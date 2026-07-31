import type {
  Collection,
  CollisionMatrix,
  CollisionMatrixColumn,
  CollisionMatrixEntry,
  CollisionMatrixRow,
  Event,
  ResolutionBehavior
} from "../entities";
import { ConflictError, ConstraintError } from "../errors";
import { errApp, okApp, type AppResult } from "../results";
import type { EventId } from "../ids";
import type { InterruptionRecovery, ResolutionBehaviorName } from "../enums";

type FieldApplicability = "required" | "forbidden";
type EventPosition = "playing" | "incoming";

export type ResolutionBehaviorDefinition = {
  target: FieldApplicability;
  defaultTarget: EventPosition | null;
  postInterruptionRecovery: FieldApplicability;
  systemInterruptionRecovery: FieldApplicability;
  help: string;
};

export const resolutionBehaviorDefinitions: Record<
  ResolutionBehaviorName,
  ResolutionBehaviorDefinition
> = {
  Preempt: {
    target: "required",
    defaultTarget: "playing",
    postInterruptionRecovery: "required",
    systemInterruptionRecovery: "required",
    help: "The incoming event stops the selected target and takes over."
  },
  Queue: {
    target: "required",
    defaultTarget: "incoming",
    postInterruptionRecovery: "forbidden",
    systemInterruptionRecovery: "required",
    help: "The selected target waits until the other event finishes."
  },
  "Co-play": {
    target: "forbidden",
    defaultTarget: null,
    postInterruptionRecovery: "forbidden",
    systemInterruptionRecovery: "required",
    help: "Both events play at full level."
  },
  Suppress: {
    target: "required",
    defaultTarget: "incoming",
    postInterruptionRecovery: "forbidden",
    systemInterruptionRecovery: "required",
    help: "The selected target does not start while the other event continues."
  },
  "Not possible": {
    target: "forbidden",
    defaultTarget: null,
    postInterruptionRecovery: "forbidden",
    systemInterruptionRecovery: "forbidden",
    help: "These events cannot occur at the same time."
  }
};

const defaultRecovery: InterruptionRecovery = "Stay stopped";

export const normalizeResolutionBehavior = (
  behavior: Partial<ResolutionBehavior> | null | undefined,
  entryEvents: Pick<CollisionMatrixEntry, "playingEventId" | "incomingEventId">
): ResolutionBehavior => {
  const behaviorName = behavior?.behaviorName ?? "Preempt";
  const definition = resolutionBehaviorDefinitions[behaviorName];
  const isEntryTarget =
    behavior?.targetEventId === entryEvents.playingEventId ||
    behavior?.targetEventId === entryEvents.incomingEventId;
  const defaultTarget =
    definition.defaultTarget === "playing"
      ? entryEvents.playingEventId
      : definition.defaultTarget === "incoming"
        ? entryEvents.incomingEventId
        : null;

  return {
    behaviorName,
    targetEventId:
      definition.target === "forbidden"
        ? null
        : isEntryTarget
          ? behavior.targetEventId ?? defaultTarget
          : defaultTarget,
    postInterruptionRecovery:
      definition.postInterruptionRecovery === "required"
        ? behavior?.postInterruptionRecovery ?? defaultRecovery
        : null,
    systemInterruptionRecovery:
      definition.systemInterruptionRecovery === "required"
        ? behavior?.systemInterruptionRecovery ?? defaultRecovery
        : null
  };
};

const eventBelongsToDevice = (
  eventId: EventId,
  deviceCollections: readonly Collection[],
  events: readonly Event[]
): boolean => {
  const collectionIds = new Set(deviceCollections.map((collection) => collection.id));
  return events.some((event) => event.id === eventId && collectionIds.has(event.collectionId));
};

export const canSelectMatrixEvent = (
  eventId: EventId,
  deviceCollections: readonly Collection[],
  events: readonly Event[]
): AppResult<void> => {
  if (!eventBelongsToDevice(eventId, deviceCollections, events)) {
    return errApp(
      new ConstraintError("Collision matrix events must belong to the selected device.", {
        constraint: "matrix-event-device-membership"
      })
    );
  }

  return okApp(undefined);
};

export const canCreateMatrixEntry = (
  candidate: Pick<CollisionMatrixEntry, "matrixId" | "playingEventId" | "incomingEventId">,
  rows: readonly CollisionMatrixRow[],
  columns: readonly CollisionMatrixColumn[],
  existingEntries: readonly CollisionMatrixEntry[]
): AppResult<void> => {
  const hasRow = rows.some(
    (row) => row.matrixId === candidate.matrixId && row.eventId === candidate.playingEventId
  );
  const hasColumn = columns.some(
    (column) => column.matrixId === candidate.matrixId && column.eventId === candidate.incomingEventId
  );

  if (!hasRow || !hasColumn) {
    return errApp(
      new ConstraintError("Matrix entries require selected playing rows and incoming columns.", {
        constraint: "matrix-entry-row-column-membership"
      })
    );
  }

  const duplicate = existingEntries.some(
    (entry) =>
      entry.matrixId === candidate.matrixId &&
      entry.playingEventId === candidate.playingEventId &&
      entry.incomingEventId === candidate.incomingEventId
  );

  if (duplicate) {
    return errApp(
      new ConflictError("A collision matrix can only have one entry per playing and incoming pair.", {
        constraint: "unique-matrix-entry"
      })
    );
  }

  return okApp(undefined);
};

export const canUseResolutionBehavior = (
  behavior: ResolutionBehavior,
  entryEvents: Pick<CollisionMatrixEntry, "playingEventId" | "incomingEventId">
): AppResult<void> => {
  const definition = resolutionBehaviorDefinitions[behavior.behaviorName];

  if (definition.target === "required" && behavior.targetEventId === null) {
    return errApp(
      new ConstraintError(`${behavior.behaviorName} requires a target event.`, {
        constraint: `${behavior.behaviorName.toLowerCase().replaceAll(" ", "-")}-target-required`
      })
    );
  }

  if (definition.target === "forbidden" && behavior.targetEventId !== null) {
    return errApp(
      new ConstraintError(`${behavior.behaviorName} cannot target an event.`, {
        constraint: "resolution-target-forbidden"
      })
    );
  }

  if (
    behavior.targetEventId !== null &&
    behavior.targetEventId !== entryEvents.playingEventId &&
    behavior.targetEventId !== entryEvents.incomingEventId
  ) {
    return errApp(
      new ConstraintError("Resolution targets must be the playing or incoming event.", {
        constraint: "resolution-target-entry-event"
      })
    );
  }

  if (
    definition.postInterruptionRecovery === "required" &&
    behavior.postInterruptionRecovery === null
  ) {
    return errApp(
      new ConstraintError(`${behavior.behaviorName} requires a post-interruption recovery.`, {
        constraint: "post-interruption-recovery-required"
      })
    );
  }

  if (
    definition.postInterruptionRecovery === "forbidden" &&
    behavior.postInterruptionRecovery !== null
  ) {
    return errApp(
      new ConstraintError(`${behavior.behaviorName} cannot use post-interruption recovery.`, {
        constraint: "post-interruption-recovery-forbidden"
      })
    );
  }

  if (
    definition.systemInterruptionRecovery === "required" &&
    behavior.systemInterruptionRecovery === null
  ) {
    return errApp(
      new ConstraintError(`${behavior.behaviorName} requires a system-interruption recovery.`, {
        constraint: "system-interruption-recovery-required"
      })
    );
  }

  if (
    definition.systemInterruptionRecovery === "forbidden" &&
    behavior.systemInterruptionRecovery !== null
  ) {
    return errApp(
      new ConstraintError(`${behavior.behaviorName} cannot use system-interruption recovery.`, {
        constraint: "system-interruption-recovery-forbidden"
      })
    );
  }

  return okApp(undefined);
};

export const validateNewMatrixIsEmpty = (
  matrix: CollisionMatrix,
  rows: readonly CollisionMatrixRow[],
  columns: readonly CollisionMatrixColumn[],
  entries: readonly CollisionMatrixEntry[]
): AppResult<void> => {
  const hasExistingMatrixState =
    rows.some((row) => row.matrixId === matrix.id) ||
    columns.some((column) => column.matrixId === matrix.id) ||
    entries.some((entry) => entry.matrixId === matrix.id);

  if (hasExistingMatrixState) {
    return errApp(
      new ConstraintError("A new collision matrix must start with no rows, columns, or entries.", {
        constraint: "new-matrix-empty"
      })
    );
  }

  return okApp(undefined);
};
