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
  ISODateString,
  PlatformId,
  ProjectFolderId,
  ProjectId,
  SharingLinkId,
  TriggerId,
  TriggerPlaybackId,
  UserId
} from "./ids";
import type { EventType, MediaKind, PlatformName, ResolutionBehaviorName, TriggerName } from "./enums";

export interface User {
  id: UserId;
  preferredName: string;
}

export interface ProjectFolder {
  id: ProjectFolderId;
  parentFolderId: ProjectFolderId | null;
  name: string;
  createdAt: ISODateString;
}

export interface FolderAccess {
  userId: UserId;
  folderId: ProjectFolderId;
}

export interface Project {
  id: ProjectId;
  folderId: ProjectFolderId | null;
  defaultAssetLibraryId: AssetLibraryId;
  name: string;
  createdAt: ISODateString;
}

export interface Platform {
  id: PlatformId;
  name: PlatformName;
}

export interface Device {
  id: DeviceId;
  projectId: ProjectId;
  platformId: PlatformId;
  name: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  isEnabled: boolean;
}

export interface CollisionMatrix {
  id: CollisionMatrixId;
  deviceId: DeviceId;
}

export interface CollisionMatrixRow {
  matrixId: CollisionMatrixId;
  eventId: EventId;
}

export interface CollisionMatrixColumn {
  matrixId: CollisionMatrixId;
  eventId: EventId;
}

export interface ResolutionBehavior {
  behaviorName: ResolutionBehaviorName;
  targetEventId: EventId | null;
}

export interface CollisionMatrixEntry {
  id: CollisionMatrixEntryId;
  matrixId: CollisionMatrixId;
  playingEventId: EventId;
  incomingEventId: EventId;
  resolutionBehavior: ResolutionBehavior;
}

export interface Collection {
  id: CollectionId;
  deviceId: DeviceId;
  name: string;
}

export interface Event {
  id: EventId;
  collectionId: CollectionId;
  name: string;
  eventType: EventType;
  sortOrder: number;
}

export interface Trigger {
  id: TriggerId;
  name: TriggerName;
}

export interface EventTrigger {
  id: EventTriggerId;
  eventId: EventId;
  triggerId: TriggerId;
  label: string | null;
  isEnabled: boolean;
}

export interface TriggerPlayback {
  id: TriggerPlaybackId;
  eventTriggerId: EventTriggerId;
  assetId: AssetId;
  startOffset: number;
}

export type ShareTarget =
  | { kind: "project"; projectId: ProjectId }
  | { kind: "event"; eventId: EventId }
  | { kind: "collisionMatrixEntry"; collisionMatrixEntryId: CollisionMatrixEntryId };

export interface SharingLink {
  id: SharingLinkId;
  target: ShareTarget;
  createdByUserId: UserId;
  url: string;
}

export interface AssetLibrary {
  id: AssetLibraryId;
  name: string;
  defaultForProjectId: ProjectId | null;
}

export interface ProjectAssetLibraryImport {
  projectId: ProjectId;
  assetLibraryId: AssetLibraryId;
}

export interface AssetLibraryFolder {
  id: AssetLibraryFolderId;
  libraryId: AssetLibraryId;
  parentFolderId: AssetLibraryFolderId | null;
  name: string;
  icon: string;
}

export interface Asset {
  id: AssetId;
  libraryId: AssetLibraryId;
  folderId: AssetLibraryFolderId;
  name: string;
  assetId: string;
  mediaKind: MediaKind;
  originalFilename: string;
  uploadedAt: ISODateString;
  playbackUrl: string;
}

export interface AssetBlob {
  assetId: AssetId;
  blob: Blob;
  contentType: string;
  size: number;
  storedAt: ISODateString;
}
