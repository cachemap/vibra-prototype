import type {
  DeviceEventAggregate,
  DeviceWorkspaceAggregate
} from "@/data/repositories/project-repository";
import type { Event, EventId } from "@/domain";

type PlaybackAsset = DeviceWorkspaceAggregate["playbackAssets"][number];

export type CollisionPreviewSource = {
  asset: PlaybackAsset;
  eventId: EventId;
  eventTriggerId: string;
  key: string;
  playbackId: string;
  startOffset: number;
};

export type CollisionPreviewLane = {
  event: Event | null;
  eventId: EventId | null;
  hapticPlaybackCount: number;
  sources: CollisionPreviewSource[];
};

function eventAggregateFor(
  workspace: DeviceWorkspaceAggregate | undefined,
  eventId: EventId | null
): DeviceEventAggregate | null {
  if (!workspace || !eventId) {
    return null;
  }

  return (
    workspace.collections
      .flatMap((collection) => collection.events)
      .find((candidate) => candidate.event.id === eventId) ?? null
  );
}

/**
 * Finds the audio choices available to one side of the collision editor. This is deliberately
 * a read-only projection: choosing a source here must never mutate an EventTrigger playback.
 */
export function collisionPreviewLaneFor(
  workspace: DeviceWorkspaceAggregate | undefined,
  eventId: EventId | null
): CollisionPreviewLane {
  const aggregate = eventAggregateFor(workspace, eventId);
  const assetById = new Map(workspace?.playbackAssets.map((asset) => [asset.id, asset]) ?? []);
  let hapticPlaybackCount = 0;

  const sources = (aggregate?.eventTriggers ?? [])
    .filter((eventTrigger) => eventTrigger.isEnabled)
    .flatMap((eventTrigger) =>
      eventTrigger.playbacks.flatMap((playback) => {
        const asset = assetById.get(playback.assetId);

        if (!asset) {
          return [];
        }

        if (asset.mediaKind !== "audio") {
          if (asset.mediaKind === "haptic") {
            hapticPlaybackCount += 1;
          }
          return [];
        }

        if (!asset.playbackUrl) {
          return [];
        }

        return [
          {
            asset,
            eventId: aggregate!.event.id,
            eventTriggerId: eventTrigger.id,
            key: `${eventTrigger.id}:${playback.id}`,
            playbackId: playback.id,
            startOffset: playback.startOffset
          }
        ];
      })
    )
    .toSorted(
      (first, second) =>
        first.startOffset - second.startOffset ||
        first.asset.name.localeCompare(second.asset.name) ||
        first.playbackId.localeCompare(second.playbackId)
    );

  return {
    event: aggregate?.event ?? null,
    eventId,
    hapticPlaybackCount,
    sources
  };
}

export function collisionPreviewLanesFor(
  workspace: DeviceWorkspaceAggregate | undefined,
  playingEventId: EventId | null,
  incomingEventId: EventId | null
) {
  return {
    incoming: collisionPreviewLaneFor(workspace, incomingEventId),
    playing: collisionPreviewLaneFor(workspace, playingEventId)
  };
}
