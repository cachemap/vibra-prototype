"use client";

import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/primitives";
import type { DeviceWorkspaceAggregate } from "@/data/repositories/project-repository";
import {
  resolutionBehaviorDefinitions,
  type CollisionMatrixEntry,
  type Event,
  type EventId,
  type InterruptionRecovery,
  type ResolutionBehaviorName
} from "@/domain";
import { CollisionPreviewTimeline } from "./collision-preview-timeline";
import {
  MatrixResolutionPanel,
  type MatrixTargetPosition
} from "./matrix-resolution-panel";

export type MatrixResolutionEditorProps = {
  behavior: ResolutionBehaviorName;
  eventById: ReadonlyMap<EventId, Event>;
  onBack: () => void;
  onBehaviorChange: (behavior: ResolutionBehaviorName) => void;
  onClearEntry: () => void;
  onPostInterruptionRecoveryChange: (recovery: InterruptionRecovery | null) => void;
  onSaveEntry: () => void;
  onSystemInterruptionRecoveryChange: (recovery: InterruptionRecovery | null) => void;
  onTargetEventIdChange: (eventId: string) => void;
  postInterruptionRecovery: InterruptionRecovery | null;
  selectedEntry: CollisionMatrixEntry | undefined;
  selectedIncomingEventId: EventId | null;
  selectedPlayingEventId: EventId | null;
  systemInterruptionRecovery: InterruptionRecovery | null;
  targetEventId: string;
  workspace: DeviceWorkspaceAggregate | undefined;
};

function targetPositionFor({
  behavior,
  incomingEventId,
  playingEventId,
  targetEventId
}: {
  behavior: ResolutionBehaviorName;
  incomingEventId: EventId | null;
  playingEventId: EventId | null;
  targetEventId: string;
}): MatrixTargetPosition | null {
  if (resolutionBehaviorDefinitions[behavior].target === "forbidden" || !targetEventId) {
    return null;
  }

  const matchesPlaying = targetEventId === playingEventId;
  const matchesIncoming = targetEventId === incomingEventId;

  if (matchesPlaying && matchesIncoming) {
    return resolutionBehaviorDefinitions[behavior].defaultTarget;
  }

  return matchesPlaying ? "playing" : matchesIncoming ? "incoming" : null;
}

export function MatrixResolutionEditor({ onBack, ...panelProps }: MatrixResolutionEditorProps) {
  const targetSelectionKey = [
    panelProps.behavior,
    panelProps.selectedPlayingEventId,
    panelProps.selectedIncomingEventId,
    panelProps.targetEventId
  ].join(":");
  const derivedTargetPosition = targetPositionFor({
    behavior: panelProps.behavior,
    incomingEventId: panelProps.selectedIncomingEventId,
    playingEventId: panelProps.selectedPlayingEventId,
    targetEventId: panelProps.targetEventId
  });
  const [localTargetSelection, setLocalTargetSelection] = useState<{
    key: string;
    position: MatrixTargetPosition | null;
  }>({ key: targetSelectionKey, position: derivedTargetPosition });
  // A diagonal cell stores the same event ID for both sides, so preserve the chosen side locally.
  const targetPosition =
    localTargetSelection.key === targetSelectionKey
      ? localTargetSelection.position
      : derivedTargetPosition;
  const setTargetPosition = (position: MatrixTargetPosition) => {
    setLocalTargetSelection({ key: targetSelectionKey, position });
  };

  return (
    <section aria-label="Collision Matrix resolution editor" className="grid gap-5">
      <div>
        <Button aria-label="Back to Matrix" className="h-11" leftIcon={<ArrowLeft className="size-4" />} onClick={onBack}>
          Back to Matrix
        </Button>
      </div>
      <CollisionPreviewTimeline
        behavior={panelProps.behavior}
        eventById={panelProps.eventById}
        incomingEventId={panelProps.selectedIncomingEventId}
        postInterruptionRecovery={panelProps.postInterruptionRecovery}
        playingEventId={panelProps.selectedPlayingEventId}
        targetLane={targetPosition}
        workspace={panelProps.workspace}
      />
      <MatrixResolutionPanel
        {...panelProps}
        onTargetPositionChange={setTargetPosition}
        targetPosition={targetPosition}
      />
    </section>
  );
}
