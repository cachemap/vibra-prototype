import { describe, expect, it } from "vitest";
import type { DeviceWorkspaceAggregate } from "@/data/repositories/project-repository";
import { asEntityId, asISODateString, type Asset, type EventId } from "@/domain";
import { collisionPreviewLaneFor, collisionPreviewLanesFor } from "@/features/matrix/collision-preview-model";

const eventId = asEntityId<EventId>("event_pay_now");
const incomingEventId = asEntityId<EventId>("event_card_declined");
const audioAsset = (id: string, name: string): Asset => ({
  assetId: id,
  folderId: asEntityId("folder_audio"),
  id: asEntityId(id),
  libraryId: asEntityId("library_audio"),
  mediaKind: "audio",
  name,
  originalFilename: `${id}.wav`,
  playbackUrl: `/audio/${id}.wav`,
  uploadedAt: asISODateString("2026-07-30T00:00:00.000Z")
});

function workspace(): DeviceWorkspaceAggregate {
  const earlyAudio = audioAsset("asset_early", "Alert");
  const laterAudio = audioAsset("asset_later", "Chime");
  const sameOffsetAudio = audioAsset("asset_same_offset", "Bell");
  const unavailableAudio = { ...audioAsset("asset_unavailable", "Unavailable"), playbackUrl: "" };
  const haptic = { ...audioAsset("asset_haptic", "Tap"), mediaKind: "haptic" as const };

  return {
    collections: [
      {
        collection: { deviceId: asEntityId("device_1"), id: asEntityId("collection_1"), name: "Checkout" },
        events: [
          {
            event: { collectionId: asEntityId("collection_1"), eventType: "Button", id: eventId, name: "Pay now", sortOrder: 0 },
            eventTriggers: [
              {
                id: asEntityId("trigger_disabled"),
                eventId,
                isEnabled: false,
                label: null,
                playbacks: [{ assetId: laterAudio.id, eventTriggerId: asEntityId("trigger_disabled"), id: asEntityId("playback_disabled"), startOffset: 0 }],
                triggerId: asEntityId("on_press")
              },
              {
                id: asEntityId("trigger_enabled"),
                eventId,
                isEnabled: true,
                label: null,
                playbacks: [
                  { assetId: haptic.id, eventTriggerId: asEntityId("trigger_enabled"), id: asEntityId("playback_haptic"), startOffset: 0 },
                  { assetId: unavailableAudio.id, eventTriggerId: asEntityId("trigger_enabled"), id: asEntityId("playback_unavailable"), startOffset: 0 },
                  { assetId: laterAudio.id, eventTriggerId: asEntityId("trigger_enabled"), id: asEntityId("playback_later"), startOffset: 0.2 },
                  { assetId: sameOffsetAudio.id, eventTriggerId: asEntityId("trigger_enabled"), id: asEntityId("playback_bell"), startOffset: 0.1 },
                  { assetId: earlyAudio.id, eventTriggerId: asEntityId("trigger_enabled"), id: asEntityId("playback_alert"), startOffset: 0.1 }
                ],
                triggerId: asEntityId("on_release")
              }
            ]
          },
          {
            event: { collectionId: asEntityId("collection_1"), eventType: "Toast", id: incomingEventId, name: "Card declined", sortOrder: 1 },
            eventTriggers: [
              {
                id: asEntityId("trigger_incoming"),
                eventId: incomingEventId,
                isEnabled: true,
                label: null,
                playbacks: [{ assetId: laterAudio.id, eventTriggerId: asEntityId("trigger_incoming"), id: asEntityId("playback_incoming"), startOffset: 0.35 }],
                triggerId: asEntityId("on_press")
              }
            ]
          }
        ]
      }
    ],
    collisionMatrix: { deviceId: asEntityId("device_1"), id: asEntityId("matrix_1") },
    device: { createdAt: asISODateString("2026-07-30T00:00:00.000Z"), id: asEntityId("device_1"), isEnabled: true, name: "iPhone", platformId: asEntityId("ios"), projectId: asEntityId("project_1"), updatedAt: asISODateString("2026-07-30T00:00:00.000Z") },
    matrixColumns: [],
    matrixEntries: [],
    matrixRows: [],
    platform: { id: asEntityId("ios"), name: "iOS" },
    playbackAssets: [earlyAudio, laterAudio, sameOffsetAudio, unavailableAudio, haptic].map((asset) => ({ ...asset, isDefaultLibrary: true, isImportedLibrary: false, libraryName: "Audio" })),
    project: { createdAt: asISODateString("2026-07-30T00:00:00.000Z"), defaultAssetLibraryId: asEntityId("library_audio"), folderId: null, id: asEntityId("project_1"), name: "Checkout" },
    triggers: []
  };
}

describe("collisionPreviewLaneFor", () => {
  it("uses enabled audio playbacks only and keeps haptic-only playback visible as metadata", () => {
    const lane = collisionPreviewLaneFor(workspace(), eventId);

    expect(lane.sources.map((source) => source.asset.name)).toEqual(["Alert", "Bell", "Chime"]);
    expect(lane.sources.map((source) => source.startOffset)).toEqual([0.1, 0.1, 0.2]);
    expect(lane.hapticPlaybackCount).toBe(1);
    expect(lane.sources.every((source) => source.key.includes("trigger_enabled"))).toBe(true);
  });

  it("derives playing and incoming sources independently without changing their authored offsets", () => {
    const aggregate = workspace();
    const lanes = collisionPreviewLanesFor(aggregate, eventId, incomingEventId);

    expect(lanes.playing.sources[0]).toMatchObject({
      eventId,
      playbackId: asEntityId("playback_alert"),
      startOffset: 0.1
    });
    expect(lanes.incoming.sources).toMatchObject([
      { eventId: incomingEventId, playbackId: asEntityId("playback_incoming"), startOffset: 0.35 }
    ]);
    expect(aggregate.collections[0]?.events[0]?.eventTriggers[1]?.playbacks.map((playback) => playback.startOffset)).toEqual([
      0,
      0,
      0.2,
      0.1,
      0.1
    ]);
  });

  it("returns an empty lane for an unknown event or an unloaded workspace", () => {
    const unknownEventId = asEntityId<EventId>("event_missing");

    expect(collisionPreviewLaneFor(workspace(), unknownEventId)).toMatchObject({
      event: null,
      eventId: unknownEventId,
      hapticPlaybackCount: 0,
      sources: []
    });
    expect(collisionPreviewLaneFor(undefined, eventId)).toMatchObject({
      event: null,
      eventId,
      hapticPlaybackCount: 0,
      sources: []
    });
  });
});
