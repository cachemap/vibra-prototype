import { describe, expect, it } from "vitest";

import { createVibraDatabase, vibraStores } from "../data/db";

describe("Vibra IndexedDB schema", () => {
  it("defines every planned Phase 3 store", () => {
    const database = createVibraDatabase("vibra-schema-test");

    expect(database.tables.map((table) => table.name).sort()).toEqual(
      Object.keys(vibraStores).sort()
    );

    database.close();
  });

  it("keeps compound indexes for dependent write constraints", () => {
    const database = createVibraDatabase("vibra-compound-index-test");

    expect(database.devices.schema.indexes.map((index) => index.src)).toContain(
      "[projectId+platformId+name]"
    );
    expect(database.eventTriggers.schema.indexes.map((index) => index.src)).toContain(
      "[eventId+triggerId]"
    );
    expect(database.collisionMatrixEntries.schema.indexes.map((index) => index.src)).toContain(
      "[matrixId+playingEventId+incomingEventId]"
    );
    expect(database.projectAssetLibraryImports.schema.primKey.src).toBe(
      "[projectId+assetLibraryId]"
    );
    expect(database.assetBlobs.schema.primKey.src).toBe("assetId");
    expect(database.assetBlobs.schema.indexes.map((index) => index.src)).toEqual(
      expect.arrayContaining(["contentType", "storedAt"])
    );

    database.close();
  });

  it("keeps sharing links addressable by URL token and target kind", () => {
    const database = createVibraDatabase("vibra-share-index-test");
    const sharingLinkIndexes = database.sharingLinks.schema.indexes.map((index) => index.src);

    expect(database.sharingLinks.schema.primKey.src).toBe("id");
    expect(sharingLinkIndexes).toEqual(
      expect.arrayContaining([
        "target.kind",
        "target.projectId",
        "target.eventId",
        "target.collisionMatrixEntryId"
      ])
    );

    database.close();
  });
});
