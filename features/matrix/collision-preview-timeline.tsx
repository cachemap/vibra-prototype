"use client";

import { DndContext, PointerSensor, useDraggable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pause, RotateCcw } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Button, Select } from "@/components/primitives";
import type { DeviceWorkspaceAggregate } from "@/data/repositories/project-repository";
import type { Event, EventId, ResolutionBehaviorName } from "@/domain";
import {
  collisionPreviewLanesFor,
  type CollisionPreviewLane,
  type CollisionPreviewSource
} from "./collision-preview-model";

type CollisionPreviewTimelineProps = {
  behavior: ResolutionBehaviorName;
  eventById: ReadonlyMap<EventId, Event>;
  incomingEventId: EventId | null;
  playingEventId: EventId | null;
  workspace: DeviceWorkspaceAggregate | undefined;
};

type LaneName = "playing" | "incoming";

type PreviewOffsets = Record<LaneName, number>;

const defaultPreviewOffsets: PreviewOffsets = { incoming: 150, playing: 0 };
const offsetSnapMilliseconds = 10;
const minimumTimelineMilliseconds = 600;
const soundBlockDurationMilliseconds = 250;

function clampOffset(milliseconds: number) {
  return Math.max(0, Math.round(milliseconds));
}

function snappedOffset(milliseconds: number) {
  return Math.max(0, Math.round(milliseconds / offsetSnapMilliseconds) * offsetSnapMilliseconds);
}

function selectedSourceFor(
  sources: readonly CollisionPreviewSource[],
  selectedSourceKey: string | null
): CollisionPreviewSource | null {
  return sources.find((source) => source.key === selectedSourceKey) ?? sources[0] ?? null;
}

function missingAudioCopy(lane: CollisionPreviewLane, label: string) {
  if (lane.hapticPlaybackCount > 0) {
    return `${label} has enabled haptic feedback, but no enabled audio playback.`;
  }

  return `${label} has no enabled previewable audio playback.`;
}

function EventLabel({
  eventById,
  eventId,
  fallback
}: {
  eventById: ReadonlyMap<EventId, Event>;
  eventId: EventId | null;
  fallback: string;
}) {
  return <span className="truncate text-sm font-semibold text-gray-700">{eventId ? eventById.get(eventId)?.name ?? fallback : fallback}</span>;
}

type PreviewSoundBlockProps = {
  label: string;
  lane: LaneName;
  offset: number;
  onKeyboardMove: (lane: LaneName, direction: -1 | 1) => void;
  timelineDuration: number;
};

function PreviewSoundBlock({ label, lane, offset, onKeyboardMove, timelineDuration }: PreviewSoundBlockProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: `collision-preview-${lane}` });
  const left = `${(offset / timelineDuration) * 100}%`;

  return (
    <div
      className="absolute inset-y-1 flex w-[46%] items-center rounded-lg border border-gray-300 bg-gray-100 px-2 text-sm font-semibold text-gray-700 shadow-sm"
      ref={setNodeRef}
      style={{ left, transform: CSS.Translate.toString(transform) }}
    >
      <button
        {...attributes}
        {...listeners}
        aria-label={`Move ${lane === "playing" ? "Playing" : "Incoming"} sound`}
        className="-ml-1 mr-1 inline-flex size-8 shrink-0 touch-none items-center justify-center rounded-md text-gray-500 hover:bg-gray-200 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/40"
        onKeyDown={(event) => {
          if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
            return;
          }

          event.preventDefault();
          event.stopPropagation();
          onKeyboardMove(lane, event.key === "ArrowLeft" ? -1 : 1);
        }}
        type="button"
      >
        <GripVertical aria-hidden="true" className="size-4" />
      </button>
      <span className="truncate">{label}</span>
      <span className="ml-auto pl-2 text-xs font-medium tabular-nums text-gray-500">{offset}ms</span>
    </div>
  );
}

/**
 * The audition engine intentionally arrives in a later slice. This component establishes
 * its fixed geometry now, so selecting sounds and scheduling them will not move the editor.
 */
export function CollisionPreviewTimeline({
  behavior,
  eventById,
  incomingEventId,
  playingEventId,
  workspace
}: CollisionPreviewTimelineProps) {
  const pairIsSelected = Boolean(playingEventId && incomingEventId);
  const unavailable = behavior === "Not possible";
  const lanes = useMemo(
    () => collisionPreviewLanesFor(workspace, playingEventId, incomingEventId),
    [incomingEventId, playingEventId, workspace]
  );
  const [selectedSourceKey, setSelectedSourceKey] = useState<Record<LaneName, string | null>>({
    incoming: null,
    playing: null
  });
  const [previewOffsets, setPreviewOffsets] = useState<PreviewOffsets>(defaultPreviewOffsets);
  const timelineCanvasRef = useRef<HTMLDivElement>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const selectedPlayingSource = selectedSourceFor(lanes.playing.sources, selectedSourceKey.playing);
  const selectedIncomingSource = selectedSourceFor(lanes.incoming.sources, selectedSourceKey.incoming);
  const missingAudio = !selectedPlayingSource || !selectedIncomingSource;
  const deviceIsDisabled = workspace?.device.isEnabled === false;
  const previewUnavailableCopy = unavailable
    ? "This behavior does not allow a concurrent preview."
    : deviceIsDisabled
      ? "Enable this device before previewing its collision behavior."
      : !pairIsSelected
        ? "Select a matrix cell to prepare its collision preview."
        : missingAudio
          ? [
              !selectedPlayingSource ? missingAudioCopy(lanes.playing, "Playing") : null,
              !selectedIncomingSource ? missingAudioCopy(lanes.incoming, "Incoming") : null
            ]
              .filter(Boolean)
              .join(" ")
          : "Choose one enabled audio playback for each event. Timing and sound choice remain local to this editor.";
  const timelineDuration = Math.max(
    minimumTimelineMilliseconds,
    Math.ceil((Math.max(previewOffsets.playing, previewOffsets.incoming) + soundBlockDurationMilliseconds) / 150) * 150
  );

  const setOffset = (lane: LaneName, milliseconds: number, snap = false) => {
    const nextOffset = snap ? snappedOffset(milliseconds) : clampOffset(milliseconds);
    setPreviewOffsets((current) => ({ ...current, [lane]: nextOffset }));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const lane = event.active.id === "collision-preview-playing" ? "playing" : event.active.id === "collision-preview-incoming" ? "incoming" : null;
    const canvasWidth = timelineCanvasRef.current?.clientWidth ?? 0;

    if (!lane || canvasWidth <= 0 || event.delta.x === 0) {
      return;
    }

    setOffset(lane, previewOffsets[lane] + (event.delta.x / canvasWidth) * timelineDuration, true);
  };

  const renderLane = (laneName: LaneName, label: string) => {
    const lane = lanes[laneName];
    const selectedSource = selectedSourceFor(lane.sources, selectedSourceKey[laneName]);
    const sourceLabel = selectedSource?.asset.name ?? "No audio selected";
    const offset = previewOffsets[laneName];

    return (
      <>
        <span className="self-center text-xs font-medium text-gray-500">{label}</span>
        <div className="grid gap-2">
          {lane.sources.length > 1 ? (
            <Select
              aria-label={`${label} sound`}
              className="h-10"
              id={`collision-preview-${laneName}-sound`}
              onChange={(event) => {
                const nextSourceKey = event.currentTarget.value;
                setSelectedSourceKey((current) => ({ ...current, [laneName]: nextSourceKey }));
              }}
              value={selectedSource?.key ?? ""}
            >
              {lane.sources.map((source) => (
                <option key={source.key} value={source.key}>
                  {source.asset.name}
                </option>
              ))}
            </Select>
          ) : null}
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_132px] sm:items-center">
            <div className="relative h-11 border-l border-gray-300 bg-gray-25" ref={timelineCanvasRef}>
              <PreviewSoundBlock
                label={sourceLabel}
                lane={laneName}
                offset={offset}
                onKeyboardMove={(movingLane, direction) => setOffset(movingLane, previewOffsets[movingLane] + direction * offsetSnapMilliseconds, true)}
                timelineDuration={timelineDuration}
              />
            </div>
            <div className="flex items-center gap-1">
              <label className="sr-only" htmlFor={`collision-preview-${laneName}-offset`}>
                {label} offset in milliseconds
              </label>
              <input
                aria-label={`${label} offset in milliseconds`}
                className="h-10 min-w-0 flex-1 rounded-lg border border-gray-300 bg-gray-25 px-2 text-right text-sm tabular-nums text-gray-700 outline-none focus:ring-2 focus:ring-purple-500/40"
                id={`collision-preview-${laneName}-offset`}
                min="0"
                onChange={(event) => setOffset(laneName, Number(event.currentTarget.value), false)}
                step="1"
                type="number"
                value={offset}
              />
              <span className="text-xs text-gray-500">ms</span>
            </div>
          </div>
          {!selectedSource ? (
            <p className="text-xs text-gray-500">{missingAudioCopy(lane, label)}</p>
          ) : null}
        </div>
      </>
    );
  };

  return (
    <section aria-labelledby="collision-preview-heading" className="grid gap-5 border-b border-gray-300 pb-5">
      <div className="grid justify-items-center gap-3 text-center">
        <Button
          aria-label="Tap to preview collision"
          className="h-12 min-w-32 text-base"
          disabled
          title={previewUnavailableCopy}
          variant="primary"
        >
          Tap
        </Button>
        <div className="grid gap-1">
          <h3 className="text-sm font-semibold text-gray-700" id="collision-preview-heading">
            <EventLabel eventById={eventById} eventId={playingEventId} fallback="Playing event" />
            <span aria-hidden="true" className="px-1.5 text-gray-500">
              ×
            </span>
            <EventLabel eventById={eventById} eventId={incomingEventId} fallback="Incoming event" />
          </h3>
          <p className="text-xs text-gray-500">
            {previewUnavailableCopy} Collision playback controls arrive with the scheduling engine.
          </p>
        </div>
      </div>

      <DndContext onDragEnd={handleDragEnd} sensors={sensors}>
      <div className="overflow-x-auto overscroll-x-contain pb-1">
        <div className="min-w-[620px] border-y border-gray-200 bg-gray-50 px-4 py-3">
          <div className="grid grid-cols-[104px_1fr] gap-x-3 gap-y-3">
            {renderLane("playing", "Playing")}
            {renderLane("incoming", "Incoming")}
            <span aria-hidden="true" />
            <div aria-label={`Collision preview timeline, Playing starts at ${previewOffsets.playing} milliseconds and Incoming starts at ${previewOffsets.incoming} milliseconds`} className="grid grid-cols-5 border-t border-gray-300 pt-1 text-xs tabular-nums text-gray-500">
              <span>0ms</span>
              <span>{timelineDuration / 4}ms</span>
              <span>{timelineDuration / 2}ms</span>
              <span>{(timelineDuration * 3) / 4}ms</span>
              <span className="text-right">{timelineDuration}ms</span>
            </div>
          </div>
        </div>
      </div>
      </DndContext>

      <div className="flex flex-wrap justify-center gap-2">
        <Button
          aria-label="Reset collision preview timing"
          className="h-11"
          leftIcon={<RotateCcw className="size-4" />}
          onClick={() => setPreviewOffsets(defaultPreviewOffsets)}
        >
          Reset timing
        </Button>
        <Button aria-label="Stop collision preview" disabled leftIcon={<Pause className="size-4" />}>
          Stop
        </Button>
      </div>
    </section>
  );
}
