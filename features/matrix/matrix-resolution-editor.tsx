"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/primitives";
import type { DeviceWorkspaceAggregate } from "@/data/repositories/project-repository";
import type {
  CollisionMatrixEntry,
  Event,
  EventId,
  InterruptionRecovery,
  ResolutionBehaviorName
} from "@/domain";
import { CollisionPreviewTimeline } from "./collision-preview-timeline";
import { MatrixResolutionPanel } from "./matrix-resolution-panel";

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

export function MatrixResolutionEditor({ onBack, ...panelProps }: MatrixResolutionEditorProps) {
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
        playingEventId={panelProps.selectedPlayingEventId}
        workspace={panelProps.workspace}
      />
      <MatrixResolutionPanel {...panelProps} />
    </section>
  );
}
