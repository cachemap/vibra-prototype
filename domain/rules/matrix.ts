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
  if (behavior.behaviorName === "Suppress" && behavior.targetEventId === null) {
    return errApp(
      new ConstraintError("Suppress requires a target event.", {
        constraint: "suppress-target-required"
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
