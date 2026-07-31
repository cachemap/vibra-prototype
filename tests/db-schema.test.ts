import "fake-indexeddb/auto";

import Dexie from "dexie";
import { describe, expect, it } from "vitest";

import {
  createVibraDatabase,
  VIBRA_DATABASE_VERSION,
  vibraStores,
  vibraStoresV1,
  vibraStoresV2,
  vibraStoresV3
} from "../data/db";
import { asEntityId, type CollisionMatrixEntryId } from "../domain";

describe("Vibra IndexedDB schema", () => {
  it("defines every planned Phase 3 store", () => {
    const database = createVibraDatabase("vibra-schema-test");

    expect(database.tables.map((table) => table.name).sort()).toEqual(
      Object.keys(vibraStores).sort()
    );
    expect(database.verno).toBe(VIBRA_DATABASE_VERSION);

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
    expect(database.events.schema.indexes.map((index) => index.src)).toContain("[collectionId+sortOrder]");
    expect(database.projectAssetLibraryImports.schema.primKey.src).toBe(
      "[projectId+assetLibraryId]"
    );
    expect(database.assetBlobs.schema.primKey.src).toBe("assetId");
    expect(database.assetBlobs.schema.indexes.map((index) => index.src)).toEqual(
      expect.arrayContaining(["contentType", "storedAt"])
    );

    database.close();
  });

  it("migrates v2 events into the existing visible order", async () => {
    const databaseName = `vibra-v2-order-migration-${crypto.randomUUID()}`;
    const legacyDatabase = new Dexie(databaseName);
    legacyDatabase.version(2).stores(vibraStoresV2);
    await legacyDatabase.open();

    await legacyDatabase.table("events").bulkAdd([
      {
        id: "event_beta",
        collectionId: "collection_a",
        name: "Beta",
        eventType: "Button"
      },
      {
        id: "event_alpha",
        collectionId: "collection_a",
        name: "Alpha",
        eventType: "Toast"
      },
      {
        id: "event_android",
        collectionId: "collection_b",
        name: "Android",
        eventType: "Button"
      }
    ]);
    await legacyDatabase.table("collisionMatrixEntries").add({
      id: "matrix_entry_queue",
      matrixId: "matrix_1",
      playingEventId: "event_beta",
      incomingEventId: "event_alpha",
      resolutionBehavior: {
        behaviorName: "Queue",
        targetEventId: null
      }
    });
    legacyDatabase.close();

    const upgradedDatabase = createVibraDatabase(databaseName);
    await upgradedDatabase.open();

    const migratedEvents = (await upgradedDatabase.events.toArray()).sort(
      (first, second) =>
        first.collectionId.localeCompare(second.collectionId) || first.sortOrder - second.sortOrder
    );

    expect(migratedEvents.map((event) => [event.id, event.sortOrder])).toEqual([
      ["event_alpha", 0],
      ["event_beta", 1],
      ["event_android", 0]
    ]);
    await expect(
      upgradedDatabase.collisionMatrixEntries.get(
        asEntityId<CollisionMatrixEntryId>("matrix_entry_queue")
      )
    ).resolves.toMatchObject({
      resolutionBehavior: {
        behaviorName: "Queue",
        targetEventId: "event_alpha",
        postInterruptionRecovery: null,
        systemInterruptionRecovery: "Stay stopped"
      }
    });

    upgradedDatabase.close();
    await upgradedDatabase.delete();
  });

  it("opens empty v1 and v2 databases through all upgrades", async () => {
    for (const legacyVersion of [1, 2] as const) {
      const databaseName = `vibra-v${legacyVersion}-upgrade-${crypto.randomUUID()}`;
      const legacyDatabase = new Dexie(databaseName);
      legacyDatabase
        .version(legacyVersion)
        .stores(legacyVersion === 1 ? vibraStoresV1 : vibraStoresV2);
      await legacyDatabase.open();
      legacyDatabase.close();

      const upgradedDatabase = createVibraDatabase(databaseName);
      await upgradedDatabase.open();

      expect(upgradedDatabase.verno).toBe(VIBRA_DATABASE_VERSION);
      expect(upgradedDatabase.events.schema.indexes.map((index) => index.src)).toContain(
        "[collectionId+sortOrder]"
      );

      upgradedDatabase.close();
      await upgradedDatabase.delete();
    }
  });

  it("normalizes version-3 resolution behaviors without changing their schema version", async () => {
    const databaseName = `vibra-v3-resolution-migration-${crypto.randomUUID()}`;
    const legacyDatabase = new Dexie(databaseName);
    legacyDatabase.version(3).stores(vibraStoresV3);
    await legacyDatabase.open();

    await legacyDatabase.table("collisionMatrixEntries").bulkAdd([
      {
        id: "matrix_entry_preempt",
        matrixId: "matrix_1",
        playingEventId: "event_playing",
        incomingEventId: "event_incoming",
        resolutionBehavior: { behaviorName: "Preempt", targetEventId: "event_incoming" }
      },
      {
        id: "matrix_entry_suppress",
        matrixId: "matrix_1",
        playingEventId: "event_playing",
        incomingEventId: "event_incoming",
        resolutionBehavior: { behaviorName: "Suppress", targetEventId: "event_playing" }
      },
      {
        id: "matrix_entry_not_possible",
        matrixId: "matrix_1",
        playingEventId: "event_playing",
        incomingEventId: "event_incoming",
        resolutionBehavior: { behaviorName: "Not possible", targetEventId: "event_playing" }
      }
    ]);
    legacyDatabase.close();

    const upgradedDatabase = createVibraDatabase(databaseName);
    await upgradedDatabase.open();

    await expect(upgradedDatabase.collisionMatrixEntries.get("matrix_entry_preempt" as CollisionMatrixEntryId)).resolves
      .toMatchObject({
        resolutionBehavior: {
          behaviorName: "Preempt",
          targetEventId: "event_incoming",
          postInterruptionRecovery: "Stay stopped",
          systemInterruptionRecovery: "Stay stopped"
        }
      });
    await expect(upgradedDatabase.collisionMatrixEntries.get("matrix_entry_suppress" as CollisionMatrixEntryId)).resolves
      .toMatchObject({
        resolutionBehavior: {
          behaviorName: "Suppress",
          targetEventId: "event_playing",
          postInterruptionRecovery: null,
          systemInterruptionRecovery: "Stay stopped"
        }
      });
    await expect(upgradedDatabase.collisionMatrixEntries.get("matrix_entry_not_possible" as CollisionMatrixEntryId)).resolves
      .toMatchObject({
        resolutionBehavior: {
          behaviorName: "Not possible",
          targetEventId: null,
          postInterruptionRecovery: null,
          systemInterruptionRecovery: null
        }
      });

    upgradedDatabase.close();
    await upgradedDatabase.delete();
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
