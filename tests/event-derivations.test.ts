import { describe, expect, it } from "vitest";

import type { DeviceCollectionAggregate } from "../data/repositories/project-repository";
import type { Asset } from "../domain";
import { asEntityId, asISODateString } from "../domain";
import {
  locateEventInCollections,
  previewItemsByEventTriggerId,
  timelineMaxSecondsFor,
  timelinePlaybacksFor
} from "../features/events/event-derivations";

const asset = (id: string, name: string): Asset & {
  libraryName: string;
  isDefaultLibrary: boolean;
  isImportedLibrary: boolean;
} => ({
  id: asEntityId(id),
  assetId: name.toLowerCase(),
  folderId: asEntityId("folder-1"),
  libraryId: asEntityId("library-1"),
  libraryName: "Default",
  isDefaultLibrary: true,
  isImportedLibrary: false,
  mediaKind: "audio",
  name,
  originalFilename: `${name}.wav`,
  playbackUrl: `/audio/${name}.wav`,
  uploadedAt: asISODateString("2026-01-01T00:00:00.000Z")
});

const collection: DeviceCollectionAggregate = {
  collection: {
    id: asEntityId("collection-1"),
    deviceId: asEntityId("device-1"),
    name: "Core"
  },
  events: [
    {
      event: {
        id: asEntityId("event-1"),
        collectionId: asEntityId("collection-1"),
        eventType: "Button",
        name: "Primary CTA",
        sortOrder: 0
      },
      eventTriggers: [
        {
          id: asEntityId("event-trigger-1"),
          eventId: asEntityId("event-1"),
          triggerId: asEntityId("trigger-1"),
          label: null,
          isEnabled: true,
          playbacks: [
            {
              id: asEntityId("playback-2"),
              eventTriggerId: asEntityId("event-trigger-1"),
              assetId: asEntityId("asset-2"),
              startOffset: 0.2
            },
            {
              id: asEntityId("playback-1"),
              eventTriggerId: asEntityId("event-trigger-1"),
              assetId: asEntityId("asset-1"),
              startOffset: 0
            }
          ]
        }
      ]
    }
  ]
};

describe("event detail derivations", () => {
  it("locates an event with its owning collection", () => {
    const located = locateEventInCollections([collection], asEntityId("event-1"));

    expect(located?.collection.name).toBe("Core");
    expect(located?.event.event.name).toBe("Primary CTA");
    expect(locateEventInCollections([collection], asEntityId("missing"))).toBeNull();
  });

  it("sorts timeline playbacks by offset and asset name", () => {
    const playbacks = timelinePlaybacksFor(collection.events[0], new Map([
      [asEntityId("asset-1"), asset("asset-1", "Tap")],
      [asEntityId("asset-2"), asset("asset-2", "Release")]
    ]));

    expect(playbacks.map(({ asset }) => asset?.name)).toEqual(["Tap", "Release"]);
    expect(timelineMaxSecondsFor(playbacks)).toBe(1);
  });

  it("groups preview items by event trigger and honors disabled devices", () => {
    const playbacks = timelinePlaybacksFor(collection.events[0], new Map([
      [asEntityId("asset-1"), asset("asset-1", "Tap")],
      [asEntityId("asset-2"), asset("asset-2", "Release")]
    ]));
    const grouped = previewItemsByEventTriggerId(playbacks, false);
    const items = grouped.get(asEntityId("event-trigger-1"));

    expect(items).toHaveLength(2);
    expect(items?.every((item) => item.isEnabled === false)).toBe(true);
  });
});
