"use client";

import { useMemo } from "react";
import { MoreHorizontal, Play, Plus, Square, Trash2 } from "lucide-react";

import {
  Button,
  EmptyState,
  IconButton,
  Switch,
  Timeline,
  type TimelineLane
} from "@/components/primitives";
import type { DeviceEventAggregate, DeviceWorkspaceAggregate } from "@/data/repositories/project-repository";
import type { Asset, EventTriggerId, Trigger, TriggerPlaybackId } from "@/domain";
import { useAudioPreviewActions, useAudioPreviewState } from "@/features/projects/audio-preview-context";
import { formatSeconds } from "@/lib/format";

import {
  previewItemsByEventTriggerId,
  timelineMaxSecondsFor,
  timelinePlaybacksFor
} from "./event-derivations";

type EventTimelineProps = {
  assetById: ReadonlyMap<Asset["id"], DeviceWorkspaceAggregate["playbackAssets"][number]>;
  onCreatePlayback: (eventTriggerId: EventTriggerId) => void;
  onDeleteEventTrigger: (request: {
    eventTriggerId: EventTriggerId;
    label: string;
    playbacksCount: number;
  }) => void;
  onDeleteTriggerPlayback: (request: {
    assetName: string;
    startOffset: number;
    triggerPlaybackId: TriggerPlaybackId;
  }) => void;
  onEditPlayback: (eventTriggerId: EventTriggerId, playbackId: TriggerPlaybackId) => void;
  onTriggerEnabledChange: (eventTriggerId: EventTriggerId, isEnabled: boolean) => void;
  selectedDeviceIsEnabled: boolean;
  selectedEvent: DeviceEventAggregate | null;
  triggerById: ReadonlyMap<Trigger["id"], Trigger>;
};

export function EventTimeline({
  assetById,
  onCreatePlayback,
  onDeleteEventTrigger,
  onDeleteTriggerPlayback,
  onEditPlayback,
  onTriggerEnabledChange,
  selectedDeviceIsEnabled,
  selectedEvent,
  triggerById
}: EventTimelineProps) {
  const audioPreview = useAudioPreviewActions();
  const audioPreviewState = useAudioPreviewState();
  const timelinePlaybacks = useMemo(
    () => timelinePlaybacksFor(selectedEvent, assetById),
    [assetById, selectedEvent]
  );
  const timelineMaxSeconds = useMemo(
    () => timelineMaxSecondsFor(timelinePlaybacks),
    [timelinePlaybacks]
  );
  const previewItems = useMemo(
    () => previewItemsByEventTriggerId(timelinePlaybacks, selectedDeviceIsEnabled),
    [selectedDeviceIsEnabled, timelinePlaybacks]
  );
  const timelineLanes: TimelineLane[] = useMemo(
    () =>
      (selectedEvent?.eventTriggers ?? []).map((eventTrigger) => {
        const trigger = triggerById.get(eventTrigger.triggerId);
        const triggerName = trigger?.name ?? eventTrigger.triggerId;
        const isLaneDisabled = !eventTrigger.isEnabled || !selectedDeviceIsEnabled;
        const laneItems = previewItems.get(eventTrigger.id) ?? [];
        const isLanePlayable = !isLaneDisabled && laneItems.length > 0;
        const playheadSeconds = audioPreviewState.playheadByScheduleKey[eventTrigger.id] ?? null;
        const isLanePlaying = playheadSeconds !== null;
        const playbacks = [...eventTrigger.playbacks].sort(
          (first, second) => first.startOffset - second.startOffset
        );

        const deleteInteractionButton = (
          <IconButton
            icon={Trash2}
            label={`Delete interaction ${triggerName}`}
            onClick={() => {
              audioPreview.stopSchedule(eventTrigger.id);
              onDeleteEventTrigger({
                eventTriggerId: eventTrigger.id,
                label: eventTrigger.label || triggerName,
                playbacksCount: eventTrigger.playbacks.length
              });
            }}
            size="compact"
          />
        );

        return {
          blocks: playbacks.map((playback) => {
            const asset = assetById.get(playback.assetId);

            return {
              controls: (
                <span className="flex items-center gap-1">
                  <IconButton
                    icon={MoreHorizontal}
                    label={`Edit playback ${asset?.name ?? playback.assetId}`}
                    onClick={() => onEditPlayback(eventTrigger.id, playback.id)}
                    size="compact"
                  />
                  <IconButton
                    icon={Trash2}
                    label={`Delete playback ${asset?.name ?? playback.assetId}`}
                    onClick={() => {
                      audioPreview.stopSchedule(eventTrigger.id);
                      onDeleteTriggerPlayback({
                        assetName: asset?.name ?? playback.assetId,
                        startOffset: playback.startOffset,
                        triggerPlaybackId: playback.id
                      });
                    }}
                    size="compact"
                  />
                </span>
              ),
              id: playback.id,
              isDisabled: isLaneDisabled,
              kind: asset?.mediaKind === "haptic" ? ("haptic" as const) : ("audio" as const),
              label: asset?.name ?? playback.assetId,
              meta: formatSeconds(playback.startOffset),
              offsetSeconds: playback.startOffset
            };
          }),
          controls: (
            <span className="flex items-center gap-1">
              <IconButton
                disabled={!isLanePlayable}
                icon={isLanePlaying ? Square : Play}
                label={`${isLanePlaying ? "Stop" : "Play"} ${triggerName}`}
                onClick={() => {
                  if (isLanePlaying) {
                    audioPreview.stopSchedule(eventTrigger.id);
                    return;
                  }

                  audioPreview.playSchedule(eventTrigger.id, laneItems, timelineMaxSeconds);
                }}
                size="compact"
              />
              {deleteInteractionButton}
            </span>
          ),
          emptyAction: (
            <Button
              leftIcon={<Plus className="size-4" />}
              onClick={() => onCreatePlayback(eventTrigger.id)}
              size="compact"
            >
              Playback
            </Button>
          ),
          id: eventTrigger.id,
          isDisabled: isLaneDisabled,
          label: triggerName,
          meta: (
            <Switch
              checked={eventTrigger.isEnabled}
              id={`event-trigger-${eventTrigger.id}`}
              label={eventTrigger.isEnabled ? "Enabled" : "Disabled"}
              onChange={(toggleEvent) =>
                onTriggerEnabledChange(eventTrigger.id, toggleEvent.currentTarget.checked)
              }
            />
          ),
          title: eventTrigger.label || triggerName,
          playheadLabel: triggerName.slice(0, 1).toUpperCase(),
          playheadSeconds,
          trailingAction: (
            <IconButton
              icon={Plus}
              label={`Add playback to ${triggerName}`}
              onClick={() => onCreatePlayback(eventTrigger.id)}
              size="compact"
            />
          )
        };
      }),
    [
      assetById,
      audioPreview,
      audioPreviewState.playheadByScheduleKey,
      onCreatePlayback,
      onDeleteEventTrigger,
      onDeleteTriggerPlayback,
      onEditPlayback,
      onTriggerEnabledChange,
      previewItems,
      selectedDeviceIsEnabled,
      selectedEvent,
      timelineMaxSeconds,
      triggerById
    ]
  );

  return (
    <>
      {timelineLanes.length ? (
        <Timeline lanes={timelineLanes} maxSeconds={timelineMaxSeconds} />
      ) : (
        <EmptyState
          title="No interactions bound yet"
          description="Bind an interaction such as onPress to schedule sound and haptic playbacks."
        />
      )}
      {audioPreviewState.errorMessage ? (
        <p className="text-sm text-gray-600">{audioPreviewState.errorMessage}</p>
      ) : null}
    </>
  );
}
