"use client";

import { Pause } from "lucide-react";
import { useMemo, useState } from "react";
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

  const renderLane = (laneName: LaneName, label: string) => {
    const lane = lanes[laneName];
    const selectedSource = selectedSourceFor(lane.sources, selectedSourceKey[laneName]);
    const sourceLabel = selectedSource?.asset.name ?? "No audio selected";
    const offsetClass = laneName === "playing" ? "left-0" : "left-[18%]";

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
          <div className="relative h-11 border-l border-gray-300 bg-gray-25">
            <div
              className={`absolute inset-y-1 ${offsetClass} flex w-[56%] items-center rounded-lg border border-gray-300 bg-gray-100 px-3 text-sm font-semibold text-gray-700`}
            >
              <span className="truncate">{sourceLabel}</span>
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

      <div className="overflow-x-auto overscroll-x-contain pb-1">
        <div className="min-w-[620px] border-y border-gray-200 bg-gray-50 px-4 py-3">
          <div className="grid grid-cols-[104px_1fr] gap-x-3 gap-y-3">
            {renderLane("playing", "Playing")}
            {renderLane("incoming", "Incoming")}
            <span aria-hidden="true" />
            <div aria-label="Collision preview timeline, playing starts at 0 milliseconds and incoming starts at 150 milliseconds" className="grid grid-cols-5 border-t border-gray-300 pt-1 text-xs tabular-nums text-gray-500">
              <span>0ms</span>
              <span>150ms</span>
              <span>300ms</span>
              <span>450ms</span>
              <span className="text-right">600ms</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <Button aria-label="Stop collision preview" disabled leftIcon={<Pause className="size-4" />}>
          Stop
        </Button>
      </div>
    </section>
  );
}
