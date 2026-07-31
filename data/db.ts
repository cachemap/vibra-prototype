import Dexie, { type Table } from "dexie";

import { resolutionBehaviorNames } from "../domain/enums";
import { normalizeResolutionBehavior } from "../domain/rules/matrix";
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
import type {
  AssetId,
  AssetLibraryFolderId,
  AssetLibraryId,
  CollectionId,
  CollisionMatrixEntryId,
  CollisionMatrixId,
  DeviceId,
  EventId,
  EventTriggerId,
  PlatformId,
  ProjectFolderId,
  ProjectId,
  SharingLinkId,
  TriggerId,
  TriggerPlaybackId,
  UserId
} from "../domain/ids";

export const VIBRA_DATABASE_NAME = "vibra-prototype";
export const VIBRA_DATABASE_VERSION = 4;

export const vibraStoresV1 = {
  users: "id",
  folders: "id, parentFolderId, createdAt",
  folderAccess: "[userId+folderId], userId, folderId",
  projects: "id, folderId, defaultAssetLibraryId, createdAt",
  platforms: "id, name",
  devices: "id, projectId, platformId, [projectId+platformId+name], isEnabled",
  collisionMatrices: "id, deviceId",
  collisionMatrixRows: "[matrixId+eventId], matrixId, eventId",
  collisionMatrixColumns: "[matrixId+eventId], matrixId, eventId",
  collisionMatrixEntries: "id, matrixId, [matrixId+playingEventId+incomingEventId]",
  collections: "id, deviceId, name",
  events: "id, collectionId, eventType, name",
  triggers: "id, name",
  eventTriggers: "id, eventId, triggerId, [eventId+triggerId], isEnabled",
  triggerPlaybacks: "id, eventTriggerId, assetId, startOffset",
  assetLibraries: "id, name, defaultForProjectId",
  projectAssetLibraryImports: "[projectId+assetLibraryId], projectId, assetLibraryId",
  assetLibraryFolders: "id, libraryId, parentFolderId",
  assets: "id, libraryId, folderId, mediaKind, uploadedAt",
  sharingLinks:
    "id, target.kind, target.projectId, target.eventId, target.collisionMatrixEntryId, createdByUserId, url"
} as const;

export const vibraStoresV2 = {
  ...vibraStoresV1,
  assetBlobs: "assetId, contentType, storedAt"
} as const;

export const vibraStoresV3 = {
  ...vibraStoresV2,
  events: "id, collectionId, eventType, name, [collectionId+sortOrder]"
} as const;

export const vibraStores = vibraStoresV3;

type LegacyEventRecord = Omit<Event, "sortOrder"> & { sortOrder?: number };
type LegacyCollisionMatrixEntryRecord = Omit<CollisionMatrixEntry, "resolutionBehavior"> & {
  resolutionBehavior?: {
    behaviorName?: CollisionMatrixEntry["resolutionBehavior"]["behaviorName"];
    targetEventId?: EventId | null;
  } | null;
};

const sortLegacyEventsForMigration = (events: LegacyEventRecord[]) =>
  events.sort(
    (first, second) =>
      first.name.localeCompare(second.name) || first.id.localeCompare(second.id)
  );

const migrateEventSortOrders = async (eventsTable: Table<LegacyEventRecord, EventId>) => {
  const events = await eventsTable.toArray();
  const eventsByCollection = new Map<CollectionId, LegacyEventRecord[]>();

  for (const event of events) {
    const siblings = eventsByCollection.get(event.collectionId) ?? [];
    siblings.push(event);
    eventsByCollection.set(event.collectionId, siblings);
  }

  const migratedEvents = [...eventsByCollection.values()].flatMap((siblings) =>
    sortLegacyEventsForMigration(siblings).map((event, sortOrder) => ({
      ...event,
      sortOrder
    }))
  );

  if (migratedEvents.length > 0) {
    await eventsTable.bulkPut(migratedEvents);
  }
};

const normalizeLegacyResolutionBehavior = (
  entry: LegacyCollisionMatrixEntryRecord
): LegacyCollisionMatrixEntryRecord & {
  resolutionBehavior: NonNullable<LegacyCollisionMatrixEntryRecord["resolutionBehavior"]>;
} => {
  const behaviorName = resolutionBehaviorNames.includes(
    entry.resolutionBehavior?.behaviorName as CollisionMatrixEntry["resolutionBehavior"]["behaviorName"]
  )
    ? (entry.resolutionBehavior?.behaviorName as CollisionMatrixEntry["resolutionBehavior"]["behaviorName"])
    : "Preempt";
  const legacyTargetEventId = entry.resolutionBehavior?.targetEventId ?? null;

  if (behaviorName === "Co-play" || behaviorName === "Not possible") {
    return {
      ...entry,
      resolutionBehavior: {
        behaviorName,
        targetEventId: null
      }
    };
  }

  if (behaviorName === "Queue") {
    return {
      ...entry,
      resolutionBehavior: {
        behaviorName,
        targetEventId: legacyTargetEventId ?? entry.incomingEventId
      }
    };
  }

  if (behaviorName === "Suppress") {
    return {
      ...entry,
      resolutionBehavior: {
        behaviorName,
        targetEventId: legacyTargetEventId ?? entry.incomingEventId
      }
    };
  }

  return {
    ...entry,
    resolutionBehavior: {
      behaviorName,
      targetEventId: legacyTargetEventId ?? entry.playingEventId
    }
  };
};

const migrateLegacyCollisionResolutionBehaviors = async (
  entriesTable: Table<LegacyCollisionMatrixEntryRecord, CollisionMatrixEntryId>
) => {
  const entries = await entriesTable.toArray();

  if (entries.length > 0) {
    await entriesTable.bulkPut(entries.map(normalizeLegacyResolutionBehavior));
  }
};

type Version3CollisionMatrixEntryRecord = Omit<CollisionMatrixEntry, "resolutionBehavior"> & {
  resolutionBehavior?: Partial<CollisionMatrixEntry["resolutionBehavior"]> | null;
};

const migrateResolutionBehaviorRecoveries = async (
  entriesTable: Table<Version3CollisionMatrixEntryRecord, CollisionMatrixEntryId>
) => {
  const entries = await entriesTable.toArray();

  if (entries.length > 0) {
    await entriesTable.bulkPut(
      entries.map((entry) => ({
        ...entry,
        resolutionBehavior: normalizeResolutionBehavior(entry.resolutionBehavior, entry)
      }))
    );
  }
};

export class VibraDatabase extends Dexie {
  users!: Table<User, UserId>;
  folders!: Table<ProjectFolder, ProjectFolderId>;
  folderAccess!: Table<FolderAccess, [UserId, ProjectFolderId]>;
  projects!: Table<Project, ProjectId>;
  platforms!: Table<Platform, PlatformId>;
  devices!: Table<Device, DeviceId>;
  collisionMatrices!: Table<CollisionMatrix, CollisionMatrixId>;
  collisionMatrixRows!: Table<CollisionMatrixRow, [CollisionMatrixId, EventId]>;
  collisionMatrixColumns!: Table<CollisionMatrixColumn, [CollisionMatrixId, EventId]>;
  collisionMatrixEntries!: Table<CollisionMatrixEntry, CollisionMatrixEntryId>;
  collections!: Table<Collection, CollectionId>;
  events!: Table<Event, EventId>;
  triggers!: Table<Trigger, TriggerId>;
  eventTriggers!: Table<EventTrigger, EventTriggerId>;
  triggerPlaybacks!: Table<TriggerPlayback, TriggerPlaybackId>;
  assetLibraries!: Table<AssetLibrary, AssetLibraryId>;
  projectAssetLibraryImports!: Table<ProjectAssetLibraryImport, [ProjectId, AssetLibraryId]>;
  assetLibraryFolders!: Table<AssetLibraryFolder, AssetLibraryFolderId>;
  assets!: Table<Asset, AssetId>;
  assetBlobs!: Table<AssetBlob, AssetId>;
  sharingLinks!: Table<SharingLink, SharingLinkId>;

  constructor(name = VIBRA_DATABASE_NAME) {
    super(name);

    this.version(1).stores(vibraStoresV1);
    this.version(2).stores(vibraStoresV2);
    this.version(3)
      .stores(vibraStoresV3)
      .upgrade(async (transaction) => {
        await migrateEventSortOrders(
          transaction.table("events") as Table<LegacyEventRecord, EventId>
        );
        await migrateLegacyCollisionResolutionBehaviors(
          transaction.table("collisionMatrixEntries") as Table<
            LegacyCollisionMatrixEntryRecord,
            CollisionMatrixEntryId
          >
        );
      });
    this.version(4)
      .stores(vibraStores)
      .upgrade(async (transaction) => {
        await migrateResolutionBehaviorRecoveries(
          transaction.table("collisionMatrixEntries") as Table<
            Version3CollisionMatrixEntryRecord,
            CollisionMatrixEntryId
          >
        );
      });
  }
}

export const createVibraDatabase = (name?: string) => new VibraDatabase(name);

export const db = createVibraDatabase();
