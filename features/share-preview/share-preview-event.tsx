"use client";

import { useMemo } from "react";
import { Radio } from "lucide-react";

import { EmptyState, Timeline, type TimelineLane } from "@/components/primitives";
import type { SharingLinkPreviewAggregate } from "@/data/repositories/project-repository";
import { timelineTailSeconds } from "@/features/events/event-derivations";
import {
  AudioPreviewIconButton,
  TimelinePreviewControls,
  playableAudioItems,
  type AudioPreviewItem
} from "@/features/projects/audio-preview";
import {
  useAudioPreviewActions,
  useAudioPreviewState
} from "@/features/projects/audio-preview-context";
import { formatSeconds } from "@/lib/format";

type SharePreviewEventProps = {
  target: Extract<SharingLinkPreviewAggregate["target"], { kind: "event" }>;
};

export function SharePreviewEvent({ target }: SharePreviewEventProps) {
  const { activeKey, errorMessage, isPlaying } = useAudioPreviewState();
  const { playItem, playSchedule, stop } = useAudioPreviewActions();
  const sharePreviewItems = useMemo<AudioPreviewItem[]>(
    () =>
      target.eventTriggers
        .flatMap((eventTrigger) =>
          eventTrigger.playbacks.map((playback) => ({
            asset: playback.asset,
            isEnabled: Boolean(target.device.isEnabled && eventTrigger.isEnabled),
            key: `share-${playback.id}`,
            startOffset: playback.startOffset
          }))
        )
        .filter((item) => item.asset.mediaKind === "audio"),
    [target]
  );
  const sharePreviewItemsByPlaybackId = useMemo(
    () => new Map(sharePreviewItems.map((item) => [item.key.replace("share-", ""), item])),
    [sharePreviewItems]
  );
  const hasPlayableShareAudio = playableAudioItems(sharePreviewItems).length > 0;
  const shareTimelineMaxSeconds = useMemo(
    () => Math.max(1, ...target.eventTriggers.flatMap((eventTrigger) =>
      eventTrigger.playbacks.map((playback) => playback.startOffset + timelineTailSeconds)
    )),
    [target]
  );
  const shareTimelineLanes = useMemo<TimelineLane[]>(
    () =>
      target.eventTriggers.map((eventTrigger) => {
        const playbacks = eventTrigger.playbacks
          .map((playback) => ({
            playback,
            previewItem: sharePreviewItemsByPlaybackId.get(playback.id)
          }))
          .sort(
            (first, second) =>
              first.playback.startOffset - second.playback.startOffset ||
              first.playback.asset.name.localeCompare(second.playback.asset.name)
          );

        return {
          blocks: playbacks.map(({ playback, previewItem }) => ({
            controls: previewItem ? (
              <AudioPreviewIconButton
                activeKey={activeKey}
                item={previewItem}
                onPlay={(item) => void playItem(item)}
                onStop={stop}
              />
            ) : undefined,
            id: playback.id,
            isDisabled: !eventTrigger.isEnabled || !target.device.isEnabled,
            kind: playback.asset.mediaKind,
            label: playback.asset.name,
            meta: formatSeconds(playback.startOffset),
            offsetSeconds: playback.startOffset
          })),
          id: eventTrigger.id,
          isDisabled: !eventTrigger.isEnabled || !target.device.isEnabled,
          label: eventTrigger.trigger.name,
          meta: [
            eventTrigger.label || (eventTrigger.isEnabled ? "Enabled" : null),
            eventTrigger.isEnabled ? null : "disabled interaction",
            target.device.isEnabled ? null : "disabled device"
          ]
            .filter(Boolean)
            .join(" / ")
        };
      }),
    [activeKey, playItem, sharePreviewItemsByPlaybackId, stop, target]
  );

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_450px]">
      <div className="grid content-start gap-2 border-y border-gray-300 bg-gray-50 px-3 py-3">
        <h2 className="text-sm font-semibold text-gray-700">Event Summary</h2>
        <p className="text-sm text-gray-600">
          {target.event.eventType} in {target.collection.name} for {target.device.name} on {target.platform.name}.
        </p>
        {target.device.isEnabled ? null : (
          <p className="border-y border-gray-300 bg-gray-100 px-2 py-2 text-sm text-gray-700">
            This device is disabled and excluded from playback/export.
          </p>
        )}
      </div>
      <div className="grid content-start gap-2 border-y border-gray-300 bg-gray-50 px-3 py-3">
        <div className="flex min-h-[34px] items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Radio className="size-4 text-gray-500" />
            Playback Preview
          </h2>
          <TimelinePreviewControls
            disabled={!hasPlayableShareAudio}
            isPlaying={isPlaying}
            label="playback preview"
            onPlay={() => playSchedule("share-preview", sharePreviewItems)}
            onStop={stop}
          />
        </div>
        {errorMessage ? <p className="text-xs font-medium text-gray-600">{errorMessage}</p> : null}
        {shareTimelineLanes.some((lane) => lane.blocks.length) ? (
          <Timeline lanes={shareTimelineLanes} maxSeconds={shareTimelineMaxSeconds} />
        ) : (
          <EmptyState title="No scheduled playbacks" description="This event has no previewable feedback yet." />
        )}
      </div>
    </div>
  );
}
