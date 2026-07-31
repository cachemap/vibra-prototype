"use client";

import { Pause } from "lucide-react";
import { Button } from "@/components/primitives";
import type { Event, EventId, ResolutionBehaviorName } from "@/domain";

type CollisionPreviewTimelineProps = {
  behavior: ResolutionBehaviorName;
  eventById: ReadonlyMap<EventId, Event>;
  incomingEventId: EventId | null;
  playingEventId: EventId | null;
};

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
  playingEventId
}: CollisionPreviewTimelineProps) {
  const pairIsSelected = Boolean(playingEventId && incomingEventId);
  const unavailable = behavior === "Not possible";

  return (
    <section aria-labelledby="collision-preview-heading" className="grid gap-5 border-b border-gray-300 pb-5">
      <div className="grid justify-items-center gap-3 text-center">
        <Button
          aria-label="Tap to preview collision"
          className="h-12 min-w-32 text-base"
          disabled={!pairIsSelected || unavailable}
          title={unavailable ? "This pair cannot be previewed concurrently." : "Audio preview is configured in the next step."}
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
            {unavailable
              ? "This behavior does not allow a concurrent preview."
              : pairIsSelected
                ? "Sound selection and audition timing are kept local to this editor."
                : "Select a matrix cell to prepare its collision preview."}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto overscroll-x-contain pb-1">
        <div className="min-w-[620px] border-y border-gray-200 bg-gray-50 px-4 py-3">
          <div className="grid grid-cols-[104px_1fr] gap-x-3 gap-y-3">
            <span className="self-center text-xs font-medium text-gray-500">Playing</span>
            <div className="relative h-11 border-l border-gray-300 bg-gray-25">
              <div className="absolute inset-y-1 left-0 flex w-[56%] items-center rounded-lg border border-gray-300 bg-gray-100 px-3 text-sm font-semibold text-gray-700">
                <EventLabel eventById={eventById} eventId={playingEventId} fallback="Choose a playing event" />
              </div>
            </div>
            <span className="self-center text-xs font-medium text-gray-500">Incoming</span>
            <div className="relative h-11 border-l border-gray-300 bg-gray-25">
              <div className="absolute inset-y-1 left-[18%] flex w-[56%] items-center rounded-lg border border-gray-300 bg-gray-100 px-3 text-sm font-semibold text-gray-700">
                <EventLabel eventById={eventById} eventId={incomingEventId} fallback="Choose an incoming event" />
              </div>
            </div>
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
