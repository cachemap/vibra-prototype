"use client";

import { CircleHelp, Trash2 } from "lucide-react";
import { Button, Select, Tooltip } from "@/components/primitives";
import {
  canUseResolutionBehavior,
  interruptionRecoveries,
  resolutionBehaviorDefinitions,
  resolutionBehaviorNames,
  type CollisionMatrixEntry,
  type Event,
  type EventId,
  type InterruptionRecovery,
  type ResolutionBehaviorName
} from "@/domain";
import { behaviorCopy } from "./behavior";

type MatrixResolutionPanelProps = {
  behavior: ResolutionBehaviorName;
  eventById: ReadonlyMap<EventId, Event>;
  onBehaviorChange: (behavior: ResolutionBehaviorName) => void;
  onClearEntry: () => void;
  onSaveEntry: () => void;
  onPostInterruptionRecoveryChange: (recovery: InterruptionRecovery | null) => void;
  onSystemInterruptionRecoveryChange: (recovery: InterruptionRecovery | null) => void;
  onTargetPositionChange?: (position: MatrixTargetPosition) => void;
  onTargetEventIdChange: (eventId: string) => void;
  postInterruptionRecovery: InterruptionRecovery | null;
  selectedEntry: CollisionMatrixEntry | undefined;
  selectedIncomingEventId: EventId | null;
  selectedPlayingEventId: EventId | null;
  systemInterruptionRecovery: InterruptionRecovery | null;
  targetEventId: string;
  targetPosition?: MatrixTargetPosition | null;
};

export type MatrixTargetPosition = "playing" | "incoming";

type SegmentedControlProps<T extends string> = {
  description: string;
  id: string;
  label: string;
  onChange: (value: T) => void;
  options: readonly { label: string; value: T }[];
  value: T | null;
};

function SegmentedControl<T extends string>({
  description,
  id,
  label,
  onChange,
  options,
  value
}: SegmentedControlProps<T>) {
  const labelId = `${id}-label`;
  const descriptionId = `${id}-description`;

  return (
    <div className="grid gap-1.5">
      <div className="flex items-center gap-1">
        <span className="text-sm font-medium text-gray-700" id={labelId}>
          {label}
        </span>
        <Tooltip content={description}>
          <button
            aria-describedby={descriptionId}
            aria-label={`Learn about ${label}`}
            className="inline-flex size-5 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/40"
            type="button"
          >
            <CircleHelp aria-hidden="true" className="size-4" />
          </button>
        </Tooltip>
      </div>
      <p className="sr-only" id={descriptionId}>
        {description}
      </p>
      <div aria-describedby={descriptionId} aria-labelledby={labelId} className="grid grid-cols-2 rounded-lg border border-gray-300 bg-gray-25 p-0.5" role="group">
        {options.map((option) => {
          const selected = value === option.value;

          return (
            <button
              aria-pressed={selected}
              className={`min-h-11 rounded-md px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/40 focus-visible:ring-offset-1 ${
                selected
                  ? "bg-gray-700 text-gray-25 shadow-sm"
                  : "text-gray-700 hover:bg-gray-100 active:bg-gray-200"
              }`}
              key={option.value}
              onClick={() => onChange(option.value)}
              type="button"
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function MatrixResolutionPanel({
  behavior,
  eventById,
  onBehaviorChange,
  onClearEntry,
  onPostInterruptionRecoveryChange,
  onSaveEntry,
  onSystemInterruptionRecoveryChange,
  onTargetPositionChange,
  onTargetEventIdChange,
  postInterruptionRecovery,
  selectedEntry,
  selectedIncomingEventId,
  selectedPlayingEventId,
  systemInterruptionRecovery,
  targetEventId,
  targetPosition
}: MatrixResolutionPanelProps) {
  const definition = resolutionBehaviorDefinitions[behavior];
  const selectedPair = selectedPlayingEventId && selectedIncomingEventId;
  const targetMatchesPlaying = Boolean(targetEventId && targetEventId === selectedPlayingEventId);
  const targetMatchesIncoming = Boolean(targetEventId && targetEventId === selectedIncomingEventId);
  const resolvedTargetPosition =
    targetPosition ??
    (targetMatchesPlaying && targetMatchesIncoming
      ? definition.defaultTarget
      : targetMatchesPlaying
        ? "playing"
        : targetMatchesIncoming
          ? "incoming"
          : null);
  const ruleIsValid = selectedPair
    ? canUseResolutionBehavior(
        {
          behaviorName: behavior,
          targetEventId: targetEventId ? (targetEventId as EventId) : null,
          postInterruptionRecovery,
          systemInterruptionRecovery
        },
        { playingEventId: selectedPlayingEventId, incomingEventId: selectedIncomingEventId }
      ).isOk()
    : false;

  return (
    <div className="grid gap-4">
      <div className="grid gap-1">
        <h3 className="text-sm font-semibold text-gray-700">Interruption behavior</h3>
        <p className="text-xs text-gray-500">
          {selectedPlayingEventId && selectedIncomingEventId
            ? `${eventById.get(selectedPlayingEventId)?.name ?? "Playing event"} when ${
                eventById.get(selectedIncomingEventId)?.name ?? "incoming event"
              } arrives.`
            : "Choose a playing row and incoming column before saving."}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Select
          className="h-11"
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
        {definition.target === "required" ? (
          <SegmentedControl
            description="Choose which event this rule affects: the event already playing or the event that arrives next."
            id="matrix-target"
            label="Target"
            onChange={(position) => {
              onTargetPositionChange?.(position);
              const eventId =
                position === "playing" ? selectedPlayingEventId : selectedIncomingEventId;

              if (eventId) {
                onTargetEventIdChange(eventId);
              }
            }}
            options={[
              selectedPlayingEventId
                ? { label: "Playing", value: "playing" as const }
                : null,
              selectedIncomingEventId
                ? { label: "Incoming", value: "incoming" as const }
                : null
            ].filter(
              (option): option is { label: string; value: MatrixTargetPosition } => option !== null
            )}
            value={resolvedTargetPosition}
          />
        ) : (
          <div aria-live="polite" className="grid content-end text-xs text-gray-500">
            This behavior does not target either event.
          </div>
        )}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {definition.postInterruptionRecovery === "required" ? (
          <SegmentedControl
            description="Choose whether the interrupted event resumes after the interruption or remains stopped."
            id="matrix-post-interruption-recovery"
            label="Post interruption"
            onChange={onPostInterruptionRecoveryChange}
            options={interruptionRecoveries.map((recovery) => ({ label: recovery, value: recovery }))}
            value={postInterruptionRecovery}
          />
        ) : null}
        {definition.systemInterruptionRecovery === "required" ? (
          <SegmentedControl
            description="Choose whether this event resumes after the operating system interrupts playback or remains stopped."
            id="matrix-system-interruption-recovery"
            label="System interruption"
            onChange={onSystemInterruptionRecoveryChange}
            options={interruptionRecoveries.map((recovery) => ({ label: recovery, value: recovery }))}
            value={systemInterruptionRecovery}
          />
        ) : null}
      </div>
      <p className="flex items-center gap-1 text-sm text-gray-600">
        <CircleHelp aria-hidden="true" className="size-4 text-gray-500" />
        {behaviorCopy[behavior]} {definition.help}
      </p>
      <div className="flex flex-wrap justify-end gap-2 border-t border-gray-200 pt-4">
        <Button
          aria-label="Clear collision rule"
          className="h-11"
          disabled={!selectedEntry}
          leftIcon={<Trash2 className="size-4" />}
          onClick={onClearEntry}
          variant="destructive"
        >
          Clear rule
        </Button>
        <Button aria-label="Save collision rule" className="h-11" disabled={!ruleIsValid} onClick={onSaveEntry} variant="primary">
          Save rule
        </Button>
      </div>
    </div>
  );
}
