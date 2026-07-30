"use client";

import { ConfirmDialog } from "@/components/primitives";
import type { EventTriggerId, TriggerPlaybackId } from "@/domain";
import { formatSeconds } from "@/lib/format";
import { pluralSuffix } from "@/lib/plural";

export type EventDeleteTarget =
  | {
      eventName: string;
      type: "event";
    }
  | {
      eventTriggerId: EventTriggerId;
      label: string;
      playbacksCount: number;
      type: "eventTrigger";
    }
  | {
      assetName: string;
      startOffset: number;
      triggerPlaybackId: TriggerPlaybackId;
      type: "triggerPlayback";
    };

type EventDeleteConfirmsProps = {
  deleteTarget: EventDeleteTarget | null;
  disabled: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

const confirmLabelFor = (target: EventDeleteTarget) => {
  switch (target.type) {
    case "event":
      return "Delete event";
    case "eventTrigger":
      return "Delete interaction";
    case "triggerPlayback":
      return "Delete playback";
  }
};

const titleFor = (target: EventDeleteTarget) => {
  switch (target.type) {
    case "event":
      return "Delete event?";
    case "eventTrigger":
      return "Delete interaction?";
    case "triggerPlayback":
      return "Delete playback?";
  }
};

const cascadeSummaryFor = (target: EventDeleteTarget) => {
  switch (target.type) {
    case "event":
      return "Trigger schedules, collision matrix rows, columns, entries, and share links.";
    case "eventTrigger":
      return `${target.playbacksCount} scheduled playback${pluralSuffix(target.playbacksCount)}.`;
    case "triggerPlayback":
      return "No dependent records.";
  }
};

const bodyCopyFor = (target: EventDeleteTarget) => {
  switch (target.type) {
    case "event":
      return `This removes ${target.eventName} and its dependent demo records from IndexedDB.`;
    case "eventTrigger":
      return `This removes ${target.label} from the event timeline.`;
    case "triggerPlayback":
      return `This removes ${target.assetName} at ${formatSeconds(
        target.startOffset
      )} from the timeline.`;
  }
};

export function EventDeleteConfirms({
  deleteTarget,
  disabled,
  onCancel,
  onConfirm
}: EventDeleteConfirmsProps) {
  if (!deleteTarget) {
    return null;
  }

  return (
    <ConfirmDialog
      confirmLabel={confirmLabelFor(deleteTarget)}
      disabled={disabled}
      onCancel={onCancel}
      onConfirm={onConfirm}
      title={titleFor(deleteTarget)}
      cascadeSummary={cascadeSummaryFor(deleteTarget)}
    >
      {bodyCopyFor(deleteTarget)}
    </ConfirmDialog>
  );
}
