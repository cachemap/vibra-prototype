import "fake-indexeddb/auto";

import * as v from "valibot";
import { afterEach, describe, expect, it } from "vitest";

import { createVibraDatabase, type VibraDatabase } from "../data/db";
import { createProjectRepository } from "../data/repositories/project-repository";
import { resetDemoData } from "../data/reset";
import { buildDemoSeedData, seedDemoDataIfEmpty } from "../data/seed";
import {
  asEntityId,
  assetBlobSchema,
  type AssetLibraryId,
  assetLibraryFolderSchema,
  assetLibrarySchema,
  assetSchema,
  collisionMatrixEntrySchema,
  collectionSchema,
  deviceSchema,
  eventSchema,
  eventTriggerSchema,
  folderAccessSchema,
  mediaKinds,
  platformNames,
  projectFolderSchema,
  projectSchema,
  sharingLinkSchema,
  triggerNames,
  triggerPlaybackSchema,
  userSchema
} from "../domain";

let database: VibraDatabase | null = null;

const createTestDatabase = () => {
  database = createVibraDatabase(`vibra-seed-test-${crypto.randomUUID()}`);
  return database;
};

afterEach(async () => {
  if (!database) {
    return;
  }

  database.close();
  await database.delete();
  database = null;
});

describe("demo seed data", () => {
  it("builds the canonical demo story with valid persisted records", () => {
    const seedData = buildDemoSeedData();

    seedData.users.forEach((record) => v.parse(userSchema, record));
    seedData.folders.forEach((record) => v.parse(projectFolderSchema, record));
    seedData.folderAccess.forEach((record) => v.parse(folderAccessSchema, record));
    seedData.projects.forEach((record) => v.parse(projectSchema, record));
    seedData.devices.forEach((record) => v.parse(deviceSchema, record));
    seedData.collections.forEach((record) => v.parse(collectionSchema, record));
    seedData.events.forEach((record) => v.parse(eventSchema, record));
    seedData.eventTriggers.forEach((record) => v.parse(eventTriggerSchema, record));
    seedData.triggerPlaybacks.forEach((record) => v.parse(triggerPlaybackSchema, record));
    seedData.assetLibraries.forEach((record) => v.parse(assetLibrarySchema, record));
    seedData.assetLibraryFolders.forEach((record) => v.parse(assetLibraryFolderSchema, record));
    seedData.assets.forEach((record) => v.parse(assetSchema, record));
    seedData.assetBlobs.forEach((record) => v.parse(assetBlobSchema, record));
    seedData.collisionMatrixEntries.forEach((record) => v.parse(collisionMatrixEntrySchema, record));
    seedData.sharingLinks.forEach((record) => v.parse(sharingLinkSchema, record));

    expect(seedData.users).toHaveLength(1);
    expect(seedData.platforms.map((platform) => platform.name).sort()).toEqual([...platformNames].sort());
    expect(seedData.triggers.map((trigger) => trigger.name).sort()).toEqual([...triggerNames].sort());
    expect(seedData.folders.filter((folder) => folder.parentFolderId === null)).toHaveLength(2);

    const emptyLeafFolder = seedData.folders.find((folder) => folder.name === "Empty Explorations");
    expect(emptyLeafFolder).toBeDefined();
    expect(seedData.projects.some((project) => project.folderId === emptyLeafFolder?.id)).toBe(false);
    expect(seedData.folders.some((folder) => folder.parentFolderId === emptyLeafFolder?.id)).toBe(false);

    for (const project of seedData.projects) {
      const defaultLibrary = seedData.assetLibraries.filter(
        (library) => library.defaultForProjectId === project.id
      );
      expect(defaultLibrary).toHaveLength(1);
      expect(project.defaultAssetLibraryId).toBe(defaultLibrary[0]?.id);
      expect(
        seedData.assetLibraryFolders.filter(
          (folder) => folder.libraryId === project.defaultAssetLibraryId && folder.parentFolderId === null
        )
      ).toHaveLength(1);
    }

    expect(seedData.projectAssetLibraryImports).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          assetLibraryId: expect.stringMatching("library_shared-brand")
        }),
        expect.objectContaining({
          assetLibraryId: expect.stringMatching("library_onboarding-default")
        })
      ])
    );
    expect(seedData.devices.some((device) => device.isEnabled === false)).toBe(true);
    expect(seedData.devices.some((device) => device.name === "iPhone 16 Pro")).toBe(true);
    expect(seedData.devices.some((device) => device.name === "Pixel 9")).toBe(true);
    expect(new Set(seedData.events.map((event) => event.eventType))).toEqual(
      new Set(["Button", "Toggle", "Banner", "Toast"])
    );
    for (const collection of seedData.collections) {
      const sortOrders = seedData.events
        .filter((event) => event.collectionId === collection.id)
        .map((event) => event.sortOrder)
        .sort((first, second) => first - second);

      expect(sortOrders).toEqual(sortOrders.map((_, index) => index));
    }
    expect(seedData.eventTriggers.some((trigger) => trigger.isEnabled === false)).toBe(true);
    expect(new Set(seedData.assets.map((asset) => asset.mediaKind))).toEqual(new Set(mediaKinds));
    expect(seedData.assetBlobs).toHaveLength(seedData.assets.length);
    expect(seedData.assetLibraryFolders.some((folder) => folder.parentFolderId !== null)).toBe(true);
    expect(seedData.collisionMatrixRows.length).toBeGreaterThan(0);
    expect(seedData.collisionMatrixColumns.length).toBeGreaterThan(0);
    expect(new Set(seedData.collisionMatrixEntries.map((entry) => entry.resolutionBehavior.behaviorName))).toEqual(
      new Set(["Preempt", "Queue", "Co-play", "Suppress", "Not possible"])
    );
    expect(new Set(seedData.sharingLinks.map((link) => link.target.kind))).toEqual(
      new Set(["project", "event", "collisionMatrixEntry"])
    );
  });

  it("seeds only an empty database and reset restores the canonical records", async () => {
    const testDatabase = createTestDatabase();

    await expect(seedDemoDataIfEmpty(testDatabase)).resolves.toEqual({ seeded: true });
    await expect(seedDemoDataIfEmpty(testDatabase)).resolves.toEqual({ seeded: false });
    expect(await testDatabase.projects.count()).toBe(2);

    await testDatabase.projects.clear();
    expect(await testDatabase.projects.count()).toBe(0);

    await resetDemoData(testDatabase);

    expect(await testDatabase.users.count()).toBe(1);
    expect(await testDatabase.projects.count()).toBe(2);
    expect(await testDatabase.assetLibraries.count()).toBe(3);
    expect(await testDatabase.assetBlobs.count()).toBe(buildDemoSeedData().assetBlobs.length);
    expect(await testDatabase.devices.count()).toBe(3);
    expect(await testDatabase.sharingLinks.count()).toBe(3);

    const repository = createProjectRepository(testDatabase, {
      createObjectUrl: (blob) => `blob:vibra-reset-${blob.size}`
    });
    const checkoutLibraryResult = await repository.loadAssetLibraryTree(
      asEntityId<AssetLibraryId>("library_checkout-default")
    );

    expect(checkoutLibraryResult.isOk()).toBe(true);
    if (checkoutLibraryResult.isErr()) {
      return;
    }

    const seededAudioAsset = checkoutLibraryResult.value.rootFolder.childFolders
      .flatMap((folder) => folder.assets)
      .find((asset) => asset.mediaKind === "audio");

    expect(seededAudioAsset?.playbackUrl).toMatch(/^blob:vibra-reset-/);
  });

  it("keeps uploaded object URLs ephemeral, shared between repository consumers, and releases them on reset", async () => {
    const testDatabase = createTestDatabase();
    await seedDemoDataIfEmpty(testDatabase);

    const revokedUrls: string[] = [];
    let createdUrlCount = 0;
    const repository = createProjectRepository(testDatabase, {
      createObjectUrl: () => `blob:vibra-reset-${++createdUrlCount}`,
      revokeObjectUrl: (url) => revokedUrls.push(url)
    });
    const libraryId = asEntityId<AssetLibraryId>("library_checkout-default");
    const firstLoad = await repository.loadAssetLibraryTree(libraryId);

    expect(firstLoad.isOk()).toBe(true);
    if (firstLoad.isErr()) {
      return;
    }

    const firstPlaybackUrl = firstLoad.value.rootFolder.childFolders
      .flatMap((folder) => folder.assets)
      .find((asset) => asset.mediaKind === "audio")?.playbackUrl;
    expect(firstPlaybackUrl).toMatch(/^blob:vibra-reset-/);

    const secondRepository = createProjectRepository(testDatabase, {
      createObjectUrl: () => `blob:vibra-unexpected-${++createdUrlCount}`
    });
    const secondLoad = await secondRepository.loadAssetLibraryTree(libraryId);

    expect(secondLoad.isOk()).toBe(true);
    if (secondLoad.isErr()) {
      return;
    }
    expect(
      secondLoad.value.rootFolder.childFolders
        .flatMap((folder) => folder.assets)
        .find((asset) => asset.mediaKind === "audio")?.playbackUrl
    ).toBe(firstPlaybackUrl);

    const storedAsset = await testDatabase.assets.get(asEntityId("asset_checkout-success-audio"));
    expect(storedAsset?.playbackUrl).not.toMatch(/^blob:/);

    await resetDemoData(testDatabase);

    expect(revokedUrls).toContain(firstPlaybackUrl);
    expect(await testDatabase.assets.get(asEntityId("asset_checkout-success-audio"))).toMatchObject({
      playbackUrl: expect.not.stringMatching(/^blob:/)
    });
  });
});
