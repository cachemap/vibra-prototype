"use client";

import { asEntityId, normalizeResolutionBehavior, type EventId } from "@/domain";
import { useState } from "react";
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
import { MatrixResolutionEditor } from "./matrix-resolution-editor";
import { MatrixToolbar } from "./matrix-toolbar";
import type { MatrixAxis } from "./matrix-axis-filter";
import type { MatrixFilterAnchor } from "./matrix-axis-filter-anchor";
import { useMatrixTabModel } from "./matrix-tab-model";
import type { MatrixTabProps } from "./matrix-tab-types";

export function MatrixTab({
  deviceId,
  deviceName,
  matrixBehavior,
  matrixFilterAnchor,
  matrixFilterAxis,
  matrixPostInterruptionRecovery,
  matrixSystemInterruptionRecovery,
  matrixTargetEventId,
  onClearEntry,
  onShareEntry,
  selectedIncomingEventId,
  selectedPlayingEventId,
  setMatrixBehavior,
  setMatrixFilterAnchor,
  setMatrixFilterAxis,
  setMatrixPostInterruptionRecovery,
  setMatrixSystemInterruptionRecovery,
  setMatrixTargetEventId,
  setSelectedIncomingEventId,
  setSelectedPlayingEventId
}: MatrixTabProps) {
  const [isEditingResolution, setIsEditingResolution] = useState(false);
  const deviceWorkspaceQuery = useDeviceWorkspaceQuery(deviceId);
  const { clearFeedback, runWithFeedback } = useFeedbackActions();
  const selectMatrixRow = useSelectCollisionMatrixRowMutation();
  const selectMatrixColumn = useSelectCollisionMatrixColumnMutation();
  const deselectMatrixRow = useDeselectCollisionMatrixRowMutation();
  const deselectMatrixColumn = useDeselectCollisionMatrixColumnMutation();
  const upsertMatrixEntry = useUpsertCollisionMatrixEntryMutation();
  const {
    matrixColumnEventIds,
    matrixCoverage,
    matrixEntryByPair,
    matrixEventById,
    matrixFilterCollections,
    matrixRowEventIds,
    selectedEntryLabel,
    selectedMatrixEntry
  } = useMatrixTabModel({
    data: deviceWorkspaceQuery.data,
    selectedIncomingEventId,
    selectedPlayingEventId
  });
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
    const behavior = normalizeResolutionBehavior(entry?.resolutionBehavior, {
      playingEventId,
      incomingEventId
    });
    setMatrixBehavior(behavior.behaviorName);
    setMatrixTargetEventId(behavior.targetEventId ?? "");
    setMatrixPostInterruptionRecovery(behavior.postInterruptionRecovery);
    setMatrixSystemInterruptionRecovery(behavior.systemInterruptionRecovery);
    setIsEditingResolution(true);
  };

  const handleSaveMatrixEntry = async () => {
    const matrixId = deviceWorkspaceQuery.data?.collisionMatrix.id;

    if (!matrixId || !selectedPlayingEventId || !selectedIncomingEventId) {
      return;
    }

    const resolutionBehavior = normalizeResolutionBehavior(
      {
        behaviorName: matrixBehavior,
        targetEventId: matrixTargetEventId ? asEntityId<EventId>(matrixTargetEventId) : null,
        postInterruptionRecovery: matrixPostInterruptionRecovery,
        systemInterruptionRecovery: matrixSystemInterruptionRecovery
      },
      { playingEventId: selectedPlayingEventId, incomingEventId: selectedIncomingEventId }
    );

    await runWithFeedback({
      work: () =>
        upsertMatrixEntry.mutateAsync({
          matrixId,
          playingEventId: selectedPlayingEventId,
          incomingEventId: selectedIncomingEventId,
          resolutionBehavior
        }),
      onSuccess: (entry) =>
        `Set ${matrixEventById.get(entry.playingEventId)?.name ?? "playing event"} x ${
          matrixEventById.get(entry.incomingEventId)?.name ?? "incoming event"
        } to ${entry.resolutionBehavior.behaviorName}.`
    });
  };

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
        {isEditingResolution ? (
          <MatrixResolutionEditor
          behavior={matrixBehavior}
          eventById={matrixEventById}
          onBack={() => setIsEditingResolution(false)}
          onPostInterruptionRecoveryChange={setMatrixPostInterruptionRecovery}
          onBehaviorChange={(nextBehavior) => {
            if (!selectedPlayingEventId || !selectedIncomingEventId) {
              setMatrixBehavior(nextBehavior);
              return;
            }

            const nextRule = normalizeResolutionBehavior(
              { behaviorName: nextBehavior },
              { playingEventId: selectedPlayingEventId, incomingEventId: selectedIncomingEventId }
            );
            setMatrixBehavior(nextRule.behaviorName);
            setMatrixTargetEventId(nextRule.targetEventId ?? "");
            setMatrixPostInterruptionRecovery(nextRule.postInterruptionRecovery);
            setMatrixSystemInterruptionRecovery(nextRule.systemInterruptionRecovery);
          }}
          onClearEntry={() => {
            if (selectedMatrixEntry) {
              onClearEntry(selectedMatrixEntry, selectedEntryLabel);
            }
          }}
          onSaveEntry={() => void handleSaveMatrixEntry()}
          onSystemInterruptionRecoveryChange={setMatrixSystemInterruptionRecovery}
          onTargetEventIdChange={setMatrixTargetEventId}
          selectedEntry={selectedMatrixEntry}
          selectedIncomingEventId={selectedIncomingEventId}
          selectedPlayingEventId={selectedPlayingEventId}
          postInterruptionRecovery={matrixPostInterruptionRecovery}
          systemInterruptionRecovery={matrixSystemInterruptionRecovery}
          targetEventId={matrixTargetEventId}
          workspace={deviceWorkspaceQuery.data}
          />
        ) : null}

        <div className={isEditingResolution ? "hidden" : undefined}>
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
    </div>
  );
}
