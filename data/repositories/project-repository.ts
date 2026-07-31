import * as v from "valibot";

import type { VibraDatabase } from "../db";
import type {
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
  Asset,
  AssetBlob,
  ProjectAssetLibraryImport,
  Project,
  ProjectFolder,
  Platform,
  ShareTarget,
  SharingLink,
  Trigger,
  TriggerPlayback,
  User
} from "../../domain/entities";
import {
  AppError,
  ConflictError,
  ConstraintError,
  NotFoundError,
  PersistenceError,
  ValidationError,
  asEntityId,
  currentISODateString,
  createEntityId,
  fromUnknownPersistenceError,
  okApp,
  errApp,
  platformSchema,
  projectFolderSchema,
  projectSchema,
  userSchema,
  deviceSchema,
  collisionMatrixSchema,
  collectionSchema,
  eventSchema,
  triggerSchema,
  eventTriggerSchema,
  triggerPlaybackSchema,
  sharingLinkSchema,
  collisionMatrixRowSchema,
  collisionMatrixColumnSchema,
  collisionMatrixEntrySchema,
  assetLibrarySchema,
  assetLibraryFolderSchema,
  assetSchema,
  assetBlobSchema,
  projectAssetLibraryImportSchema,
  folderAccessSchema,
  createProjectCommandSchema,
  createDeviceCommandSchema,
  createAssetCommandSchema,
  createAssetLibraryCommandSchema,
  createAssetLibraryFolderCommandSchema,
  createCollectionCommandSchema,
  updateCollectionCommandSchema,
  createEventCommandSchema,
  reorderCollectionEventsCommandSchema,
  updateEventCommandSchema,
  createEventTriggerCommandSchema,
  updateEventTriggerCommandSchema,
  createTriggerPlaybackCommandSchema,
  selectCollisionMatrixEventCommandSchema,
  upsertCollisionMatrixEntryCommandSchema,
  generateSharingLinkCommandSchema,
  shareRouteParamsSchema,
  importAssetLibraryCommandSchema,
  createProjectFolderCommandSchema,
  updateDeviceCommandSchema,
  updateTriggerPlaybackCommandSchema,
  canAddChildFolder,
  canAddProjectToFolder,
  canAddAssetToFolder,
  canAddChildFolderToAssetFolder,
  canCreateEventTrigger,
  canCreateMatrixEntry,
  canImportAssetLibrary,
  canSelectMatrixEvent,
  canGenerateSharingLink,
  canUseResolutionBehavior,
  canUseAssetInProject,
  canUseTriggerPlaybackOffset,
  canCreateDevice,
  validateDeviceCreationRecords,
  validateProjectCreationRecords,
  type AppResult
} from "../../domain";
import type { EventType } from "../../domain/enums";
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
} from "../../domain/ids";
import { deleteCascadeTransactionTables } from "./delete-cascade";

export interface ProjectFolderNode {
  folder: ProjectFolder;
  childFolders: ProjectFolderNode[];
  projects: Project[];
  isEmptyLeaf: boolean;
}

export interface ProjectTreeAggregate {
  user: User;
  roots: ProjectFolderNode[];
  rootProjects: Project[];
  platforms: Platform[];
}

export interface CreateProjectFolderInput {
  parentFolderId: ProjectFolderId | null;
  createdByUserId?: UserId;
  name: string;
}

export interface CreateProjectInput {
  folderId: ProjectFolderId | null;
  name: string;
  devices?: {
    platformId: PlatformId;
    name: string;
  }[];
  starterEventTypes?: EventType[];
}

export interface CreatedProjectAggregate {
  project: Project;
  defaultAssetLibrary: AssetLibrary;
  rootFolder: AssetLibraryFolder;
  devices: (CreatedDeviceAggregate & {
    defaultCollection: Collection;
    starterEvents: Event[];
  })[];
}

export interface AssetLibraryFolderNode {
  folder: AssetLibraryFolder;
  childFolders: AssetLibraryFolderNode[];
  assets: Asset[];
  isEmptyLeaf: boolean;
}

export interface AssetLibraryTreeAggregate {
  library: AssetLibrary;
  rootFolder: AssetLibraryFolderNode;
}

export interface AssetLibrarySummary {
  library: AssetLibrary;
  rootFolder: AssetLibraryFolder;
  assetCount: number;
  folderCount: number;
  importedByProjectCount: number;
  defaultForProject: Project | null;
}

export interface AssetLibraryListAggregate {
  libraries: AssetLibrarySummary[];
}

export interface CreateAssetLibraryInput {
  name: string;
}

export interface CreatedAssetLibraryAggregate {
  library: AssetLibrary;
  rootFolder: AssetLibraryFolder;
}

export interface CreateAssetLibraryFolderInput {
  libraryId: AssetLibraryId;
  parentFolderId: AssetLibraryFolderId;
  name: string;
  icon: string;
}

export interface CreateAssetInput {
  libraryId: AssetLibraryId;
  folderId: AssetLibraryFolderId;
  name: string;
  assetId: string;
  mediaKind: Asset["mediaKind"];
  originalFilename: string;
  playbackUrl?: string;
  blob?: Blob;
  contentType?: string;
}

export interface ImportAssetLibraryInput {
  projectId: ProjectId;
  assetLibraryId: AssetLibraryId;
}

export interface DeviceSummary {
  device: Device;
  platform: Platform;
  collisionMatrix: CollisionMatrix;
  collectionCount: number;
  eventCount: number;
}

export interface ProjectWorkspaceAggregate {
  project: Project;
  folder: ProjectFolder | null;
  defaultAssetLibrary: AssetLibrary;
  importedAssetLibraries: AssetLibrary[];
  platforms: Platform[];
  devices: DeviceSummary[];
}

export interface CreateDeviceInput {
  projectId: ProjectId;
  platformId: PlatformId;
  name: string;
  isEnabled?: boolean;
}

export interface UpdateDeviceInput {
  deviceId: DeviceId;
  name?: string;
  isEnabled?: boolean;
}

export interface CreatedDeviceAggregate {
  device: Device;
  platform: Platform;
  collisionMatrix: CollisionMatrix;
}

export interface CreateCollectionInput {
  deviceId: DeviceId;
  name: string;
}

export interface UpdateCollectionInput {
  collectionId: CollectionId;
  name: string;
}

export interface CreateEventInput {
  collectionId: CollectionId;
  name: string;
  eventType: Event["eventType"];
}

export interface ReorderCollectionEventsInput {
  collectionId: CollectionId;
  orderedEventIds: EventId[];
}

export interface UpdateEventInput {
  eventId: EventId;
  name?: string;
  eventType?: Event["eventType"];
}

export interface CreateEventTriggerInput {
  eventId: EventId;
  triggerId: TriggerId;
  label?: string | null;
  isEnabled?: boolean;
}

export interface UpdateEventTriggerInput {
  eventTriggerId: EventTriggerId;
  label?: string | null;
  isEnabled?: boolean;
}

export interface CreateTriggerPlaybackInput {
  eventTriggerId: EventTriggerId;
  assetId: AssetId;
  startOffset: number;
}

export interface UpdateTriggerPlaybackInput {
  triggerPlaybackId: TriggerPlaybackId;
  assetId?: AssetId;
  startOffset?: number;
}

export interface CollisionMatrixAggregate {
  device: Device;
  collisionMatrix: CollisionMatrix;
  collections: Collection[];
  events: Event[];
  rows: CollisionMatrixRow[];
  columns: CollisionMatrixColumn[];
  entries: CollisionMatrixEntry[];
}

export interface SelectCollisionMatrixEventInput {
  matrixId: CollisionMatrixId;
  eventId: EventId;
}

export interface UpsertCollisionMatrixEntryInput {
  matrixId: CollisionMatrixId;
  playingEventId: EventId;
  incomingEventId: EventId;
  resolutionBehavior: CollisionMatrixEntry["resolutionBehavior"];
}

export interface GenerateSharingLinkInput {
  target: ShareTarget;
  createdByUserId: UserId;
}

export type SharingLinkPreviewTarget =
  | {
      kind: "project";
      project: Project;
      devices: DeviceSummary[];
    }
  | {
      kind: "event";
      project: Project;
      device: Device;
      platform: Platform;
      collection: Collection;
      event: Event;
      eventTriggers: Array<
        EventTrigger & {
          trigger: Trigger;
          playbacks: Array<TriggerPlayback & { asset: Asset }>;
        }
      >;
    }
  | {
      kind: "collisionMatrixEntry";
      project: Project;
      device: Device;
      platform: Platform;
      collisionMatrix: CollisionMatrix;
      entry: CollisionMatrixEntry;
      playingEvent: Event;
      incomingEvent: Event;
    };

export interface SharingLinkPreviewAggregate {
  sharingLink: SharingLink;
  createdByUser: User;
  target: SharingLinkPreviewTarget;
}

interface DeviceCreationRecords {
  device: Device;
  collisionMatrix: CollisionMatrix;
}

export interface DeviceEventAggregate {
  event: Event;
  eventTriggers: Array<EventTrigger & { playbacks: TriggerPlayback[] }>;
}

export interface DeviceCollectionAggregate {
  collection: Collection;
  events: DeviceEventAggregate[];
}

export interface DeviceWorkspaceAggregate {
  project: Project;
  device: Device;
  platform: Platform;
  collisionMatrix: CollisionMatrix;
  triggers: Trigger[];
  playbackAssets: Array<
    Asset & {
      libraryName: string;
      isDefaultLibrary: boolean;
      isImportedLibrary: boolean;
    }
  >;
  collections: DeviceCollectionAggregate[];
  matrixRows: CollisionMatrixRow[];
  matrixColumns: CollisionMatrixColumn[];
  matrixEntries: CollisionMatrixEntry[];
}

export interface ProjectRepository {
  loadProjectTree(userId: UserId): Promise<AppResult<ProjectTreeAggregate>>;
  loadProjectWorkspace(projectId: ProjectId): Promise<AppResult<ProjectWorkspaceAggregate>>;
  loadAssetLibraries(): Promise<AppResult<AssetLibraryListAggregate>>;
  loadAssetLibraryTree(libraryId: AssetLibraryId): Promise<AppResult<AssetLibraryTreeAggregate>>;
  createProjectFolder(input: CreateProjectFolderInput): Promise<AppResult<ProjectFolder>>;
  deleteProjectFolder(projectFolderId: ProjectFolderId): Promise<AppResult<void>>;
  createProject(input: CreateProjectInput): Promise<AppResult<CreatedProjectAggregate>>;
  deleteProject(projectId: ProjectId): Promise<AppResult<void>>;
  createAssetLibrary(input: CreateAssetLibraryInput): Promise<AppResult<CreatedAssetLibraryAggregate>>;
  deleteAssetLibrary(assetLibraryId: AssetLibraryId): Promise<AppResult<void>>;
  createAssetLibraryFolder(input: CreateAssetLibraryFolderInput): Promise<AppResult<AssetLibraryFolder>>;
  deleteAssetLibraryFolder(assetLibraryFolderId: AssetLibraryFolderId): Promise<AppResult<void>>;
  createAsset(input: CreateAssetInput): Promise<AppResult<Asset>>;
  deleteAsset(assetId: AssetId): Promise<AppResult<void>>;
  importAssetLibrary(input: ImportAssetLibraryInput): Promise<AppResult<ProjectAssetLibraryImport>>;
  createDevice(input: CreateDeviceInput): Promise<AppResult<CreatedDeviceAggregate>>;
  updateDevice(input: UpdateDeviceInput): Promise<AppResult<Device>>;
  deleteDevice(deviceId: DeviceId): Promise<AppResult<void>>;
  loadDeviceWorkspace(deviceId: DeviceId): Promise<AppResult<DeviceWorkspaceAggregate>>;
  createCollection(input: CreateCollectionInput): Promise<AppResult<Collection>>;
  updateCollection(input: UpdateCollectionInput): Promise<AppResult<Collection>>;
  deleteCollection(collectionId: CollectionId): Promise<AppResult<void>>;
  createEvent(input: CreateEventInput): Promise<AppResult<Event>>;
  reorderCollectionEvents(input: ReorderCollectionEventsInput): Promise<AppResult<Event[]>>;
  updateEvent(input: UpdateEventInput): Promise<AppResult<Event>>;
  deleteEvent(eventId: EventId): Promise<AppResult<void>>;
  createEventTrigger(input: CreateEventTriggerInput): Promise<AppResult<EventTrigger>>;
  updateEventTrigger(input: UpdateEventTriggerInput): Promise<AppResult<EventTrigger>>;
  deleteEventTrigger(eventTriggerId: EventTriggerId): Promise<AppResult<void>>;
  createTriggerPlayback(input: CreateTriggerPlaybackInput): Promise<AppResult<TriggerPlayback>>;
  updateTriggerPlayback(input: UpdateTriggerPlaybackInput): Promise<AppResult<TriggerPlayback>>;
  deleteTriggerPlayback(triggerPlaybackId: TriggerPlaybackId): Promise<AppResult<void>>;
  loadCollisionMatrix(matrixId: CollisionMatrixId): Promise<AppResult<CollisionMatrixAggregate>>;
  selectCollisionMatrixRow(input: SelectCollisionMatrixEventInput): Promise<AppResult<CollisionMatrixRow>>;
  selectCollisionMatrixColumn(input: SelectCollisionMatrixEventInput): Promise<AppResult<CollisionMatrixColumn>>;
  deselectCollisionMatrixRow(input: SelectCollisionMatrixEventInput): Promise<AppResult<void>>;
  deselectCollisionMatrixColumn(input: SelectCollisionMatrixEventInput): Promise<AppResult<void>>;
  upsertCollisionMatrixEntry(input: UpsertCollisionMatrixEntryInput): Promise<AppResult<CollisionMatrixEntry>>;
  deleteCollisionMatrixEntry(collisionMatrixEntryId: CollisionMatrixEntryId): Promise<AppResult<void>>;
  generateSharingLink(input: GenerateSharingLinkInput): Promise<AppResult<SharingLink>>;
  deleteSharingLink(sharingLinkId: SharingLinkId): Promise<AppResult<void>>;
  lookupSharingLink(shareToken: string): Promise<AppResult<SharingLink>>;
  loadSharingLinkPreview(shareToken: string): Promise<AppResult<SharingLinkPreviewAggregate>>;
}

export interface ProjectRepositoryOptions {
  createObjectUrl?: (blob: Blob) => string;
  revokeObjectUrl?: (url: string) => void;
}

const defaultCreateObjectUrl = (blob: Blob): string => {
  if (typeof URL === "undefined" || typeof URL.createObjectURL !== "function") {
    throw new PersistenceError("Uploaded asset playback URLs are not available in this environment.", {
      constraint: "asset-object-url-unavailable"
    });
  }

  return URL.createObjectURL(blob);
};

const defaultRevokeObjectUrl = (url: string): void => {
  if (typeof URL !== "undefined" && typeof URL.revokeObjectURL === "function") {
    URL.revokeObjectURL(url);
  }
};

const toAppResult = async <Value>(operation: () => Promise<Value>): Promise<AppResult<Value>> => {
  try {
    return okApp(await operation());
  } catch (cause) {
    if (cause instanceof AppError) {
      return errApp(cause);
    }

    return errApp(fromUnknownPersistenceError(cause));
  }
};

const parseRecord = <Schema extends v.GenericSchema>(schema: Schema, value: unknown): v.InferOutput<Schema> => {
  try {
    return v.parse(schema, value);
  } catch (cause) {
    throw fromUnknownPersistenceError(cause, "Local demo data failed validation.");
  }
};

const parseCommand = <Schema extends v.GenericSchema>(schema: Schema, value: unknown): v.InferOutput<Schema> => {
  try {
    return v.parse(schema, value);
  } catch (cause) {
    throw new ValidationError("Project command input is invalid.", { cause });
  }
};

const parseAssetRecord = async (
  database: VibraDatabase,
  rawAsset: unknown,
  objectUrlsByAssetId: Map<AssetId, string>,
  createObjectUrl: (blob: Blob) => string
): Promise<Asset> => {
  const asset = parseRecord(assetSchema, rawAsset) as Asset;
  const rawAssetBlob = await database.assetBlobs.get(asset.id);

  if (!rawAssetBlob) {
    if (isUploadedAssetPlaceholderUrl(asset.playbackUrl)) {
      throw fromUnknownPersistenceError(
        new Error(`Uploaded asset blob is missing for ${asset.id}.`),
        "Uploaded asset file data could not be loaded."
      );
    }

    return asset;
  }

  const assetBlob = parseRecord(assetBlobSchema, rawAssetBlob) as AssetBlob;
  const previousObjectUrl = objectUrlsByAssetId.get(asset.id);

  if (previousObjectUrl) {
    return {
      ...asset,
      playbackUrl: previousObjectUrl
    };
  }

  const playbackUrl = createObjectUrl(assetBlob.blob);
  objectUrlsByAssetId.set(asset.id, playbackUrl);

  return {
    ...asset,
    playbackUrl
  };
};

const buildFolderNode = (
  folder: ProjectFolder,
  foldersByParentId: Map<ProjectFolderId | null, ProjectFolder[]>,
  projectsByFolderId: Map<ProjectFolderId | null, Project[]>
): ProjectFolderNode => {
  const childFolders = (foldersByParentId.get(folder.id) ?? []).map((childFolder) =>
    buildFolderNode(childFolder, foldersByParentId, projectsByFolderId)
  );
  const projects = projectsByFolderId.get(folder.id) ?? [];

  return {
    folder,
    childFolders,
    projects,
    isEmptyLeaf: childFolders.length === 0 && projects.length === 0
  };
};

const buildAssetLibraryFolderNode = (
  folder: AssetLibraryFolder,
  foldersByParentId: Map<AssetLibraryFolderId | null, AssetLibraryFolder[]>,
  assetsByFolderId: Map<AssetLibraryFolderId, Asset[]>
): AssetLibraryFolderNode => {
  const childFolders = (foldersByParentId.get(folder.id) ?? []).map((childFolder) =>
    buildAssetLibraryFolderNode(childFolder, foldersByParentId, assetsByFolderId)
  );
  const assets = assetsByFolderId.get(folder.id) ?? [];

  return {
    folder,
    childFolders,
    assets,
    isEmptyLeaf: childFolders.length === 0 && assets.length === 0
  };
};

const sortByName = <Record extends { name: string }>(records: Record[]): Record[] =>
  records.sort((first, second) => first.name.localeCompare(second.name));

const sortByEventOrder = <Record extends { name: string; id: string; sortOrder: number }>(
  records: Record[]
): Record[] =>
  records.sort(
    (first, second) =>
      first.sortOrder - second.sortOrder ||
      first.name.localeCompare(second.name) ||
      first.id.localeCompare(second.id)
  );

const sortByCreatedAtThenName = <Record extends { createdAt: string; name: string }>(
  records: Record[]
): Record[] =>
  records.sort(
    (first, second) =>
      first.createdAt.localeCompare(second.createdAt) || first.name.localeCompare(second.name)
  );

type CreatedProjectRecords = CreatedProjectAggregate;

const createDefaultProjectRecords = (
  input: CreateProjectInput,
  platformsById: Map<PlatformId, Platform>
): CreatedProjectRecords => {
  const projectId = createEntityId<ProjectId>("project");
  const defaultAssetLibraryId = createEntityId<AssetLibraryId>("library");
  const rootFolderId = createEntityId<AssetLibraryFolderId>("folder_library");
  const createdAt = currentISODateString();
  const starterEventTypes = input.starterEventTypes ?? [];
  const devices = (input.devices ?? []).map((deviceInput) => {
    const records = createDeviceRecords({
      projectId,
      platformId: deviceInput.platformId,
      name: deviceInput.name
    });
    const defaultCollection = createCollectionRecord({
      deviceId: records.device.id,
      name: "Core interactions"
    });
    const starterEvents = starterEventTypes.map((eventType, sortOrder) =>
      createEventRecord({
        collectionId: defaultCollection.id,
        name: eventType,
        eventType,
        sortOrder
      })
    );
    const platform = platformsById.get(deviceInput.platformId);

    if (!platform) {
      throw new NotFoundError("Platform could not be found.", { entity: "Platform" });
    }

    return {
      device: records.device,
      platform,
      collisionMatrix: records.collisionMatrix,
      defaultCollection,
      starterEvents
    };
  });

  return {
    project: {
      id: projectId,
      folderId: input.folderId,
      defaultAssetLibraryId,
      name: input.name,
      createdAt
    },
    defaultAssetLibrary: {
      id: defaultAssetLibraryId,
      name: `${input.name} Default`,
      defaultForProjectId: projectId
    },
    rootFolder: {
      id: rootFolderId,
      libraryId: defaultAssetLibraryId,
      parentFolderId: null,
      name: input.name,
      icon: "folder"
    },
    devices
  };
};

const createProjectFolderRecord = (input: CreateProjectFolderInput): ProjectFolder => ({
  id: createEntityId<ProjectFolderId>("folder"),
  parentFolderId: input.parentFolderId,
  name: input.name,
  createdAt: currentISODateString()
});

const createStandaloneAssetLibraryRecords = (
  input: CreateAssetLibraryInput
): CreatedAssetLibraryAggregate => {
  const libraryId = createEntityId<AssetLibraryId>("library");
  const rootFolderId = createEntityId<AssetLibraryFolderId>("folder_library");

  return {
    library: {
      id: libraryId,
      name: input.name,
      defaultForProjectId: null
    },
    rootFolder: {
      id: rootFolderId,
      libraryId,
      parentFolderId: null,
      name: input.name,
      icon: "folder"
    }
  };
};

const createAssetLibraryFolderRecord = (input: CreateAssetLibraryFolderInput): AssetLibraryFolder => ({
  id: createEntityId<AssetLibraryFolderId>("folder_library"),
  libraryId: input.libraryId,
  parentFolderId: input.parentFolderId,
  name: input.name,
  icon: input.icon
});

const uploadedAssetPlaceholderUrl = (assetId: AssetId) =>
  `https://vibra.local/assets/uploaded/${assetId}`;

const isUploadedAssetPlaceholderUrl = (playbackUrl: string) =>
  playbackUrl.startsWith("https://vibra.local/assets/uploaded/");

const createAssetRecords = (
  input: CreateAssetInput
): { asset: Asset; assetBlob: AssetBlob | null } => {
  const id = createEntityId<AssetId>("asset");
  const uploadedAt = currentISODateString();
  const asset: Asset = {
    id,
    libraryId: input.libraryId,
    folderId: input.folderId,
    name: input.name,
    assetId: input.assetId,
    mediaKind: input.mediaKind,
    originalFilename: input.originalFilename,
    uploadedAt,
    playbackUrl: input.playbackUrl ?? uploadedAssetPlaceholderUrl(id)
  };

  return {
    asset,
    assetBlob: input.blob
      ? {
          assetId: id,
          blob: input.blob,
          contentType: input.contentType ?? input.blob.type,
          size: input.blob.size,
          storedAt: uploadedAt
        }
      : null
  };
};

const createDeviceRecords = (input: CreateDeviceInput): DeviceCreationRecords => {
  const deviceId = createEntityId<DeviceId>("device");
  const matrixId = createEntityId<CollisionMatrixId>("matrix");
  const createdAt = currentISODateString();

  return {
    device: {
      id: deviceId,
      projectId: input.projectId,
      platformId: input.platformId,
      name: input.name,
      createdAt,
      updatedAt: createdAt,
      isEnabled: input.isEnabled ?? true
    },
    collisionMatrix: {
      id: matrixId,
      deviceId
    }
  };
};

const createCollectionRecord = (input: CreateCollectionInput): Collection => ({
  id: createEntityId<CollectionId>("collection"),
  deviceId: input.deviceId,
  name: input.name
});

const createEventRecord = (input: CreateEventInput & { sortOrder: number }): Event => ({
  id: createEntityId<EventId>("event"),
  collectionId: input.collectionId,
  name: input.name,
  eventType: input.eventType,
  sortOrder: input.sortOrder
});

const createEventTriggerRecord = (input: CreateEventTriggerInput): EventTrigger => ({
  id: createEntityId<EventTriggerId>("event_trigger"),
  eventId: input.eventId,
  triggerId: input.triggerId,
  label: input.label ?? null,
  isEnabled: input.isEnabled ?? true
});

const createTriggerPlaybackRecord = (input: CreateTriggerPlaybackInput): TriggerPlayback => ({
  id: createEntityId<TriggerPlaybackId>("playback"),
  eventTriggerId: input.eventTriggerId,
  assetId: input.assetId,
  startOffset: input.startOffset
});

const createCollisionMatrixEntryRecord = (
  input: UpsertCollisionMatrixEntryInput
): CollisionMatrixEntry => ({
  id: createEntityId<CollisionMatrixEntryId>("matrix_entry"),
  matrixId: input.matrixId,
  playingEventId: input.playingEventId,
  incomingEventId: input.incomingEventId,
  resolutionBehavior: input.resolutionBehavior
});

const createSharingLinkRecord = (input: GenerateSharingLinkInput): SharingLink => {
  const id = createEntityId<SharingLinkId>("share");

  return {
    id,
    target: input.target,
    createdByUserId: input.createdByUserId,
    url: `https://vibra.local/share/${id}`
  };
};

const shareUrlForToken = (shareToken: string) => `https://vibra.local/share/${shareToken}`;

const parseShareTarget = (target: ShareTarget): ShareTarget => {
  switch (target.kind) {
    case "project":
      return { kind: "project", projectId: asEntityId<ProjectId>(target.projectId) };
    case "event":
      return { kind: "event", eventId: asEntityId<EventId>(target.eventId) };
    case "collisionMatrixEntry":
      return {
        kind: "collisionMatrixEntry",
        collisionMatrixEntryId: asEntityId<CollisionMatrixEntryId>(target.collisionMatrixEntryId)
      };
  }
};

const loadCollisionMatrixAggregate = async (
  database: VibraDatabase,
  matrixId: CollisionMatrixId
): Promise<CollisionMatrixAggregate> => {
  const rawCollisionMatrix = await database.collisionMatrices.get(matrixId);

  if (!rawCollisionMatrix) {
    throw new NotFoundError("Collision matrix could not be found.", { entity: "CollisionMatrix" });
  }

  const collisionMatrix = parseRecord(collisionMatrixSchema, rawCollisionMatrix) as CollisionMatrix;
  const rawDevice = await database.devices.get(collisionMatrix.deviceId);

  if (!rawDevice) {
    throw new NotFoundError("Matrix device could not be found.", { entity: "Device" });
  }

  const device = parseRecord(deviceSchema, rawDevice) as Device;
  const rawCollections = await database.collections.where("deviceId").equals(device.id).toArray();
  const collections = sortByName(
    rawCollections.map((collection) => parseRecord(collectionSchema, collection) as Collection)
  );
  const events = sortByEventOrder(
    (
      await Promise.all(
        collections.map((collection) =>
          database.events.where("collectionId").equals(collection.id).toArray()
        )
      )
    )
      .flat()
      .map((event) => parseRecord(eventSchema, event) as Event)
  );
  const [rawRows, rawColumns, rawEntries] = await Promise.all([
    database.collisionMatrixRows.where("matrixId").equals(collisionMatrix.id).toArray(),
    database.collisionMatrixColumns.where("matrixId").equals(collisionMatrix.id).toArray(),
    database.collisionMatrixEntries.where("matrixId").equals(collisionMatrix.id).toArray()
  ]);

  return {
    device,
    collisionMatrix,
    collections,
    events,
    rows: rawRows
      .map((row) => parseRecord(collisionMatrixRowSchema, row) as CollisionMatrixRow)
      .sort((first, second) => first.eventId.localeCompare(second.eventId)),
    columns: rawColumns
      .map((column) => parseRecord(collisionMatrixColumnSchema, column) as CollisionMatrixColumn)
      .sort((first, second) => first.eventId.localeCompare(second.eventId)),
    entries: rawEntries
      .map((entry) => parseRecord(collisionMatrixEntrySchema, entry) as CollisionMatrixEntry)
      .sort(
        (first, second) =>
          first.playingEventId.localeCompare(second.playingEventId) ||
          first.incomingEventId.localeCompare(second.incomingEventId)
      )
  };
};

const loadProjectForEventTrigger = async (
  database: VibraDatabase,
  eventTriggerId: EventTriggerId
): Promise<{
  eventTrigger: EventTrigger;
  event: Event;
  collection: Collection;
  device: Device;
  project: Project;
}> => {
  const rawEventTrigger = await database.eventTriggers.get(eventTriggerId);

  if (!rawEventTrigger) {
    throw new NotFoundError("Event interaction could not be found.", { entity: "EventTrigger" });
  }

  const eventTrigger = parseRecord(eventTriggerSchema, rawEventTrigger) as EventTrigger;
  const rawEvent = await database.events.get(eventTrigger.eventId);

  if (!rawEvent) {
    throw new NotFoundError("Event could not be found.", { entity: "Event" });
  }

  const event = parseRecord(eventSchema, rawEvent) as Event;
  const rawCollection = await database.collections.get(event.collectionId);

  if (!rawCollection) {
    throw new NotFoundError("Collection could not be found.", { entity: "Collection" });
  }

  const collection = parseRecord(collectionSchema, rawCollection) as Collection;
  const rawDevice = await database.devices.get(collection.deviceId);

  if (!rawDevice) {
    throw new NotFoundError("Device could not be found.", { entity: "Device" });
  }

  const device = parseRecord(deviceSchema, rawDevice) as Device;
  const rawProject = await database.projects.get(device.projectId);

  if (!rawProject) {
    throw new NotFoundError("Project could not be found.", { entity: "Project" });
  }

  return {
    eventTrigger,
    event,
    collection,
    device,
    project: parseRecord(projectSchema, rawProject) as Project
  };
};

const validatePlaybackAssetEligibility = async (
  database: VibraDatabase,
  project: Project,
  assetId: AssetId
): Promise<Asset> => {
  const rawAsset = await database.assets.get(assetId);

  if (!rawAsset) {
    throw new NotFoundError("Playback asset could not be found.", { entity: "Asset" });
  }

  const asset = parseRecord(assetSchema, rawAsset) as Asset;
  const imports = (
    await database.projectAssetLibraryImports.where("projectId").equals(project.id).toArray()
  ).map((record) => parseRecord(projectAssetLibraryImportSchema, record) as ProjectAssetLibraryImport);
  const eligibilityRule = canUseAssetInProject(project, asset, imports);

  if (eligibilityRule.isErr()) {
    throw eligibilityRule.error;
  }

  return asset;
};

const assertShareTargetExists = async (database: VibraDatabase, target: ShareTarget): Promise<void> => {
  switch (target.kind) {
    case "project": {
      const project = await database.projects.get(target.projectId);

      if (!project) {
        throw new NotFoundError("Share target project could not be found.", { entity: "Project" });
      }

      parseRecord(projectSchema, project);
      break;
    }
    case "event": {
      const event = await database.events.get(target.eventId);

      if (!event) {
        throw new NotFoundError("Share target event could not be found.", { entity: "Event" });
      }

      parseRecord(eventSchema, event);
      break;
    }
    case "collisionMatrixEntry": {
      const entry = await database.collisionMatrixEntries.get(target.collisionMatrixEntryId);

      if (!entry) {
        throw new NotFoundError("Share target matrix entry could not be found.", {
          entity: "CollisionMatrixEntry"
        });
      }

      parseRecord(collisionMatrixEntrySchema, entry);
      break;
    }
  }
};

const loadProjectDeviceSummaries = async (
  database: VibraDatabase,
  projectId: ProjectId
): Promise<DeviceSummary[]> => {
  const [rawDevices, rawPlatforms] = await Promise.all([
    database.devices.where("projectId").equals(projectId).toArray(),
    database.platforms.toArray()
  ]);
  const platforms = new Map(
    rawPlatforms.map((platform) => {
      const parsedPlatform = parseRecord(platformSchema, platform) as Platform;
      return [parsedPlatform.id, parsedPlatform] as const;
    })
  );

  return Promise.all(
    sortByCreatedAtThenName(rawDevices.map((device) => parseRecord(deviceSchema, device) as Device)).map(
      async (device) => {
        const platform = platforms.get(device.platformId);
        const rawCollisionMatrix = await database.collisionMatrices.where("deviceId").equals(device.id).first();

        if (!platform) {
          throw new NotFoundError("Device platform could not be found.", { entity: "Platform" });
        }

        if (!rawCollisionMatrix) {
          throw new NotFoundError("Device collision matrix could not be found.", {
            entity: "CollisionMatrix"
          });
        }

        const collisionMatrix = parseRecord(collisionMatrixSchema, rawCollisionMatrix) as CollisionMatrix;
        const rawCollections = await database.collections.where("deviceId").equals(device.id).toArray();
        const collections = rawCollections.map((collection) => parseRecord(collectionSchema, collection) as Collection);
        const eventCount = (
          await Promise.all(
            collections.map((collection) => database.events.where("collectionId").equals(collection.id).count())
          )
        ).reduce((total, count) => total + count, 0);

        return {
          device,
          platform,
          collisionMatrix,
          collectionCount: collections.length,
          eventCount
        };
      }
    )
  );
};

const loadEventPreviewTarget = async (
  database: VibraDatabase,
  eventId: EventId,
  resolveAsset: (rawAsset: unknown) => Promise<Asset>
): Promise<Extract<SharingLinkPreviewTarget, { kind: "event" }>> => {
  const rawEvent = await database.events.get(eventId);

  if (!rawEvent) {
    throw new NotFoundError("Share target event could not be found.", { entity: "Event" });
  }

  const event = parseRecord(eventSchema, rawEvent) as Event;
  const rawCollection = await database.collections.get(event.collectionId);

  if (!rawCollection) {
    throw new NotFoundError("Event collection could not be found.", { entity: "Collection" });
  }

  const collection = parseRecord(collectionSchema, rawCollection) as Collection;
  const rawDevice = await database.devices.get(collection.deviceId);

  if (!rawDevice) {
    throw new NotFoundError("Event device could not be found.", { entity: "Device" });
  }

  const device = parseRecord(deviceSchema, rawDevice) as Device;
  const [rawProject, rawPlatform, rawEventTriggers] = await Promise.all([
    database.projects.get(device.projectId),
    database.platforms.get(device.platformId),
    database.eventTriggers.where("eventId").equals(event.id).toArray()
  ]);

  if (!rawProject) {
    throw new NotFoundError("Event project could not be found.", { entity: "Project" });
  }

  if (!rawPlatform) {
    throw new NotFoundError("Event platform could not be found.", { entity: "Platform" });
  }

  const eventTriggers = await Promise.all(
    rawEventTriggers.map(async (rawEventTrigger) => {
      const eventTrigger = parseRecord(eventTriggerSchema, rawEventTrigger) as EventTrigger;
      const [rawTrigger, rawPlaybacks] = await Promise.all([
        database.triggers.get(eventTrigger.triggerId),
        database.triggerPlaybacks.where("eventTriggerId").equals(eventTrigger.id).toArray()
      ]);

      if (!rawTrigger) {
        throw new NotFoundError("Event interaction could not be found.", { entity: "Trigger" });
      }

      const playbacks = await Promise.all(
        rawPlaybacks.map(async (rawPlayback) => {
          const playback = parseRecord(triggerPlaybackSchema, rawPlayback) as TriggerPlayback;
          const rawAsset = await database.assets.get(playback.assetId);

          if (!rawAsset) {
            throw new NotFoundError("Playback asset could not be found.", { entity: "Asset" });
          }

          return {
            ...playback,
            asset: await resolveAsset(rawAsset)
          };
        })
      );

      return {
        ...eventTrigger,
        trigger: parseRecord(triggerSchema, rawTrigger) as Trigger,
        playbacks: playbacks.sort((first, second) => first.startOffset - second.startOffset)
      };
    })
  );

  return {
    kind: "event",
    project: parseRecord(projectSchema, rawProject) as Project,
    device,
    platform: parseRecord(platformSchema, rawPlatform) as Platform,
    collection,
    event,
    eventTriggers
  };
};

const loadMatrixEntryPreviewTarget = async (
  database: VibraDatabase,
  collisionMatrixEntryId: CollisionMatrixEntryId
): Promise<Extract<SharingLinkPreviewTarget, { kind: "collisionMatrixEntry" }>> => {
  const rawEntry = await database.collisionMatrixEntries.get(collisionMatrixEntryId);

  if (!rawEntry) {
    throw new NotFoundError("Share target matrix entry could not be found.", {
      entity: "CollisionMatrixEntry"
    });
  }

  const entry = parseRecord(collisionMatrixEntrySchema, rawEntry) as CollisionMatrixEntry;
  const [rawMatrix, rawPlayingEvent, rawIncomingEvent] = await Promise.all([
    database.collisionMatrices.get(entry.matrixId),
    database.events.get(entry.playingEventId),
    database.events.get(entry.incomingEventId)
  ]);

  if (!rawMatrix) {
    throw new NotFoundError("Collision Matrix could not be found.", { entity: "CollisionMatrix" });
  }

  if (!rawPlayingEvent || !rawIncomingEvent) {
    throw new NotFoundError("Matrix entry event could not be found.", { entity: "Event" });
  }

  const collisionMatrix = parseRecord(collisionMatrixSchema, rawMatrix) as CollisionMatrix;
  const rawDevice = await database.devices.get(collisionMatrix.deviceId);

  if (!rawDevice) {
    throw new NotFoundError("Matrix device could not be found.", { entity: "Device" });
  }

  const device = parseRecord(deviceSchema, rawDevice) as Device;
  const [rawProject, rawPlatform] = await Promise.all([
    database.projects.get(device.projectId),
    database.platforms.get(device.platformId)
  ]);

  if (!rawProject) {
    throw new NotFoundError("Matrix project could not be found.", { entity: "Project" });
  }

  if (!rawPlatform) {
    throw new NotFoundError("Matrix platform could not be found.", { entity: "Platform" });
  }

  return {
    kind: "collisionMatrixEntry",
    project: parseRecord(projectSchema, rawProject) as Project,
    device,
    platform: parseRecord(platformSchema, rawPlatform) as Platform,
    collisionMatrix,
    entry,
    playingEvent: parseRecord(eventSchema, rawPlayingEvent) as Event,
    incomingEvent: parseRecord(eventSchema, rawIncomingEvent) as Event
  };
};

const loadSharingPreviewTarget = async (
  database: VibraDatabase,
  target: ShareTarget,
  resolveAsset: (rawAsset: unknown) => Promise<Asset>
): Promise<SharingLinkPreviewTarget> => {
  switch (target.kind) {
    case "project": {
      const rawProject = await database.projects.get(target.projectId);

      if (!rawProject) {
        throw new NotFoundError("Share target project could not be found.", { entity: "Project" });
      }

      const project = parseRecord(projectSchema, rawProject) as Project;

      return {
        kind: "project",
        project,
        devices: await loadProjectDeviceSummaries(database, project.id)
      };
    }
    case "event":
      return loadEventPreviewTarget(database, target.eventId, resolveAsset);
    case "collisionMatrixEntry":
      return loadMatrixEntryPreviewTarget(database, target.collisionMatrixEntryId);
  }
};

export const createProjectRepository = (
  database: VibraDatabase,
  options: ProjectRepositoryOptions = {}
): ProjectRepository => {
  const objectUrlsByAssetId = new Map<AssetId, string>();
  const createObjectUrl = options.createObjectUrl ?? defaultCreateObjectUrl;
  const revokeObjectUrl = options.revokeObjectUrl ?? defaultRevokeObjectUrl;

  const resolveAsset = (rawAsset: unknown) =>
    parseAssetRecord(database, rawAsset, objectUrlsByAssetId, createObjectUrl);
  const deleteTransactionTables = () => deleteCascadeTransactionTables.map((tableName) => database[tableName]);

  const deleteSharingLinksForTarget = async (target: ShareTarget) => {
    const sharingLinks = await database.sharingLinks.toArray();

    await database.sharingLinks.bulkDelete(
      sharingLinks
        .filter((sharingLink) => {
          switch (target.kind) {
            case "project":
              return sharingLink.target.kind === "project" && sharingLink.target.projectId === target.projectId;
            case "event":
              return sharingLink.target.kind === "event" && sharingLink.target.eventId === target.eventId;
            case "collisionMatrixEntry":
              return (
                sharingLink.target.kind === "collisionMatrixEntry" &&
                sharingLink.target.collisionMatrixEntryId === target.collisionMatrixEntryId
              );
          }
        })
        .map((sharingLink) => sharingLink.id)
    );
  };

  const deleteCollisionMatrixEntryCascade = async (collisionMatrixEntryId: CollisionMatrixEntryId) => {
    await deleteSharingLinksForTarget({ kind: "collisionMatrixEntry", collisionMatrixEntryId });
    await database.collisionMatrixEntries.delete(collisionMatrixEntryId);
  };

  const deleteCollisionMatrixEntriesForEvent = async (eventId: EventId) => {
    const entries = await database.collisionMatrixEntries
      .filter((entry) => entry.playingEventId === eventId || entry.incomingEventId === eventId)
      .toArray();

    for (const entry of entries) {
      await deleteCollisionMatrixEntryCascade(entry.id);
    }
  };

  const deleteCollisionMatrixEntriesForAxis = async (
    matrixId: CollisionMatrixId,
    eventId: EventId,
    axis: "playing" | "incoming"
  ) => {
    const entries = await database.collisionMatrixEntries
      .where("matrixId")
      .equals(matrixId)
      .and((entry) => (axis === "playing" ? entry.playingEventId === eventId : entry.incomingEventId === eventId))
      .toArray();

    for (const entry of entries) {
      await deleteCollisionMatrixEntryCascade(entry.id);
    }
  };

  const deleteAssetCascade = async (assetId: AssetId) => {
    const objectUrl = objectUrlsByAssetId.get(assetId);

    if (objectUrl) {
      revokeObjectUrl(objectUrl);
      objectUrlsByAssetId.delete(assetId);
    }

    await database.triggerPlaybacks.where("assetId").equals(assetId).delete();
    await database.assetBlobs.delete(assetId);
    await database.assets.delete(assetId);
  };

  const deleteAssetLibraryFolderCascade = async (assetLibraryFolderId: AssetLibraryFolderId) => {
    const childFolders = await database.assetLibraryFolders
      .where("parentFolderId")
      .equals(assetLibraryFolderId)
      .toArray();
    const assets = await database.assets.where("folderId").equals(assetLibraryFolderId).toArray();

    for (const childFolder of childFolders) {
      await deleteAssetLibraryFolderCascade(childFolder.id);
    }

    for (const asset of assets) {
      await deleteAssetCascade(asset.id);
    }

    await database.assetLibraryFolders.delete(assetLibraryFolderId);
  };

  const deleteAssetLibraryCascade = async (assetLibraryId: AssetLibraryId) => {
    const rootFolders = await database.assetLibraryFolders
      .where("libraryId")
      .equals(assetLibraryId)
      .and((folder) => folder.parentFolderId === null)
      .toArray();

    for (const rootFolder of rootFolders) {
      await deleteAssetLibraryFolderCascade(rootFolder.id);
    }

    await database.projectAssetLibraryImports.where("assetLibraryId").equals(assetLibraryId).delete();
    await database.assetLibraries.delete(assetLibraryId);
  };

  const deleteEventTriggerCascade = async (eventTriggerId: EventTriggerId) => {
    await database.triggerPlaybacks.where("eventTriggerId").equals(eventTriggerId).delete();
    await database.eventTriggers.delete(eventTriggerId);
  };

  const deleteEventCascade = async (eventId: EventId) => {
    const eventTriggers = await database.eventTriggers.where("eventId").equals(eventId).toArray();

    for (const eventTrigger of eventTriggers) {
      await deleteEventTriggerCascade(eventTrigger.id);
    }

    await deleteCollisionMatrixEntriesForEvent(eventId);
    await database.collisionMatrixRows.where("eventId").equals(eventId).delete();
    await database.collisionMatrixColumns.where("eventId").equals(eventId).delete();
    await deleteSharingLinksForTarget({ kind: "event", eventId });
    await database.events.delete(eventId);
  };

  const deleteCollectionCascade = async (collectionId: CollectionId) => {
    const events = await database.events.where("collectionId").equals(collectionId).toArray();

    for (const event of events) {
      await deleteEventCascade(event.id);
    }

    await database.collections.delete(collectionId);
  };

  const deleteDeviceCascade = async (deviceId: DeviceId) => {
    const [collections, matrices] = await Promise.all([
      database.collections.where("deviceId").equals(deviceId).toArray(),
      database.collisionMatrices.where("deviceId").equals(deviceId).toArray()
    ]);

    for (const collection of collections) {
      await deleteCollectionCascade(collection.id);
    }

    for (const matrix of matrices) {
      const entries = await database.collisionMatrixEntries.where("matrixId").equals(matrix.id).toArray();

      for (const entry of entries) {
        await deleteCollisionMatrixEntryCascade(entry.id);
      }

      await database.collisionMatrixRows.where("matrixId").equals(matrix.id).delete();
      await database.collisionMatrixColumns.where("matrixId").equals(matrix.id).delete();
      await database.collisionMatrices.delete(matrix.id);
    }

    await database.devices.delete(deviceId);
  };

  const deleteProjectCascade = async (projectId: ProjectId) => {
    const rawProject = await database.projects.get(projectId);

    if (!rawProject) {
      return;
    }

    const project = parseRecord(projectSchema, rawProject) as Project;
    const devices = await database.devices.where("projectId").equals(projectId).toArray();

    for (const device of devices) {
      await deleteDeviceCascade(device.id);
    }

    await database.projectAssetLibraryImports.where("projectId").equals(projectId).delete();
    await deleteSharingLinksForTarget({ kind: "project", projectId });
    await deleteAssetLibraryCascade(project.defaultAssetLibraryId);
    await database.projects.delete(projectId);
  };

  const deleteProjectFolderCascade = async (projectFolderId: ProjectFolderId) => {
    const [childFolders, projects] = await Promise.all([
      database.folders.where("parentFolderId").equals(projectFolderId).toArray(),
      database.projects.where("folderId").equals(projectFolderId).toArray()
    ]);

    for (const childFolder of childFolders) {
      await deleteProjectFolderCascade(childFolder.id);
    }

    for (const project of projects) {
      await deleteProjectCascade(project.id);
    }

    await database.folderAccess.where("folderId").equals(projectFolderId).delete();
    await database.folders.delete(projectFolderId);
  };

  return {
    loadProjectTree: (userId) =>
    toAppResult(async () => {
      const rawUser = await database.users.get(userId);

      if (!rawUser) {
        throw new NotFoundError("User could not be found.", { entity: "User" });
      }

      const user = parseRecord(userSchema, rawUser) as User;

      const [folderAccess, rawFolders, rawProjects, rawPlatforms] = await Promise.all([
        database.folderAccess.where("userId").equals(userId).toArray(),
        database.folders.toArray(),
        database.projects.toArray(),
        database.platforms.toArray()
      ]);

      const folders = rawFolders.map((folder) => parseRecord(projectFolderSchema, folder) as ProjectFolder);
      const projects = rawProjects.map((project) => parseRecord(projectSchema, project) as Project);
      const platforms = rawPlatforms.map((platform) => parseRecord(platformSchema, platform) as Platform);
      const accessibleFolderIds = new Set(
        folderAccess.map((access) => parseRecord(folderAccessSchema, access).folderId as ProjectFolderId)
      );
      const foldersByParentId = new Map<ProjectFolderId | null, ProjectFolder[]>();
      const projectsByFolderId = new Map<ProjectFolderId | null, Project[]>();

      for (const folder of folders) {
        const siblings = foldersByParentId.get(folder.parentFolderId) ?? [];
        siblings.push(folder);
        foldersByParentId.set(folder.parentFolderId, siblings);
      }

      for (const project of projects) {
        const folderProjects = projectsByFolderId.get(project.folderId) ?? [];
        folderProjects.push(project);
        projectsByFolderId.set(project.folderId, folderProjects);
      }

      for (const siblings of foldersByParentId.values()) {
        sortByName(siblings);
      }

      for (const folderProjects of projectsByFolderId.values()) {
        sortByName(folderProjects);
      }

      const roots = sortByName(folders.filter((folder) => accessibleFolderIds.has(folder.id))).map((folder) =>
        buildFolderNode(folder, foldersByParentId, projectsByFolderId)
      );
      const rootProjects = projectsByFolderId.get(null) ?? [];

      return { user, roots, rootProjects: sortByName(rootProjects), platforms };
    }),
  loadProjectWorkspace: (projectId) =>
    toAppResult(async () => {
      const rawProject = await database.projects.get(projectId);

      if (!rawProject) {
        throw new NotFoundError("Project could not be found.", { entity: "Project" });
      }

      const project = parseRecord(projectSchema, rawProject) as Project;
      const [rawFolder, rawDefaultAssetLibrary, rawImports, rawDevices, rawPlatforms] = await Promise.all([
        project.folderId ? database.folders.get(project.folderId) : Promise.resolve(null),
        database.assetLibraries.get(project.defaultAssetLibraryId),
        database.projectAssetLibraryImports.where("projectId").equals(project.id).toArray(),
        database.devices.where("projectId").equals(project.id).toArray(),
        database.platforms.toArray()
      ]);

      if (project.folderId && !rawFolder) {
        throw new NotFoundError("Project folder could not be found.", { entity: "ProjectFolder" });
      }

      if (!rawDefaultAssetLibrary) {
        throw new NotFoundError("Default asset library could not be found.", { entity: "AssetLibrary" });
      }

      const folder = rawFolder ? (parseRecord(projectFolderSchema, rawFolder) as ProjectFolder) : null;
      const defaultAssetLibrary = parseRecord(assetLibrarySchema, rawDefaultAssetLibrary) as AssetLibrary;
      const imports = rawImports.map((record) => parseRecord(projectAssetLibraryImportSchema, record));
      const importedAssetLibraries = await Promise.all(
        imports.map(async (record) => {
          const library = await database.assetLibraries.get(asEntityId<AssetLibraryId>(record.assetLibraryId));

          if (!library) {
            throw new NotFoundError("Imported asset library could not be found.", {
              entity: "AssetLibrary"
            });
          }

          return parseRecord(assetLibrarySchema, library) as AssetLibrary;
        })
      );
      const platforms = new Map(
        rawPlatforms.map((platform) => {
          const parsedPlatform = parseRecord(platformSchema, platform) as Platform;
          return [parsedPlatform.id, parsedPlatform] as const;
        })
      );
      const devices = await Promise.all(
        sortByCreatedAtThenName(rawDevices.map((device) => parseRecord(deviceSchema, device) as Device)).map(
          async (device) => {
            const platform = platforms.get(device.platformId);
            const rawCollisionMatrix = await database.collisionMatrices.where("deviceId").equals(device.id).first();

            if (!platform) {
              throw new NotFoundError("Device platform could not be found.", { entity: "Platform" });
            }

            if (!rawCollisionMatrix) {
              throw new NotFoundError("Device collision matrix could not be found.", {
                entity: "CollisionMatrix"
              });
            }

            const collisionMatrix = parseRecord(collisionMatrixSchema, rawCollisionMatrix) as CollisionMatrix;
            const rawCollections = await database.collections.where("deviceId").equals(device.id).toArray();
            const collections = rawCollections.map((collection) => parseRecord(collectionSchema, collection) as Collection);
            const eventCount = (
              await Promise.all(
                collections.map((collection) =>
                  database.events.where("collectionId").equals(collection.id).count()
                )
              )
            ).reduce((total, count) => total + count, 0);

            return {
              device,
              platform,
              collisionMatrix,
              collectionCount: collections.length,
              eventCount
            };
          }
        )
      );

      return {
        project,
        folder,
        defaultAssetLibrary,
        importedAssetLibraries: sortByName(importedAssetLibraries),
        platforms: sortByName([...platforms.values()]),
        devices
      };
    }),
  loadAssetLibraries: () =>
    toAppResult(async () => {
      const [rawLibraries, rawFolders, rawAssets, rawImports, rawProjects] = await Promise.all([
        database.assetLibraries.toArray(),
        database.assetLibraryFolders.toArray(),
        database.assets.toArray(),
        database.projectAssetLibraryImports.toArray(),
        database.projects.toArray()
      ]);
      const libraries = rawLibraries.map((library) => parseRecord(assetLibrarySchema, library) as AssetLibrary);
      const folders = rawFolders.map(
        (folder) => parseRecord(assetLibraryFolderSchema, folder) as AssetLibraryFolder
      );
      const assets = rawAssets.map((asset) => parseRecord(assetSchema, asset) as Asset);
      const imports = rawImports.map(
        (libraryImport) =>
          parseRecord(projectAssetLibraryImportSchema, libraryImport) as ProjectAssetLibraryImport
      );
      const projects = new Map(
        rawProjects
          .map((project) => parseRecord(projectSchema, project) as Project)
          .map((project) => [project.id, project])
      );

      const rootFoldersByLibraryId = new Map<AssetLibraryId, AssetLibraryFolder>();
      const folderCountsByLibraryId = new Map<AssetLibraryId, number>();
      const assetCountsByLibraryId = new Map<AssetLibraryId, number>();
      const importCountsByLibraryId = new Map<AssetLibraryId, number>();

      for (const folder of folders) {
        folderCountsByLibraryId.set(folder.libraryId, (folderCountsByLibraryId.get(folder.libraryId) ?? 0) + 1);

        if (folder.parentFolderId === null) {
          rootFoldersByLibraryId.set(folder.libraryId, folder);
        }
      }

      for (const asset of assets) {
        assetCountsByLibraryId.set(asset.libraryId, (assetCountsByLibraryId.get(asset.libraryId) ?? 0) + 1);
      }

      for (const libraryImport of imports) {
        importCountsByLibraryId.set(
          libraryImport.assetLibraryId,
          (importCountsByLibraryId.get(libraryImport.assetLibraryId) ?? 0) + 1
        );
      }

      return {
        libraries: sortByName(libraries).map((library) => {
          const rootFolder = rootFoldersByLibraryId.get(library.id);

          if (!rootFolder) {
            throw fromUnknownPersistenceError(
              new Error(`Expected one root folder for asset library ${library.id}; found none.`),
              "Local demo data failed validation."
            );
          }

          return {
            library,
            rootFolder,
            assetCount: assetCountsByLibraryId.get(library.id) ?? 0,
            folderCount: folderCountsByLibraryId.get(library.id) ?? 0,
            importedByProjectCount: importCountsByLibraryId.get(library.id) ?? 0,
            defaultForProject: library.defaultForProjectId
              ? projects.get(library.defaultForProjectId) ?? null
              : null
          };
        })
      };
    }),
  loadAssetLibraryTree: (libraryId) =>
    toAppResult(async () => {
      const rawLibrary = await database.assetLibraries.get(libraryId);

      if (!rawLibrary) {
        throw new NotFoundError("Asset library could not be found.", { entity: "AssetLibrary" });
      }

      const library = parseRecord(assetLibrarySchema, rawLibrary) as AssetLibrary;
      const [rawFolders, rawAssets] = await Promise.all([
        database.assetLibraryFolders.where("libraryId").equals(library.id).toArray(),
        database.assets.where("libraryId").equals(library.id).toArray()
      ]);
      const folders = rawFolders.map(
        (folder) => parseRecord(assetLibraryFolderSchema, folder) as AssetLibraryFolder
      );
      const assets = await Promise.all(rawAssets.map((asset) => resolveAsset(asset)));
      const rootFolders = folders.filter((folder) => folder.parentFolderId === null);

      if (rootFolders.length !== 1) {
        throw fromUnknownPersistenceError(
          new Error(`Expected one root folder for asset library ${library.id}; found ${rootFolders.length}.`),
          "Local demo data failed validation."
        );
      }

      const foldersByParentId = new Map<AssetLibraryFolderId | null, AssetLibraryFolder[]>();
      const assetsByFolderId = new Map<AssetLibraryFolderId, Asset[]>();

      for (const folder of folders) {
        const siblings = foldersByParentId.get(folder.parentFolderId) ?? [];
        siblings.push(folder);
        foldersByParentId.set(folder.parentFolderId, siblings);
      }

      for (const asset of assets) {
        const folderAssets = assetsByFolderId.get(asset.folderId) ?? [];
        folderAssets.push(asset);
        assetsByFolderId.set(asset.folderId, folderAssets);
      }

      for (const siblings of foldersByParentId.values()) {
        sortByName(siblings);
      }

      for (const folderAssets of assetsByFolderId.values()) {
        sortByName(folderAssets);
      }

      return {
        library,
        rootFolder: buildAssetLibraryFolderNode(rootFolders[0], foldersByParentId, assetsByFolderId)
      };
    }),
  createProject: (input) =>
    toAppResult(async () => {
      const command = parseCommand(createProjectCommandSchema, input);
      const createInput: CreateProjectInput = {
        folderId: command.folderId ? asEntityId<ProjectFolderId>(command.folderId) : null,
        name: command.name,
        devices: command.devices.map((device) => ({
          platformId: asEntityId<PlatformId>(device.platformId),
          name: device.name
        })),
        starterEventTypes: command.starterEventTypes
      };

      const [targetFolder, rawFolders, rawProjects, rawPlatforms] = await Promise.all([
        createInput.folderId ? database.folders.get(createInput.folderId) : Promise.resolve(null),
        database.folders.toArray(),
        database.projects.toArray(),
        database.platforms.toArray()
      ]);

      if (createInput.folderId && !targetFolder) {
        throw new NotFoundError("Project folder could not be found.", { entity: "ProjectFolder" });
      }

      const parsedFolders = rawFolders.map(
        (folder) => parseRecord(projectFolderSchema, folder) as ProjectFolder
      );
      const parsedProjects = rawProjects.map((project) => parseRecord(projectSchema, project) as Project);
      const platforms = rawPlatforms.map((platform) => parseRecord(platformSchema, platform) as Platform);
      const platformsById = new Map(platforms.map((platform) => [platform.id, platform]));
      const folderRule = canAddProjectToFolder(
        createInput.folderId,
        createInput.name,
        parsedFolders,
        parsedProjects
      );

      if (folderRule.isErr()) {
        throw folderRule.error;
      }

      const selectedDeviceInputs = createInput.devices ?? [];

      for (const deviceInput of selectedDeviceInputs) {
        if (!platformsById.has(deviceInput.platformId)) {
          throw new NotFoundError("Platform could not be found.", { entity: "Platform" });
        }
      }

      for (let index = 0; index < selectedDeviceInputs.length; index += 1) {
        const duplicateRule = canCreateDevice(
          {
            projectId: asEntityId<ProjectId>("project_pending"),
            platformId: selectedDeviceInputs[index].platformId,
            name: selectedDeviceInputs[index].name
          },
          selectedDeviceInputs.slice(0, index).map((deviceInput, previousIndex) => ({
            id: asEntityId<DeviceId>(`device_pending_${previousIndex}`),
            projectId: asEntityId<ProjectId>("project_pending"),
            platformId: deviceInput.platformId,
            name: deviceInput.name,
            createdAt: currentISODateString(),
            updatedAt: currentISODateString(),
            isEnabled: true
          }))
        );

        if (duplicateRule.isErr()) {
          throw duplicateRule.error;
        }
      }

      const records = createDefaultProjectRecords(createInput, platformsById);
      const creationRule = validateProjectCreationRecords(records);

      if (creationRule.isErr()) {
        throw creationRule.error;
      }

      for (const deviceRecords of records.devices) {
        const deviceRule = validateDeviceCreationRecords(
          deviceRecords.device,
          deviceRecords.collisionMatrix
        );

        if (deviceRule.isErr()) {
          throw deviceRule.error;
        }
      }

      await database.transaction(
        "rw",
        [
          database.projects,
          database.assetLibraries,
          database.assetLibraryFolders,
          database.devices,
          database.collisionMatrices,
          database.collections,
          database.events
        ],
        async () => {
          await database.projects.add(records.project);
          await database.assetLibraries.add(records.defaultAssetLibrary);
          await database.assetLibraryFolders.add(records.rootFolder);
          await database.devices.bulkAdd(records.devices.map((deviceRecords) => deviceRecords.device));
          await database.collisionMatrices.bulkAdd(
            records.devices.map((deviceRecords) => deviceRecords.collisionMatrix)
          );
          await database.collections.bulkAdd(
            records.devices.map((deviceRecords) => deviceRecords.defaultCollection)
          );
          await database.events.bulkAdd(records.devices.flatMap((deviceRecords) => deviceRecords.starterEvents));
        }
      );

      return {
        project: parseRecord(projectSchema, records.project) as Project,
        defaultAssetLibrary: parseRecord(assetLibrarySchema, records.defaultAssetLibrary) as AssetLibrary,
        rootFolder: parseRecord(assetLibraryFolderSchema, records.rootFolder) as AssetLibraryFolder,
        devices: records.devices.map((deviceRecords) => ({
          device: parseRecord(deviceSchema, deviceRecords.device) as Device,
          platform: parseRecord(platformSchema, deviceRecords.platform) as Platform,
          collisionMatrix: parseRecord(
            collisionMatrixSchema,
            deviceRecords.collisionMatrix
          ) as CollisionMatrix,
          defaultCollection: parseRecord(
            collectionSchema,
            deviceRecords.defaultCollection
          ) as Collection,
          starterEvents: deviceRecords.starterEvents.map(
            (starterEvent) => parseRecord(eventSchema, starterEvent) as Event
          )
        }))
      };
    }),
  deleteProject: (projectId) =>
    toAppResult(async () => {
      const rawProject = await database.projects.get(projectId);

      if (!rawProject) {
        throw new NotFoundError("Project could not be found.", { entity: "Project" });
      }

      await database.transaction("rw", deleteTransactionTables(), async () => {
        await deleteProjectCascade(projectId);
      });
    }),
  createProjectFolder: (input) =>
    toAppResult(async () => {
      const command = parseCommand(createProjectFolderCommandSchema, input);

      const createInput: CreateProjectFolderInput = {
        parentFolderId: command.parentFolderId ? asEntityId<ProjectFolderId>(command.parentFolderId) : null,
        createdByUserId: command.createdByUserId ? asEntityId<UserId>(command.createdByUserId) : undefined,
        name: command.name
      };

      const [parentFolder, rawFolders] = await Promise.all([
        createInput.parentFolderId ? database.folders.get(createInput.parentFolderId) : Promise.resolve(null),
        database.folders.toArray()
      ]);

      if (createInput.parentFolderId && !parentFolder) {
        throw new NotFoundError("Parent project folder could not be found.", { entity: "ProjectFolder" });
      }

      const folders = rawFolders.map((folder) => parseRecord(projectFolderSchema, folder) as ProjectFolder);
      const folderRule = canAddChildFolder(createInput.parentFolderId, createInput.name, folders);

      if (folderRule.isErr()) {
        throw folderRule.error;
      }

      const folder = parseRecord(projectFolderSchema, createProjectFolderRecord(createInput)) as ProjectFolder;

      if (createInput.parentFolderId === null) {
        const userId = createInput.createdByUserId;

        if (!userId) {
          throw new ConstraintError("Root project folders need a user access owner.", {
            constraint: "root-project-folder-access-owner"
          });
        }

        const user = await database.users.get(userId);

        if (!user) {
          throw new NotFoundError("User could not be found.", { entity: "User" });
        }

        await database.transaction("rw", database.folders, database.folderAccess, async () => {
          await database.folders.add(folder);
          await database.folderAccess.add({ userId, folderId: folder.id });
        });
      } else {
        await database.folders.add(folder);
      }

      return folder;
    }),
  deleteProjectFolder: (projectFolderId) =>
    toAppResult(async () => {
      const rawFolder = await database.folders.get(projectFolderId);

      if (!rawFolder) {
        throw new NotFoundError("Project folder could not be found.", { entity: "ProjectFolder" });
      }

      await database.transaction("rw", deleteTransactionTables(), async () => {
        await deleteProjectFolderCascade(projectFolderId);
      });
    }),
  createAssetLibrary: (input) =>
    toAppResult(async () => {
      const command = parseCommand(createAssetLibraryCommandSchema, input);
      const records = createStandaloneAssetLibraryRecords({ name: command.name });
      const library = parseRecord(assetLibrarySchema, records.library) as AssetLibrary;
      const rootFolder = parseRecord(assetLibraryFolderSchema, records.rootFolder) as AssetLibraryFolder;

      await database.transaction("rw", database.assetLibraries, database.assetLibraryFolders, async () => {
        await database.assetLibraries.add(library);
        await database.assetLibraryFolders.add(rootFolder);
      });

      return { library, rootFolder };
    }),
  deleteAssetLibrary: (assetLibraryId) =>
    toAppResult(async () => {
      const rawLibrary = await database.assetLibraries.get(assetLibraryId);

      if (!rawLibrary) {
        throw new NotFoundError("Asset library could not be found.", { entity: "AssetLibrary" });
      }

      const library = parseRecord(assetLibrarySchema, rawLibrary) as AssetLibrary;

      if (library.defaultForProjectId) {
        throw new ConstraintError("A project's default asset library can only be deleted with its project.", {
          constraint: "default-asset-library-delete-protected"
        });
      }

      await database.transaction("rw", deleteTransactionTables(), async () => {
        await deleteAssetLibraryCascade(assetLibraryId);
      });
    }),
  createAssetLibraryFolder: (input) =>
    toAppResult(async () => {
      const command = parseCommand(createAssetLibraryFolderCommandSchema, input);
      const createInput: CreateAssetLibraryFolderInput = {
        libraryId: asEntityId<AssetLibraryId>(command.libraryId),
        parentFolderId: asEntityId<AssetLibraryFolderId>(command.parentFolderId),
        name: command.name,
        icon: command.icon
      };
      const [rawLibrary, rawParentFolder, rawFolders] = await Promise.all([
        database.assetLibraries.get(createInput.libraryId),
        database.assetLibraryFolders.get(createInput.parentFolderId),
        database.assetLibraryFolders.where("libraryId").equals(createInput.libraryId).toArray()
      ]);

      if (!rawLibrary) {
        throw new NotFoundError("Asset library could not be found.", { entity: "AssetLibrary" });
      }

      if (!rawParentFolder) {
        throw new NotFoundError("Parent asset folder could not be found.", { entity: "AssetLibraryFolder" });
      }

      const parentFolder = parseRecord(assetLibraryFolderSchema, rawParentFolder) as AssetLibraryFolder;

      if (parentFolder.libraryId !== createInput.libraryId) {
        throw new ConstraintError("Parent asset folder must belong to the selected library.", {
          constraint: "asset-folder-library-membership"
        });
      }

      const existingFolders = rawFolders.map(
        (folder) => parseRecord(assetLibraryFolderSchema, folder) as AssetLibraryFolder
      );
      const leafRule = canAddChildFolderToAssetFolder(
        createInput.parentFolderId,
        createInput.name,
        existingFolders
      );

      if (leafRule.isErr()) {
        throw leafRule.error;
      }

      const record = createAssetLibraryFolderRecord(createInput);
      const folder = parseRecord(assetLibraryFolderSchema, record) as AssetLibraryFolder;

      await database.assetLibraryFolders.add(folder);

      return folder;
    }),
  deleteAssetLibraryFolder: (assetLibraryFolderId) =>
    toAppResult(async () => {
      const rawFolder = await database.assetLibraryFolders.get(assetLibraryFolderId);

      if (!rawFolder) {
        throw new NotFoundError("Asset folder could not be found.", { entity: "AssetLibraryFolder" });
      }

      const folder = parseRecord(assetLibraryFolderSchema, rawFolder) as AssetLibraryFolder;

      if (folder.parentFolderId === null) {
        throw new ConstraintError("An asset library root folder can only be deleted with its library.", {
          constraint: "asset-library-root-folder-delete-protected"
        });
      }

      await database.transaction("rw", deleteTransactionTables(), async () => {
        await deleteAssetLibraryFolderCascade(assetLibraryFolderId);
      });
    }),
  createAsset: (input) =>
    toAppResult(async () => {
      const command = parseCommand(createAssetCommandSchema, input);
      const createInput: CreateAssetInput = {
        libraryId: asEntityId<AssetLibraryId>(command.libraryId),
        folderId: asEntityId<AssetLibraryFolderId>(command.folderId),
        name: command.name,
        assetId: command.assetId,
        mediaKind: command.mediaKind,
        originalFilename: command.originalFilename,
        playbackUrl: command.playbackUrl,
        blob: command.blob,
        contentType: command.contentType
      };

      if (!createInput.playbackUrl && !createInput.blob) {
        throw new ValidationError("Asset creation requires a playback URL or uploaded file data.", {
          field: "playbackUrl"
        });
      }
      const [rawLibrary, rawFolder, rawFolders, rawAssets] = await Promise.all([
        database.assetLibraries.get(createInput.libraryId),
        database.assetLibraryFolders.get(createInput.folderId),
        database.assetLibraryFolders.where("libraryId").equals(createInput.libraryId).toArray(),
        database.assets.where("folderId").equals(createInput.folderId).toArray()
      ]);

      if (!rawLibrary) {
        throw new NotFoundError("Asset library could not be found.", { entity: "AssetLibrary" });
      }

      if (!rawFolder) {
        throw new NotFoundError("Asset folder could not be found.", { entity: "AssetLibraryFolder" });
      }

      const folder = parseRecord(assetLibraryFolderSchema, rawFolder) as AssetLibraryFolder;

      if (folder.libraryId !== createInput.libraryId) {
        throw new ConstraintError("Asset folder must belong to the selected library.", {
          constraint: "asset-folder-library-membership"
        });
      }

      const existingFolders = rawFolders.map(
        (childFolder) => parseRecord(assetLibraryFolderSchema, childFolder) as AssetLibraryFolder
      );
      const existingAssets = rawAssets.map((asset) => parseRecord(assetSchema, asset) as Asset);
      const leafRule = canAddAssetToFolder(
        createInput.folderId,
        createInput.name,
        existingFolders,
        existingAssets
      );

      if (leafRule.isErr()) {
        throw leafRule.error;
      }

      const records = createAssetRecords(createInput);
      const asset = parseRecord(assetSchema, records.asset) as Asset;
      const assetBlob = records.assetBlob
        ? (parseRecord(assetBlobSchema, records.assetBlob) as AssetBlob)
        : null;

      await database.transaction("rw", database.assets, database.assetBlobs, async () => {
        await database.assets.add(asset);

        if (assetBlob) {
          await database.assetBlobs.add(assetBlob);
        }
      });

      return asset;
    }),
  deleteAsset: (assetId) =>
    toAppResult(async () => {
      const rawAsset = await database.assets.get(assetId);

      if (!rawAsset) {
        throw new NotFoundError("Asset could not be found.", { entity: "Asset" });
      }

      await database.transaction("rw", deleteTransactionTables(), async () => {
        await deleteAssetCascade(assetId);
      });
    }),
  importAssetLibrary: (input) =>
    toAppResult(async () => {
      const command = parseCommand(importAssetLibraryCommandSchema, input);
      const importInput: ImportAssetLibraryInput = {
        projectId: asEntityId<ProjectId>(command.projectId),
        assetLibraryId: asEntityId<AssetLibraryId>(command.assetLibraryId)
      };
      const [rawProject, rawLibrary, existingImport] = await Promise.all([
        database.projects.get(importInput.projectId),
        database.assetLibraries.get(importInput.assetLibraryId),
        database.projectAssetLibraryImports.get([importInput.projectId, importInput.assetLibraryId])
      ]);

      if (!rawProject) {
        throw new NotFoundError("Project could not be found.", { entity: "Project" });
      }

      if (!rawLibrary) {
        throw new NotFoundError("Asset library could not be found.", { entity: "AssetLibrary" });
      }

      if (existingImport) {
        throw new ConflictError("Asset library is already imported into this project.", {
          constraint: "project-library-import-unique"
        });
      }

      const project = parseRecord(projectSchema, rawProject) as Project;
      const importRule = canImportAssetLibrary(project, importInput.assetLibraryId);

      if (importRule.isErr()) {
        throw importRule.error;
      }

      const record = parseRecord(projectAssetLibraryImportSchema, importInput) as ProjectAssetLibraryImport;

      await database.projectAssetLibraryImports.add(record);

      return record;
    }),
  createDevice: (input) =>
    toAppResult(async () => {
      const command = parseCommand(createDeviceCommandSchema, input);
      const createInput: CreateDeviceInput = {
        projectId: asEntityId<ProjectId>(command.projectId),
        platformId: asEntityId<PlatformId>(command.platformId),
        name: command.name,
        isEnabled: command.isEnabled
      };

      const [project, platform, existingDevices] = await Promise.all([
        database.projects.get(createInput.projectId),
        database.platforms.get(createInput.platformId),
        database.devices.where("projectId").equals(createInput.projectId).toArray()
      ]);

      if (!project) {
        throw new NotFoundError("Project could not be found.", { entity: "Project" });
      }

      if (!platform) {
        throw new NotFoundError("Platform could not be found.", { entity: "Platform" });
      }

      const parsedExistingDevices = existingDevices.map((device) => parseRecord(deviceSchema, device) as Device);
      const duplicateRule = canCreateDevice(createInput, parsedExistingDevices);

      if (duplicateRule.isErr()) {
        throw duplicateRule.error;
      }

      const records = createDeviceRecords(createInput);
      const parsedPlatform = parseRecord(platformSchema, platform) as Platform;
      const creationRule = validateDeviceCreationRecords(records.device, records.collisionMatrix);

      if (creationRule.isErr()) {
        throw creationRule.error;
      }

      await database.transaction("rw", database.devices, database.collisionMatrices, async () => {
        await database.devices.add(records.device);
        await database.collisionMatrices.add(records.collisionMatrix);
      });

      return {
        device: parseRecord(deviceSchema, records.device) as Device,
        platform: parsedPlatform,
        collisionMatrix: parseRecord(collisionMatrixSchema, records.collisionMatrix) as CollisionMatrix
      };
    }),
  updateDevice: (input) =>
    toAppResult(async () => {
      const command = parseCommand(updateDeviceCommandSchema, input);
      const deviceId = asEntityId<DeviceId>(command.deviceId);
      const rawDevice = await database.devices.get(deviceId);

      if (!rawDevice) {
        throw new NotFoundError("Device could not be found.", { entity: "Device" });
      }

      const device = parseRecord(deviceSchema, rawDevice) as Device;
      const updatedDevice = parseRecord(deviceSchema, {
        ...device,
        name: command.name ?? device.name,
        isEnabled: command.isEnabled ?? device.isEnabled,
        updatedAt: currentISODateString()
      }) as Device;

      if (updatedDevice.name !== device.name) {
        const existingDevices = (
          await database.devices.where("projectId").equals(updatedDevice.projectId).toArray()
        )
          .map((existingDevice) => parseRecord(deviceSchema, existingDevice) as Device)
          .filter((existingDevice) => existingDevice.id !== device.id);
        const duplicateRule = canCreateDevice(
          {
            projectId: updatedDevice.projectId,
            platformId: updatedDevice.platformId,
            name: updatedDevice.name
          },
          existingDevices
        );

        if (duplicateRule.isErr()) {
          throw duplicateRule.error;
        }
      }

      await database.devices.put(updatedDevice);

      return updatedDevice;
    }),
  deleteDevice: (deviceId) =>
    toAppResult(async () => {
      const rawDevice = await database.devices.get(deviceId);

      if (!rawDevice) {
        throw new NotFoundError("Device could not be found.", { entity: "Device" });
      }

      await database.transaction("rw", deleteTransactionTables(), async () => {
        await deleteDeviceCascade(deviceId);
      });
    }),
  loadDeviceWorkspace: (deviceId) =>
    toAppResult(async () => {
      const rawDevice = await database.devices.get(deviceId);

      if (!rawDevice) {
        throw new NotFoundError("Device could not be found.", { entity: "Device" });
      }

      const device = parseRecord(deviceSchema, rawDevice) as Device;
      const [rawProject, rawPlatform, rawCollisionMatrix] = await Promise.all([
        database.projects.get(device.projectId),
        database.platforms.get(device.platformId),
        database.collisionMatrices.where("deviceId").equals(device.id).first()
      ]);

      if (!rawProject) {
        throw new NotFoundError("Project could not be found.", { entity: "Project" });
      }

      if (!rawPlatform) {
        throw new NotFoundError("Platform could not be found.", { entity: "Platform" });
      }

      if (!rawCollisionMatrix) {
        throw new NotFoundError("Device collision matrix could not be found.", { entity: "CollisionMatrix" });
      }

      const project = parseRecord(projectSchema, rawProject) as Project;
      const platform = parseRecord(platformSchema, rawPlatform) as Platform;
      const collisionMatrix = parseRecord(collisionMatrixSchema, rawCollisionMatrix) as CollisionMatrix;
      const [rawCollections, rawTriggers, rawImports, rawAssets, rawLibraries] = await Promise.all([
        database.collections.where("deviceId").equals(device.id).toArray(),
        database.triggers.toArray(),
        database.projectAssetLibraryImports.where("projectId").equals(project.id).toArray(),
        database.assets.toArray(),
        database.assetLibraries.toArray()
      ]);
      const importedLibraryIds = rawImports.map(
        (record) => parseRecord(projectAssetLibraryImportSchema, record).assetLibraryId as AssetLibraryId
      );
      const eligibleLibraryIds = new Set<AssetLibraryId>([
        project.defaultAssetLibraryId,
        ...importedLibraryIds
      ]);
      const librariesById = new Map(
        rawLibraries
          .map((library) => parseRecord(assetLibrarySchema, library) as AssetLibrary)
          .map((library) => [library.id, library])
      );
      const triggers = rawTriggers
        .map((trigger) => parseRecord(triggerSchema, trigger) as Trigger)
        .sort((first, second) => first.name.localeCompare(second.name));
      const playbackAssets = sortByName(
        (await Promise.all(rawAssets.map((asset) => resolveAsset(asset))))
          .filter((asset) => eligibleLibraryIds.has(asset.libraryId))
          .map((asset) => {
            const library = librariesById.get(asset.libraryId);

            if (!library) {
              throw new NotFoundError("Playback asset library could not be found.", { entity: "AssetLibrary" });
            }

            return {
              ...asset,
              libraryName: library.name,
              isDefaultLibrary: asset.libraryId === project.defaultAssetLibraryId,
              isImportedLibrary: importedLibraryIds.includes(asset.libraryId)
            };
          })
      );
      const collections = await Promise.all(
        sortByName(rawCollections.map((collection) => parseRecord(collectionSchema, collection) as Collection)).map(
          async (collection) => {
            const rawEvents = await database.events.where("collectionId").equals(collection.id).toArray();
            const events = await Promise.all(
              sortByEventOrder(rawEvents.map((event) => parseRecord(eventSchema, event) as Event)).map(async (event) => {
                const rawEventTriggers = await database.eventTriggers.where("eventId").equals(event.id).toArray();
                const eventTriggers = await Promise.all(
                  rawEventTriggers.map(async (eventTrigger) => {
                    const parsedEventTrigger = parseRecord(eventTriggerSchema, eventTrigger) as EventTrigger;
                    const rawPlaybacks = await database.triggerPlaybacks
                      .where("eventTriggerId")
                      .equals(parsedEventTrigger.id)
                      .toArray();

                    return {
                      ...parsedEventTrigger,
                      playbacks: rawPlaybacks
                        .map((playback) => parseRecord(triggerPlaybackSchema, playback) as TriggerPlayback)
                        .sort((first, second) => first.startOffset - second.startOffset)
                    };
                  })
                );

                return {
                  event,
                  eventTriggers: eventTriggers.sort((first, second) => first.triggerId.localeCompare(second.triggerId))
                };
              })
            );

            return { collection, events };
          }
        )
      );
      const [rawMatrixRows, rawMatrixColumns, rawMatrixEntries] = await Promise.all([
        database.collisionMatrixRows.where("matrixId").equals(collisionMatrix.id).toArray(),
        database.collisionMatrixColumns.where("matrixId").equals(collisionMatrix.id).toArray(),
        database.collisionMatrixEntries.where("matrixId").equals(collisionMatrix.id).toArray()
      ]);

      return {
        project,
        device,
        platform,
        collisionMatrix,
        triggers,
        playbackAssets,
        collections,
        matrixRows: rawMatrixRows.map((row) => parseRecord(collisionMatrixRowSchema, row) as CollisionMatrixRow),
        matrixColumns: rawMatrixColumns.map(
          (column) => parseRecord(collisionMatrixColumnSchema, column) as CollisionMatrixColumn
        ),
        matrixEntries: rawMatrixEntries.map(
          (entry) => parseRecord(collisionMatrixEntrySchema, entry) as CollisionMatrixEntry
        )
      };
    }),
  createCollection: (input) =>
    toAppResult(async () => {
      const command = parseCommand(createCollectionCommandSchema, input);
      const createInput: CreateCollectionInput = {
        deviceId: asEntityId<DeviceId>(command.deviceId),
        name: command.name
      };
      const device = await database.devices.get(createInput.deviceId);

      if (!device) {
        throw new NotFoundError("Device could not be found.", { entity: "Device" });
      }

      const record = createCollectionRecord(createInput);
      const collection = parseRecord(collectionSchema, record) as Collection;

      await database.collections.add(collection);

      return collection;
    }),
  updateCollection: (input) =>
    toAppResult(async () => {
      const command = parseCommand(updateCollectionCommandSchema, input);
      const collectionId = asEntityId<CollectionId>(command.collectionId);
      const rawCollection = await database.collections.get(collectionId);

      if (!rawCollection) {
        throw new NotFoundError("Collection could not be found.", { entity: "Collection" });
      }

      const collection = parseRecord(collectionSchema, rawCollection) as Collection;
      const updatedCollection = parseRecord(collectionSchema, {
        ...collection,
        name: command.name
      }) as Collection;

      await database.collections.put(updatedCollection);

      return updatedCollection;
    }),
  deleteCollection: (collectionId) =>
    toAppResult(async () => {
      const rawCollection = await database.collections.get(collectionId);

      if (!rawCollection) {
        throw new NotFoundError("Collection could not be found.", { entity: "Collection" });
      }

      await database.transaction("rw", deleteTransactionTables(), async () => {
        await deleteCollectionCascade(collectionId);
      });
    }),
  createEvent: (input) =>
    toAppResult(async () => {
      const command = parseCommand(createEventCommandSchema, input);
      const createInput: CreateEventInput = {
        collectionId: asEntityId<CollectionId>(command.collectionId),
        name: command.name,
        eventType: command.eventType
      };
      const collection = await database.collections.get(createInput.collectionId);

      if (!collection) {
        throw new NotFoundError("Collection could not be found.", { entity: "Collection" });
      }

      let event: Event | null = null;

      await database.transaction("rw", database.events, async () => {
        const siblings = (
          await database.events.where("collectionId").equals(createInput.collectionId).toArray()
        ).map((record) => parseRecord(eventSchema, record) as Event);
        const nextSortOrder =
          siblings.length === 0 ? 0 : Math.max(...siblings.map((sibling) => sibling.sortOrder)) + 1;
        const record = createEventRecord({
          ...createInput,
          sortOrder: nextSortOrder
        });
        event = parseRecord(eventSchema, record) as Event;

        await database.events.add(event);
      });

      if (!event) {
        throw new PersistenceError("Event could not be created.", { entity: "Event" });
      }

      return event;
    }),
  reorderCollectionEvents: (input) =>
    toAppResult(async () => {
      const command = parseCommand(reorderCollectionEventsCommandSchema, input);
      const reorderInput: ReorderCollectionEventsInput = {
        collectionId: asEntityId<CollectionId>(command.collectionId),
        orderedEventIds: command.orderedEventIds.map((eventId) => asEntityId<EventId>(eventId))
      };
      const uniqueOrderedEventIds = new Set(reorderInput.orderedEventIds);

      if (uniqueOrderedEventIds.size !== reorderInput.orderedEventIds.length) {
        throw new ConstraintError("Event order cannot contain duplicate events.", {
          constraint: "event-order-unique"
        });
      }

      const collection = await database.collections.get(reorderInput.collectionId);

      if (!collection) {
        throw new NotFoundError("Collection could not be found.", { entity: "Collection" });
      }

      const currentEvents = (
        await database.events.where("collectionId").equals(reorderInput.collectionId).toArray()
      ).map((record) => parseRecord(eventSchema, record) as Event);
      const currentEventIds = new Set(currentEvents.map((event) => event.id));

      if (currentEvents.length !== reorderInput.orderedEventIds.length) {
        throw new ConstraintError("Event order must include every event in the collection exactly once.", {
          constraint: "event-order-exact-permutation"
        });
      }

      const orderedRecords = await database.events.bulkGet(reorderInput.orderedEventIds);
      const reorderedEvents: Event[] = [];

      for (const [index, rawEvent] of orderedRecords.entries()) {
        const eventId = reorderInput.orderedEventIds[index];

        if (!rawEvent) {
          throw new ConstraintError("Event order includes an unknown event.", {
            constraint: "event-order-unknown-event"
          });
        }

        if (rawEvent.collectionId !== reorderInput.collectionId) {
          throw new ConstraintError("Event order cannot include events from another collection.", {
            constraint: "event-order-cross-collection"
          });
        }

        if (!currentEventIds.has(eventId)) {
          throw new ConstraintError("Event order must match the collection's current events.", {
            constraint: "event-order-exact-permutation"
          });
        }

        reorderedEvents.push(
          parseRecord(eventSchema, {
            ...rawEvent,
            sortOrder: index
          }) as Event
        );
      }

      await database.transaction("rw", database.events, async () => {
        await database.events.bulkPut(reorderedEvents);
      });

      return reorderedEvents;
    }),
  updateEvent: (input) =>
    toAppResult(async () => {
      const command = parseCommand(updateEventCommandSchema, input);
      const eventId = asEntityId<EventId>(command.eventId);
      const rawEvent = await database.events.get(eventId);

      if (!rawEvent) {
        throw new NotFoundError("Event could not be found.", { entity: "Event" });
      }

      const event = parseRecord(eventSchema, rawEvent) as Event;
      const updatedEvent = parseRecord(eventSchema, {
        ...event,
        name: command.name ?? event.name,
        eventType: command.eventType ?? event.eventType
      }) as Event;

      await database.events.put(updatedEvent);

      return updatedEvent;
    }),
  deleteEvent: (eventId) =>
    toAppResult(async () => {
      const rawEvent = await database.events.get(eventId);

      if (!rawEvent) {
        throw new NotFoundError("Event could not be found.", { entity: "Event" });
      }

      await database.transaction("rw", deleteTransactionTables(), async () => {
        await deleteEventCascade(eventId);
      });
    }),
  createEventTrigger: (input) =>
    toAppResult(async () => {
      const command = parseCommand(createEventTriggerCommandSchema, input);
      const createInput: CreateEventTriggerInput = {
        eventId: asEntityId<EventId>(command.eventId),
        triggerId: asEntityId<TriggerId>(command.triggerId),
        label: command.label,
        isEnabled: command.isEnabled
      };
      const [event, trigger, rawEventTriggers] = await Promise.all([
        database.events.get(createInput.eventId),
        database.triggers.get(createInput.triggerId),
        database.eventTriggers.where("eventId").equals(createInput.eventId).toArray()
      ]);

      if (!event) {
        throw new NotFoundError("Event could not be found.", { entity: "Event" });
      }

      if (!trigger) {
        throw new NotFoundError("Interaction trigger could not be found.", { entity: "Trigger" });
      }

      const existingEventTriggers = rawEventTriggers.map(
        (eventTrigger) => parseRecord(eventTriggerSchema, eventTrigger) as EventTrigger
      );
      const duplicateRule = canCreateEventTrigger(
        createInput.eventId,
        createInput.triggerId,
        existingEventTriggers
      );

      if (duplicateRule.isErr()) {
        throw duplicateRule.error;
      }

      const record = createEventTriggerRecord(createInput);
      const eventTrigger = parseRecord(eventTriggerSchema, record) as EventTrigger;

      await database.eventTriggers.add(eventTrigger);

      return eventTrigger;
    }),
  updateEventTrigger: (input) =>
    toAppResult(async () => {
      const command = parseCommand(updateEventTriggerCommandSchema, input);
      const eventTriggerId = asEntityId<EventTriggerId>(command.eventTriggerId);
      const rawEventTrigger = await database.eventTriggers.get(eventTriggerId);

      if (!rawEventTrigger) {
        throw new NotFoundError("Event interaction could not be found.", { entity: "EventTrigger" });
      }

      const eventTrigger = parseRecord(eventTriggerSchema, rawEventTrigger) as EventTrigger;
      const updatedEventTrigger = parseRecord(eventTriggerSchema, {
        ...eventTrigger,
        label: command.label === undefined ? eventTrigger.label : command.label,
        isEnabled: command.isEnabled ?? eventTrigger.isEnabled
      }) as EventTrigger;

      await database.eventTriggers.put(updatedEventTrigger);

      return updatedEventTrigger;
    }),
  deleteEventTrigger: (eventTriggerId) =>
    toAppResult(async () => {
      const rawEventTrigger = await database.eventTriggers.get(eventTriggerId);

      if (!rawEventTrigger) {
        throw new NotFoundError("Event interaction could not be found.", { entity: "EventTrigger" });
      }

      await database.transaction("rw", deleteTransactionTables(), async () => {
        await deleteEventTriggerCascade(eventTriggerId);
      });
    }),
  createTriggerPlayback: (input) =>
    toAppResult(async () => {
      const command = parseCommand(createTriggerPlaybackCommandSchema, input);
      const createInput: CreateTriggerPlaybackInput = {
        eventTriggerId: asEntityId<EventTriggerId>(command.eventTriggerId),
        assetId: asEntityId<AssetId>(command.assetId),
        startOffset: command.startOffset
      };
      const offsetRule = canUseTriggerPlaybackOffset(createInput.startOffset);

      if (offsetRule.isErr()) {
        throw offsetRule.error;
      }

      const { project } = await loadProjectForEventTrigger(database, createInput.eventTriggerId);
      await validatePlaybackAssetEligibility(database, project, createInput.assetId);

      const record = createTriggerPlaybackRecord(createInput);
      const playback = parseRecord(triggerPlaybackSchema, record) as TriggerPlayback;

      await database.triggerPlaybacks.add(playback);

      return playback;
    }),
  updateTriggerPlayback: (input) =>
    toAppResult(async () => {
      const command = parseCommand(updateTriggerPlaybackCommandSchema, input);
      const triggerPlaybackId = asEntityId<TriggerPlaybackId>(command.triggerPlaybackId);
      const rawPlayback = await database.triggerPlaybacks.get(triggerPlaybackId);

      if (!rawPlayback) {
        throw new NotFoundError("Trigger playback could not be found.", { entity: "TriggerPlayback" });
      }

      const playback = parseRecord(triggerPlaybackSchema, rawPlayback) as TriggerPlayback;
      const assetId = command.assetId === undefined ? playback.assetId : asEntityId<AssetId>(command.assetId);
      const startOffset = command.startOffset ?? playback.startOffset;
      const offsetRule = canUseTriggerPlaybackOffset(startOffset);

      if (offsetRule.isErr()) {
        throw offsetRule.error;
      }

      const { project } = await loadProjectForEventTrigger(database, playback.eventTriggerId);
      await validatePlaybackAssetEligibility(database, project, assetId);

      const updatedPlayback = parseRecord(triggerPlaybackSchema, {
        ...playback,
        assetId,
        startOffset
      }) as TriggerPlayback;

      await database.triggerPlaybacks.put(updatedPlayback);

      return updatedPlayback;
    }),
  deleteTriggerPlayback: (triggerPlaybackId) =>
    toAppResult(async () => {
      const rawPlayback = await database.triggerPlaybacks.get(triggerPlaybackId);

      if (!rawPlayback) {
        throw new NotFoundError("Trigger playback could not be found.", { entity: "TriggerPlayback" });
      }

      await database.transaction("rw", deleteTransactionTables(), async () => {
        await database.triggerPlaybacks.delete(triggerPlaybackId);
      });
    }),
  loadCollisionMatrix: (matrixId) =>
    toAppResult(async () => loadCollisionMatrixAggregate(database, matrixId)),
  selectCollisionMatrixRow: (input) =>
    toAppResult(async () => {
      const command = parseCommand(selectCollisionMatrixEventCommandSchema, input);
      const selectInput: SelectCollisionMatrixEventInput = {
        matrixId: asEntityId<CollisionMatrixId>(command.matrixId),
        eventId: asEntityId<EventId>(command.eventId)
      };
      const aggregate = await loadCollisionMatrixAggregate(database, selectInput.matrixId);
      const selectionRule = canSelectMatrixEvent(selectInput.eventId, aggregate.collections, aggregate.events);

      if (selectionRule.isErr()) {
        throw selectionRule.error;
      }

      const existingRow = aggregate.rows.find((row) => row.eventId === selectInput.eventId);

      if (existingRow) {
        return existingRow;
      }

      const row = parseRecord(collisionMatrixRowSchema, selectInput) as CollisionMatrixRow;

      await database.collisionMatrixRows.add(row);

      return row;
    }),
  selectCollisionMatrixColumn: (input) =>
    toAppResult(async () => {
      const command = parseCommand(selectCollisionMatrixEventCommandSchema, input);
      const selectInput: SelectCollisionMatrixEventInput = {
        matrixId: asEntityId<CollisionMatrixId>(command.matrixId),
        eventId: asEntityId<EventId>(command.eventId)
      };
      const aggregate = await loadCollisionMatrixAggregate(database, selectInput.matrixId);
      const selectionRule = canSelectMatrixEvent(selectInput.eventId, aggregate.collections, aggregate.events);

      if (selectionRule.isErr()) {
        throw selectionRule.error;
      }

      const existingColumn = aggregate.columns.find((column) => column.eventId === selectInput.eventId);

      if (existingColumn) {
        return existingColumn;
      }

      const column = parseRecord(collisionMatrixColumnSchema, selectInput) as CollisionMatrixColumn;

      await database.collisionMatrixColumns.add(column);

      return column;
    }),
  deselectCollisionMatrixRow: (input) =>
    toAppResult(async () => {
      const command = parseCommand(selectCollisionMatrixEventCommandSchema, input);
      const selectInput: SelectCollisionMatrixEventInput = {
        matrixId: asEntityId<CollisionMatrixId>(command.matrixId),
        eventId: asEntityId<EventId>(command.eventId)
      };
      const rawRow = await database.collisionMatrixRows.get([selectInput.matrixId, selectInput.eventId]);

      if (!rawRow) {
        throw new NotFoundError("Collision Matrix row could not be found.", { entity: "CollisionMatrixRow" });
      }

      await database.transaction("rw", deleteTransactionTables(), async () => {
        await deleteCollisionMatrixEntriesForAxis(selectInput.matrixId, selectInput.eventId, "playing");
        await database.collisionMatrixRows.delete([selectInput.matrixId, selectInput.eventId]);
      });
    }),
  deselectCollisionMatrixColumn: (input) =>
    toAppResult(async () => {
      const command = parseCommand(selectCollisionMatrixEventCommandSchema, input);
      const selectInput: SelectCollisionMatrixEventInput = {
        matrixId: asEntityId<CollisionMatrixId>(command.matrixId),
        eventId: asEntityId<EventId>(command.eventId)
      };
      const rawColumn = await database.collisionMatrixColumns.get([selectInput.matrixId, selectInput.eventId]);

      if (!rawColumn) {
        throw new NotFoundError("Collision Matrix column could not be found.", {
          entity: "CollisionMatrixColumn"
        });
      }

      await database.transaction("rw", deleteTransactionTables(), async () => {
        await deleteCollisionMatrixEntriesForAxis(selectInput.matrixId, selectInput.eventId, "incoming");
        await database.collisionMatrixColumns.delete([selectInput.matrixId, selectInput.eventId]);
      });
    }),
  upsertCollisionMatrixEntry: (input) =>
    toAppResult(async () => {
      const command = parseCommand(upsertCollisionMatrixEntryCommandSchema, input);
      const upsertInput: UpsertCollisionMatrixEntryInput = {
        matrixId: asEntityId<CollisionMatrixId>(command.matrixId),
        playingEventId: asEntityId<EventId>(command.playingEventId),
        incomingEventId: asEntityId<EventId>(command.incomingEventId),
        resolutionBehavior: {
          behaviorName: command.resolutionBehavior.behaviorName,
          targetEventId:
            command.resolutionBehavior.targetEventId === null
              ? null
              : asEntityId<EventId>(command.resolutionBehavior.targetEventId),
          postInterruptionRecovery: command.resolutionBehavior.postInterruptionRecovery,
          systemInterruptionRecovery: command.resolutionBehavior.systemInterruptionRecovery
        }
      };
      const aggregate = await loadCollisionMatrixAggregate(database, upsertInput.matrixId);
      const behaviorRule = canUseResolutionBehavior(upsertInput.resolutionBehavior, upsertInput);

      if (behaviorRule.isErr()) {
        throw behaviorRule.error;
      }

      const existingEntry = aggregate.entries.find(
        (entry) =>
          entry.playingEventId === upsertInput.playingEventId &&
          entry.incomingEventId === upsertInput.incomingEventId
      );

      if (existingEntry) {
        const updatedEntry = parseRecord(collisionMatrixEntrySchema, {
          ...existingEntry,
          resolutionBehavior: upsertInput.resolutionBehavior
        }) as CollisionMatrixEntry;

        await database.collisionMatrixEntries.put(updatedEntry);

        return updatedEntry;
      }

      const creationRule = canCreateMatrixEntry(
        upsertInput,
        aggregate.rows,
        aggregate.columns,
        aggregate.entries
      );

      if (creationRule.isErr()) {
        throw creationRule.error;
      }

      const entry = parseRecord(
        collisionMatrixEntrySchema,
        createCollisionMatrixEntryRecord(upsertInput)
      ) as CollisionMatrixEntry;

      await database.collisionMatrixEntries.add(entry);

      return entry;
    }),
  deleteCollisionMatrixEntry: (collisionMatrixEntryId) =>
    toAppResult(async () => {
      const rawEntry = await database.collisionMatrixEntries.get(collisionMatrixEntryId);

      if (!rawEntry) {
        throw new NotFoundError("Collision Matrix entry could not be found.", {
          entity: "CollisionMatrixEntry"
        });
      }

      await database.transaction("rw", deleteTransactionTables(), async () => {
        await deleteCollisionMatrixEntryCascade(collisionMatrixEntryId);
      });
    }),
  generateSharingLink: (input) =>
    toAppResult(async () => {
      const command = parseCommand(generateSharingLinkCommandSchema, input);
      const generateInput: GenerateSharingLinkInput = {
        target: parseShareTarget(command.target as ShareTarget),
        createdByUserId: asEntityId<UserId>(command.createdByUserId)
      };
      const targetRule = canGenerateSharingLink(generateInput.target);

      if (targetRule.isErr()) {
        throw targetRule.error;
      }

      const rawUser = await database.users.get(generateInput.createdByUserId);

      if (!rawUser) {
        throw new NotFoundError("Sharing link creator could not be found.", { entity: "User" });
      }

      parseRecord(userSchema, rawUser);
      await assertShareTargetExists(database, generateInput.target);

      const sharingLink = parseRecord(sharingLinkSchema, createSharingLinkRecord(generateInput)) as SharingLink;

      await database.sharingLinks.add(sharingLink);

      return sharingLink;
    }),
  deleteSharingLink: (sharingLinkId) =>
    toAppResult(async () => {
      const rawSharingLink = await database.sharingLinks.get(sharingLinkId);

      if (!rawSharingLink) {
        throw new NotFoundError("Sharing link could not be found.", { entity: "SharingLink" });
      }

      await database.transaction("rw", deleteTransactionTables(), async () => {
        await database.sharingLinks.delete(sharingLinkId);
      });
    }),
  lookupSharingLink: (shareToken) =>
    toAppResult(async () => {
      const command = parseCommand(shareRouteParamsSchema, { shareToken });
      const rawSharingLink = await database.sharingLinks
        .where("url")
        .equals(shareUrlForToken(command.shareToken))
        .first();

      if (!rawSharingLink) {
        throw new NotFoundError("Sharing link could not be found.", { entity: "SharingLink" });
      }

      const sharingLink = parseRecord(sharingLinkSchema, rawSharingLink) as SharingLink;

      await assertShareTargetExists(database, sharingLink.target);

      return sharingLink;
    }),
  loadSharingLinkPreview: (shareToken) =>
    toAppResult(async () => {
      const command = parseCommand(shareRouteParamsSchema, { shareToken });
      const rawSharingLink = await database.sharingLinks
        .where("url")
        .equals(shareUrlForToken(command.shareToken))
        .first();

      if (!rawSharingLink) {
        throw new NotFoundError("Sharing link could not be found.", { entity: "SharingLink" });
      }

      const sharingLink = parseRecord(sharingLinkSchema, rawSharingLink) as SharingLink;
      const rawUser = await database.users.get(sharingLink.createdByUserId);

      if (!rawUser) {
        throw new NotFoundError("Sharing link creator could not be found.", { entity: "User" });
      }

      return {
        sharingLink,
        createdByUser: parseRecord(userSchema, rawUser) as User,
        target: await loadSharingPreviewTarget(database, sharingLink.target, resolveAsset)
      };
    })
  };
};
