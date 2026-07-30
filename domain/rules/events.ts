import type { EventTrigger, TriggerPlayback } from "../entities";
import { ConflictError, ConstraintError } from "../errors";
import { errApp, okApp, type AppResult } from "../results";
import type { EventId, TriggerId } from "../ids";

export const canCreateEventTrigger = (
  eventId: EventId,
  triggerId: TriggerId,
  existingEventTriggers: readonly EventTrigger[]
): AppResult<void> => {
  const duplicate = existingEventTriggers.some(
    (eventTrigger) => eventTrigger.eventId === eventId && eventTrigger.triggerId === triggerId
  );

  if (duplicate) {
    return errApp(
      new ConflictError("An event can only bind each interaction once.", {
        constraint: "unique-event-trigger"
      })
    );
  }

  return okApp(undefined);
};

export const canUseTriggerPlaybackOffset = (startOffset: number): AppResult<void> => {
  if (startOffset < 0) {
    return errApp(
      new ConstraintError("Trigger playback offsets must be zero or greater.", {
        constraint: "non-negative-trigger-playback-offset"
      })
    );
  }

  return okApp(undefined);
};

export const getPreviewableTriggerPlaybacks = (
  eventTrigger: EventTrigger,
  triggerPlaybacks: readonly TriggerPlayback[]
): readonly TriggerPlayback[] => {
  if (!eventTrigger.isEnabled) {
    return [];
  }

  return triggerPlaybacks
    .filter((playback) => playback.eventTriggerId === eventTrigger.id)
    .sort((left, right) => left.startOffset - right.startOffset);
};
