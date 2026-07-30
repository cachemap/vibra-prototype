import type { CollectionId, EventId } from "@/domain";

export type MatrixAxis = "playing" | "incoming";

export type MatrixFilterEvent = {
  id: EventId;
  name: string;
};

export type MatrixFilterCollection = {
  events: readonly MatrixFilterEvent[];
  id: CollectionId;
  name: string;
};

export type MatrixSelectionState = "all" | "none" | "partial";

export const axisNoun: Record<MatrixAxis, string> = {
  playing: "playing row",
  incoming: "incoming column"
};

export const axisNounPlural: Record<MatrixAxis, string> = {
  playing: "playing rows",
  incoming: "incoming columns"
};

export const axisLabel: Record<MatrixAxis, string> = {
  playing: "Playing",
  incoming: "Incoming"
};

export const selectionStateFor = (
  events: readonly MatrixFilterEvent[],
  selectedEventIds: ReadonlySet<EventId>
): MatrixSelectionState => {
  if (events.length === 0) {
    return "none";
  }

  const selectedCount = events.filter((event) => selectedEventIds.has(event.id)).length;

  if (selectedCount === 0) {
    return "none";
  }

  return selectedCount === events.length ? "all" : "partial";
};
