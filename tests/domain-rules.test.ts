import { describe, expect, it } from "vitest";

import type {
  Asset,
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
  Project,
  ProjectAssetLibraryImport,
  ProjectFolder,
  ResolutionBehavior,
  TriggerPlayback
} from "../domain";
import {
  allowsEmptyLeafFolder,
  canAddAssetToFolder,
  canAddChildFolder,
  canAddChildFolderToAssetFolder,
  canAddProjectToFolder,
  canCreateDevice,
  canCreateEventTrigger,
  canCreateMatrixEntry,
  canGenerateSharingLink,
  canImportAssetLibrary,
  canSelectMatrixEvent,
  canUseAssetInProject,
  canUseResolutionBehavior,
  canUseTriggerPlaybackOffset,
  collectionHasNoChildCollections,
  getPreviewableTriggerPlaybacks,
  validateDeviceCreationRecords,
  validateNewMatrixIsEmpty,
  validateProjectCreationRecords
} from "../domain";
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
  TriggerId,
  TriggerPlaybackId
} from "../domain";

const id = <Id>(value: string): Id => value as Id;
const now = "2026-07-27T18:08:00.000Z" as ISODateString;

const folder = (folderId: string, parentFolderId: string | null = null): ProjectFolder => ({
  id: id<ProjectFolderId>(folderId),
  parentFolderId: parentFolderId ? id<ProjectFolderId>(parentFolderId) : null,
  name: folderId,
  createdAt: now
});

const project = (
  projectId: string,
  folderId: string | null = "folder_leaf",
  defaultAssetLibraryId = "library_default"
): Project => ({
  id: id<ProjectId>(projectId),
  folderId: folderId ? id<ProjectFolderId>(folderId) : null,
  defaultAssetLibraryId: id<AssetLibraryId>(defaultAssetLibraryId),
  name: projectId,
  createdAt: now
});

const assetLibrary = (
  libraryId: string,
  defaultForProjectId: string | null = null
): AssetLibrary => ({
  id: id<AssetLibraryId>(libraryId),
  name: libraryId,
  defaultForProjectId: defaultForProjectId ? id<ProjectId>(defaultForProjectId) : null
});

const assetFolder = (
  folderId: string,
  libraryId = "library_default",
  parentFolderId: string | null = null
): AssetLibraryFolder => ({
  id: id<AssetLibraryFolderId>(folderId),
  libraryId: id<AssetLibraryId>(libraryId),
  parentFolderId: parentFolderId ? id<AssetLibraryFolderId>(parentFolderId) : null,
  name: folderId,
  icon: "folder"
});

const asset = (assetId: string, libraryId = "library_default", folderId = "asset_folder"): Asset => ({
  id: id<AssetId>(assetId),
  libraryId: id<AssetLibraryId>(libraryId),
  folderId: id<AssetLibraryFolderId>(folderId),
  name: assetId,
  assetId,
  mediaKind: "audio",
  originalFilename: `${assetId}.wav`,
  uploadedAt: now,
  playbackUrl: `https://example.com/${assetId}.wav`
});

const device = (
  deviceId: string,
  projectId = "project_1",
  platformId = "platform_ios",
  name = "iPhone 16 Pro"
): Device => ({
  id: id<DeviceId>(deviceId),
  projectId: id<ProjectId>(projectId),
  platformId: id<PlatformId>(platformId),
  name,
  createdAt: now,
  updatedAt: now,
  isEnabled: true
});

const collection = (collectionId: string, deviceId = "device_1"): Collection => ({
  id: id<CollectionId>(collectionId),
  deviceId: id<DeviceId>(deviceId),
  name: collectionId
});

const event = (eventId: string, collectionId = "collection_1"): Event => ({
  id: id<EventId>(eventId),
  collectionId: id<CollectionId>(collectionId),
  name: eventId,
  eventType: "Button",
  sortOrder: 0
});

const eventTrigger = (
  eventTriggerId: string,
  eventId = "event_1",
  triggerId = "trigger_press",
  isEnabled = true
): EventTrigger => ({
  id: id<EventTriggerId>(eventTriggerId),
  eventId: id<EventId>(eventId),
  triggerId: id<TriggerId>(triggerId),
  label: null,
  isEnabled
});

const playback = (
  playbackId: string,
  eventTriggerId = "event_trigger_1",
  startOffset = 0
): TriggerPlayback => ({
  id: id<TriggerPlaybackId>(playbackId),
  eventTriggerId: id<EventTriggerId>(eventTriggerId),
  assetId: id<AssetId>("asset_1"),
  startOffset
});

const matrix = (matrixId = "matrix_1", deviceId = "device_1"): CollisionMatrix => ({
  id: id<CollisionMatrixId>(matrixId),
  deviceId: id<DeviceId>(deviceId)
});

const row = (eventId: string, matrixId = "matrix_1"): CollisionMatrixRow => ({
  matrixId: id<CollisionMatrixId>(matrixId),
  eventId: id<EventId>(eventId)
});

const column = (eventId: string, matrixId = "matrix_1"): CollisionMatrixColumn => ({
  matrixId: id<CollisionMatrixId>(matrixId),
  eventId: id<EventId>(eventId)
});

const matrixEntry = (
  playingEventId = "event_playing",
  incomingEventId = "event_incoming",
  matrixId = "matrix_1"
): CollisionMatrixEntry => ({
  id: id<CollisionMatrixEntryId>("entry_1"),
  matrixId: id<CollisionMatrixId>(matrixId),
  playingEventId: id<EventId>(playingEventId),
  incomingEventId: id<EventId>(incomingEventId),
  resolutionBehavior: {
    behaviorName: "Preempt",
    targetEventId: id<EventId>(playingEventId),
    postInterruptionRecovery: "Stay stopped",
    systemInterruptionRecovery: "Stay stopped"
  }
});

describe("folder rules", () => {
  it("allows folders to mix child folders and projects", () => {
    expect(
      canAddChildFolder(id<ProjectFolderId>("folder_mixed"), "Experiments", [folder("folder_mixed")]).isOk()
    ).toBe(true);

    expect(
      canAddProjectToFolder(
        id<ProjectFolderId>("folder_mixed"),
        "Settings Feedback",
        [folder("folder_mixed"), folder("folder_child", "folder_mixed")],
        []
      ).isOk()
    ).toBe(true);
  });

  it("allows root folders and root projects with sibling-name checks", () => {
    expect(canAddChildFolder(null, "Root Experiments", []).isOk()).toBe(true);

    expect(
      canAddChildFolder(null, "Existing Root", [{ ...folder("folder_existing"), name: "Existing Root" }]).isErr()
    ).toBe(true);

    expect(canAddProjectToFolder(null, "Root Project", [], []).isOk()).toBe(true);

    expect(
      canAddProjectToFolder(null, "Root Project", [], [{ ...project("project_root", null), name: "Root Project" }]).isErr()
    ).toBe(true);
  });

  it("rejects missing folder parents and duplicate sibling names", () => {
    expect(canAddChildFolder(id<ProjectFolderId>("folder_missing"), "Experiments", []).isErr()).toBe(true);

    expect(
      canAddChildFolder(id<ProjectFolderId>("folder_parent"), "Existing Folder", [
        folder("folder_parent"),
        { ...folder("folder_child", "folder_parent"), name: "Existing Folder" }
      ]).isErr()
    ).toBe(true);

    expect(
      canAddProjectToFolder(
        id<ProjectFolderId>("folder_parent"),
        "Existing Project",
        [folder("folder_parent")],
        [{ ...project("project_1", "folder_parent"), name: "Existing Project" }]
      ).isErr()
    ).toBe(true);
  });

  it("allows newly created empty leaf folders", () => {
    expect(allowsEmptyLeafFolder(id<ProjectFolderId>("folder_empty"), [], [])).toBe(true);
  });
});

describe("project and asset rules", () => {
  it("requires project creation to create one linked default library and root folder", () => {
    const createdProject = project("project_1");
    const defaultLibrary = assetLibrary("library_default", "project_1");
    const rootFolder = assetFolder("asset_folder_root", "library_default");

    expect(
      validateProjectCreationRecords({
        project: createdProject,
        defaultAssetLibrary: defaultLibrary,
        rootFolder
      }).isOk()
    ).toBe(true);

    expect(
      validateProjectCreationRecords({
        project: createdProject,
        defaultAssetLibrary: assetLibrary("library_other", "project_1"),
        rootFolder
      }).isErr()
    ).toBe(true);
  });

  it("prevents importing the project's own default library", () => {
    expect(
      canImportAssetLibrary(project("project_1"), id<AssetLibraryId>("library_default")).isErr()
    ).toBe(true);
    expect(canImportAssetLibrary(project("project_1"), id<AssetLibraryId>("library_shared")).isOk()).toBe(
      true
    );
  });

  it("limits playback assets to the default or imported project libraries", () => {
    const imports: ProjectAssetLibraryImport[] = [
      {
        projectId: id<ProjectId>("project_1"),
        assetLibraryId: id<AssetLibraryId>("library_shared")
      }
    ];

    expect(canUseAssetInProject(project("project_1"), asset("asset_1"), imports).isOk()).toBe(true);
    expect(
      canUseAssetInProject(project("project_1"), asset("asset_2", "library_shared"), imports).isOk()
    ).toBe(true);
    expect(
      canUseAssetInProject(project("project_1"), asset("asset_3", "library_foreign"), imports).isErr()
    ).toBe(true);
  });

  it("allows asset folders to mix child folders and assets", () => {
    expect(
      canAddChildFolderToAssetFolder(id<AssetLibraryFolderId>("asset_folder"), "Subfolder", [
        assetFolder("asset_folder")
      ]).isOk()
    ).toBe(true);

    expect(
      canAddAssetToFolder(
        id<AssetLibraryFolderId>("asset_folder"),
        "Tone",
        [assetFolder("asset_folder"), assetFolder("child_folder", "library_default", "asset_folder")],
        []
      ).isOk()
    ).toBe(true);
  });

  it("rejects missing asset folder parents and duplicate sibling names", () => {
    expect(
      canAddChildFolderToAssetFolder(id<AssetLibraryFolderId>("missing_folder"), "Subfolder", []).isErr()
    ).toBe(true);

    expect(
      canAddChildFolderToAssetFolder(id<AssetLibraryFolderId>("asset_folder"), "Existing Folder", [
        assetFolder("asset_folder"),
        {
          ...assetFolder("child_folder", "library_default", "asset_folder"),
          name: "Existing Folder"
        }
      ]).isErr()
    ).toBe(true);

    expect(
      canAddAssetToFolder(
        id<AssetLibraryFolderId>("asset_folder"),
        "Existing Asset",
        [assetFolder("asset_folder")],
        [{ ...asset("asset_1"), name: "Existing Asset" }]
      ).isErr()
    ).toBe(true);
  });
});

describe("device and event rules", () => {
  it("requires device creation to create one collision matrix", () => {
    expect(validateDeviceCreationRecords(device("device_1"), matrix()).isOk()).toBe(true);
    expect(validateDeviceCreationRecords(device("device_2"), matrix()).isErr()).toBe(true);
  });

  it("enforces unique device names per project and platform", () => {
    expect(canCreateDevice(device("device_2"), [device("device_1")]).isErr()).toBe(true);
    expect(
      canCreateDevice(device("device_3", "project_1", "platform_android", "Pixel 10"), [
        device("device_1")
      ]).isOk()
    ).toBe(true);
  });

  it("keeps collections flat in the current domain shape", () => {
    expect(collectionHasNoChildCollections().isOk()).toBe(true);
  });

  it("enforces unique event-trigger bindings and non-negative playback offsets", () => {
    expect(
      canCreateEventTrigger(id<EventId>("event_1"), id<TriggerId>("trigger_press"), [
        eventTrigger("event_trigger_1")
      ]).isErr()
    ).toBe(true);

    expect(canUseTriggerPlaybackOffset(0).isOk()).toBe(true);
    expect(canUseTriggerPlaybackOffset(-0.1).isErr()).toBe(true);
  });

  it("excludes disabled event triggers from preview playback", () => {
    expect(
      getPreviewableTriggerPlaybacks(eventTrigger("event_trigger_1", "event_1", "trigger_press", false), [
        playback("playback_1")
      ])
    ).toEqual([]);

    expect(
      getPreviewableTriggerPlaybacks(eventTrigger("event_trigger_1"), [
        playback("playback_late", "event_trigger_1", 0.5),
        playback("playback_now", "event_trigger_1", 0)
      ]).map((item) => item.id)
    ).toEqual(["playback_now", "playback_late"]);
  });
});

describe("collision matrix rules", () => {
  it("requires matrix candidate events to belong to the selected device", () => {
    expect(
      canSelectMatrixEvent(id<EventId>("event_1"), [collection("collection_1")], [event("event_1")]).isOk()
    ).toBe(true);

    expect(
      canSelectMatrixEvent(id<EventId>("event_1"), [collection("collection_2")], [event("event_1")]).isErr()
    ).toBe(true);
  });

  it("requires row and column membership and unique matrix entries", () => {
    const candidate = matrixEntry();

    expect(
      canCreateMatrixEntry(candidate, [row("event_playing")], [column("event_incoming")], []).isOk()
    ).toBe(true);
    expect(canCreateMatrixEntry(candidate, [], [column("event_incoming")], []).isErr()).toBe(true);
    expect(
      canCreateMatrixEntry(candidate, [row("event_playing")], [column("event_incoming")], [
        candidate
      ]).isErr()
    ).toBe(true);
  });

  it("validates behavior-specific targets and recovery fields", () => {
    const suppressWithoutTarget: ResolutionBehavior = {
      behaviorName: "Suppress",
      targetEventId: null,
      postInterruptionRecovery: null,
      systemInterruptionRecovery: "Stay stopped"
    };

    expect(canUseResolutionBehavior(suppressWithoutTarget, matrixEntry()).isErr()).toBe(true);

    expect(
      canUseResolutionBehavior(
        {
          behaviorName: "Queue",
          targetEventId: id<EventId>("event_foreign"),
          postInterruptionRecovery: null,
          systemInterruptionRecovery: "Stay stopped"
        },
        matrixEntry()
      ).isErr()
    ).toBe(true);

    expect(
      canUseResolutionBehavior(
        {
          behaviorName: "Suppress",
          targetEventId: id<EventId>("event_incoming"),
          postInterruptionRecovery: null,
          systemInterruptionRecovery: "Stay stopped"
        },
        matrixEntry()
      ).isOk()
    ).toBe(true);

    expect(
      canUseResolutionBehavior(
        {
          behaviorName: "Preempt",
          targetEventId: id<EventId>("event_playing"),
          postInterruptionRecovery: null,
          systemInterruptionRecovery: "Stay stopped"
        },
        matrixEntry()
      ).isErr()
    ).toBe(true);

    expect(
      canUseResolutionBehavior(
        {
          behaviorName: "Not possible",
          targetEventId: null,
          postInterruptionRecovery: null,
          systemInterruptionRecovery: null
        },
        matrixEntry()
      ).isOk()
    ).toBe(true);
  });

  it("requires a new collision matrix to start empty", () => {
    expect(validateNewMatrixIsEmpty(matrix(), [], [], []).isOk()).toBe(true);
    expect(validateNewMatrixIsEmpty(matrix(), [row("event_1")], [], []).isErr()).toBe(true);
  });
});

describe("sharing rules", () => {
  it("requires share links to target exactly one domain object", () => {
    expect(canGenerateSharingLink({ kind: "project", projectId: id<ProjectId>("project_1") }).isOk()).toBe(
      true
    );

    expect(
      canGenerateSharingLink({
        kind: "project",
        projectId: id<ProjectId>("project_1"),
        eventId: id<EventId>("event_1")
      } as never).isErr()
    ).toBe(true);
  });
});
