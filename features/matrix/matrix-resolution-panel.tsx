"use client";

import { Trash2 } from "lucide-react";
import { Button, Select } from "@/components/primitives";
import {
  resolutionBehaviorNames,
  type CollisionMatrixEntry,
  type Event,
  type EventId,
  type ResolutionBehaviorName
} from "@/domain";
import { behaviorCopy } from "./behavior";

type MatrixResolutionPanelProps = {
  behavior: ResolutionBehaviorName;
  eventById: ReadonlyMap<EventId, Event>;
  onBehaviorChange: (behavior: ResolutionBehaviorName) => void;
  onClearEntry: () => void;
  onSaveEntry: () => void;
  onTargetEventIdChange: (eventId: string) => void;
  selectedEntry: CollisionMatrixEntry | undefined;
  selectedIncomingEventId: EventId | null;
  selectedPlayingEventId: EventId | null;
  targetEventId: string;
};

export function MatrixResolutionPanel({
  behavior,
  eventById,
  onBehaviorChange,
  onClearEntry,
  onSaveEntry,
  onTargetEventIdChange,
  selectedEntry,
  selectedIncomingEventId,
  selectedPlayingEventId,
  targetEventId
}: MatrixResolutionPanelProps) {
  return (
    <div className="grid gap-3 border-y border-gray-300 bg-gray-50 px-3 py-3">
      <div>
        <h4 className="text-sm font-semibold text-gray-700">Resolution Behavior</h4>
        <p className="text-xs text-gray-500">
          {selectedPlayingEventId && selectedIncomingEventId
            ? `${eventById.get(selectedPlayingEventId)?.name ?? "Playing event"} when ${
                eventById.get(selectedIncomingEventId)?.name ?? "incoming event"
              } arrives.`
            : "Choose a playing row and incoming column before saving."}
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-[1fr_1fr]">
        <div className="grid gap-1 border-l border-gray-300 bg-gray-25 px-3 py-2">
          <span className="text-xs font-medium text-gray-500">Playing</span>
          <span className="truncate text-sm font-semibold text-gray-700">
            {selectedPlayingEventId
              ? (eventById.get(selectedPlayingEventId)?.name ?? "Playing event")
              : "No row selected"}
          </span>
        </div>
        <div className="grid gap-1 border-l border-gray-300 bg-gray-25 px-3 py-2">
          <span className="text-xs font-medium text-gray-500">Incoming</span>
          <span className="truncate text-sm font-semibold text-gray-700">
            {selectedIncomingEventId
              ? (eventById.get(selectedIncomingEventId)?.name ?? "Incoming event")
              : "No column selected"}
          </span>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <Select
          id="matrix-behavior"
          label="Behavior"
          onChange={(event) => onBehaviorChange(event.currentTarget.value as ResolutionBehaviorName)}
          value={behavior}
        >
          {resolutionBehaviorNames.map((resolutionBehavior) => (
            <option key={resolutionBehavior} value={resolutionBehavior}>
              {resolutionBehavior}
            </option>
          ))}
        </Select>
        <Select
          disabled={behavior !== "Suppress"}
          id="matrix-target"
          label="Target"
          onChange={(event) => onTargetEventIdChange(event.currentTarget.value)}
          value={targetEventId}
        >
          <option value="">No target</option>
          {selectedPlayingEventId ? (
            <option value={selectedPlayingEventId}>
              Playing / {eventById.get(selectedPlayingEventId)?.name}
            </option>
          ) : null}
          {selectedIncomingEventId ? (
            <option value={selectedIncomingEventId}>
              Incoming / {eventById.get(selectedIncomingEventId)?.name}
            </option>
          ) : null}
        </Select>
        <div className="flex items-end gap-2">
          <Button
            disabled={!selectedEntry}
            leftIcon={<Trash2 className="size-4" />}
            onClick={onClearEntry}
            variant="destructive"
          >
            Clear rule
          </Button>
          <Button
            disabled={!selectedPlayingEventId || !selectedIncomingEventId}
            onClick={onSaveEntry}
            variant="primary"
          >
            Save rule
          </Button>
        </div>
      </div>
      <p className="text-sm text-gray-600">{behaviorCopy[behavior]}</p>
    </div>
  );
}
