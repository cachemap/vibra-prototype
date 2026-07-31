import type { VibraDatabase } from "./db";
import type {
  Asset,
  AssetBlob,
  AssetLibrary,
  AssetLibraryFolder,
  Collection,
  CollisionMatrix,
  CollisionMatrixColumn,
  CollisionMatrixEntry,
  CollisionMatrixRow,
  Device,
  Event,
  EventTrigger,
  FolderAccess,
  Platform,
  Project,
  ProjectAssetLibraryImport,
  ProjectFolder,
  SharingLink,
  Trigger,
  TriggerPlayback,
  User
} from "../domain/entities";
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
  type EntityId,
  type PlatformId,
  type ProjectFolderId,
  type ProjectId,
  type SharingLinkId,
  type TriggerId,
  type TriggerPlaybackId,
  type UserId
} from "../domain/ids";

export interface DemoSeedData {
  users: User[];
  folders: ProjectFolder[];
  folderAccess: FolderAccess[];
  projects: Project[];
  platforms: Platform[];
  devices: Device[];
  collisionMatrices: CollisionMatrix[];
  collisionMatrixRows: CollisionMatrixRow[];
  collisionMatrixColumns: CollisionMatrixColumn[];
  collisionMatrixEntries: CollisionMatrixEntry[];
  collections: Collection[];
  events: Event[];
  triggers: Trigger[];
  eventTriggers: EventTrigger[];
  triggerPlaybacks: TriggerPlayback[];
  assetLibraries: AssetLibrary[];
  projectAssetLibraryImports: ProjectAssetLibraryImport[];
  assetLibraryFolders: AssetLibraryFolder[];
  assets: Asset[];
  assetBlobs: AssetBlob[];
  sharingLinks: SharingLink[];
}

export const DEMO_USER_ID = asEntityId<UserId>("user_dillon");
export const DEMO_PRIMARY_PROJECT_ID = asEntityId<ProjectId>("project_checkout-system");
export const DEMO_SECONDARY_PROJECT_ID = asEntityId<ProjectId>("project_onboarding-kit");

const createdAt = asISODateString("2026-07-01T16:00:00.000Z");
const updatedAt = asISODateString("2026-07-08T18:30:00.000Z");
const uploadedAt = asISODateString("2026-07-03T12:00:00.000Z");

const id = <Id extends EntityId>(value: string) => asEntityId<Id>(value);

const tinyWavBlob = () =>
  new Blob(
    [
      new Uint8Array([
        0x52, 0x49, 0x46, 0x46, 0x2c, 0x00, 0x00, 0x00, 0x57, 0x41, 0x56, 0x45,
        0x66, 0x6d, 0x74, 0x20, 0x10, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
        0x44, 0xac, 0x00, 0x00, 0x88, 0x58, 0x01, 0x00, 0x02, 0x00, 0x10, 0x00,
        0x64, 0x61, 0x74, 0x61, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff, 0x7f,
        0x00, 0x00, 0x01, 0x80
      ])
    ],
    { type: "audio/wav" }
  );

const tinyAhapBlob = () =>
  new Blob(
    [
      JSON.stringify({
        Version: 1,
        Pattern: [
          {
            Event: {
              Time: 0,
              EventType: "HapticTransient",
              EventParameters: []
            }
          }
        ]
      })
    ],
    { type: "application/json" }
  );

const createSeedAssetBlob = (
  assetId: AssetId,
  blob: Blob,
  contentType: string
): AssetBlob => ({
  assetId,
  blob,
  contentType,
  size: blob.size,
  storedAt: uploadedAt
});

export const buildDemoSeedData = (): DemoSeedData => {
  const platforms: Platform[] = [
    { id: id<PlatformId>("platform_ios"), name: "iOS" },
    { id: id<PlatformId>("platform_windows"), name: "Windows" },
    { id: id<PlatformId>("platform_mac"), name: "Mac" },
    { id: id<PlatformId>("platform_linux"), name: "Linux" },
    { id: id<PlatformId>("platform_android"), name: "Android" }
  ];

  const triggers: Trigger[] = [
    { id: id<TriggerId>("trigger_on-hover"), name: "onHover" },
    { id: id<TriggerId>("trigger_on-press"), name: "onPress" },
    { id: id<TriggerId>("trigger_on-release"), name: "onRelease" },
    { id: id<TriggerId>("trigger_on-hold"), name: "onHold" }
  ];

  const folders: ProjectFolder[] = [
    {
      id: id<ProjectFolderId>("folder_mobile-systems"),
      parentFolderId: null,
      name: "Mobile App Systems",
      createdAt
    },
    {
      id: id<ProjectFolderId>("folder_checkout"),
      parentFolderId: id<ProjectFolderId>("folder_mobile-systems"),
      name: "Checkout Experience",
      createdAt
    },
    {
      id: id<ProjectFolderId>("folder_empty-explorations"),
      parentFolderId: id<ProjectFolderId>("folder_mobile-systems"),
      name: "Empty Explorations",
      createdAt
    },
    {
      id: id<ProjectFolderId>("folder_platform-kits"),
      parentFolderId: null,
      name: "Shared Platform Kits",
      createdAt
    },
    {
      id: id<ProjectFolderId>("folder_onboarding"),
      parentFolderId: id<ProjectFolderId>("folder_platform-kits"),
      name: "Onboarding",
      createdAt
    }
  ];

  const projects: Project[] = [
    {
      id: DEMO_PRIMARY_PROJECT_ID,
      folderId: id<ProjectFolderId>("folder_checkout"),
      defaultAssetLibraryId: id<AssetLibraryId>("library_checkout-default"),
      name: "Checkout Feedback System",
      createdAt
    },
    {
      id: DEMO_SECONDARY_PROJECT_ID,
      folderId: id<ProjectFolderId>("folder_onboarding"),
      defaultAssetLibraryId: id<AssetLibraryId>("library_onboarding-default"),
      name: "Onboarding Motion Kit",
      createdAt
    }
  ];

  const assetLibraries: AssetLibrary[] = [
    {
      id: id<AssetLibraryId>("library_checkout-default"),
      name: "Checkout Feedback System Default",
      defaultForProjectId: DEMO_PRIMARY_PROJECT_ID
    },
    {
      id: id<AssetLibraryId>("library_onboarding-default"),
      name: "Onboarding Motion Kit Default",
      defaultForProjectId: DEMO_SECONDARY_PROJECT_ID
    },
    {
      id: id<AssetLibraryId>("library_shared-brand"),
      name: "Shared Brand Feedback",
      defaultForProjectId: null
    }
  ];

  const assetLibraryFolders: AssetLibraryFolder[] = [
    {
      id: id<AssetLibraryFolderId>("folder_library-checkout-root"),
      libraryId: id<AssetLibraryId>("library_checkout-default"),
      parentFolderId: null,
      name: "Checkout Feedback System",
      icon: "folder"
    },
    {
      id: id<AssetLibraryFolderId>("folder_library-checkout-confirmation"),
      libraryId: id<AssetLibraryId>("library_checkout-default"),
      parentFolderId: id<AssetLibraryFolderId>("folder_library-checkout-root"),
      name: "Confirmation",
      icon: "check-circle"
    },
    {
      id: id<AssetLibraryFolderId>("folder_library-checkout-alerts"),
      libraryId: id<AssetLibraryId>("library_checkout-default"),
      parentFolderId: id<AssetLibraryFolderId>("folder_library-checkout-root"),
      name: "Alerts",
      icon: "bell"
    },
    {
      id: id<AssetLibraryFolderId>("folder_library-onboarding-root"),
      libraryId: id<AssetLibraryId>("library_onboarding-default"),
      parentFolderId: null,
      name: "Onboarding Motion Kit",
      icon: "folder"
    },
    {
      id: id<AssetLibraryFolderId>("folder_library-onboarding-prompts"),
      libraryId: id<AssetLibraryId>("library_onboarding-default"),
      parentFolderId: id<AssetLibraryFolderId>("folder_library-onboarding-root"),
      name: "Prompts",
      icon: "sparkles"
    },
    {
      id: id<AssetLibraryFolderId>("folder_library-shared-root"),
      libraryId: id<AssetLibraryId>("library_shared-brand"),
      parentFolderId: null,
      name: "Shared Brand Feedback",
      icon: "folder"
    },
    {
      id: id<AssetLibraryFolderId>("folder_library-shared-navigation"),
      libraryId: id<AssetLibraryId>("library_shared-brand"),
      parentFolderId: id<AssetLibraryFolderId>("folder_library-shared-root"),
      name: "Navigation",
      icon: "mouse-pointer-click"
    }
  ];

  const assets: Asset[] = [
    {
      id: id<AssetId>("asset_checkout-success-audio"),
      libraryId: id<AssetLibraryId>("library_checkout-default"),
      folderId: id<AssetLibraryFolderId>("folder_library-checkout-confirmation"),
      name: "Success Chime",
      assetId: "asset-checkout-success-audio",
      mediaKind: "audio",
      originalFilename: "success-chime.wav",
      uploadedAt,
      playbackUrl: "https://vibra.local/assets/success-chime.wav"
    },
    {
      id: id<AssetId>("asset_checkout-success-haptic"),
      libraryId: id<AssetLibraryId>("library_checkout-default"),
      folderId: id<AssetLibraryFolderId>("folder_library-checkout-confirmation"),
      name: "Success Tap",
      assetId: "asset-checkout-success-haptic",
      mediaKind: "haptic",
      originalFilename: "success-tap.ahap",
      uploadedAt,
      playbackUrl: "https://vibra.local/assets/success-tap.ahap"
    },
    {
      id: id<AssetId>("asset_checkout-warning-audio"),
      libraryId: id<AssetLibraryId>("library_checkout-default"),
      folderId: id<AssetLibraryFolderId>("folder_library-checkout-alerts"),
      name: "Warning Pulse",
      assetId: "asset-checkout-warning-audio",
      mediaKind: "audio",
      originalFilename: "warning-pulse.wav",
      uploadedAt,
      playbackUrl: "https://vibra.local/assets/warning-pulse.wav"
    },
    {
      id: id<AssetId>("asset_onboarding-soft-haptic"),
      libraryId: id<AssetLibraryId>("library_onboarding-default"),
      folderId: id<AssetLibraryFolderId>("folder_library-onboarding-prompts"),
      name: "Soft Prompt",
      assetId: "asset-onboarding-soft-haptic",
      mediaKind: "haptic",
      originalFilename: "soft-prompt.ahap",
      uploadedAt,
      playbackUrl: "https://vibra.local/assets/soft-prompt.ahap"
    },
    {
      id: id<AssetId>("asset_shared-nav-click"),
      libraryId: id<AssetLibraryId>("library_shared-brand"),
      folderId: id<AssetLibraryFolderId>("folder_library-shared-navigation"),
      name: "Navigation Click",
      assetId: "asset-shared-nav-click",
      mediaKind: "audio",
      originalFilename: "navigation-click.wav",
      uploadedAt,
      playbackUrl: "https://vibra.local/assets/navigation-click.wav"
    }
  ];

  const assetBlobs: AssetBlob[] = [
    createSeedAssetBlob(id<AssetId>("asset_checkout-success-audio"), tinyWavBlob(), "audio/wav"),
    createSeedAssetBlob(id<AssetId>("asset_checkout-success-haptic"), tinyAhapBlob(), "application/json"),
    createSeedAssetBlob(id<AssetId>("asset_checkout-warning-audio"), tinyWavBlob(), "audio/wav"),
    createSeedAssetBlob(id<AssetId>("asset_onboarding-soft-haptic"), tinyAhapBlob(), "application/json"),
    createSeedAssetBlob(id<AssetId>("asset_shared-nav-click"), tinyWavBlob(), "audio/wav")
  ];

  const devices: Device[] = [
    {
      id: id<DeviceId>("device_checkout-ios-16-pro"),
      projectId: DEMO_PRIMARY_PROJECT_ID,
      platformId: id<PlatformId>("platform_ios"),
      name: "iPhone 16 Pro",
      createdAt,
      updatedAt,
      isEnabled: true
    },
    {
      id: id<DeviceId>("device_checkout-android-pixel"),
      projectId: DEMO_PRIMARY_PROJECT_ID,
      platformId: id<PlatformId>("platform_android"),
      name: "Pixel 9",
      createdAt,
      updatedAt,
      isEnabled: true
    },
    {
      id: id<DeviceId>("device_checkout-windows-disabled"),
      projectId: DEMO_PRIMARY_PROJECT_ID,
      platformId: id<PlatformId>("platform_windows"),
      name: "Windows Touch Preview",
      createdAt,
      updatedAt,
      isEnabled: false
    }
  ];

  const collisionMatrices: CollisionMatrix[] = [
    { id: id<CollisionMatrixId>("matrix_checkout-ios"), deviceId: id<DeviceId>("device_checkout-ios-16-pro") },
    { id: id<CollisionMatrixId>("matrix_checkout-android"), deviceId: id<DeviceId>("device_checkout-android-pixel") },
    {
      id: id<CollisionMatrixId>("matrix_checkout-windows-disabled"),
      deviceId: id<DeviceId>("device_checkout-windows-disabled")
    }
  ];

  const collections: Collection[] = [
    {
      id: id<CollectionId>("collection_ios-checkout-actions"),
      deviceId: id<DeviceId>("device_checkout-ios-16-pro"),
      name: "Checkout Actions"
    },
    {
      id: id<CollectionId>("collection_ios-system-messaging"),
      deviceId: id<DeviceId>("device_checkout-ios-16-pro"),
      name: "System Messaging"
    },
    {
      id: id<CollectionId>("collection_android-checkout-actions"),
      deviceId: id<DeviceId>("device_checkout-android-pixel"),
      name: "Android Checkout Actions"
    }
  ];

  const events: Event[] = [
    {
      id: id<EventId>("event_ios-pay-now"),
      collectionId: id<CollectionId>("collection_ios-checkout-actions"),
      name: "Pay Now",
      eventType: "Button",
      sortOrder: 0
    },
    {
      id: id<EventId>("event_ios-save-card"),
      collectionId: id<CollectionId>("collection_ios-checkout-actions"),
      name: "Save Card",
      eventType: "Toggle",
      sortOrder: 1
    },
    {
      id: id<EventId>("event_ios-card-declined"),
      collectionId: id<CollectionId>("collection_ios-system-messaging"),
      name: "Card Declined",
      eventType: "Banner",
      sortOrder: 0
    },
    {
      id: id<EventId>("event_ios-payment-complete"),
      collectionId: id<CollectionId>("collection_ios-system-messaging"),
      name: "Payment Complete",
      eventType: "Toast",
      sortOrder: 1
    },
    {
      id: id<EventId>("event_android-pay-now"),
      collectionId: id<CollectionId>("collection_android-checkout-actions"),
      name: "Pay Now",
      eventType: "Button",
      sortOrder: 0
    }
  ];

  const eventTriggers: EventTrigger[] = [
    {
      id: id<EventTriggerId>("event-trigger_pay-now-press"),
      eventId: id<EventId>("event_ios-pay-now"),
      triggerId: id<TriggerId>("trigger_on-press"),
      label: "Finger down confirmation",
      isEnabled: true
    },
    {
      id: id<EventTriggerId>("event-trigger_pay-now-release"),
      eventId: id<EventId>("event_ios-pay-now"),
      triggerId: id<TriggerId>("trigger_on-release"),
      label: "Commit success",
      isEnabled: true
    },
    {
      id: id<EventTriggerId>("event-trigger_save-card-hover"),
      eventId: id<EventId>("event_ios-save-card"),
      triggerId: id<TriggerId>("trigger_on-hover"),
      label: "Pointer preview",
      isEnabled: false
    },
    {
      id: id<EventTriggerId>("event-trigger_card-declined-hold"),
      eventId: id<EventId>("event_ios-card-declined"),
      triggerId: id<TriggerId>("trigger_on-hold"),
      label: "Escalated warning",
      isEnabled: true
    },
    {
      id: id<EventTriggerId>("event-trigger_payment-complete-release"),
      eventId: id<EventId>("event_ios-payment-complete"),
      triggerId: id<TriggerId>("trigger_on-release"),
      label: null,
      isEnabled: true
    },
    {
      id: id<EventTriggerId>("event-trigger_android-pay-now-press"),
      eventId: id<EventId>("event_android-pay-now"),
      triggerId: id<TriggerId>("trigger_on-press"),
      label: "Android press",
      isEnabled: true
    }
  ];

  const triggerPlaybacks: TriggerPlayback[] = [
    {
      id: id<TriggerPlaybackId>("playback_pay-now-press-haptic"),
      eventTriggerId: id<EventTriggerId>("event-trigger_pay-now-press"),
      assetId: id<AssetId>("asset_checkout-success-haptic"),
      startOffset: 0
    },
    {
      id: id<TriggerPlaybackId>("playback_pay-now-release-audio"),
      eventTriggerId: id<EventTriggerId>("event-trigger_pay-now-release"),
      assetId: id<AssetId>("asset_checkout-success-audio"),
      startOffset: 0
    },
    {
      id: id<TriggerPlaybackId>("playback_pay-now-release-haptic"),
      eventTriggerId: id<EventTriggerId>("event-trigger_pay-now-release"),
      assetId: id<AssetId>("asset_checkout-success-haptic"),
      startOffset: 0.3
    },
    {
      id: id<TriggerPlaybackId>("playback_save-card-hover-audio"),
      eventTriggerId: id<EventTriggerId>("event-trigger_save-card-hover"),
      assetId: id<AssetId>("asset_shared-nav-click"),
      startOffset: 0.1
    },
    {
      id: id<TriggerPlaybackId>("playback_card-declined-warning"),
      eventTriggerId: id<EventTriggerId>("event-trigger_card-declined-hold"),
      assetId: id<AssetId>("asset_checkout-warning-audio"),
      startOffset: 0
    },
    {
      id: id<TriggerPlaybackId>("playback_android-pay-now-prompt"),
      eventTriggerId: id<EventTriggerId>("event-trigger_android-pay-now-press"),
      assetId: id<AssetId>("asset_onboarding-soft-haptic"),
      startOffset: 0.2
    }
  ];

  const collisionMatrixRows: CollisionMatrixRow[] = [
    { matrixId: id<CollisionMatrixId>("matrix_checkout-ios"), eventId: id<EventId>("event_ios-pay-now") },
    { matrixId: id<CollisionMatrixId>("matrix_checkout-ios"), eventId: id<EventId>("event_ios-card-declined") },
    { matrixId: id<CollisionMatrixId>("matrix_checkout-ios"), eventId: id<EventId>("event_ios-payment-complete") }
  ];

  const collisionMatrixColumns: CollisionMatrixColumn[] = [
    { matrixId: id<CollisionMatrixId>("matrix_checkout-ios"), eventId: id<EventId>("event_ios-card-declined") },
    { matrixId: id<CollisionMatrixId>("matrix_checkout-ios"), eventId: id<EventId>("event_ios-save-card") },
    { matrixId: id<CollisionMatrixId>("matrix_checkout-ios"), eventId: id<EventId>("event_ios-payment-complete") }
  ];

  const collisionMatrixEntries: CollisionMatrixEntry[] = [
    {
      id: id<CollisionMatrixEntryId>("matrix-entry_pay-now_card-declined"),
      matrixId: id<CollisionMatrixId>("matrix_checkout-ios"),
      playingEventId: id<EventId>("event_ios-pay-now"),
      incomingEventId: id<EventId>("event_ios-card-declined"),
      resolutionBehavior: {
        behaviorName: "Suppress",
        targetEventId: id<EventId>("event_ios-card-declined"),
        postInterruptionRecovery: null,
        systemInterruptionRecovery: "Stay stopped"
      }
    },
    {
      id: id<CollisionMatrixEntryId>("matrix-entry_declined_complete"),
      matrixId: id<CollisionMatrixId>("matrix_checkout-ios"),
      playingEventId: id<EventId>("event_ios-card-declined"),
      incomingEventId: id<EventId>("event_ios-payment-complete"),
      resolutionBehavior: {
        behaviorName: "Queue",
        targetEventId: id<EventId>("event_ios-payment-complete"),
        postInterruptionRecovery: null,
        systemInterruptionRecovery: "Stay stopped"
      }
    },
    {
      id: id<CollisionMatrixEntryId>("matrix-entry_complete_save-card"),
      matrixId: id<CollisionMatrixId>("matrix_checkout-ios"),
      playingEventId: id<EventId>("event_ios-payment-complete"),
      incomingEventId: id<EventId>("event_ios-save-card"),
      resolutionBehavior: {
        behaviorName: "Co-play",
        targetEventId: null,
        postInterruptionRecovery: null,
        systemInterruptionRecovery: "Stay stopped"
      }
    },
    {
      id: id<CollisionMatrixEntryId>("matrix-entry_pay-now_complete"),
      matrixId: id<CollisionMatrixId>("matrix_checkout-ios"),
      playingEventId: id<EventId>("event_ios-pay-now"),
      incomingEventId: id<EventId>("event_ios-payment-complete"),
      resolutionBehavior: {
        behaviorName: "Preempt",
        targetEventId: id<EventId>("event_ios-pay-now"),
        postInterruptionRecovery: "Stay stopped",
        systemInterruptionRecovery: "Stay stopped"
      }
    },
    {
      id: id<CollisionMatrixEntryId>("matrix-entry_declined_save-card"),
      matrixId: id<CollisionMatrixId>("matrix_checkout-ios"),
      playingEventId: id<EventId>("event_ios-card-declined"),
      incomingEventId: id<EventId>("event_ios-save-card"),
      resolutionBehavior: {
        behaviorName: "Not possible",
        targetEventId: null,
        postInterruptionRecovery: null,
        systemInterruptionRecovery: null
      }
    }
  ];

  const sharingLinks: SharingLink[] = [
    {
      id: id<SharingLinkId>("share_project_checkout"),
      target: { kind: "project", projectId: DEMO_PRIMARY_PROJECT_ID },
      createdByUserId: DEMO_USER_ID,
      url: "https://vibra.local/share/project-checkout"
    },
    {
      id: id<SharingLinkId>("share_event_pay-now"),
      target: { kind: "event", eventId: id<EventId>("event_ios-pay-now") },
      createdByUserId: DEMO_USER_ID,
      url: "https://vibra.local/share/event-pay-now"
    },
    {
      id: id<SharingLinkId>("share_matrix_pay-now-card-declined"),
      target: {
        kind: "collisionMatrixEntry",
        collisionMatrixEntryId: id<CollisionMatrixEntryId>("matrix-entry_pay-now_card-declined")
      },
      createdByUserId: DEMO_USER_ID,
      url: "https://vibra.local/share/matrix-pay-now-card-declined"
    }
  ];

  return {
    users: [{ id: DEMO_USER_ID, preferredName: "Dillon" }],
    folders,
    folderAccess: [
      { userId: DEMO_USER_ID, folderId: id<ProjectFolderId>("folder_mobile-systems") },
      { userId: DEMO_USER_ID, folderId: id<ProjectFolderId>("folder_platform-kits") }
    ],
    projects,
    platforms,
    devices,
    collisionMatrices,
    collisionMatrixRows,
    collisionMatrixColumns,
    collisionMatrixEntries,
    collections,
    events,
    triggers,
    eventTriggers,
    triggerPlaybacks,
    assetLibraries,
    projectAssetLibraryImports: [
      {
        projectId: DEMO_PRIMARY_PROJECT_ID,
        assetLibraryId: id<AssetLibraryId>("library_shared-brand")
      },
      {
        projectId: DEMO_PRIMARY_PROJECT_ID,
        assetLibraryId: id<AssetLibraryId>("library_onboarding-default")
      }
    ],
    assetLibraryFolders,
    assets,
    assetBlobs,
    sharingLinks
  };
};

export const writeDemoSeedData = async (
  database: VibraDatabase,
  seedData = buildDemoSeedData()
): Promise<void> => {
  await database.users.bulkAdd(seedData.users);
  await database.folders.bulkAdd(seedData.folders);
  await database.folderAccess.bulkAdd(seedData.folderAccess);
  await database.projects.bulkAdd(seedData.projects);
  await database.platforms.bulkAdd(seedData.platforms);
  await database.devices.bulkAdd(seedData.devices);
  await database.collisionMatrices.bulkAdd(seedData.collisionMatrices);
  await database.collections.bulkAdd(seedData.collections);
  await database.events.bulkAdd(seedData.events);
  await database.triggers.bulkAdd(seedData.triggers);
  await database.eventTriggers.bulkAdd(seedData.eventTriggers);
  await database.triggerPlaybacks.bulkAdd(seedData.triggerPlaybacks);
  await database.assetLibraries.bulkAdd(seedData.assetLibraries);
  await database.projectAssetLibraryImports.bulkAdd(seedData.projectAssetLibraryImports);
  await database.assetLibraryFolders.bulkAdd(seedData.assetLibraryFolders);
  await database.assets.bulkAdd(seedData.assets);
  await database.assetBlobs.bulkAdd(seedData.assetBlobs);
  await database.collisionMatrixRows.bulkAdd(seedData.collisionMatrixRows);
  await database.collisionMatrixColumns.bulkAdd(seedData.collisionMatrixColumns);
  await database.collisionMatrixEntries.bulkAdd(seedData.collisionMatrixEntries);
  await database.sharingLinks.bulkAdd(seedData.sharingLinks);
};

export const seedDemoDataIfEmpty = async (
  database: VibraDatabase
): Promise<{ seeded: boolean }> => {
  const userCount = await database.users.count();

  if (userCount > 0) {
    return { seeded: false };
  }

  await database.transaction("rw", database.tables, async () => {
    await writeDemoSeedData(database);
  });

  return { seeded: true };
};
