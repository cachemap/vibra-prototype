"use client";

import { useMemo } from "react";
import { asEntityId, type CollisionMatrixEntry, type DeviceId, type EventId, type ResolutionBehaviorName } from "@/domain";
import {
  useDeselectCollisionMatrixColumnMutation,
  useDeselectCollisionMatrixRowMutation,
  useDeviceWorkspaceQuery,
  useSelectCollisionMatrixColumnMutation,
  useSelectCollisionMatrixRowMutation,
  useUpsertCollisionMatrixEntryMutation
} from "@/features/projects/queries";
import { useFeedbackActions } from "@/features/feedback/feedback-context";
import { MatrixGrid, matrixEntryKeyFor } from "./matrix-grid";
import { MatrixResolutionPanel } from "./matrix-resolution-panel";
import { MatrixToolbar } from "./matrix-toolbar";
import type { MatrixAxis, MatrixFilterCollection } from "./matrix-axis-filter";
import type { MatrixFilterAnchor } from "./matrix-axis-filter-anchor";

type MatrixTabProps = {
  deviceId: DeviceId;
  deviceName: string;
  matrixBehavior: ResolutionBehaviorName;
  matrixFilterAnchor: MatrixFilterAnchor | null;
  matrixFilterAxis: MatrixAxis;
  matrixTargetEventId: string;
  onClearEntry: (entry: CollisionMatrixEntry, label: string) => void;
  onShareEntry: (entry: CollisionMatrixEntry, label: string) => void;
  selectedIncomingEventId: EventId | null;
  selectedPlayingEventId: EventId | null;
  setMatrixBehavior: (behavior: ResolutionBehaviorName) => void;
  setMatrixFilterAnchor: (anchor: MatrixFilterAnchor | null | ((current: MatrixFilterAnchor | null) => MatrixFilterAnchor | null)) => void;
  setMatrixFilterAxis: (axis: MatrixAxis) => void;
  setMatrixTargetEventId: (eventId: string) => void;
  setSelectedIncomingEventId: (eventId: EventId | null) => void;
  setSelectedPlayingEventId: (eventId: EventId | null) => void;
};

export function MatrixTab({
  deviceId,
  deviceName,
  matrixBehavior,
  matrixFilterAnchor,
  matrixFilterAxis,
  matrixTargetEventId,
  onClearEntry,
  onShareEntry,
  selectedIncomingEventId,
  selectedPlayingEventId,
  setMatrixBehavior,
  setMatrixFilterAnchor,
  setMatrixFilterAxis,
  setMatrixTargetEventId,
  setSelectedIncomingEventId,
  setSelectedPlayingEventId
}: MatrixTabProps) {
  const deviceWorkspaceQuery = useDeviceWorkspaceQuery(deviceId);
  const { clearFeedback, runWithFeedback } = useFeedbackActions();
  const selectMatrixRow = useSelectCollisionMatrixRowMutation();
  const selectMatrixColumn = useSelectCollisionMatrixColumnMutation();
  const deselectMatrixRow = useDeselectCollisionMatrixRowMutation();
  const deselectMatrixColumn = useDeselectCollisionMatrixColumnMutation();
  const upsertMatrixEntry = useUpsertCollisionMatrixEntryMutation();
  const matrixEvents = useMemo(
    () =>
      (deviceWorkspaceQuery.data?.collections ?? []).flatMap((collection) =>
        collection.events.map((event) => event.event)
      ),
    [deviceWorkspaceQuery.data?.collections]
  );
  const matrixEventById = useMemo(
    () => new Map(matrixEvents.map((event) => [event.id, event])),
    [matrixEvents]
  );
  const matrixFilterCollections = useMemo<MatrixFilterCollection[]>(
    () =>
      (deviceWorkspaceQuery.data?.collections ?? []).map((collection) => ({
        id: collection.collection.id,
        name: collection.collection.name,
        events: collection.events.map((event) => ({ id: event.event.id, name: event.event.name }))
      })),
    [deviceWorkspaceQuery.data?.collections]
  );
  const matrixRowEventIds = useMemo(
    () => new Set((deviceWorkspaceQuery.data?.matrixRows ?? []).map((row) => row.eventId)),
    [deviceWorkspaceQuery.data?.matrixRows]
  );
  const matrixColumnEventIds = useMemo(
    () => new Set((deviceWorkspaceQuery.data?.matrixColumns ?? []).map((column) => column.eventId)),
    [deviceWorkspaceQuery.data?.matrixColumns]
  );
  const matrixEntryByPair = useMemo(
    () =>
      new Map(
        (deviceWorkspaceQuery.data?.matrixEntries ?? []).map((entry) => [
          matrixEntryKeyFor(entry.playingEventId, entry.incomingEventId),
          entry
        ])
      ),
    [deviceWorkspaceQuery.data?.matrixEntries]
  );
  const selectedMatrixEntry =
    selectedPlayingEventId && selectedIncomingEventId
      ? matrixEntryByPair.get(matrixEntryKeyFor(selectedPlayingEventId, selectedIncomingEventId))
      : undefined;
  const matrixCoverage = useMemo(() => {
    const rowCount = deviceWorkspaceQuery.data?.matrixRows.length ?? 0;
    const columnCount = deviceWorkspaceQuery.data?.matrixColumns.length ?? 0;
    const possibleCells = rowCount * columnCount;

    if (!possibleCells) {
      return 0;
    }

    return Math.round(((deviceWorkspaceQuery.data?.matrixEntries.length ?? 0) / possibleCells) * 100);
  }, [
    deviceWorkspaceQuery.data?.matrixColumns,
    deviceWorkspaceQuery.data?.matrixEntries,
    deviceWorkspaceQuery.data?.matrixRows
  ]);
  const matrixMutationsPending =
    selectMatrixRow.isPending ||
    selectMatrixColumn.isPending ||
    deselectMatrixRow.isPending ||
    deselectMatrixColumn.isPending;

  const openMatrixFilter = (anchor: MatrixFilterAnchor, axis: MatrixAxis) => {
    clearFeedback();
    setMatrixFilterAxis(axis);
    setMatrixFilterAnchor((current) => (current === anchor ? null : anchor));
  };

  const handleToggleMatrixAxisEvents = async (
    axis: MatrixAxis,
    eventIds: readonly EventId[],
    nextSelected: boolean
  ) => {
    const matrixId = deviceWorkspaceQuery.data?.collisionMatrix.id;

    if (!matrixId) {
      return;
    }

    const selectedEventIds = axis === "playing" ? matrixRowEventIds : matrixColumnEventIds;
    const changingEventIds = eventIds.filter(
      (eventId) => selectedEventIds.has(eventId) !== nextSelected
    );

    if (changingEventIds.length === 0) {
      return;
    }

    await runWithFeedback({
      work: async () => {
        for (const eventId of changingEventIds) {
          if (nextSelected && axis === "playing") {
            await selectMatrixRow.mutateAsync({ matrixId, eventId });
          } else if (nextSelected) {
            await selectMatrixColumn.mutateAsync({ matrixId, eventId });
          } else if (axis === "playing") {
            await deselectMatrixRow.mutateAsync({ matrixId, eventId });
          } else {
            await deselectMatrixColumn.mutateAsync({ matrixId, eventId });
          }
        }

        if (!nextSelected) {
          if (
            axis === "playing" &&
            selectedPlayingEventId &&
            changingEventIds.includes(selectedPlayingEventId)
          ) {
            setSelectedPlayingEventId(null);
            setMatrixTargetEventId("");
          }

          if (
            axis === "incoming" &&
            selectedIncomingEventId &&
            changingEventIds.includes(selectedIncomingEventId)
          ) {
            setSelectedIncomingEventId(null);
            setMatrixTargetEventId("");
          }
        }

        const axisLabel = axis === "playing" ? "playing rows" : "incoming columns";
        const changedLabel =
          changingEventIds.length === 1
            ? (matrixEventById.get(changingEventIds[0])?.name ?? "1 event")
            : `${changingEventIds.length} events`;

        return nextSelected
          ? `Added ${changedLabel} to ${axisLabel}.`
          : `Removed ${changedLabel} from ${axisLabel}.`;
      },
      onSuccess: (message) => message
    });
  };

  const handleSelectMatrixCell = (playingEventId: EventId, incomingEventId: EventId) => {
    const entry = matrixEntryByPair.get(matrixEntryKeyFor(playingEventId, incomingEventId));

    setSelectedPlayingEventId(playingEventId);
    setSelectedIncomingEventId(incomingEventId);
    setMatrixBehavior(entry?.resolutionBehavior.behaviorName ?? "Preempt");
    setMatrixTargetEventId(entry?.resolutionBehavior.targetEventId ?? "");
  };

  const handleSaveMatrixEntry = async () => {
    const matrixId = deviceWorkspaceQuery.data?.collisionMatrix.id;

    if (!matrixId || !selectedPlayingEventId || !selectedIncomingEventId) {
      return;
    }

    const targetEventId = matrixBehavior === "Suppress" ? matrixTargetEventId : matrixTargetEventId || "";

    await runWithFeedback({
      work: () =>
        upsertMatrixEntry.mutateAsync({
          matrixId,
          playingEventId: selectedPlayingEventId,
          incomingEventId: selectedIncomingEventId,
          resolutionBehavior: {
            behaviorName: matrixBehavior,
            targetEventId: targetEventId ? asEntityId<EventId>(targetEventId) : null
          }
        }),
      onSuccess: (entry) =>
        `Set ${matrixEventById.get(entry.playingEventId)?.name ?? "playing event"} x ${
          matrixEventById.get(entry.incomingEventId)?.name ?? "incoming event"
        } to ${entry.resolutionBehavior.behaviorName}.`
    });
  };

  const selectedEntryLabel = selectedMatrixEntry
    ? `${matrixEventById.get(selectedMatrixEntry.playingEventId)?.name ?? "Playing event"} x ${
        matrixEventById.get(selectedMatrixEntry.incomingEventId)?.name ?? "incoming event"
      }`
    : "";

  return (
    <div className="grid gap-4">
      <MatrixToolbar
        collections={matrixFilterCollections}
        coverage={matrixCoverage}
        deviceName={deviceName}
        incomingEventIds={matrixColumnEventIds}
        matrixFilterAnchor={matrixFilterAnchor}
        matrixFilterAxis={matrixFilterAxis}
        onChangeAxis={setMatrixFilterAxis}
        onCloseFilter={() => setMatrixFilterAnchor(null)}
        onOpenFilter={openMatrixFilter}
        onShareEntry={() => {
          if (selectedMatrixEntry) {
            onShareEntry(selectedMatrixEntry, selectedEntryLabel);
          }
        }}
        onToggleEvents={(axis, eventIds, nextSelected) =>
          void handleToggleMatrixAxisEvents(axis, eventIds, nextSelected)
        }
        pending={matrixMutationsPending}
        playingEventIds={matrixRowEventIds}
        selectedEntry={selectedMatrixEntry}
      />

      <div className="grid min-w-0 gap-4">
        <MatrixResolutionPanel
          behavior={matrixBehavior}
          eventById={matrixEventById}
          onBehaviorChange={(nextBehavior) => {
            setMatrixBehavior(nextBehavior);
            if (nextBehavior !== "Suppress") {
              setMatrixTargetEventId("");
            }
          }}
          onClearEntry={() => {
            if (selectedMatrixEntry) {
              onClearEntry(selectedMatrixEntry, selectedEntryLabel);
            }
          }}
          onSaveEntry={() => void handleSaveMatrixEntry()}
          onTargetEventIdChange={setMatrixTargetEventId}
          selectedEntry={selectedMatrixEntry}
          selectedIncomingEventId={selectedIncomingEventId}
          selectedPlayingEventId={selectedPlayingEventId}
          targetEventId={matrixTargetEventId}
        />

        <MatrixGrid
          collections={matrixFilterCollections}
          columns={deviceWorkspaceQuery.data?.matrixColumns ?? []}
          entries={deviceWorkspaceQuery.data?.matrixEntries ?? []}
          eventById={matrixEventById}
          incomingEventIds={matrixColumnEventIds}
          matrixFilterAnchor={matrixFilterAnchor}
          matrixFilterAxis={matrixFilterAxis}
          onChangeAxis={setMatrixFilterAxis}
          onCloseFilter={() => setMatrixFilterAnchor(null)}
          onIncomingEventIdChange={setSelectedIncomingEventId}
          onOpenFilter={openMatrixFilter}
          onPlayingEventIdChange={setSelectedPlayingEventId}
          onSelectCell={handleSelectMatrixCell}
          onToggleEvents={(axis, eventIds, nextSelected) =>
            void handleToggleMatrixAxisEvents(axis, eventIds, nextSelected)
          }
          pending={matrixMutationsPending}
          playingEventIds={matrixRowEventIds}
          rows={deviceWorkspaceQuery.data?.matrixRows ?? []}
          selectedIncomingEventId={selectedIncomingEventId}
          selectedPlayingEventId={selectedPlayingEventId}
        />
      </div>
    </div>
  );
}
