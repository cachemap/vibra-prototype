import "fake-indexeddb/auto";

import { afterEach, describe, expect, it } from "vitest";

import { createVibraDatabase, type VibraDatabase } from "../data/db";
import { createProjectRepository } from "../data/repositories/project-repository";
import { DEMO_PRIMARY_PROJECT_ID, DEMO_USER_ID, seedDemoDataIfEmpty } from "../data/seed";
import {
  asEntityId,
  asISODateString,
  type AssetId,
  type AssetLibraryFolderId,
  type AssetLibraryId,
  type CollectionId,
  type CollisionMatrixEntryId,
  type CollisionMatrixId,
  type DeviceId,
  type EventId,
  type EventTriggerId,
  type PlatformId,
  type ProjectFolderId,
  type SharingLinkId,
  type TriggerId
} from "../domain";

let database: VibraDatabase | null = null;

const createSeededRepository = async (options?: Parameters<typeof createProjectRepository>[1]) => {
  database = createVibraDatabase(`vibra-project-repository-test-${crypto.randomUUID()}`);
  await seedDemoDataIfEmpty(database);
  return createProjectRepository(database, {
    createObjectUrl: (blob) => `blob:vibra-test-default-${blob.size}`,
    ...options
  });
};

afterEach(async () => {
  if (!database) {
    return;
  }

  database.close();
  await database.delete();
  database = null;
});

describe("project repository", () => {
  it("loads the accessible project tree with nested folders and empty leaf folders", async () => {
    const repository = await createSeededRepository();

    const result = await repository.loadProjectTree(DEMO_USER_ID);

    expect(result.isOk()).toBe(true);
    if (result.isErr()) {
      return;
    }

    expect(result.value.user.preferredName).toBe("Dillon");
    expect(result.value.roots.map((root) => root.folder.name)).toEqual([
      "Mobile App Systems",
      "Shared Platform Kits"
    ]);

    const mobileRoot = result.value.roots.find((root) => root.folder.name === "Mobile App Systems");
    expect(mobileRoot?.childFolders.map((node) => node.folder.name)).toEqual([
      "Checkout Experience",
      "Empty Explorations"
    ]);
    expect(mobileRoot?.childFolders.find((node) => node.folder.name === "Empty Explorations")?.isEmptyLeaf).toBe(
      true
    );
    expect(
      mobileRoot?.childFolders.find((node) => node.folder.name === "Checkout Experience")?.projects.map(
        (project) => project.name
      )
    ).toEqual(["Checkout Feedback System"]);
  });

  it("creates a project with one default asset library and root folder in an empty leaf folder", async () => {
    const repository = await createSeededRepository();
    const folderId = asEntityId<ProjectFolderId>("folder_empty-explorations");

    const result = await repository.createProject({
      folderId,
      name: "Settings Feedback"
    });

    expect(result.isOk()).toBe(true);
    if (result.isErr() || !database) {
      return;
    }

    expect(result.value.project.folderId).toBe(folderId);
    expect(result.value.project.defaultAssetLibraryId).toBe(result.value.defaultAssetLibrary.id);
    expect(result.value.defaultAssetLibrary.defaultForProjectId).toBe(result.value.project.id);
    expect(result.value.rootFolder.libraryId).toBe(result.value.defaultAssetLibrary.id);
    expect(result.value.rootFolder.parentFolderId).toBeNull();

    await expect(database.projects.get(result.value.project.id)).resolves.toMatchObject({
      name: "Settings Feedback"
    });
    await expect(database.assetLibraries.get(result.value.defaultAssetLibrary.id)).resolves.toMatchObject({
      name: "Settings Feedback Default"
    });
    await expect(database.assetLibraryFolders.get(result.value.rootFolder.id)).resolves.toMatchObject({
      name: "Settings Feedback"
    });
  });

  it("creates starter devices with matrices, default collections, and starter events", async () => {
    const repository = await createSeededRepository();
    const folderId = asEntityId<ProjectFolderId>("folder_empty-explorations");

    const result = await repository.createProject({
      folderId,
      name: "Settings Feedback",
      devices: [
        { platformId: asEntityId<PlatformId>("platform_ios"), name: "iPhone Pro" },
        { platformId: asEntityId<PlatformId>("platform_android"), name: "Pixel Pro" }
      ],
      starterEventTypes: ["Toast", "Button"]
    });

    expect(result.isOk()).toBe(true);
    if (result.isErr() || !database) {
      return;
    }

    expect(result.value.devices.map((created) => created.device.name)).toEqual([
      "iPhone Pro",
      "Pixel Pro"
    ]);
    expect(result.value.devices.map((created) => created.defaultCollection.name)).toEqual([
      "Core interactions",
      "Core interactions"
    ]);
    expect(result.value.devices.flatMap((created) => created.starterEvents.map((event) => event.eventType))).toEqual([
      "Toast",
      "Button",
      "Toast",
      "Button"
    ]);

    const persistedDevices = await database.devices.where("projectId").equals(result.value.project.id).toArray();
    const persistedMatrices = await database.collisionMatrices.toArray();
    const persistedCollections = await database.collections.toArray();
    const persistedEvents = await database.events.toArray();

    expect(persistedDevices).toHaveLength(2);
    expect(
      result.value.devices.every((created) =>
        persistedMatrices.some((matrix) => matrix.deviceId === created.device.id)
      )
    ).toBe(true);
    expect(
      result.value.devices.every((created) =>
        persistedCollections.some((collection) => collection.deviceId === created.device.id)
      )
    ).toBe(true);
    expect(
      result.value.devices.every((created) =>
        persistedEvents.filter((event) => event.collectionId === created.defaultCollection.id).length === 2
      )
    ).toBe(true);
  });

  it("rejects duplicate starter devices in a new project", async () => {
    const repository = await createSeededRepository();

    const result = await repository.createProject({
      folderId: asEntityId<ProjectFolderId>("folder_empty-explorations"),
      name: "Duplicate Device Project",
      devices: [
        { platformId: asEntityId<PlatformId>("platform_ios"), name: "iPhone Pro" },
        { platformId: asEntityId<PlatformId>("platform_ios"), name: "iPhone Pro" }
      ]
    });

    expect(result.isErr()).toBe(true);
    if (result.isOk()) {
      return;
    }

    expect(result.error.kind).toBe("conflict");
  });

  it("creates a nested folder when the parent does not contain projects", async () => {
    const repository = await createSeededRepository();
    const parentFolderId = asEntityId<ProjectFolderId>("folder_empty-explorations");

    const result = await repository.createProjectFolder({
      parentFolderId,
      name: "Settings Experiments"
    });

    expect(result.isOk()).toBe(true);
    if (result.isErr() || !database) {
      return;
    }

    expect(result.value.parentFolderId).toBe(parentFolderId);
    expect(result.value.name).toBe("Settings Experiments");

    await expect(database.folders.get(result.value.id)).resolves.toMatchObject({
      parentFolderId,
      name: "Settings Experiments"
    });
  });

  it("creates a nested folder in a folder that already contains projects", async () => {
    const repository = await createSeededRepository();

    const result = await repository.createProjectFolder({
      parentFolderId: asEntityId<ProjectFolderId>("folder_checkout"),
      name: "Checkout Experiments"
    });

    expect(result.isOk()).toBe(true);
    if (result.isErr() || !database) {
      return;
    }

    expect(result.value.name).toBe("Checkout Experiments");
    await expect(database.folders.get(result.value.id)).resolves.toMatchObject({
      parentFolderId: asEntityId<ProjectFolderId>("folder_checkout"),
      name: "Checkout Experiments"
    });
  });

  it("creates a top-level folder and registers access for the current user", async () => {
    const repository = await createSeededRepository();

    const result = await repository.createProjectFolder({
      parentFolderId: null,
      createdByUserId: DEMO_USER_ID,
      name: "Root Experiments"
    });

    expect(result.isOk()).toBe(true);
    if (result.isErr() || !database) {
      return;
    }

    expect(result.value.parentFolderId).toBeNull();
    await expect(database.folderAccess.get([DEMO_USER_ID, result.value.id])).resolves.toMatchObject({
      userId: DEMO_USER_ID,
      folderId: result.value.id
    });

    const treeResult = await repository.loadProjectTree(DEMO_USER_ID);
    expect(treeResult.isOk()).toBe(true);
    if (treeResult.isErr()) {
      return;
    }
    expect(treeResult.value.roots.map((root) => root.folder.name)).toContain("Root Experiments");
  });

  it("loads a project workspace with devices, platforms, libraries, and matrix summaries", async () => {
    const repository = await createSeededRepository();

    const result = await repository.loadProjectWorkspace(DEMO_PRIMARY_PROJECT_ID);

    expect(result.isOk()).toBe(true);
    if (result.isErr()) {
      return;
    }

    expect(result.value.project.name).toBe("Checkout Feedback System");
    expect(result.value.folder?.name).toBe("Checkout Experience");
    expect(result.value.defaultAssetLibrary.name).toBe("Checkout Feedback System Default");
    expect(result.value.importedAssetLibraries.map((library) => library.name)).toEqual([
      "Onboarding Motion Kit Default",
      "Shared Brand Feedback"
    ]);
    expect(result.value.devices.map((device) => device.device.name)).toEqual([
      "iPhone 16 Pro",
      "Pixel 9",
      "Windows Touch Preview"
    ]);

    const iPhone = result.value.devices.find((device) => device.device.name === "iPhone 16 Pro");
    expect(iPhone?.platform.name).toBe("iOS");
    expect(iPhone?.collisionMatrix.deviceId).toBe(iPhone?.device.id);
    expect(iPhone?.collectionCount).toBe(2);
    expect(iPhone?.eventCount).toBe(4);
  });

  it("creates a device with one collision matrix", async () => {
    const repository = await createSeededRepository();

    const result = await repository.createDevice({
      projectId: DEMO_PRIMARY_PROJECT_ID,
      platformId: asEntityId<PlatformId>("platform_mac"),
      name: "MacBook Pro",
      isEnabled: false
    });

    expect(result.isOk()).toBe(true);
    if (result.isErr() || !database) {
      return;
    }

    expect(result.value.device.projectId).toBe(DEMO_PRIMARY_PROJECT_ID);
    expect(result.value.device.platformId).toBe("platform_mac");
    expect(result.value.device.isEnabled).toBe(false);
    expect(result.value.platform.name).toBe("Mac");
    expect(result.value.collisionMatrix.deviceId).toBe(result.value.device.id);

    await expect(database.devices.get(result.value.device.id)).resolves.toMatchObject({
      name: "MacBook Pro"
    });
    await expect(database.collisionMatrices.get(result.value.collisionMatrix.id)).resolves.toMatchObject({
      deviceId: result.value.device.id
    });
  });

  it("rejects duplicate device creation for the same project, platform, and name", async () => {
    const repository = await createSeededRepository();

    const result = await repository.createDevice({
      projectId: DEMO_PRIMARY_PROJECT_ID,
      platformId: asEntityId<PlatformId>("platform_ios"),
      name: "iPhone 16 Pro"
    });

    expect(result.isErr()).toBe(true);
    if (result.isOk()) {
      return;
    }

    expect(result.error.kind).toBe("conflict");
    expect(result.error.details?.constraint).toBe("unique-project-platform-device-name");
  });

  it("updates device enabled state for playback and export inclusion", async () => {
    const repository = await createSeededRepository();

    const result = await repository.updateDevice({
      deviceId: asEntityId<DeviceId>("device_checkout-ios-16-pro"),
      isEnabled: false
    });

    expect(result.isOk()).toBe(true);
    if (result.isErr() || !database) {
      return;
    }

    expect(result.value.isEnabled).toBe(false);
    await expect(database.devices.get(asEntityId<DeviceId>("device_checkout-ios-16-pro"))).resolves.toMatchObject({
      isEnabled: false
    });
  });

  it("loads a device workspace with nested collection, event, playback, and matrix data", async () => {
    const repository = await createSeededRepository();

    const result = await repository.loadDeviceWorkspace(
      asEntityId<DeviceId>("device_checkout-ios-16-pro")
    );

    expect(result.isOk()).toBe(true);
    if (result.isErr()) {
      return;
    }

    expect(result.value.project.id).toBe(DEMO_PRIMARY_PROJECT_ID);
    expect(result.value.platform.name).toBe("iOS");
    expect(result.value.collisionMatrix.id).toBe("matrix_checkout-ios");
    expect(result.value.collections.map((collection) => collection.collection.name)).toEqual([
      "Checkout Actions",
      "System Messaging"
    ]);
    expect(result.value.collections.flatMap((collection) => collection.events.map((event) => event.event.name))).toEqual([
      "Pay Now",
      "Save Card",
      "Card Declined",
      "Payment Complete"
    ]);

    const payNow = result.value.collections
      .flatMap((collection) => collection.events)
      .find((event) => event.event.name === "Pay Now");

    expect(payNow?.eventTriggers).toHaveLength(2);
    expect(payNow?.eventTriggers.flatMap((trigger) => trigger.playbacks.map((playback) => playback.startOffset))).toEqual([
      0,
      0,
      0.3
    ]);
    expect(result.value.matrixRows).toHaveLength(3);
    expect(result.value.matrixColumns).toHaveLength(3);
    expect(result.value.matrixEntries).toHaveLength(5);
  });

  it("creates and updates collections and events in a device workspace", async () => {
    const repository = await createSeededRepository();

    const collectionResult = await repository.createCollection({
      deviceId: asEntityId<DeviceId>("device_checkout-ios-16-pro"),
      name: "Account Recovery"
    });

    expect(collectionResult.isOk()).toBe(true);
    if (collectionResult.isErr() || !database) {
      return;
    }

    const updatedCollectionResult = await repository.updateCollection({
      collectionId: collectionResult.value.id,
      name: "Account Recovery Alerts"
    });

    expect(updatedCollectionResult.isOk()).toBe(true);
    if (updatedCollectionResult.isErr()) {
      return;
    }

    const eventResult = await repository.createEvent({
      collectionId: updatedCollectionResult.value.id,
      name: "Recovery Code Sent",
      eventType: "Toast"
    });

    expect(eventResult.isOk()).toBe(true);
    if (eventResult.isErr()) {
      return;
    }

    const updatedEventResult = await repository.updateEvent({
      eventId: eventResult.value.id,
      name: "Recovery Code Resent",
      eventType: "Banner"
    });

    expect(updatedEventResult.isOk()).toBe(true);
    if (updatedEventResult.isErr()) {
      return;
    }

    expect(updatedCollectionResult.value.name).toBe("Account Recovery Alerts");
    expect(updatedEventResult.value).toMatchObject({
      collectionId: updatedCollectionResult.value.id,
      name: "Recovery Code Resent",
      eventType: "Banner",
      sortOrder: 0
    });
    await expect(database.collections.get(collectionResult.value.id)).resolves.toMatchObject({
      name: "Account Recovery Alerts"
    });
    await expect(database.events.get(eventResult.value.id)).resolves.toMatchObject({
      name: "Recovery Code Resent",
      eventType: "Banner",
      sortOrder: 0
    });
  });

  it("appends newly created events after existing collection order", async () => {
    const repository = await createSeededRepository();

    const eventResult = await repository.createEvent({
      collectionId: asEntityId("collection_ios-checkout-actions"),
      name: "Apple Pay",
      eventType: "Button"
    });

    expect(eventResult.isOk()).toBe(true);
    if (eventResult.isErr()) {
      return;
    }
    expect(eventResult.value.sortOrder).toBe(2);

    const workspaceResult = await repository.loadDeviceWorkspace(
      asEntityId<DeviceId>("device_checkout-ios-16-pro")
    );
    expect(workspaceResult.isOk()).toBe(true);
    if (workspaceResult.isErr()) {
      return;
    }

    const checkoutEvents = workspaceResult.value.collections.find(
      (collection) => collection.collection.id === "collection_ios-checkout-actions"
    )?.events;
    expect(checkoutEvents?.map((event) => event.event.name)).toEqual(["Pay Now", "Save Card", "Apple Pay"]);
  });

  it("reorders collection events with contiguous persisted positions", async () => {
    const repository = await createSeededRepository();
    const collectionId = asEntityId<CollectionId>("collection_ios-checkout-actions");

    const reorderResult = await repository.reorderCollectionEvents({
      collectionId,
      orderedEventIds: [
        asEntityId<EventId>("event_ios-save-card"),
        asEntityId<EventId>("event_ios-pay-now")
      ]
    });

    expect(reorderResult.isOk()).toBe(true);
    if (reorderResult.isErr() || !database) {
      return;
    }

    expect(reorderResult.value.map((event) => [event.id, event.sortOrder])).toEqual([
      ["event_ios-save-card", 0],
      ["event_ios-pay-now", 1]
    ]);
    await expect(database.events.get(asEntityId<EventId>("event_ios-save-card"))).resolves.toMatchObject({
      sortOrder: 0
    });
    await expect(database.events.get(asEntityId<EventId>("event_ios-pay-now"))).resolves.toMatchObject({
      sortOrder: 1
    });

    const workspaceResult = await repository.loadDeviceWorkspace(
      asEntityId<DeviceId>("device_checkout-ios-16-pro")
    );
    expect(workspaceResult.isOk()).toBe(true);
    if (workspaceResult.isErr()) {
      return;
    }

    const checkoutEvents = workspaceResult.value.collections.find(
      (collection) => collection.collection.id === collectionId
    )?.events;
    expect(checkoutEvents?.map((event) => event.event.id)).toEqual([
      "event_ios-save-card",
      "event_ios-pay-now"
    ]);
  });

  it("rejects invalid event reorder inputs", async () => {
    const repository = await createSeededRepository();
    const collectionId = asEntityId<CollectionId>("collection_ios-checkout-actions");

    const duplicateResult = await repository.reorderCollectionEvents({
      collectionId,
      orderedEventIds: [
        asEntityId<EventId>("event_ios-pay-now"),
        asEntityId<EventId>("event_ios-pay-now")
      ]
    });
    expect(duplicateResult.isErr()).toBe(true);
    if (duplicateResult.isOk()) {
      return;
    }
    expect(duplicateResult.error.kind).toBe("constraint");
    expect(duplicateResult.error.details?.constraint).toBe("event-order-unique");

    const omittedResult = await repository.reorderCollectionEvents({
      collectionId,
      orderedEventIds: [asEntityId<EventId>("event_ios-pay-now")]
    });
    expect(omittedResult.isErr()).toBe(true);
    if (omittedResult.isOk()) {
      return;
    }
    expect(omittedResult.error.kind).toBe("constraint");
    expect(omittedResult.error.details?.constraint).toBe("event-order-exact-permutation");

    const unknownResult = await repository.reorderCollectionEvents({
      collectionId,
      orderedEventIds: [
        asEntityId<EventId>("event_ios-pay-now"),
        asEntityId<EventId>("event_missing")
      ]
    });
    expect(unknownResult.isErr()).toBe(true);
    if (unknownResult.isOk()) {
      return;
    }
    expect(unknownResult.error.kind).toBe("constraint");
    expect(unknownResult.error.details?.constraint).toBe("event-order-unknown-event");

    const crossCollectionResult = await repository.reorderCollectionEvents({
      collectionId,
      orderedEventIds: [
        asEntityId<EventId>("event_ios-pay-now"),
        asEntityId<EventId>("event_ios-card-declined")
      ]
    });
    expect(crossCollectionResult.isErr()).toBe(true);
    if (crossCollectionResult.isOk()) {
      return;
    }
    expect(crossCollectionResult.error.kind).toBe("constraint");
    expect(crossCollectionResult.error.details?.constraint).toBe("event-order-cross-collection");
  });

  it("creates, updates, and deletes event interactions and playbacks", async () => {
    const repository = await createSeededRepository();

    const eventTriggerResult = await repository.createEventTrigger({
      eventId: asEntityId<EventId>("event_ios-save-card"),
      triggerId: asEntityId<TriggerId>("trigger_on-release"),
      label: "Toggle release",
      isEnabled: true
    });

    expect(eventTriggerResult.isOk()).toBe(true);
    if (eventTriggerResult.isErr() || !database) {
      return;
    }

    const updatedEventTriggerResult = await repository.updateEventTrigger({
      eventTriggerId: eventTriggerResult.value.id,
      label: null,
      isEnabled: false
    });

    expect(updatedEventTriggerResult.isOk()).toBe(true);
    if (updatedEventTriggerResult.isErr()) {
      return;
    }

    const playbackResult = await repository.createTriggerPlayback({
      eventTriggerId: eventTriggerResult.value.id,
      assetId: asEntityId<AssetId>("asset_shared-nav-click"),
      startOffset: 0.15
    });

    expect(playbackResult.isOk()).toBe(true);
    if (playbackResult.isErr()) {
      return;
    }

    const updatedPlaybackResult = await repository.updateTriggerPlayback({
      triggerPlaybackId: playbackResult.value.id,
      assetId: asEntityId<AssetId>("asset_checkout-success-haptic"),
      startOffset: 0.4
    });

    expect(updatedPlaybackResult.isOk()).toBe(true);
    if (updatedPlaybackResult.isErr()) {
      return;
    }

    expect(updatedEventTriggerResult.value).toMatchObject({
      label: null,
      isEnabled: false
    });
    expect(updatedPlaybackResult.value).toMatchObject({
      assetId: "asset_checkout-success-haptic",
      startOffset: 0.4
    });

    const deletePlaybackResult = await repository.deleteTriggerPlayback(playbackResult.value.id);
    expect(deletePlaybackResult.isOk()).toBe(true);
    await expect(database.triggerPlaybacks.get(playbackResult.value.id)).resolves.toBeUndefined();

    const cascadePlaybackResult = await repository.createTriggerPlayback({
      eventTriggerId: eventTriggerResult.value.id,
      assetId: asEntityId<AssetId>("asset_checkout-success-haptic"),
      startOffset: 0
    });
    expect(cascadePlaybackResult.isOk()).toBe(true);
    if (cascadePlaybackResult.isErr()) {
      return;
    }

    const deleteEventTriggerResult = await repository.deleteEventTrigger(eventTriggerResult.value.id);
    expect(deleteEventTriggerResult.isOk()).toBe(true);
    await expect(database.eventTriggers.get(eventTriggerResult.value.id)).resolves.toBeUndefined();
    await expect(database.triggerPlaybacks.get(cascadePlaybackResult.value.id)).resolves.toBeUndefined();
  });

  it("rejects duplicate event interactions and invalid playback records", async () => {
    const repository = await createSeededRepository();

    const duplicateTriggerResult = await repository.createEventTrigger({
      eventId: asEntityId<EventId>("event_ios-pay-now"),
      triggerId: asEntityId<TriggerId>("trigger_on-press")
    });

    expect(duplicateTriggerResult.isErr()).toBe(true);
    if (duplicateTriggerResult.isOk()) {
      return;
    }
    expect(duplicateTriggerResult.error.kind).toBe("conflict");
    expect(duplicateTriggerResult.error.details?.constraint).toBe("unique-event-trigger");

    const invalidOffsetResult = await repository.createTriggerPlayback({
      eventTriggerId: asEntityId<EventTriggerId>("event-trigger_payment-complete-release"),
      assetId: asEntityId<AssetId>("asset_checkout-success-haptic"),
      startOffset: -0.1
    });

    expect(invalidOffsetResult.isErr()).toBe(true);
    if (invalidOffsetResult.isOk() || !database) {
      return;
    }
    expect(invalidOffsetResult.error.kind).toBe("validation");

    await database.assetLibraries.add({
      id: asEntityId<AssetLibraryId>("library_unimported"),
      name: "Unimported Kit",
      defaultForProjectId: null
    });
    await database.assetLibraryFolders.add({
      id: asEntityId<AssetLibraryFolderId>("folder_library-unimported-root"),
      libraryId: asEntityId<AssetLibraryId>("library_unimported"),
      parentFolderId: null,
      name: "Unimported Kit",
      icon: "folder"
    });
    await database.assets.add({
      id: asEntityId<AssetId>("asset_unimported-tone"),
      libraryId: asEntityId<AssetLibraryId>("library_unimported"),
      folderId: asEntityId<AssetLibraryFolderId>("folder_library-unimported-root"),
      name: "Unimported Tone",
      assetId: "asset-unimported-tone",
      mediaKind: "audio",
      originalFilename: "unimported-tone.wav",
      uploadedAt: asISODateString("2026-07-03T12:00:00.000Z"),
      playbackUrl: "https://vibra.local/assets/unimported-tone.wav"
    });

    const ineligibleAssetResult = await repository.createTriggerPlayback({
      eventTriggerId: asEntityId<EventTriggerId>("event-trigger_payment-complete-release"),
      assetId: asEntityId<AssetId>("asset_unimported-tone"),
      startOffset: 0
    });

    expect(ineligibleAssetResult.isErr()).toBe(true);
    if (ineligibleAssetResult.isOk()) {
      return;
    }
    expect(ineligibleAssetResult.error.kind).toBe("constraint");
    expect(ineligibleAssetResult.error.details?.constraint).toBe("project-asset-eligibility");
  });

  it("loads and mutates asset library trees", async () => {
    const repository = await createSeededRepository();

    const libraryListResult = await repository.loadAssetLibraries();

    expect(libraryListResult.isOk()).toBe(true);
    if (libraryListResult.isErr()) {
      return;
    }

    expect(libraryListResult.value.libraries.map((summary) => summary.library.name)).toEqual([
      "Checkout Feedback System Default",
      "Onboarding Motion Kit Default",
      "Shared Brand Feedback"
    ]);
    expect(libraryListResult.value.libraries[0]).toMatchObject({
      assetCount: 3,
      folderCount: 3,
      importedByProjectCount: 0
    });
    expect(libraryListResult.value.libraries[0]?.defaultForProject?.name).toBe("Checkout Feedback System");
    expect(
      libraryListResult.value.libraries.find((summary) => summary.library.name === "Shared Brand Feedback")
        ?.importedByProjectCount
    ).toBe(1);

    const treeResult = await repository.loadAssetLibraryTree(
      asEntityId<AssetLibraryId>("library_checkout-default")
    );

    expect(treeResult.isOk()).toBe(true);
    if (treeResult.isErr() || !database) {
      return;
    }

    expect(treeResult.value.library.name).toBe("Checkout Feedback System Default");
    expect(treeResult.value.rootFolder.folder.name).toBe("Checkout Feedback System");
    expect(treeResult.value.rootFolder.childFolders.map((node) => node.folder.name)).toEqual([
      "Alerts",
      "Confirmation"
    ]);

    const createdLibraryResult = await repository.createAssetLibrary({
      name: "Notification Kit"
    });

    expect(createdLibraryResult.isOk()).toBe(true);
    if (createdLibraryResult.isErr()) {
      return;
    }

    expect(createdLibraryResult.value.library.defaultForProjectId).toBeNull();
    expect(createdLibraryResult.value.rootFolder).toMatchObject({
      libraryId: createdLibraryResult.value.library.id,
      parentFolderId: null,
      name: "Notification Kit"
    });

    const childFolderResult = await repository.createAssetLibraryFolder({
      libraryId: createdLibraryResult.value.library.id,
      parentFolderId: createdLibraryResult.value.rootFolder.id,
      name: "Toasts",
      icon: "message-square"
    });

    expect(childFolderResult.isOk()).toBe(true);
    if (childFolderResult.isErr()) {
      return;
    }

    const assetResult = await repository.createAsset({
      libraryId: createdLibraryResult.value.library.id,
      folderId: childFolderResult.value.id,
      name: "Toast Tap",
      assetId: "asset-toast-tap",
      mediaKind: "haptic",
      originalFilename: "toast-tap.ahap",
      playbackUrl: "https://vibra.local/assets/toast-tap.ahap"
    });

    expect(assetResult.isOk()).toBe(true);
    if (assetResult.isErr()) {
      return;
    }

    const updatedTreeResult = await repository.loadAssetLibraryTree(createdLibraryResult.value.library.id);

    expect(updatedTreeResult.isOk()).toBe(true);
    if (updatedTreeResult.isErr()) {
      return;
    }

    expect(updatedTreeResult.value.rootFolder.childFolders[0]?.assets.map((asset) => asset.name)).toEqual([
      "Toast Tap"
    ]);
    await expect(database.assets.get(assetResult.value.id)).resolves.toMatchObject({
      name: "Toast Tap",
      mediaKind: "haptic"
    });
  });

  it("stores uploaded audio blobs and keeps browser playback URLs stable across aggregate loads", async () => {
    const repository = await createSeededRepository();
    const createdLibraryResult = await repository.createAssetLibrary({
      name: "Uploaded Audio Kit"
    });

    expect(createdLibraryResult.isOk()).toBe(true);
    if (createdLibraryResult.isErr() || !database) {
      return;
    }

    const childFolderResult = await repository.createAssetLibraryFolder({
      libraryId: createdLibraryResult.value.library.id,
      parentFolderId: createdLibraryResult.value.rootFolder.id,
      name: "Uploads",
      icon: "upload"
    });

    expect(childFolderResult.isOk()).toBe(true);
    if (childFolderResult.isErr()) {
      return;
    }

    const blob = new Blob(["RIFF demo audio"], { type: "audio/wav" });
    const assetResult = await repository.createAsset({
      libraryId: createdLibraryResult.value.library.id,
      folderId: childFolderResult.value.id,
      name: "Uploaded Tone",
      assetId: "asset-uploaded-tone",
      mediaKind: "audio",
      originalFilename: "uploaded-tone.wav",
      blob
    });

    expect(assetResult.isOk()).toBe(true);
    if (assetResult.isErr()) {
      return;
    }

    await expect(database.assetBlobs.get(assetResult.value.id)).resolves.toMatchObject({
      assetId: assetResult.value.id,
      contentType: "audio/wav",
      size: blob.size
    });

    const revokedUrls: string[] = [];
    let createdUrlCount = 0;
    const reloadedRepository = createProjectRepository(database, {
      createObjectUrl: () => `blob:vibra-test-${++createdUrlCount}`,
      revokeObjectUrl: (url) => revokedUrls.push(url)
    });

    const firstTreeResult = await reloadedRepository.loadAssetLibraryTree(createdLibraryResult.value.library.id);
    const libraryListResult = await reloadedRepository.loadAssetLibraries();
    const secondTreeResult = await reloadedRepository.loadAssetLibraryTree(createdLibraryResult.value.library.id);

    expect(firstTreeResult.isOk()).toBe(true);
    expect(libraryListResult.isOk()).toBe(true);
    expect(secondTreeResult.isOk()).toBe(true);
    if (firstTreeResult.isErr() || secondTreeResult.isErr()) {
      return;
    }

    expect(firstTreeResult.value.rootFolder.childFolders[0]?.assets[0]?.playbackUrl).toBe("blob:vibra-test-1");
    expect(secondTreeResult.value.rootFolder.childFolders[0]?.assets[0]?.playbackUrl).toBe("blob:vibra-test-1");
    expect(createdUrlCount).toBe(1);
    expect(revokedUrls).toEqual([]);
  });

  it("stores uploaded haptic blobs after reload and keeps them selectable for playbacks", async () => {
    const repository = await createSeededRepository();
    const createdLibraryResult = await repository.createAssetLibrary({
      name: "Uploaded Haptic Kit"
    });

    expect(createdLibraryResult.isOk()).toBe(true);
    if (createdLibraryResult.isErr() || !database) {
      return;
    }

    const childFolderResult = await repository.createAssetLibraryFolder({
      libraryId: createdLibraryResult.value.library.id,
      parentFolderId: createdLibraryResult.value.rootFolder.id,
      name: "Uploads",
      icon: "upload"
    });

    expect(childFolderResult.isOk()).toBe(true);
    if (childFolderResult.isErr()) {
      return;
    }

    const blob = new Blob([JSON.stringify({ Version: 1, Pattern: [] })], {
      type: "application/json"
    });
    const assetResult = await repository.createAsset({
      libraryId: createdLibraryResult.value.library.id,
      folderId: childFolderResult.value.id,
      name: "Uploaded Tap",
      assetId: "asset-uploaded-tap",
      mediaKind: "haptic",
      originalFilename: "uploaded-tap.ahap",
      blob
    });

    expect(assetResult.isOk()).toBe(true);
    if (assetResult.isErr()) {
      return;
    }

    const importResult = await repository.importAssetLibrary({
      projectId: DEMO_PRIMARY_PROJECT_ID,
      assetLibraryId: createdLibraryResult.value.library.id
    });

    expect(importResult.isOk()).toBe(true);
    if (importResult.isErr()) {
      return;
    }

    const playbackResult = await repository.createTriggerPlayback({
      eventTriggerId: asEntityId<EventTriggerId>("event-trigger_pay-now-release"),
      assetId: assetResult.value.id,
      startOffset: 0.6
    });

    expect(playbackResult.isOk()).toBe(true);
    if (playbackResult.isErr()) {
      return;
    }

    await expect(database.assetBlobs.get(assetResult.value.id)).resolves.toMatchObject({
      assetId: assetResult.value.id,
      contentType: "application/json",
      size: blob.size
    });

    const reloadedRepository = createProjectRepository(database, {
      createObjectUrl: () => "blob:vibra-haptic-test"
    });
    const workspaceResult = await reloadedRepository.loadDeviceWorkspace(
      asEntityId<DeviceId>("device_checkout-ios-16-pro")
    );

    expect(workspaceResult.isOk()).toBe(true);
    if (workspaceResult.isErr()) {
      return;
    }

    expect(workspaceResult.value.playbackAssets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: assetResult.value.id,
          mediaKind: "haptic",
          playbackUrl: "blob:vibra-haptic-test"
        })
      ])
    );
    expect(
      workspaceResult.value.collections
        .flatMap((collection) => collection.events)
        .flatMap((event) => event.eventTriggers)
        .flatMap((eventTrigger) => eventTrigger.playbacks)
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: playbackResult.value.id,
          assetId: assetResult.value.id
        })
      ])
    );
  });

  it("reports missing uploaded asset blobs as persistence failures", async () => {
    const repository = await createSeededRepository();
    const createdLibraryResult = await repository.createAssetLibrary({
      name: "Corrupt Upload Kit"
    });

    expect(createdLibraryResult.isOk()).toBe(true);
    if (createdLibraryResult.isErr() || !database) {
      return;
    }

    const childFolderResult = await repository.createAssetLibraryFolder({
      libraryId: createdLibraryResult.value.library.id,
      parentFolderId: createdLibraryResult.value.rootFolder.id,
      name: "Uploads",
      icon: "upload"
    });

    expect(childFolderResult.isOk()).toBe(true);
    if (childFolderResult.isErr()) {
      return;
    }

    const assetResult = await repository.createAsset({
      libraryId: createdLibraryResult.value.library.id,
      folderId: childFolderResult.value.id,
      name: "Missing Blob Tone",
      assetId: "asset-missing-blob-tone",
      mediaKind: "audio",
      originalFilename: "missing-blob-tone.wav",
      blob: new Blob(["missing"], { type: "audio/wav" })
    });

    expect(assetResult.isOk()).toBe(true);
    if (assetResult.isErr()) {
      return;
    }

    await database.assetBlobs.delete(assetResult.value.id);

    const treeResult = await repository.loadAssetLibraryTree(createdLibraryResult.value.library.id);

    expect(treeResult.isErr()).toBe(true);
    if (treeResult.isOk()) {
      return;
    }

    expect(treeResult.error.kind).toBe("persistence");
    expect(treeResult.error.message).toBe("Uploaded asset file data could not be loaded.");
  });

  it("allows mixed asset folder contents and enforces library imports", async () => {
    const repository = await createSeededRepository();

    const childUnderAssetFolderResult = await repository.createAssetLibraryFolder({
      libraryId: asEntityId<AssetLibraryId>("library_checkout-default"),
      parentFolderId: asEntityId<AssetLibraryFolderId>("folder_library-checkout-confirmation"),
      name: "Nested Valid",
      icon: "folder"
    });

    expect(childUnderAssetFolderResult.isOk()).toBe(true);
    if (childUnderAssetFolderResult.isErr()) {
      return;
    }

    const assetUnderChildFolderResult = await repository.createAsset({
      libraryId: asEntityId<AssetLibraryId>("library_checkout-default"),
      folderId: asEntityId<AssetLibraryFolderId>("folder_library-checkout-root"),
      name: "Root Tone",
      assetId: "asset-root-tone",
      mediaKind: "audio",
      originalFilename: "root-tone.wav",
      playbackUrl: "https://vibra.local/assets/root-tone.wav"
    });

    expect(assetUnderChildFolderResult.isOk()).toBe(true);
    if (assetUnderChildFolderResult.isErr()) {
      return;
    }

    const createdLibraryResult = await repository.createAssetLibrary({
      name: "Modal Feedback"
    });

    expect(createdLibraryResult.isOk()).toBe(true);
    if (createdLibraryResult.isErr() || !database) {
      return;
    }

    const importResult = await repository.importAssetLibrary({
      projectId: DEMO_PRIMARY_PROJECT_ID,
      assetLibraryId: createdLibraryResult.value.library.id
    });

    expect(importResult.isOk()).toBe(true);
    if (importResult.isErr()) {
      return;
    }
    await expect(
      database.projectAssetLibraryImports.get([DEMO_PRIMARY_PROJECT_ID, createdLibraryResult.value.library.id])
    ).resolves.toMatchObject({
      projectId: DEMO_PRIMARY_PROJECT_ID,
      assetLibraryId: createdLibraryResult.value.library.id
    });

    const duplicateImportResult = await repository.importAssetLibrary({
      projectId: DEMO_PRIMARY_PROJECT_ID,
      assetLibraryId: createdLibraryResult.value.library.id
    });

    expect(duplicateImportResult.isErr()).toBe(true);
    if (duplicateImportResult.isOk()) {
      return;
    }
    expect(duplicateImportResult.error.kind).toBe("conflict");
    expect(duplicateImportResult.error.details?.constraint).toBe("project-library-import-unique");

    const ownDefaultImportResult = await repository.importAssetLibrary({
      projectId: DEMO_PRIMARY_PROJECT_ID,
      assetLibraryId: asEntityId<AssetLibraryId>("library_checkout-default")
    });

    expect(ownDefaultImportResult.isErr()).toBe(true);
    if (ownDefaultImportResult.isOk()) {
      return;
    }
    expect(ownDefaultImportResult.error.kind).toBe("conflict");
    expect(ownDefaultImportResult.error.details?.constraint).toBe("project-import-own-default-library");
  });

  it("loads collision matrices and persists row, column, and entry updates", async () => {
    const repository = await createSeededRepository();
    const matrixId = asEntityId<CollisionMatrixId>("matrix_checkout-ios");

    const matrixResult = await repository.loadCollisionMatrix(matrixId);

    expect(matrixResult.isOk()).toBe(true);
    if (matrixResult.isErr() || !database) {
      return;
    }

    expect(matrixResult.value.device.name).toBe("iPhone 16 Pro");
    expect(matrixResult.value.events.map((event) => event.name)).toEqual([
      "Card Declined",
      "Pay Now",
      "Payment Complete",
      "Save Card"
    ]);
    expect(matrixResult.value.rows).toHaveLength(3);
    expect(matrixResult.value.columns).toHaveLength(3);
    expect(matrixResult.value.entries).toHaveLength(5);

    const rowResult = await repository.selectCollisionMatrixRow({
      matrixId,
      eventId: asEntityId<EventId>("event_ios-save-card")
    });
    const columnResult = await repository.selectCollisionMatrixColumn({
      matrixId,
      eventId: asEntityId<EventId>("event_ios-pay-now")
    });

    expect(rowResult.isOk()).toBe(true);
    expect(columnResult.isOk()).toBe(true);
    await expect(
      database.collisionMatrixRows.get([matrixId, asEntityId<EventId>("event_ios-save-card")])
    ).resolves.toMatchObject({
      eventId: "event_ios-save-card"
    });
    await expect(
      database.collisionMatrixColumns.get([matrixId, asEntityId<EventId>("event_ios-pay-now")])
    ).resolves.toMatchObject({
      eventId: "event_ios-pay-now"
    });

    const createdEntryResult = await repository.upsertCollisionMatrixEntry({
      matrixId,
      playingEventId: asEntityId<EventId>("event_ios-pay-now"),
      incomingEventId: asEntityId<EventId>("event_ios-save-card"),
      resolutionBehavior: {
        behaviorName: "Suppress",
        targetEventId: asEntityId<EventId>("event_ios-save-card")
      }
    });

    expect(createdEntryResult.isOk()).toBe(true);
    if (createdEntryResult.isErr()) {
      return;
    }
    expect(createdEntryResult.value.resolutionBehavior).toEqual({
      behaviorName: "Suppress",
      targetEventId: "event_ios-save-card"
    });

    const updatedEntryResult = await repository.upsertCollisionMatrixEntry({
      matrixId,
      playingEventId: asEntityId<EventId>("event_ios-pay-now"),
      incomingEventId: asEntityId<EventId>("event_ios-save-card"),
      resolutionBehavior: {
        behaviorName: "Queue",
        targetEventId: null
      }
    });

    expect(updatedEntryResult.isOk()).toBe(true);
    if (updatedEntryResult.isErr()) {
      return;
    }
    expect(updatedEntryResult.value.id).toBe(createdEntryResult.value.id);
    expect(updatedEntryResult.value.resolutionBehavior).toEqual({
      behaviorName: "Queue",
      targetEventId: null
    });
  });

  it("rejects invalid collision matrix selections and entries", async () => {
    const repository = await createSeededRepository();
    const matrixId = asEntityId<CollisionMatrixId>("matrix_checkout-ios");

    const offDeviceRowResult = await repository.selectCollisionMatrixRow({
      matrixId,
      eventId: asEntityId<EventId>("event_android-pay-now")
    });

    expect(offDeviceRowResult.isErr()).toBe(true);
    if (offDeviceRowResult.isOk()) {
      return;
    }
    expect(offDeviceRowResult.error.kind).toBe("constraint");
    expect(offDeviceRowResult.error.details?.constraint).toBe("matrix-event-device-membership");

    const missingColumnResult = await repository.upsertCollisionMatrixEntry({
      matrixId,
      playingEventId: asEntityId<EventId>("event_ios-pay-now"),
      incomingEventId: asEntityId<EventId>("event_ios-pay-now"),
      resolutionBehavior: {
        behaviorName: "Queue",
        targetEventId: null
      }
    });

    expect(missingColumnResult.isErr()).toBe(true);
    if (missingColumnResult.isOk()) {
      return;
    }
    expect(missingColumnResult.error.kind).toBe("constraint");
    expect(missingColumnResult.error.details?.constraint).toBe("matrix-entry-row-column-membership");

    const invalidSuppressResult = await repository.upsertCollisionMatrixEntry({
      matrixId,
      playingEventId: asEntityId<EventId>("event_ios-pay-now"),
      incomingEventId: asEntityId<EventId>("event_ios-save-card"),
      resolutionBehavior: {
        behaviorName: "Suppress",
        targetEventId: null
      }
    });

    expect(invalidSuppressResult.isErr()).toBe(true);
    if (invalidSuppressResult.isOk()) {
      return;
    }
    expect(invalidSuppressResult.error.kind).toBe("constraint");
    expect(invalidSuppressResult.error.details?.constraint).toBe("suppress-target-required");
  });

  it("deletes assets with blobs, object URLs, and referencing playbacks", async () => {
    const revokedUrls: string[] = [];
    const repository = await createSeededRepository({
      createObjectUrl: (blob) => `blob:vibra-delete-test-${blob.size}-${crypto.randomUUID()}`,
      revokeObjectUrl: (url) => revokedUrls.push(url)
    });
    const assetId = asEntityId<AssetId>("asset_checkout-success-audio");

    const treeBeforeDelete = await repository.loadAssetLibraryTree(
      asEntityId<AssetLibraryId>("library_checkout-default")
    );
    expect(treeBeforeDelete.isOk()).toBe(true);

    const deleteResult = await repository.deleteAsset(assetId);

    expect(deleteResult.isOk()).toBe(true);
    if (deleteResult.isErr() || !database) {
      return;
    }

    expect(revokedUrls).toHaveLength(1);
    await expect(database.assets.get(assetId)).resolves.toBeUndefined();
    await expect(database.assetBlobs.get(assetId)).resolves.toBeUndefined();
    await expect(database.triggerPlaybacks.where("assetId").equals(assetId).count()).resolves.toBe(0);

    const workspaceResult = await repository.loadDeviceWorkspace(
      asEntityId<DeviceId>("device_checkout-ios-16-pro")
    );
    expect(workspaceResult.isOk()).toBe(true);
    if (workspaceResult.isErr()) {
      return;
    }
    expect(
      workspaceResult.value.collections
        .flatMap((collection) => collection.events)
        .flatMap((event) => event.eventTriggers)
        .flatMap((eventTrigger) => eventTrigger.playbacks)
        .some((playback) => playback.assetId === assetId)
    ).toBe(false);
  });

  it("deletes asset library folder trees and standalone libraries while protecting defaults", async () => {
    const repository = await createSeededRepository();

    const protectedDeleteResult = await repository.deleteAssetLibrary(
      asEntityId<AssetLibraryId>("library_checkout-default")
    );
    expect(protectedDeleteResult.isErr()).toBe(true);
    if (protectedDeleteResult.isOk()) {
      return;
    }
    expect(protectedDeleteResult.error.kind).toBe("constraint");
    expect(protectedDeleteResult.error.details?.constraint).toBe("default-asset-library-delete-protected");

    const createdLibraryResult = await repository.createAssetLibrary({ name: "Disposable Library" });
    expect(createdLibraryResult.isOk()).toBe(true);
    if (createdLibraryResult.isErr() || !database) {
      return;
    }

    const childFolderResult = await repository.createAssetLibraryFolder({
      libraryId: createdLibraryResult.value.library.id,
      parentFolderId: createdLibraryResult.value.rootFolder.id,
      name: "Nested",
      icon: "folder"
    });
    expect(childFolderResult.isOk()).toBe(true);
    if (childFolderResult.isErr()) {
      return;
    }

    const assetResult = await repository.createAsset({
      libraryId: createdLibraryResult.value.library.id,
      folderId: childFolderResult.value.id,
      name: "Disposable Tone",
      assetId: "asset-disposable-tone",
      mediaKind: "audio",
      originalFilename: "disposable-tone.wav",
      blob: new Blob(["tone"], { type: "audio/wav" })
    });
    expect(assetResult.isOk()).toBe(true);
    if (assetResult.isErr()) {
      return;
    }

    const deleteFolderResult = await repository.deleteAssetLibraryFolder(childFolderResult.value.id);
    expect(deleteFolderResult.isOk()).toBe(true);
    await expect(database.assetLibraryFolders.get(childFolderResult.value.id)).resolves.toBeUndefined();
    await expect(database.assets.get(assetResult.value.id)).resolves.toBeUndefined();
    await expect(database.assetBlobs.get(assetResult.value.id)).resolves.toBeUndefined();

    const deleteLibraryResult = await repository.deleteAssetLibrary(createdLibraryResult.value.library.id);
    expect(deleteLibraryResult.isOk()).toBe(true);
    await expect(database.assetLibraries.get(createdLibraryResult.value.library.id)).resolves.toBeUndefined();
    await expect(database.assetLibraryFolders.get(createdLibraryResult.value.rootFolder.id)).resolves.toBeUndefined();
  });

  it("deletes events with trigger, playback, matrix, and share-link cascades", async () => {
    const repository = await createSeededRepository();
    const eventId = asEntityId<EventId>("event_ios-pay-now");

    const deleteResult = await repository.deleteEvent(eventId);

    expect(deleteResult.isOk()).toBe(true);
    if (deleteResult.isErr() || !database) {
      return;
    }

    await expect(database.events.get(eventId)).resolves.toBeUndefined();
    await expect(database.eventTriggers.where("eventId").equals(eventId).count()).resolves.toBe(0);
    await expect(
      database.triggerPlaybacks.get(asEntityId("playback_pay-now-release-audio"))
    ).resolves.toBeUndefined();
    await expect(database.collisionMatrixRows.where("eventId").equals(eventId).count()).resolves.toBe(0);
    await expect(database.collisionMatrixColumns.where("eventId").equals(eventId).count()).resolves.toBe(0);
    expect(
      await database.collisionMatrixEntries
        .filter((entry) => entry.playingEventId === eventId || entry.incomingEventId === eventId)
        .count()
    ).toBe(0);
    await expect(database.sharingLinks.get(asEntityId<SharingLinkId>("share_event_pay-now"))).resolves.toBeUndefined();

    const workspaceResult = await repository.loadDeviceWorkspace(
      asEntityId<DeviceId>("device_checkout-ios-16-pro")
    );
    expect(workspaceResult.isOk()).toBe(true);
  });

  it("deletes collision matrix entries, axes, and sharing links", async () => {
    const repository = await createSeededRepository();
    const matrixId = asEntityId<CollisionMatrixId>("matrix_checkout-ios");
    const entryId = asEntityId<CollisionMatrixEntryId>("matrix-entry_pay-now_card-declined");

    const deleteEntryResult = await repository.deleteCollisionMatrixEntry(entryId);
    expect(deleteEntryResult.isOk()).toBe(true);
    if (deleteEntryResult.isErr() || !database) {
      return;
    }
    await expect(database.collisionMatrixEntries.get(entryId)).resolves.toBeUndefined();
    await expect(
      database.sharingLinks.get(asEntityId<SharingLinkId>("share_matrix_pay-now-card-declined"))
    ).resolves.toBeUndefined();

    const generatedShareResult = await repository.generateSharingLink({
      target: { kind: "project", projectId: DEMO_PRIMARY_PROJECT_ID },
      createdByUserId: DEMO_USER_ID
    });
    expect(generatedShareResult.isOk()).toBe(true);
    if (generatedShareResult.isErr()) {
      return;
    }

    const deleteShareResult = await repository.deleteSharingLink(generatedShareResult.value.id);
    expect(deleteShareResult.isOk()).toBe(true);
    await expect(database.sharingLinks.get(generatedShareResult.value.id)).resolves.toBeUndefined();

    const deselectRowResult = await repository.deselectCollisionMatrixRow({
      matrixId,
      eventId: asEntityId<EventId>("event_ios-card-declined")
    });
    expect(deselectRowResult.isOk()).toBe(true);
    await expect(
      database.collisionMatrixRows.get([matrixId, asEntityId<EventId>("event_ios-card-declined")])
    ).resolves.toBeUndefined();
    expect(
      await database.collisionMatrixEntries
        .where("matrixId")
        .equals(matrixId)
        .and((entry) => entry.playingEventId === "event_ios-card-declined")
        .count()
    ).toBe(0);

    const deselectColumnResult = await repository.deselectCollisionMatrixColumn({
      matrixId,
      eventId: asEntityId<EventId>("event_ios-save-card")
    });
    expect(deselectColumnResult.isOk()).toBe(true);
    await expect(
      database.collisionMatrixColumns.get([matrixId, asEntityId<EventId>("event_ios-save-card")])
    ).resolves.toBeUndefined();
    expect(
      await database.collisionMatrixEntries
        .where("matrixId")
        .equals(matrixId)
        .and((entry) => entry.incomingEventId === "event_ios-save-card")
        .count()
    ).toBe(0);
  });

  it("deletes devices, projects, and project folders with recursive cascades", async () => {
    const repository = await createSeededRepository();

    const deleteCollectionResult = await repository.deleteCollection(
      asEntityId("collection_android-checkout-actions")
    );
    expect(deleteCollectionResult.isOk()).toBe(true);
    if (deleteCollectionResult.isErr() || !database) {
      return;
    }
    await expect(database.collections.get(asEntityId("collection_android-checkout-actions"))).resolves.toBeUndefined();
    await expect(database.events.get(asEntityId<EventId>("event_android-pay-now"))).resolves.toBeUndefined();
    await expect(database.eventTriggers.where("eventId").equals("event_android-pay-now").count()).resolves.toBe(0);

    const deleteDeviceResult = await repository.deleteDevice(
      asEntityId<DeviceId>("device_checkout-windows-disabled")
    );
    expect(deleteDeviceResult.isOk()).toBe(true);
    if (deleteDeviceResult.isErr()) {
      return;
    }
    await expect(database.devices.get(asEntityId<DeviceId>("device_checkout-windows-disabled"))).resolves.toBeUndefined();
    await expect(
      database.collisionMatrices.get(asEntityId<CollisionMatrixId>("matrix_checkout-windows-disabled"))
    ).resolves.toBeUndefined();

    const deleteProjectResult = await repository.deleteProject(DEMO_PRIMARY_PROJECT_ID);
    expect(deleteProjectResult.isOk()).toBe(true);
    await expect(database.projects.get(DEMO_PRIMARY_PROJECT_ID)).resolves.toBeUndefined();
    await expect(database.devices.where("projectId").equals(DEMO_PRIMARY_PROJECT_ID).count()).resolves.toBe(0);
    await expect(database.projectAssetLibraryImports.where("projectId").equals(DEMO_PRIMARY_PROJECT_ID).count()).resolves.toBe(0);
    await expect(database.assetLibraries.get(asEntityId<AssetLibraryId>("library_checkout-default"))).resolves.toBeUndefined();
    await expect(database.sharingLinks.get(asEntityId<SharingLinkId>("share_project_checkout"))).resolves.toBeUndefined();

    const deleteFolderResult = await repository.deleteProjectFolder(
      asEntityId<ProjectFolderId>("folder_platform-kits")
    );
    expect(deleteFolderResult.isOk()).toBe(true);
    await expect(database.folders.get(asEntityId<ProjectFolderId>("folder_platform-kits"))).resolves.toBeUndefined();
    await expect(database.folders.get(asEntityId<ProjectFolderId>("folder_onboarding"))).resolves.toBeUndefined();
    await expect(database.projects.get(asEntityId("project_onboarding"))).resolves.toBeUndefined();
    await expect(database.folderAccess.where("folderId").equals("folder_platform-kits").count()).resolves.toBe(0);
  });

  it("looks up seeded share links by route token", async () => {
    const repository = await createSeededRepository();

    const result = await repository.lookupSharingLink("project-checkout");

    expect(result.isOk()).toBe(true);
    if (result.isErr()) {
      return;
    }

    expect(result.value).toMatchObject({
      id: "share_project_checkout",
      target: { kind: "project", projectId: DEMO_PRIMARY_PROJECT_ID },
      createdByUserId: DEMO_USER_ID,
      url: "https://vibra.local/share/project-checkout"
    });
  });

  it("generates share links for projects, events, and matrix entries", async () => {
    const repository = await createSeededRepository();

    const projectLinkResult = await repository.generateSharingLink({
      target: { kind: "project", projectId: DEMO_PRIMARY_PROJECT_ID },
      createdByUserId: DEMO_USER_ID
    });
    const eventLinkResult = await repository.generateSharingLink({
      target: { kind: "event", eventId: asEntityId<EventId>("event_ios-pay-now") },
      createdByUserId: DEMO_USER_ID
    });
    const matrixLinkResult = await repository.generateSharingLink({
      target: {
        kind: "collisionMatrixEntry",
        collisionMatrixEntryId: asEntityId("matrix-entry_pay-now_card-declined")
      },
      createdByUserId: DEMO_USER_ID
    });

    expect(projectLinkResult.isOk()).toBe(true);
    expect(eventLinkResult.isOk()).toBe(true);
    expect(matrixLinkResult.isOk()).toBe(true);
    if (projectLinkResult.isErr() || eventLinkResult.isErr() || matrixLinkResult.isErr() || !database) {
      return;
    }

    expect(projectLinkResult.value.url).toBe(`https://vibra.local/share/${projectLinkResult.value.id}`);
    expect(eventLinkResult.value.target.kind).toBe("event");
    expect(matrixLinkResult.value.target.kind).toBe("collisionMatrixEntry");

    const generatedToken = projectLinkResult.value.url.split("/").at(-1);
    expect(generatedToken).toBe(projectLinkResult.value.id);
    await expect(database.sharingLinks.get(projectLinkResult.value.id)).resolves.toMatchObject({
      target: { kind: "project", projectId: DEMO_PRIMARY_PROJECT_ID }
    });

    const lookupResult = await repository.lookupSharingLink(projectLinkResult.value.id);
    expect(lookupResult.isOk()).toBe(true);
    if (lookupResult.isErr()) {
      return;
    }
    expect(lookupResult.value.id).toBe(projectLinkResult.value.id);
  });

  it("rejects invalid share link generation and lookup", async () => {
    const repository = await createSeededRepository();

    const missingCreatorResult = await repository.generateSharingLink({
      target: { kind: "project", projectId: DEMO_PRIMARY_PROJECT_ID },
      createdByUserId: asEntityId("user_missing")
    });

    expect(missingCreatorResult.isErr()).toBe(true);
    if (missingCreatorResult.isOk()) {
      return;
    }
    expect(missingCreatorResult.error.kind).toBe("not-found");
    expect(missingCreatorResult.error.details?.entity).toBe("User");

    const missingTargetResult = await repository.generateSharingLink({
      target: { kind: "event", eventId: asEntityId<EventId>("event_missing") },
      createdByUserId: DEMO_USER_ID
    });

    expect(missingTargetResult.isErr()).toBe(true);
    if (missingTargetResult.isOk()) {
      return;
    }
    expect(missingTargetResult.error.kind).toBe("not-found");
    expect(missingTargetResult.error.details?.entity).toBe("Event");

    const missingLookupResult = await repository.lookupSharingLink("missing-token");
    expect(missingLookupResult.isErr()).toBe(true);
    if (missingLookupResult.isOk()) {
      return;
    }
    expect(missingLookupResult.error.kind).toBe("not-found");
    expect(missingLookupResult.error.details?.entity).toBe("SharingLink");

    const invalidTokenResult = await repository.lookupSharingLink("");
    expect(invalidTokenResult.isErr()).toBe(true);
    if (invalidTokenResult.isOk()) {
      return;
    }
    expect(invalidTokenResult.error.kind).toBe("validation");
  });

  it("validates IndexedDB records before returning aggregate reads", async () => {
    const repository = await createSeededRepository();

    if (!database) {
      return;
    }

    await database.projects.put({
      id: DEMO_PRIMARY_PROJECT_ID,
      folderId: asEntityId<ProjectFolderId>("folder_checkout-experience"),
      defaultAssetLibraryId: asEntityId<AssetLibraryId>("library_checkout-default"),
      createdAt: asISODateString("2026-07-03T12:00:00.000Z")
    } as never);

    const result = await repository.loadProjectWorkspace(DEMO_PRIMARY_PROJECT_ID);

    expect(result.isErr()).toBe(true);
    if (result.isOk()) {
      return;
    }
    expect(result.error.kind).toBe("persistence");
  });

  it("converts unknown persistence failures into persistence errors", async () => {
    const repository = await createSeededRepository();

    if (!database) {
      return;
    }

    database.close();

    const result = await repository.loadProjectTree(DEMO_USER_ID);

    expect(result.isErr()).toBe(true);
    if (result.isOk()) {
      return;
    }
    expect(result.error.kind).toBe("persistence");
  });

  it("creates a project in a folder that already contains child folders", async () => {
    const repository = await createSeededRepository();

    const result = await repository.createProject({
      folderId: asEntityId<ProjectFolderId>("folder_mobile-systems"),
      name: "Root Mixed Project"
    });

    expect(result.isOk()).toBe(true);
    if (result.isErr()) {
      return;
    }

    expect(result.value.project.name).toBe("Root Mixed Project");
    expect(result.value.project.folderId).toBe(asEntityId<ProjectFolderId>("folder_mobile-systems"));
  });

  it("creates and loads a root-level project", async () => {
    const repository = await createSeededRepository();

    const result = await repository.createProject({
      folderId: null,
      name: "Root Feedback System"
    });

    expect(result.isOk()).toBe(true);
    if (result.isErr()) {
      return;
    }

    expect(result.value.project.folderId).toBeNull();

    const treeResult = await repository.loadProjectTree(DEMO_USER_ID);
    expect(treeResult.isOk()).toBe(true);
    if (treeResult.isErr()) {
      return;
    }

    expect(treeResult.value.rootProjects.map((project) => project.name)).toContain("Root Feedback System");

    const workspaceResult = await repository.loadProjectWorkspace(result.value.project.id);
    expect(workspaceResult.isOk()).toBe(true);
    if (workspaceResult.isErr()) {
      return;
    }

    expect(workspaceResult.value.folder).toBeNull();
  });
});
