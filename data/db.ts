import Dexie, { type Table } from "dexie";

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
export const VIBRA_DATABASE_VERSION = 2;

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

export const vibraStores = {
  ...vibraStoresV1,
  assetBlobs: "assetId, contentType, storedAt"
} as const;

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
    this.version(2).stores(vibraStores);
  }
}

export const createVibraDatabase = (name?: string) => new VibraDatabase(name);

export const db = createVibraDatabase();
