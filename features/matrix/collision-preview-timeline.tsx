"use client";

import { DndContext, PointerSensor, useDraggable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pause, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Select } from "@/components/primitives";
import type { DeviceWorkspaceAggregate } from "@/data/repositories/project-repository";
import type { Event, EventId, ResolutionBehaviorName } from "@/domain";
import {
  collisionPreviewLanesFor,
  type CollisionPreviewLane,
  type CollisionPreviewSource
} from "./collision-preview-model";
import {
  useAudioPreviewActions,
  useAudioPreviewState
} from "@/features/projects/audio-preview-context";
import type { CollisionPreviewLaneName } from "@/features/projects/collision-preview-scheduler";

type CollisionPreviewTimelineProps = {
  behavior: ResolutionBehaviorName;
  eventById: ReadonlyMap<EventId, Event>;
  incomingEventId: EventId | null;
  postInterruptionRecovery: "Resume" | "Stay stopped" | null;
  playingEventId: EventId | null;
  targetLane: CollisionPreviewLaneName | null;
  workspace: DeviceWorkspaceAggregate | undefined;
};

type LaneName = "playing" | "incoming";

type PreviewOffsets = Record<LaneName, number>;

const defaultPreviewOffsets: PreviewOffsets = { incoming: 150, playing: 0 };
const offsetSnapMilliseconds = 10;
const timelineDurationMilliseconds = 30_000;
const timelinePixelsPerMillisecond = 0.4;
const timelineCanvasWidth = timelineDurationMilliseconds * timelinePixelsPerMillisecond;
const soundBlockDurationMilliseconds = 250;
const maximumPreviewOffset = timelineDurationMilliseconds - soundBlockDurationMilliseconds;
const timelineControlWidth = 176;
const timelineRulerHeight = 34;
const timelineLaneHeight = 112;

const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)");

    if (!mediaQuery) {
      return;
    }

    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);
    updatePreference();
    mediaQuery.addEventListener?.("change", updatePreference);

    return () => mediaQuery.removeEventListener?.("change", updatePreference);
  }, []);

  return prefersReducedMotion;
};

function clampOffset(milliseconds: number) {
  return Math.min(maximumPreviewOffset, Math.max(0, Math.round(milliseconds)));
}

function snappedOffset(milliseconds: number) {
  return clampOffset(
    Math.round(milliseconds / offsetSnapMilliseconds) * offsetSnapMilliseconds
  );
}

export function previewOffsetAfterPointerDrag(
  currentOffset: number,
  deltaX: number,
  canvasWidth: number,
  timelineDuration: number
) {
  if (canvasWidth <= 0 || deltaX === 0) {
    return currentOffset;
  }

  return snappedOffset(currentOffset + (deltaX / canvasWidth) * timelineDuration);
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
};

function PreviewSoundBlock({ label, lane, offset, onKeyboardMove }: PreviewSoundBlockProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: `collision-preview-${lane}` });

  return (
    <div
      className="absolute inset-y-3 flex items-center rounded-lg border border-gray-300 bg-gray-100 px-2 text-sm font-semibold text-gray-700 shadow-sm"
      ref={setNodeRef}
      style={{
        left: offset * timelinePixelsPerMillisecond,
        transform: CSS.Translate.toString(transform),
        width: soundBlockDurationMilliseconds * timelinePixelsPerMillisecond
      }}
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
    </div>
  );
}

function TimelinePlayhead({ milliseconds, ruler = false }: { milliseconds: number; ruler?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 z-20 w-px bg-purple-500"
      data-testid={ruler ? "collision-preview-playhead" : undefined}
      style={{ left: milliseconds * timelinePixelsPerMillisecond }}
    >
      {ruler ? (
        <span className="absolute -left-[7px] bottom-0 size-[15px] rounded-full border-2 border-gray-700 bg-purple-600 shadow-sm" />
      ) : null}
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
  postInterruptionRecovery,
  playingEventId,
  targetLane,
  workspace
}: CollisionPreviewTimelineProps) {
  const audioPreview = useAudioPreviewActions();
  const { errorMessage, playheadByScheduleKey } = useAudioPreviewState();
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
  const prefersReducedMotion = useReducedMotion();
  const timelineScrollerRef = useRef<HTMLDivElement>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const selectedPlayingSource = selectedSourceFor(lanes.playing.sources, selectedSourceKey.playing);
  const selectedIncomingSource = selectedSourceFor(lanes.incoming.sources, selectedSourceKey.incoming);
  const missingAudio = !selectedPlayingSource || !selectedIncomingSource;
  const deviceIsDisabled = workspace?.device.isEnabled === false;
  const scheduleKey = `collision-preview:${playingEventId ?? "none"}:${incomingEventId ?? "none"}`;
  const isPlaying = scheduleKey in playheadByScheduleKey;
  const playheadMilliseconds = Math.min(
    timelineDurationMilliseconds,
    (playheadByScheduleKey[scheduleKey] ?? 0) * 1000
  );
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
  const setOffset = (lane: LaneName, milliseconds: number, snap = false) => {
    const nextOffset = snap ? snappedOffset(milliseconds) : clampOffset(milliseconds);
    setPreviewOffsets((current) => ({ ...current, [lane]: nextOffset }));
  };

  const canPreview = pairIsSelected && !unavailable && !deviceIsDisabled && !missingAudio;

  const playCollision = () => {
    if (!selectedPlayingSource || !selectedIncomingSource || !canPreview) {
      return;
    }

    void audioPreview.playCollisionSchedule({
      behavior,
      lanes: {
        incoming: {
          offsetMilliseconds: previewOffsets.incoming,
          playbackUrl: selectedIncomingSource.asset.playbackUrl
        },
        playing: {
          offsetMilliseconds: previewOffsets.playing,
          playbackUrl: selectedPlayingSource.asset.playbackUrl
        }
      },
      postInterruptionRecovery,
      reduceMotion: prefersReducedMotion,
      scheduleKey,
      targetLane
    });
  };

  const toggleCollisionPreview = () => {
    if (isPlaying) {
      audioPreview.stopSchedule(scheduleKey);
      return;
    }

    playCollision();
  };

  useEffect(
    () => () => {
      audioPreview.stopSchedule(scheduleKey);
    },
    [audioPreview, scheduleKey, selectedIncomingSource?.key, selectedPlayingSource?.key]
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const lane = event.active.id === "collision-preview-playing" ? "playing" : event.active.id === "collision-preview-incoming" ? "incoming" : null;

    if (!lane || event.delta.x === 0) {
      return;
    }

    setOffset(
      lane,
      previewOffsetAfterPointerDrag(
        previewOffsets[lane],
        event.delta.x,
        timelineCanvasWidth,
        timelineDurationMilliseconds
      )
    );
  };

  const renderLane = (laneName: LaneName, label: string) => {
    const lane = lanes[laneName];
    const selectedSource = selectedSourceFor(lane.sources, selectedSourceKey[laneName]);
    const sourceLabel = selectedSource?.asset.name ?? "No audio selected";
    const offset = previewOffsets[laneName];

    return (
      <>
        <div
          className="sticky left-0 z-30 grid content-center gap-2 border-r border-t border-gray-200 bg-gray-50 px-3 py-2"
          style={{ height: timelineLaneHeight }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-gray-600">{label}</span>
            <div className="flex min-w-0 items-center gap-1">
              <label className="sr-only" htmlFor={`collision-preview-${laneName}-offset`}>
                {label} offset in milliseconds
              </label>
              <input
                aria-label={`${label} offset in milliseconds`}
                className="h-9 w-[76px] min-w-0 rounded-lg border border-gray-300 bg-gray-25 px-2 text-right text-sm tabular-nums text-gray-700 outline-none focus:ring-2 focus:ring-purple-500/40"
                id={`collision-preview-${laneName}-offset`}
                max={maximumPreviewOffset}
                min="0"
                onChange={(event) => setOffset(laneName, Number(event.currentTarget.value), false)}
                step="1"
                type="number"
                value={offset}
              />
              <span className="text-xs text-gray-500">ms</span>
            </div>
          </div>
          {lane.sources.length > 1 ? (
            <Select
              aria-label={`${label} sound`}
              className="h-9"
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
          ) : !selectedSource ? (
            <p className="text-xs text-gray-500">{missingAudioCopy(lane, label)}</p>
          ) : null}
        </div>
        <div
          className="relative border-t border-gray-200 bg-gray-25"
          style={{ height: timelineLaneHeight }}
        >
          {Array.from({ length: 60 }, (_, index) => (
            <span
              aria-hidden="true"
              className={`absolute inset-y-0 border-l ${
                index % 2 === 0 ? "border-gray-200" : "border-gray-100"
              }`}
              key={index}
              style={{ left: index * 500 * timelinePixelsPerMillisecond }}
            />
          ))}
          <PreviewSoundBlock
            label={sourceLabel}
            lane={laneName}
            offset={offset}
            onKeyboardMove={(movingLane, direction) =>
              setOffset(
                movingLane,
                previewOffsets[movingLane] + direction * offsetSnapMilliseconds,
                true
              )
            }
          />
          {isPlaying ? <TimelinePlayhead milliseconds={playheadMilliseconds} /> : null}
        </div>
      </>
    );
  };

  return (
    <section
      aria-labelledby="collision-preview-heading"
      className="grid gap-5 border-b border-gray-300 pb-5"
      data-motion-preference={prefersReducedMotion ? "reduced" : "full"}
    >
      <div className="grid justify-items-center gap-3 text-center">
        <Button
          aria-label={isPlaying ? "Stop collision preview" : "Tap to preview collision"}
          className="h-12 min-w-32 text-base"
          disabled={!canPreview && !isPlaying}
          leftIcon={isPlaying ? <Pause className="size-4" /> : undefined}
          onClick={toggleCollisionPreview}
          title={previewUnavailableCopy}
          variant="primary"
        >
          {isPlaying ? "Stop" : "Tap"}
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
            {previewUnavailableCopy}
          </p>
          {errorMessage ? <p className="text-xs text-red-600" role="status">{errorMessage}</p> : null}
        </div>
      </div>

      <DndContext onDragEnd={handleDragEnd} sensors={sensors}>
        <div
          aria-label={`Collision preview timeline, Playing starts at ${previewOffsets.playing} milliseconds and Incoming starts at ${previewOffsets.incoming} milliseconds`}
          className="overflow-x-auto overscroll-x-contain border-y border-gray-200 bg-gray-50 pb-1"
          data-testid="collision-preview-timeline"
          ref={timelineScrollerRef}
        >
          <div
            className="grid"
            style={{
              gridTemplateColumns: `${timelineControlWidth}px ${timelineCanvasWidth}px`,
              width: timelineControlWidth + timelineCanvasWidth
            }}
          >
            <div
              className="sticky left-0 z-30 flex items-center border-r border-gray-200 bg-gray-50 px-3 text-xs font-medium text-gray-500"
              style={{ height: timelineRulerHeight }}
            >
              Offset (ms)
            </div>
            <div
              className="relative border-b border-gray-200 bg-gray-50"
              style={{ height: timelineRulerHeight }}
            >
              {Array.from({ length: 61 }, (_, index) => {
                const milliseconds = index * 500;
                const isWholeSecond = milliseconds % 1000 === 0;

                return (
                  <span
                    aria-hidden="true"
                    className={`absolute bottom-0 border-l ${
                      isWholeSecond ? "h-3 border-gray-400" : "h-2 border-gray-300"
                    }`}
                    key={milliseconds}
                    style={{ left: milliseconds * timelinePixelsPerMillisecond }}
                  >
                    {isWholeSecond ? (
                      <span className="absolute bottom-3 left-1 whitespace-nowrap text-[11px] tabular-nums text-gray-500">
                        {milliseconds === 0 ? "0ms" : `${milliseconds / 1000}s`}
                      </span>
                    ) : null}
                  </span>
                );
              })}
              {isPlaying ? (
                <TimelinePlayhead milliseconds={playheadMilliseconds} ruler />
              ) : null}
            </div>
            {renderLane("playing", "Playing")}
            {renderLane("incoming", "Incoming")}
          </div>
        </div>
      </DndContext>

      <div className="flex flex-wrap justify-center gap-2">
        <Button
          aria-label="Reset collision preview timing"
          className="h-11"
          leftIcon={<RotateCcw className="size-4" />}
          onClick={() => {
            setPreviewOffsets(defaultPreviewOffsets);
            if (timelineScrollerRef.current) {
              timelineScrollerRef.current.scrollLeft = 0;
            }
          }}
        >
          Reset timing
        </Button>
      </div>
    </section>
  );
}
