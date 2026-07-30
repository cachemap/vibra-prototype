import { useMemo } from "react";
import type { DeviceWorkspaceAggregate } from "@/data/repositories/project-repository";
import type { EventId } from "@/domain";
import { matrixEntryKeyFor } from "./matrix-grid";
import type { MatrixFilterCollection } from "./matrix-axis-filter";

type MatrixTabModelInput = {
  data: DeviceWorkspaceAggregate | undefined;
  selectedIncomingEventId: EventId | null;
  selectedPlayingEventId: EventId | null;
};

export function useMatrixTabModel({
  data,
  selectedIncomingEventId,
  selectedPlayingEventId
}: MatrixTabModelInput) {
  const matrixEvents = useMemo(
    () => (data?.collections ?? []).flatMap((collection) => collection.events.map((event) => event.event)),
    [data?.collections]
  );
  const matrixEventById = useMemo(
    () => new Map(matrixEvents.map((event) => [event.id, event])),
    [matrixEvents]
  );
  const matrixFilterCollections = useMemo<MatrixFilterCollection[]>(
    () =>
      (data?.collections ?? []).map((collection) => ({
        id: collection.collection.id,
        name: collection.collection.name,
        events: collection.events.map((event) => ({ id: event.event.id, name: event.event.name }))
      })),
    [data?.collections]
  );
  const matrixRowEventIds = useMemo(
    () => new Set((data?.matrixRows ?? []).map((row) => row.eventId)),
    [data?.matrixRows]
  );
  const matrixColumnEventIds = useMemo(
    () => new Set((data?.matrixColumns ?? []).map((column) => column.eventId)),
    [data?.matrixColumns]
  );
  const matrixEntryByPair = useMemo(
    () =>
      new Map(
        (data?.matrixEntries ?? []).map((entry) => [
          matrixEntryKeyFor(entry.playingEventId, entry.incomingEventId),
          entry
        ])
      ),
    [data?.matrixEntries]
  );
  const selectedMatrixEntry =
    selectedPlayingEventId && selectedIncomingEventId
      ? matrixEntryByPair.get(matrixEntryKeyFor(selectedPlayingEventId, selectedIncomingEventId))
      : undefined;
  const matrixCoverage = useMemo(() => {
    const rowCount = data?.matrixRows.length ?? 0;
    const columnCount = data?.matrixColumns.length ?? 0;
    const possibleCells = rowCount * columnCount;

    if (!possibleCells) {
      return 0;
    }

    return Math.round(((data?.matrixEntries.length ?? 0) / possibleCells) * 100);
  }, [data?.matrixColumns, data?.matrixEntries, data?.matrixRows]);
  const selectedEntryLabel = selectedMatrixEntry
    ? `${matrixEventById.get(selectedMatrixEntry.playingEventId)?.name ?? "Playing event"} x ${
        matrixEventById.get(selectedMatrixEntry.incomingEventId)?.name ?? "incoming event"
      }`
    : "";

  return {
    matrixColumnEventIds,
    matrixCoverage,
    matrixEntryByPair,
    matrixEventById,
    matrixFilterCollections,
    matrixRowEventIds,
    selectedEntryLabel,
    selectedMatrixEntry
  };
}
