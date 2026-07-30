import type {
  DeviceCollectionAggregate,
  DeviceEventAggregate
} from "@/data/repositories/project-repository";
import type { AudioPreviewItem } from "@/features/projects/audio-preview";
import type { Asset, EventId, EventTriggerId, TriggerPlayback } from "@/domain";

export const timelineTailSeconds = 0.45;

export type LocatedEvent = {
  collection: DeviceCollectionAggregate["collection"];
  event: DeviceEventAggregate;
};

export type TimelinePlayback = {
  asset:
    | (Asset & {
        libraryName: string;
        isDefaultLibrary: boolean;
        isImportedLibrary: boolean;
      })
    | undefined;
  eventTrigger: DeviceEventAggregate["eventTriggers"][number];
  playback: TriggerPlayback;
};

export function locateEventInCollections(
  collections: readonly DeviceCollectionAggregate[],
  eventId: EventId
): LocatedEvent | null {
  return (
    collections
      .flatMap((collection) =>
        collection.events.map((event) => ({ collection: collection.collection, event }))
      )
      .find((candidate) => candidate.event.event.id === eventId) ?? null
  );
}

export function timelinePlaybacksFor(
  event: DeviceEventAggregate | null,
  assetById: ReadonlyMap<Asset["id"], TimelinePlayback["asset"]>
): TimelinePlayback[] {
  return (event?.eventTriggers ?? [])
    .flatMap((eventTrigger) =>
      eventTrigger.playbacks.map((playback) => ({
        eventTrigger,
        playback,
        asset: assetById.get(playback.assetId)
      }))
    )
    .sort(
      (first, second) =>
        first.playback.startOffset - second.playback.startOffset ||
        (first.asset?.name ?? "").localeCompare(second.asset?.name ?? "")
    );
}

export function timelineMaxSecondsFor(playbacks: readonly TimelinePlayback[]): number {
  return Math.max(
    1,
    ...playbacks.map(({ playback }) => playback.startOffset + timelineTailSeconds)
  );
}

export function previewItemsByEventTriggerId(
  playbacks: readonly TimelinePlayback[],
  selectedDeviceIsEnabled: boolean
): Map<EventTriggerId, AudioPreviewItem[]> {
  const grouped = new Map<EventTriggerId, AudioPreviewItem[]>();

  playbacks.forEach(({ asset, eventTrigger, playback }) => {
    if (!asset) {
      return;
    }

    const previewItem: AudioPreviewItem = {
      asset,
      isEnabled: selectedDeviceIsEnabled && eventTrigger.isEnabled,
      key: `event-${playback.id}`,
      startOffset: playback.startOffset
    };

    grouped.set(eventTrigger.id, [...(grouped.get(eventTrigger.id) ?? []), previewItem]);
  });

  return grouped;
}
