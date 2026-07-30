"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Fragment, FormEvent, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Edit3,
  FileAudio,
  FolderPlus,
  Link2,
  MoreVertical,
  Plus,
  Search,
  Smartphone,
  Trash2,
  Waves
} from "lucide-react";
import {
  Badge,
  Button,
  ConfirmDialog,
  DialogOverlay,
  EmptyState,
  ErrorState,
  FormDialog,
  IconButton,
  LoadingState,
  PageHeader,
  PageStateScaffold,
  RowActionsMenu,
  Select,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TextInput
} from "@/components/primitives";
import {
  asEntityId,
  eventTypes,
  type Asset,
  type AssetId,
  type AssetLibraryFolder,
  type AssetLibraryFolderId,
  type AssetLibraryId,
  type CollectionId,
  type CollisionMatrixEntryId,
  type CollisionMatrixEntry,
  type DeviceId,
  type EventId,
  type PlatformId,
  type ProjectId,
  type ResolutionBehaviorName
} from "@/domain";
import type {
  AssetLibraryFolderNode,
  DeviceSummary
} from "@/data/repositories/project-repository";
import {
  useCreateCollectionMutation,
  useCreateDeviceMutation,
  useCreateEventMutation,
  useCreateAssetLibraryFolderMutation,
  useCreateAssetMutation,
  useDeleteDeviceMutation,
  useDeleteCollectionMutation,
  useDeleteAssetLibraryFolderMutation,
  useDeleteAssetMutation,
  useDeleteEventMutation,
  useDeleteProjectMutation,
  useDeviceWorkspaceQuery,
  useAssetLibrariesQuery,
  useAssetLibraryTreeQuery,
  useImportAssetLibraryMutation,
  useProjectWorkspaceQuery,
  useUpdateCollectionMutation,
  useUpdateDeviceMutation,
  useDeleteCollisionMatrixEntryMutation
} from "@/features/projects/queries";
import {
  type AudioPreviewItem
} from "@/features/projects/audio-preview";
import {
  AudioPreviewButton,
  AudioPreviewProvider,
  useAudioPreviewActions
} from "@/features/projects/audio-preview-context";
import { MatrixTab } from "@/features/matrix/matrix-tab";
import type { MatrixAxis } from "@/features/matrix/matrix-axis-filter";
import type { MatrixFilterAnchor } from "@/features/matrix/matrix-axis-filter-anchor";
import {
  CreateAssetDialog,
  CreateAssetFolderDialog
} from "@/features/assets/asset-authoring-dialogs";
import {
  CardGrid,
  DeviceGlyph,
  SelectableCard
} from "@/components/primitives";
import {
  FeedbackProvider,
  FeedbackText,
  useFeedbackActions,
  useFeedbackMessage
} from "@/features/feedback/feedback-context";
import {
  groupDevicePresetsByFormFactor,
  type DevicePreset
} from "@/domain/device-catalog";
import { messageForError, workspaceErrorFallback } from "@/lib/errors";
import { writeFlashMessage } from "@/lib/flash-message";
import { pluralSuffix } from "@/lib/plural";
import { hrefWithParams } from "@/lib/search-params";
import {
  ShareLinkDeleteConfirm,
  ShareLinkDialog
} from "@/features/sharing/share-link-dialog";
import { useShareLink } from "@/features/sharing/use-share-link";

const formatDeviceMeta = (summary: DeviceSummary) =>
  summary.device.isEnabled ? summary.platform.name : "Excluded";

type DeleteTarget =
  | { kind: "project"; id: ProjectId; name: string }
  | { kind: "device"; id: DeviceId; name: string }
  | { kind: "collection"; id: CollectionId; name: string }
  | { kind: "event"; id: EventId; name: string }
  | { counts: { assets: number; folders: number }; kind: "assetFolder"; id: AssetLibraryFolderId; name: string }
  | { kind: "asset"; id: AssetId; name: string }
  | { kind: "matrixEntry"; id: CollisionMatrixEntryId; name: string };

const deleteActionLabelFor = (target: DeleteTarget) => {
  if (target.kind === "matrixEntry") {
    return "Clear matrix rule";
  }

  if (target.kind === "assetFolder") {
    return "Delete folder";
  }

  return `Delete ${target.kind}`;
};

function EmptyProjectWorkspace({ onAddDevice }: { onAddDevice: () => void }) {
  return (
    <div className="grid min-h-[min(680px,calc(100vh-220px))] grid-rows-[auto_1fr]">
      <div className="flex min-h-[34px] flex-wrap items-center justify-between gap-3">
        <h2 className="truncate text-md font-semibold text-gray-700">Untitled</h2>
        <Button disabled leftIcon={<Plus className="size-4" />}>
          Add event
        </Button>
      </div>

      <div className="relative mt-9 border-t border-gray-200">
        <div
          aria-hidden="true"
          className="grid h-10 grid-cols-[minmax(180px,1.5fr)_minmax(120px,1fr)_minmax(120px,1fr)_minmax(120px,1fr)] items-center border-b border-gray-200 px-3 text-xs font-medium text-gray-400"
        >
          <span>Name</span>
          <span>Event</span>
          <span>Sound</span>
          <span>Haptic</span>
        </div>

        <div className="flex min-h-[420px] items-center justify-center px-4 py-14 text-center">
          <div className="grid max-w-sm gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-700">Select a system to begin</p>
              <p className="mt-1 text-sm leading-5 text-gray-500">
                Select the type of operating system that your sound and haptic events will play on.
              </p>
            </div>
            <div className="flex justify-center">
              <Button leftIcon={<Plus className="size-4" />} onClick={onAddDevice}>
                Add system
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const assetExtensionFor = (asset: Asset) =>
  asset.originalFilename.includes(".") ? `.${asset.originalFilename.split(".").pop()}` : asset.mediaKind;

const assetSourceLabelFor = (asset: Asset) =>
  asset.playbackUrl.startsWith("blob:") || asset.playbackUrl.includes("/assets/uploaded/")
    ? `Uploaded ${asset.mediaKind}`
    : `Demo ${asset.mediaKind}`;

const flattenAssetFolders = (node: AssetLibraryFolderNode): AssetLibraryFolderNode[] => [
  node,
  ...node.childFolders.flatMap(flattenAssetFolders)
];

const countAssetFolderDescendants = (node: AssetLibraryFolderNode): { assets: number; folders: number } =>
  node.childFolders.reduce(
    (counts, child) => {
      const childCounts = countAssetFolderDescendants(child);

      return {
        assets: counts.assets + childCounts.assets,
        folders: counts.folders + 1 + childCounts.folders
      };
    },
    { assets: node.assets.length, folders: 0 }
  );

const findAssetFolderNode = (
  node: AssetLibraryFolderNode,
  folderId: AssetLibraryFolderId
): AssetLibraryFolderNode | null => {
  if (node.folder.id === folderId) {
    return node;
  }

  for (const child of node.childFolders) {
    const matched = findAssetFolderNode(child, folderId);

    if (matched) {
      return matched;
    }
  }

  return null;
};

const pathForAssetFolder = (
  folders: AssetLibraryFolder[],
  folderId: AssetLibraryFolderId
): AssetLibraryFolder[] => {
  const byId = new Map(folders.map((folder) => [folder.id, folder]));
  const path: AssetLibraryFolder[] = [];
  let current = byId.get(folderId) ?? null;

  while (current) {
    path.unshift(current);
    current = current.parentFolderId ? byId.get(current.parentFolderId) ?? null : null;
  }

  return path;
};

export default function ProjectPage() {
  const searchParams = useSearchParams();

  return (
    <FeedbackProvider errorFallback={workspaceErrorFallback} initialMessage={searchParams.get("feedback")}>
      <AudioPreviewProvider>
        <ProjectWorkspace />
      </AudioPreviewProvider>
    </FeedbackProvider>
  );
}

function ProjectWorkspace() {
  const { projectId: projectIdParam } = useParams<{ projectId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = asEntityId<ProjectId>(projectIdParam);
  const selectedDeviceParam = searchParams.get("device");
  const selectedCollectionParam = searchParams.get("collection");
  const [dialog, setDialog] = useState<
    | "device"
    | "collection"
    | "editCollection"
    | "event"
    | "assetFolder"
    | "asset"
    | "libraryImport"
    | "share"
    | null
  >(null);
  const [deviceName, setDeviceName] = useState("");
  const [devicePlatformId, setDevicePlatformId] = useState("");
  const [devicePresetId, setDevicePresetId] = useState("");
  const [deviceEnabled, setDeviceEnabled] = useState(true);
  const [collectionName, setCollectionName] = useState("");
  const [eventName, setEventName] = useState("");
  const [eventType, setEventType] = useState<(typeof eventTypes)[number]>("Button");
  const [importLibraryId, setImportLibraryId] = useState("");
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<"events" | "assets" | "matrix">("events");
  const [workspaceSearch, setWorkspaceSearch] = useState("");
  const [selectedProjectAssetLibraryId, setSelectedProjectAssetLibraryId] = useState<AssetLibraryId | null>(null);
  const [selectedProjectAssetFolderId, setSelectedProjectAssetFolderId] = useState<AssetLibraryFolderId | null>(null);
  const [selectedMatrixPlayingEventId, setSelectedMatrixPlayingEventId] = useState<EventId | null>(null);
  const [selectedMatrixIncomingEventId, setSelectedMatrixIncomingEventId] = useState<EventId | null>(null);
  const [matrixBehavior, setMatrixBehavior] = useState<ResolutionBehaviorName>("Preempt");
  const [matrixTargetEventId, setMatrixTargetEventId] = useState("");
  const [matrixFilterAnchor, setMatrixFilterAnchor] = useState<MatrixFilterAnchor | null>(null);
  const [matrixFilterAxis, setMatrixFilterAxis] = useState<MatrixAxis>("playing");
  const feedback = useFeedbackMessage();
  const { clearFeedback, runWithFeedback } = useFeedbackActions();
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const workspaceQuery = useProjectWorkspaceQuery(projectId);
  const assetLibrariesQuery = useAssetLibrariesQuery();
  const projectAssetLibraryIds = useMemo(() => {
    const workspace = workspaceQuery.data;

    if (!workspace) {
      return [];
    }

    return [
      workspace.defaultAssetLibrary.id,
      ...workspace.importedAssetLibraries.map((library) => library.id)
    ];
  }, [workspaceQuery.data]);
  const activeProjectAssetLibraryId = useMemo(() => {
    if (selectedProjectAssetLibraryId && projectAssetLibraryIds.includes(selectedProjectAssetLibraryId)) {
      return selectedProjectAssetLibraryId;
    }

    return projectAssetLibraryIds[0] ?? null;
  }, [projectAssetLibraryIds, selectedProjectAssetLibraryId]);
  const projectAssetTreeQuery = useAssetLibraryTreeQuery(activeProjectAssetLibraryId);
  const selectedDevice = useMemo(() => {
    const devices = workspaceQuery.data?.devices ?? [];

    if (selectedDeviceParam) {
      const matched = devices.find((summary) => summary.device.id === selectedDeviceParam);

      if (matched) {
        return matched;
      }
    }

    return devices[0] ?? null;
  }, [selectedDeviceParam, workspaceQuery.data?.devices]);
  const platformIdByName = useMemo(
    () => new Map((workspaceQuery.data?.platforms ?? []).map((platform) => [platform.name, platform.id])),
    [workspaceQuery.data?.platforms]
  );
  const deviceWorkspaceQuery = useDeviceWorkspaceQuery(selectedDevice?.device.id ?? null);
  const createDevice = useCreateDeviceMutation();
  const updateDevice = useUpdateDeviceMutation();
  const deleteProject = useDeleteProjectMutation();
  const deleteDevice = useDeleteDeviceMutation();
  const deleteCollection = useDeleteCollectionMutation();
  const deleteEvent = useDeleteEventMutation();
  const deleteAssetLibraryFolder = useDeleteAssetLibraryFolderMutation();
  const deleteAsset = useDeleteAssetMutation();
  const createAssetLibraryFolder = useCreateAssetLibraryFolderMutation();
  const createAsset = useCreateAssetMutation();
  const createCollection = useCreateCollectionMutation();
  const updateCollection = useUpdateCollectionMutation();
  const createEvent = useCreateEventMutation();
  const importAssetLibrary = useImportAssetLibraryMutation();
  const deleteMatrixEntry = useDeleteCollisionMatrixEntryMutation();
  const audioPreview = useAudioPreviewActions();
  const shareController = useShareLink({
    setDialog: (nextDialog) => setDialog(nextDialog)
  });

  const selectedCollection = useMemo(() => {
    const collections = deviceWorkspaceQuery.data?.collections ?? [];

    if (selectedCollectionParam) {
      const matched = collections.find((item) => item.collection.id === selectedCollectionParam);

      if (matched) {
        return matched;
      }
    }

    return collections[0] ?? null;
  }, [deviceWorkspaceQuery.data?.collections, selectedCollectionParam]);
  const eventRows = useMemo(() => selectedCollection?.events ?? [], [selectedCollection?.events]);
  const importedLibraryIds = useMemo(
    () => new Set((workspaceQuery.data?.importedAssetLibraries ?? []).map((library) => library.id)),
    [workspaceQuery.data?.importedAssetLibraries]
  );
  const importCandidates = useMemo(() => {
    const workspace = workspaceQuery.data;

    if (!workspace) {
      return [];
    }

    return (assetLibrariesQuery.data?.libraries ?? []).filter(
      (summary) =>
        summary.library.id !== workspace.defaultAssetLibrary.id && !importedLibraryIds.has(summary.library.id)
    );
  }, [assetLibrariesQuery.data?.libraries, importedLibraryIds, workspaceQuery.data]);
  const projectAssetFolders = useMemo(
    () =>
      projectAssetTreeQuery.data
        ? flattenAssetFolders(projectAssetTreeQuery.data.rootFolder).map((node) => node.folder)
        : [],
    [projectAssetTreeQuery.data]
  );
  const selectedProjectAssetFolder = useMemo(() => {
    if (!projectAssetTreeQuery.data) {
      return null;
    }

    if (selectedProjectAssetFolderId) {
      const matched = findAssetFolderNode(
        projectAssetTreeQuery.data.rootFolder,
        selectedProjectAssetFolderId
      );

      if (matched) {
        return matched;
      }
    }

    return projectAssetTreeQuery.data.rootFolder;
  }, [projectAssetTreeQuery.data, selectedProjectAssetFolderId]);
  const projectAssetFolderPath = useMemo(
    () =>
      selectedProjectAssetFolder
        ? pathForAssetFolder(projectAssetFolders, selectedProjectAssetFolder.folder.id)
        : [],
    [projectAssetFolders, selectedProjectAssetFolder]
  );
  const visibleProjectAssetItems = useMemo(() => {
    if (!selectedProjectAssetFolder) {
      return [];
    }

    return [
      ...selectedProjectAssetFolder.childFolders.map((node) => ({
        kind: "folder" as const,
        node
      })),
      ...selectedProjectAssetFolder.assets.map((asset) => ({
        kind: "asset" as const,
        asset
      }))
    ];
  }, [selectedProjectAssetFolder]);
  const selectedProjectAssetFolderItemCount =
    (selectedProjectAssetFolder?.childFolders.length ?? 0) + (selectedProjectAssetFolder?.assets.length ?? 0);
  const goToDevice = (deviceId: DeviceId) => {
    router.push(`/projects/${projectId}${hrefWithParams("", searchParams, { device: deviceId, collection: null })}`);
  };

  const goToCollection = (collectionId: CollectionId) => {
    router.push(`/projects/${projectId}${hrefWithParams("", searchParams, { collection: collectionId })}`);
  };

  const goToEvent = (eventId: EventId) => {
    router.push(
      `/projects/${projectId}/events/${eventId}${hrefWithParams("", searchParams, {
        collection: selectedCollection?.collection.id ?? null,
        device: selectedDevice?.device.id ?? null
      })}`
    );
  };

  const goToProjectAssetLibrary = (libraryId: AssetLibraryId) => {
    setSelectedProjectAssetLibraryId(libraryId);
    setSelectedProjectAssetFolderId(null);
  };

  const goToProjectAssetFolder = (folderId: AssetLibraryFolderId) => {
    setSelectedProjectAssetFolderId(folderId);
  };

  const openCreateDevice = () => {
    setDeviceName("");
    setDevicePlatformId(workspaceQuery.data?.platforms[0]?.id ?? "");
    setDevicePresetId("");
    setDeviceEnabled(true);
    clearFeedback();
    setDialog("device");
  };

  const selectDevicePreset = (preset: DevicePreset) => {
    const platformId = platformIdByName.get(preset.platformName);

    setDevicePresetId(preset.presetId);
    setDeviceName(preset.deviceName);

    if (platformId) {
      setDevicePlatformId(platformId);
    }
  };

  const openCreateCollection = () => {
    setCollectionName("");
    clearFeedback();
    setDialog("collection");
  };

  const openEditCollection = () => {
    setCollectionName(selectedCollection?.collection.name ?? "");
    clearFeedback();
    setDialog("editCollection");
  };

  const openCreateEvent = () => {
    setEventName("");
    setEventType("Button");
    clearFeedback();
    setDialog("event");
  };

  const openImportLibrary = () => {
    setImportLibraryId(importCandidates[0]?.library.id ?? "");
    clearFeedback();
    setDialog("libraryImport");
  };

  const openCreateAssetFolder = () => {
    clearFeedback();
    setDialog("assetFolder");
  };

  const openCreateAsset = () => {
    clearFeedback();
    setDialog("asset");
  };

  const openDeleteProject = () => {
    if (!workspaceQuery.data) {
      return;
    }

    clearFeedback();
    setDeleteTarget({
      kind: "project",
      id: workspaceQuery.data.project.id,
      name: workspaceQuery.data.project.name
    });
  };

  const openDeleteDevice = (summary: DeviceSummary) => {
    clearFeedback();
    setDeleteTarget({
      kind: "device",
      id: summary.device.id,
      name: summary.device.name
    });
  };

  const openDeleteCollection = () => {
    if (!selectedCollection) {
      return;
    }

    clearFeedback();
    setDeleteTarget({
      kind: "collection",
      id: selectedCollection.collection.id,
      name: selectedCollection.collection.name
    });
  };

  const openDeleteEvent = (event: { id: EventId; name: string }) => {
    clearFeedback();
    setDeleteTarget({
      kind: "event",
      id: event.id,
      name: event.name
    });
  };

  const openClearMatrixEntry = (entry: CollisionMatrixEntry, name: string) => {
    clearFeedback();
    setDeleteTarget({
      kind: "matrixEntry",
      id: entry.id,
      name
    });
  };

  const openDeleteProjectAssetFolder = (node: AssetLibraryFolderNode) => {
    clearFeedback();
    setDeleteTarget({
      counts: countAssetFolderDescendants(node),
      kind: "assetFolder",
      id: node.folder.id,
      name: node.folder.name
    });
  };

  const openDeleteProjectAsset = (asset: Asset) => {
    clearFeedback();
    setDeleteTarget({
      kind: "asset",
      id: asset.id,
      name: asset.name
    });
  };

  const handleCreateDevice = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const platformId = devicePlatformId || workspaceQuery.data?.platforms[0]?.id;

    if (!platformId) {
      return;
    }

    await runWithFeedback({
      work: async () => {
        const created = await createDevice.mutateAsync({
          projectId,
          platformId: asEntityId<PlatformId>(platformId),
          name: deviceName,
          isEnabled: deviceEnabled
        });

        setDialog(null);
        setDeviceName("");
        setDevicePresetId("");
        goToDevice(created.device.id);
        return created;
      },
      onSuccess: (created) => `Created ${created.device.name} with a new Collision Matrix.`
    });
  };

  const handleCreateCollection = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedDevice) {
      return;
    }

    await runWithFeedback({
      work: async () => {
        const collection = await createCollection.mutateAsync({
          deviceId: selectedDevice.device.id,
          name: collectionName
        });

        setDialog(null);
        setCollectionName("");
        goToCollection(collection.id);
        return collection;
      },
      onSuccess: (collection) => `Created ${collection.name} for ${selectedDevice.device.name}.`
    });
  };

  const handleEditCollection = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedCollection) {
      return;
    }

    await runWithFeedback({
      work: async () => {
        const collection = await updateCollection.mutateAsync({
          collectionId: selectedCollection.collection.id,
          name: collectionName
        });

        setDialog(null);
        return collection;
      },
      onSuccess: (collection) => `Renamed collection to ${collection.name}.`
    });
  };

  const handleCreateEvent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedCollection) {
      return;
    }

    await runWithFeedback({
      work: async () => {
        const created = await createEvent.mutateAsync({
          collectionId: selectedCollection.collection.id,
          name: eventName,
          eventType
        });

        setDialog(null);
        setEventName("");
        goToEvent(created.id);
        return created;
      },
      onSuccess: (created) => `Created ${created.name} in ${selectedCollection.collection.name}.`
    });
  };

  const handleImportLibrary = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!importLibraryId) {
      return;
    }

    await runWithFeedback({
      work: async () => {
        const imported = await importAssetLibrary.mutateAsync({
          projectId,
          assetLibraryId: asEntityId<AssetLibraryId>(importLibraryId)
        });
        const library = assetLibrariesQuery.data?.libraries.find(
          (summary) => summary.library.id === imported.assetLibraryId
        )?.library;

        setDialog(null);
        return library?.name ?? "asset library";
      },
      onSuccess: (libraryName) => `Imported ${libraryName} for playback selection.`
    });
  };

  const handleCreateAssetFolder = async ({ name, icon }: { name: string; icon: string }) => {
    if (!selectedProjectAssetLibrary || !selectedProjectAssetFolder) {
      return;
    }

    const folder = await runWithFeedback({
      work: async () => {
        const createdFolder = await createAssetLibraryFolder.mutateAsync({
          libraryId: selectedProjectAssetLibrary.library.id,
          parentFolderId: selectedProjectAssetFolder.folder.id,
          name,
          icon
        });

        setDialog(null);
        goToProjectAssetFolder(createdFolder.id);
        return createdFolder;
      },
      onSuccess: (createdFolder) => `Created folder ${createdFolder.name}.`
    });

    if (!folder) {
      throw new Error(workspaceErrorFallback);
    }
  };

  const handleCreateAsset = async (input: {
    name: string;
    assetId: string;
    mediaKind: Asset["mediaKind"];
    originalFilename: string;
    blob: File;
    contentType?: string;
  }) => {
    if (!selectedProjectAssetLibrary || !selectedProjectAssetFolder) {
      return;
    }

    const asset = await runWithFeedback({
      work: async () => {
        const createdAsset = await createAsset.mutateAsync({
          libraryId: selectedProjectAssetLibrary.library.id,
          folderId: selectedProjectAssetFolder.folder.id,
          ...input
        });

        setDialog(null);
        return createdAsset;
      },
      onSuccess: (createdAsset) => `Uploaded ${createdAsset.mediaKind} asset ${createdAsset.name}.`
    });

    if (!asset) {
      throw new Error(workspaceErrorFallback);
    }
  };

  const handleDeviceEnabledChange = async (isEnabled: boolean) => {
    if (!selectedDevice) {
      return;
    }

    await runWithFeedback({
      work: () =>
        updateDevice.mutateAsync({
          deviceId: selectedDevice.device.id,
          isEnabled
        }),
      onSuccess: () =>
        isEnabled
          ? `${selectedDevice.device.name} is included in playback and export.`
          : `${selectedDevice.device.name} is excluded from playback and export.`
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    await runWithFeedback({
      work: async () => {
        if (deleteTarget.kind === "project") {
        await deleteProject.mutateAsync(deleteTarget.id);
        setDeleteTarget(null);
        writeFlashMessage(`Deleted project ${deleteTarget.name}.`);
        router.push("/projects");
        return null;
      }

      if (deleteTarget.kind === "collection") {
        const remainingCollections = (deviceWorkspaceQuery.data?.collections ?? []).filter(
          (item) => item.collection.id !== deleteTarget.id
        );
        const fallbackCollectionId = remainingCollections[0]?.collection.id ?? null;

        await deleteCollection.mutateAsync(deleteTarget.id);
        setDeleteTarget(null);

        if (selectedCollection?.collection.id === deleteTarget.id) {
          router.push(
            `/projects/${projectId}${hrefWithParams("", searchParams, {
              collection: fallbackCollectionId
            })}`
          );
        }

        return `Deleted collection ${deleteTarget.name}.`;
      }

      if (deleteTarget.kind === "event") {
        await deleteEvent.mutateAsync(deleteTarget.id);
        setDeleteTarget(null);
        return `Deleted event ${deleteTarget.name}.`;
      }

      if (deleteTarget.kind === "assetFolder") {
        const deletedPathContainedSelection =
          selectedProjectAssetFolderId === deleteTarget.id ||
          projectAssetFolderPath.some((folder) => folder.id === deleteTarget.id);

        await deleteAssetLibraryFolder.mutateAsync(deleteTarget.id);
        setDeleteTarget(null);

        if (deletedPathContainedSelection) {
          setSelectedProjectAssetFolderId(null);
        }

        return `Deleted folder ${deleteTarget.name}.`;
      }

      if (deleteTarget.kind === "asset") {
        audioPreview.stop();
        await deleteAsset.mutateAsync(deleteTarget.id);
        setDeleteTarget(null);
        return `Deleted asset ${deleteTarget.name}.`;
      }

      if (deleteTarget.kind === "matrixEntry") {
        await deleteMatrixEntry.mutateAsync(deleteTarget.id);
        setDeleteTarget(null);
        setMatrixBehavior("Preempt");
        setMatrixTargetEventId("");
        return `Cleared matrix rule ${deleteTarget.name}.`;
      }

      const remainingDevices = (workspaceQuery.data?.devices ?? []).filter(
        (summary) => summary.device.id !== deleteTarget.id
      );
      const fallbackDeviceId = remainingDevices[0]?.device.id ?? null;

      await deleteDevice.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);

      if (selectedDevice?.device.id === deleteTarget.id) {
        router.push(
          `/projects/${projectId}${hrefWithParams("", searchParams, {
            device: fallbackDeviceId,
            collection: null
          })}`
        );
      }
        return `Deleted device ${deleteTarget.name}.`;
      },
      onSuccess: (message) => message
    });
  };

  if (workspaceQuery.isLoading) {
    return (
      <PageStateScaffold breadcrumbs={[{ href: "/projects", label: "Projects" }]}>
        <LoadingState title="Loading project workspace" description="Opening the local device workspace." />
      </PageStateScaffold>
    );
  }

  if (workspaceQuery.isError) {
    return (
      <PageStateScaffold breadcrumbs={[{ href: "/projects", label: "Projects" }]}>
        <ErrorState
          action={<Button onClick={() => void workspaceQuery.refetch()}>Retry</Button>}
          title="Project workspace could not load"
          description={messageForError(workspaceQuery.error, workspaceErrorFallback)}
        />
      </PageStateScaffold>
    );
  }

  if (!workspaceQuery.data) {
    return (
      <PageStateScaffold breadcrumbs={[{ href: "/projects", label: "Projects" }]}>
        <LoadingState title="Loading project workspace" description="Opening the local device workspace." />
      </PageStateScaffold>
    );
  }

  const workspace = workspaceQuery.data;
  const collections = deviceWorkspaceQuery.data?.collections ?? [];
  const normalizedWorkspaceSearch = workspaceSearch.trim().toLowerCase();
  const filteredDevices = normalizedWorkspaceSearch
    ? workspace.devices.filter((summary) =>
        [summary.device.name, summary.platform.name].some((value) =>
          value.toLowerCase().includes(normalizedWorkspaceSearch)
        )
      )
    : workspace.devices;
  const filteredCollections = normalizedWorkspaceSearch
    ? collections.filter((item) =>
        item.collection.name.toLowerCase().includes(normalizedWorkspaceSearch)
      )
    : collections;
  const librarySummaryById = new Map(
    (assetLibrariesQuery.data?.libraries ?? []).map((summary) => [summary.library.id, summary])
  );
  const allProjectAssetLibraries = [
    { library: workspace.defaultAssetLibrary, status: "Default" },
    ...workspace.importedAssetLibraries.map((library) => ({ library, status: "Imported" }))
  ];
  const projectAssetLibraries = allProjectAssetLibraries.filter(({ library }) =>
    normalizedWorkspaceSearch ? library.name.toLowerCase().includes(normalizedWorkspaceSearch) : true
  );
  const selectedProjectAssetLibrary =
    allProjectAssetLibraries.find(({ library }) => library.id === activeProjectAssetLibraryId) ??
    allProjectAssetLibraries[0] ??
    null;
  const selectedTabLabel =
    activeWorkspaceTab === "events" ? "Events" : activeWorkspaceTab === "assets" ? "Assets" : "Matrix";

  return (
    <section className="grid min-h-[calc(100vh-64px)] grid-rows-[auto_1fr] bg-gray-25">
      <div className="px-4 py-5">
        <PageHeader
          actions={
            <div className="flex items-center gap-2">
              <Button
                leftIcon={<Link2 className="size-4" />}
                onClick={() =>
                  void shareController.openShareDialog(
                    { kind: "project", projectId: workspace.project.id },
                    workspace.project.name
                  )
                }
              >
                Share project
              </Button>
              <RowActionsMenu
                grouped
                icon={MoreVertical}
                items={[
                  {
                    destructive: true,
                    icon: <Trash2 aria-hidden="true" className="size-4" />,
                    label: "Delete project",
                    onSelect: openDeleteProject
                  }
                ]}
                label={`Open actions for ${workspace.project.name}`}
              />
            </div>
          }
          breadcrumbs={[
            { href: "/projects", label: "Projects" },
            ...(workspace.folder
              ? [{ href: `/projects?folder=${workspace.folder.id}`, label: workspace.folder.name }]
              : [])
          ]}
          border={false}
          className="px-0 py-0"
          title={workspace.project.name}
        />
      </div>

      <div className="grid min-h-0 md:grid-cols-[268px_1fr]">
        <aside className="hidden content-start gap-5 border-r border-gray-300 bg-gray-50 px-4 py-4 md:grid">
          <div className="grid grid-cols-3 gap-1" role="tablist">
            <button
              className={`h-8 rounded-lg text-sm font-medium ${
                activeWorkspaceTab === "events" ? "bg-gray-200 text-gray-700" : "text-gray-500 hover:bg-gray-100"
              }`}
              aria-selected={activeWorkspaceTab === "events"}
              onClick={() => setActiveWorkspaceTab("events")}
              role="tab"
              type="button"
            >
              Events
            </button>
            <button
              className={`h-8 rounded-lg text-sm font-medium ${
                activeWorkspaceTab === "assets" ? "bg-gray-200 text-gray-700" : "text-gray-500 hover:bg-gray-100"
              }`}
              aria-selected={activeWorkspaceTab === "assets"}
              onClick={() => setActiveWorkspaceTab("assets")}
              role="tab"
              type="button"
            >
              Assets
            </button>
            <button
              className={`h-8 rounded-lg text-sm font-medium ${
                activeWorkspaceTab === "matrix" ? "bg-gray-200 text-gray-700" : "text-gray-500 hover:bg-gray-100"
              }`}
              aria-selected={activeWorkspaceTab === "matrix"}
              onClick={() => setActiveWorkspaceTab("matrix")}
              role="tab"
              type="button"
            >
              Matrix
            </button>
          </div>

          <label className="relative block" htmlFor="workspace-search">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-500"
              strokeWidth={1.8}
            />
            <input
              className="h-[34px] w-full rounded-lg border border-gray-300 bg-gray-25 px-9 text-sm text-gray-700 outline-none transition-shadow placeholder:text-gray-400 focus:border-gray-300 focus:ring-2 focus:ring-purple-500/40"
              id="workspace-search"
              onChange={(event) => setWorkspaceSearch(event.currentTarget.value)}
              placeholder="Search"
              type="search"
              value={workspaceSearch}
            />
          </label>

          <div className="grid gap-2">
            <div className="flex h-8 items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">Systems</h2>
              <IconButton icon={Plus} label="Add device" onClick={openCreateDevice} size="compact" />
            </div>
            <div className="grid gap-1" data-testid="device-list">
              {filteredDevices.length ? (
                filteredDevices.map((summary) => {
                  const active = selectedDevice?.device.id === summary.device.id;

                  return (
                    <div
                      className={`grid min-h-10 grid-cols-[1fr_auto] items-center gap-1 rounded-lg transition-colors ${
                        active ? "bg-gray-200 text-gray-700" : "text-gray-600 hover:bg-gray-100"
                      }`}
                      key={summary.device.id}
                    >
                      <button
                        className="grid min-h-10 min-w-0 grid-cols-[1fr_auto] items-center gap-2 rounded-lg px-2.5 text-left text-sm"
                        onClick={() => goToDevice(summary.device.id)}
                        type="button"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <Smartphone aria-hidden="true" className="size-4 shrink-0 text-gray-500" />
                          <span className="truncate font-medium">{summary.device.name}</span>
                        </span>
                        <span className="text-xs text-gray-500">{formatDeviceMeta(summary)}</span>
                      </button>
                      <div className="pr-1">
                        <RowActionsMenu
                          grouped
                          icon={MoreVertical}
                          items={[
                            {
                              destructive: true,
                              icon: <Trash2 aria-hidden="true" className="size-4" />,
                              label: "Delete device",
                              onSelect: () => openDeleteDevice(summary)
                            }
                          ]}
                          label={`Open actions for ${summary.device.name}`}
                          size="compact"
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="px-2 text-xs text-gray-500">
                  {workspace.devices.length ? "No matching systems." : "No systems yet."}
                </p>
              )}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div className="mb-2 flex h-8 items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">Collections</h2>
              <IconButton
                disabled={!selectedDevice}
                icon={Plus}
                label="Add collection"
                onClick={openCreateCollection}
                size="compact"
              />
            </div>
            {deviceWorkspaceQuery.isLoading ? (
              <p className="px-2 text-xs text-gray-500">Loading collections</p>
            ) : !selectedDevice ? (
              <p className="px-2 text-xs text-gray-500">Select a system before adding collections.</p>
            ) : filteredCollections.length ? (
              <div className="grid gap-1" data-testid="collection-list">
                {filteredCollections.map((item) => {
                  const active = selectedCollection?.collection.id === item.collection.id;

                  return (
                    <button
                      className={`grid min-h-10 grid-cols-[1fr_auto] items-center gap-2 rounded-lg px-2.5 text-left text-sm transition-colors ${
                        active ? "bg-gray-200 text-gray-700" : "text-gray-600 hover:bg-gray-100"
                      }`}
                      key={item.collection.id}
                      onClick={() => goToCollection(item.collection.id)}
                      type="button"
                    >
                      <span className="truncate font-medium">{item.collection.name}</span>
                      <span className="text-xs text-gray-500">{item.events.length}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="px-2 text-xs text-gray-500">No matching collections.</p>
            )}
          </div>
        </aside>

        <main className="grid min-w-0 content-start gap-4 px-4 py-3 md:py-4">
          <div className="grid gap-3 border-b border-gray-200 pb-3 md:hidden">
            <div className="grid grid-cols-3 gap-1" role="tablist" aria-label="Project workspace views">
              <button
                className={`h-8 rounded-lg text-sm font-medium ${
                  activeWorkspaceTab === "events" ? "bg-gray-200 text-gray-700" : "text-gray-500 hover:bg-gray-100"
                }`}
                aria-selected={activeWorkspaceTab === "events"}
                onClick={() => setActiveWorkspaceTab("events")}
                role="tab"
                type="button"
              >
                Events
              </button>
              <button
                className={`h-8 rounded-lg text-sm font-medium ${
                  activeWorkspaceTab === "assets" ? "bg-gray-200 text-gray-700" : "text-gray-500 hover:bg-gray-100"
                }`}
                aria-selected={activeWorkspaceTab === "assets"}
                onClick={() => setActiveWorkspaceTab("assets")}
                role="tab"
                type="button"
              >
                Assets
              </button>
              <button
                className={`h-8 rounded-lg text-sm font-medium ${
                  activeWorkspaceTab === "matrix" ? "bg-gray-200 text-gray-700" : "text-gray-500 hover:bg-gray-100"
                }`}
                aria-selected={activeWorkspaceTab === "matrix"}
                onClick={() => setActiveWorkspaceTab("matrix")}
                role="tab"
                type="button"
              >
                Matrix
              </button>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <label className="grid gap-1 text-xs font-medium text-gray-500" htmlFor="mobile-device">
                Device
                <select
                  className="h-[34px] rounded-lg border border-gray-300 bg-gray-25 px-3 text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-purple-500/40"
                  disabled={!workspace.devices.length}
                  id="mobile-device"
                  onChange={(event) => goToDevice(asEntityId<DeviceId>(event.currentTarget.value))}
                  value={selectedDevice?.device.id ?? ""}
                >
                  {workspace.devices.length ? null : <option value="">No devices</option>}
                  {workspace.devices.map((summary) => (
                    <option key={summary.device.id} value={summary.device.id}>
                      {summary.device.name} / {formatDeviceMeta(summary)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1 text-xs font-medium text-gray-500" htmlFor="mobile-collection">
                Collection
                <select
                  className="h-[34px] rounded-lg border border-gray-300 bg-gray-25 px-3 text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-purple-500/40"
                  disabled={!collections.length}
                  id="mobile-collection"
                  onChange={(event) => goToCollection(asEntityId<CollectionId>(event.currentTarget.value))}
                  value={selectedCollection?.collection.id ?? ""}
                >
                  {collections.length ? null : <option value="">No collections</option>}
                  {collections.map((item) => (
                    <option key={item.collection.id} value={item.collection.id}>
                      {item.collection.name} / {item.events.length} events
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <p className="h-5 truncate text-xs text-gray-500">
              {selectedDevice
                ? `${selectedTabLabel} on ${selectedDevice.device.name}`
                : "Create a device to configure this project."}
            </p>
          </div>

          {!selectedDevice ? (
            <EmptyProjectWorkspace onAddDevice={openCreateDevice} />
          ) : (
            <>
              <div className="hidden flex-wrap items-center justify-between gap-3 md:flex">
                <div className="grid gap-1">
                  <h2 className="text-md font-semibold text-gray-700">{selectedDevice.device.name}</h2>
                </div>
                <Switch
                  checked={selectedDevice.device.isEnabled}
                  disabled={updateDevice.isPending}
                  id="device-enabled"
                  label="Included in playback/export"
                  onChange={(event) => void handleDeviceEnabledChange(event.currentTarget.checked)}
                />
              </div>

              {selectedDevice.device.isEnabled ? null : (
                <div className="border-y border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-700" role="status">
                  This device is excluded from playback and export until it is enabled again.
                </div>
              )}

              <p className="min-h-5 text-sm text-gray-600" role="status">
                {feedback ?? ""}
              </p>

              {deviceWorkspaceQuery.isError ? (
                <ErrorState
                  action={<Button onClick={() => void deviceWorkspaceQuery.refetch()}>Retry</Button>}
                  title="Device workspace could not load"
                  description={messageForError(deviceWorkspaceQuery.error, workspaceErrorFallback)}
                />
              ) : (
                <section className="grid gap-3">
                  {activeWorkspaceTab === "matrix" ? (
                    <MatrixTab
                      deviceId={selectedDevice.device.id}
                      deviceName={selectedDevice.device.name}
                      matrixBehavior={matrixBehavior}
                      matrixFilterAnchor={matrixFilterAnchor}
                      matrixFilterAxis={matrixFilterAxis}
                      matrixTargetEventId={matrixTargetEventId}
                      onClearEntry={openClearMatrixEntry}
                      onShareEntry={(entry, label) =>
                        void shareController.openShareDialog(
                          {
                            kind: "collisionMatrixEntry",
                            collisionMatrixEntryId: entry.id
                          },
                          label
                        )
                      }
                      selectedIncomingEventId={selectedMatrixIncomingEventId}
                      selectedPlayingEventId={selectedMatrixPlayingEventId}
                      setMatrixBehavior={setMatrixBehavior}
                      setMatrixFilterAnchor={setMatrixFilterAnchor}
                      setMatrixFilterAxis={setMatrixFilterAxis}
                      setMatrixTargetEventId={setMatrixTargetEventId}
                      setSelectedIncomingEventId={setSelectedMatrixIncomingEventId}
                      setSelectedPlayingEventId={setSelectedMatrixPlayingEventId}
                    />
                  ) : activeWorkspaceTab === "assets" ? (
                    <div className="grid gap-4" data-testid="project-asset-libraries">
                      <div className="flex min-h-[34px] flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <BookOpen className="size-4 text-gray-500" />
                            Asset Libraries
                          </h3>
                          <p className="text-xs text-gray-500">
                            Libraries available to events on {selectedDevice.device.name}.
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {selectedProjectAssetFolder?.folder.parentFolderId ? (
                            <RowActionsMenu
                              grouped
                              icon={MoreVertical}
                              items={[
                                {
                                  destructive: true,
                                  icon: <Trash2 aria-hidden="true" className="size-4" />,
                                  label: "Delete folder",
                                  onSelect: () =>
                                    openDeleteProjectAssetFolder(selectedProjectAssetFolder)
                                }
                              ]}
                              label={`Open actions for ${selectedProjectAssetFolder.folder.name}`}
                            />
                          ) : null}
                          <Button
                            disabled={!selectedProjectAssetFolder}
                            leftIcon={<FolderPlus className="size-4" />}
                            onClick={openCreateAssetFolder}
                          >
                            New folder
                          </Button>
                          <Button
                            disabled={!selectedProjectAssetFolder}
                            leftIcon={<Plus className="size-4" />}
                            onClick={openCreateAsset}
                            variant="primary"
                          >
                            New asset
                          </Button>
                          <Button
                            disabled={!importCandidates.length || assetLibrariesQuery.isLoading}
                            leftIcon={<Plus className="size-4" />}
                            onClick={openImportLibrary}
                          >
                            Import library
                          </Button>
                        </div>
                      </div>

                      {projectAssetLibraries.length ? (
                        <div className="grid gap-4 xl:grid-cols-[268px_1fr]">
                          <aside className="grid content-start gap-2 border-y border-gray-300 bg-gray-50 px-3 py-3">
                            {projectAssetLibraries.map(({ library, status }) => {
                              const summary = librarySummaryById.get(library.id);
                              const selected = selectedProjectAssetLibrary?.library.id === library.id;

                              return (
                                <button
                                  className={`grid rounded-xl border px-3 py-3 text-left transition-colors ${
                                    selected
                                      ? "border-gray-200 bg-gray-200 text-gray-700"
                                      : "border-gray-300 bg-gray-25 text-gray-600 hover:bg-gray-100"
                                  }`}
                                  key={library.id}
                                  onClick={() => goToProjectAssetLibrary(library.id)}
                                  type="button"
                                >
                                  <span className="flex min-w-0 items-start justify-between gap-3">
                                    <span className="min-w-0">
                                      <span className="block truncate text-sm font-medium text-gray-700">
                                        {library.name}
                                      </span>
                                      <span className="mt-1 block text-xs text-gray-500">
                                        {summary?.assetCount ?? 0} assets, {summary?.folderCount ?? 0} folders
                                      </span>
                                    </span>
                                    <BookOpen className="size-4 shrink-0 text-gray-600" strokeWidth={1.8} />
                                  </span>
                                  <span className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-medium text-gray-600">
                                    <Badge>{status}</Badge>
                                  </span>
                                </button>
                              );
                            })}
                          </aside>

                          <div className="grid min-w-0 content-start gap-3">
                            <div className="flex min-h-[34px] flex-wrap items-center justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-1 text-sm text-gray-500">
                                  <span className="truncate font-medium text-gray-600">
                                    {selectedProjectAssetLibrary?.library.name ?? "Asset library"}
                                  </span>
                                  {projectAssetFolderPath.map((folder) => (
                                    <Fragment key={folder.id}>
                                      <span aria-hidden="true">/</span>
                                      <button
                                        className="max-w-[220px] truncate rounded-md px-1 font-medium text-gray-600 hover:bg-gray-100"
                                        onClick={() => goToProjectAssetFolder(folder.id)}
                                        type="button"
                                      >
                                        {folder.name}
                                      </button>
                                    </Fragment>
                                  ))}
                                </div>
                                <h4 className="truncate text-md font-semibold text-gray-700">
                                  {selectedProjectAssetFolder?.folder.name ?? "Library contents"}
                                </h4>
                                <p className="text-xs text-gray-500">
                                  {selectedProjectAssetFolderItemCount} item
                                  {pluralSuffix(selectedProjectAssetFolderItemCount)} available for playback
                                  scheduling.
                                </p>
                              </div>
                            </div>

                            {projectAssetTreeQuery.isLoading ? (
                              <LoadingState title="Loading asset library" description="Reading folders and assets." />
                            ) : null}
                            {projectAssetTreeQuery.isError ? (
                              <ErrorState
                                title="Asset library unavailable"
                                description={messageForError(projectAssetTreeQuery.error, workspaceErrorFallback)}
                              />
                            ) : null}

                            {!projectAssetTreeQuery.isLoading &&
                            !projectAssetTreeQuery.isError &&
                            visibleProjectAssetItems.length === 0 ? (
                              <EmptyState
                                action={
                                  <Button onClick={openCreateAsset} variant="primary">
                                    Create asset
                                  </Button>
                                }
                                title="This folder is empty"
                                description="Upload an audio or haptic asset to make it available for playback scheduling."
                              />
                            ) : null}

                            {!projectAssetTreeQuery.isLoading &&
                            !projectAssetTreeQuery.isError &&
                            visibleProjectAssetItems.length > 0 ? (
                              <Table>
                                <TableHead>
                                  <TableRow>
                                    <TableHeaderCell>Name</TableHeaderCell>
                                    <TableHeaderCell>Type</TableHeaderCell>
                                    <TableHeaderCell>Source</TableHeaderCell>
                                    <TableHeaderCell>Preview</TableHeaderCell>
                                    <TableHeaderCell className="w-12 text-right">Actions</TableHeaderCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {visibleProjectAssetItems.map((item) => {
                                    if (item.kind === "folder") {
                                      return (
                                        <TableRow
                                          className="cursor-pointer hover:bg-gray-50"
                                          key={item.node.folder.id}
                                          onClick={() => goToProjectAssetFolder(item.node.folder.id)}
                                        >
                                          <TableCell className="font-medium">
                                            <span className="flex items-center gap-2">
                                              <BookOpen className="size-4 text-gray-600" strokeWidth={1.8} />
                                              {item.node.folder.name}
                                            </span>
                                          </TableCell>
                                          <TableCell>Folder</TableCell>
                                          <TableCell>Folder</TableCell>
                                          <TableCell>-</TableCell>
                                          <TableCell>
                                            <div
                                              className="flex justify-end"
                                              onClick={(event) => event.stopPropagation()}
                                            >
                                              <RowActionsMenu
                                                grouped
                                                icon={MoreVertical}
                                                items={[
                                                  {
                                                    destructive: true,
                                                    icon: <Trash2 aria-hidden="true" className="size-4" />,
                                                    label: "Delete folder",
                                                    onSelect: () =>
                                                      openDeleteProjectAssetFolder(item.node)
                                                  }
                                                ]}
                                                label={`Open actions for ${item.node.folder.name}`}
                                                size="compact"
                                              />
                                            </div>
                                          </TableCell>
                                        </TableRow>
                                      );
                                    }

                                    const Icon = item.asset.mediaKind === "audio" ? FileAudio : Waves;
                                    const previewItem: AudioPreviewItem = {
                                      asset: item.asset,
                                      isEnabled: item.asset.mediaKind === "audio",
                                      key: `asset-library-${item.asset.id}`,
                                      startOffset: 0
                                    };

                                    return (
                                      <TableRow key={item.asset.id}>
                                        <TableCell className="font-medium">
                                          <span className="flex items-center gap-2">
                                            <Icon className="size-4 text-gray-600" strokeWidth={1.8} />
                                            {item.asset.name}
                                          </span>
                                        </TableCell>
                                        <TableCell>{assetExtensionFor(item.asset)}</TableCell>
                                        <TableCell>{assetSourceLabelFor(item.asset)}</TableCell>
                                        <TableCell>
                                          {item.asset.mediaKind === "audio" ? (
                                            <AudioPreviewButton item={previewItem} />
                                          ) : (
                                            <span className="text-xs text-gray-500">Visual</span>
                                          )}
                                        </TableCell>
                                        <TableCell>
                                          <div className="flex justify-end">
                                            <RowActionsMenu
                                              grouped
                                              icon={MoreVertical}
                                              items={[
                                                {
                                                  destructive: true,
                                                  icon: <Trash2 aria-hidden="true" className="size-4" />,
                                                  label: "Delete asset",
                                                  onSelect: () => openDeleteProjectAsset(item.asset)
                                                }
                                              ]}
                                              label={`Open actions for ${item.asset.name}`}
                                              size="compact"
                                            />
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            ) : null}
                          </div>
                        </div>
                      ) : (
                        <EmptyState
                          title="No matching libraries"
                          description="Clear search to show this project's asset libraries."
                        />
                      )}
                    </div>
                  ) : (
                  <>
                  <div className="flex min-h-[34px] flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700">
                        {selectedCollection?.collection.name ?? "No collection selected"}
                      </h3>
                      <p className="text-xs text-gray-500">
                        Collections are scoped to {selectedDevice.device.name}.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        disabled={!selectedCollection}
                        leftIcon={<Edit3 className="size-4" />}
                        onClick={openEditCollection}
                      >
                        Rename
                      </Button>
                      <RowActionsMenu
                        disabled={!selectedCollection}
                        grouped
                        icon={MoreVertical}
                        items={[
                          {
                            destructive: true,
                            icon: <Trash2 aria-hidden="true" className="size-4" />,
                            label: "Delete collection",
                            onSelect: openDeleteCollection
                          }
                        ]}
                        label={`Open actions for ${selectedCollection?.collection.name ?? "collection"}`}
                      />
                      <Button leftIcon={<Plus className="size-4" />} onClick={openCreateCollection}>
                        Collection
                      </Button>
                      <Button
                        disabled={!selectedCollection}
                        leftIcon={<Plus className="size-4" />}
                        onClick={openCreateEvent}
                        variant="primary"
                      >
                        Add event
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <div className="min-w-0">
                      <div className="hidden md:block">
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableHeaderCell>Event</TableHeaderCell>
                              <TableHeaderCell>Event type</TableHeaderCell>
                              <TableHeaderCell>Interactions</TableHeaderCell>
                              <TableHeaderCell>Scheduled playbacks</TableHeaderCell>
                              <TableHeaderCell className="w-24" />
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {eventRows.map((row) => {
                              const triggerCount = row.eventTriggers.length;
                              const playbackCount = row.eventTriggers.reduce(
                                (total, trigger) => total + trigger.playbacks.length,
                                0
                              );
                              return (
                                <TableRow className="hover:bg-gray-50" key={row.event.id}>
                                  <TableCell className="font-medium">
                                    <button
                                      className="grid w-full min-w-0 gap-0.5 text-left text-gray-700"
                                      onClick={() => goToEvent(row.event.id)}
                                      type="button"
                                    >
                                      <span className="truncate">{row.event.name}</span>
                                    </button>
                                  </TableCell>
                                  <TableCell>
                                    <span className="inline-flex h-[22px] items-center rounded-lg border border-gray-300 bg-gray-25 px-2 text-xs font-medium text-gray-700">
                                      {row.event.eventType}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    {triggerCount ? `${triggerCount} bound` : <span className="text-gray-500">Unset</span>}
                                  </TableCell>
                                  <TableCell>{playbackCount ? `${playbackCount} scheduled` : "0 scheduled"}</TableCell>
                                  <TableCell>
                                    <div className="flex items-center justify-end gap-1">
                                    <Button
                                      onClick={() => goToEvent(row.event.id)}
                                      rightIcon={<ArrowRight className="size-4" />}
                                      size="compact"
                                    >
                                      Open
                                    </Button>
                                    <RowActionsMenu
                                      grouped
                                      icon={MoreVertical}
                                      items={[
                                        {
                                          destructive: true,
                                          icon: <Trash2 aria-hidden="true" className="size-4" />,
                                          label: "Delete event",
                                          onSelect: () => openDeleteEvent(row.event)
                                        }
                                      ]}
                                      label={`Open actions for ${row.event.name}`}
                                      size="compact"
                                    />
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>

                      <div className="grid border-y border-gray-300 md:hidden">
                        <div className="grid h-10 grid-cols-[1fr_auto] items-center bg-gray-50 px-3 text-xs font-medium text-gray-500">
                          <span>Events</span>
                          <span>{eventRows.length}</span>
                        </div>
                        {eventRows.map((row) => {
                          const triggerCount = row.eventTriggers.length;
                          const playbackCount = row.eventTriggers.reduce(
                            (total, trigger) => total + trigger.playbacks.length,
                            0
                          );
                          return (
                            <div
                              className="grid gap-2 border-t border-gray-200 bg-gray-25 px-3 py-2 text-left text-gray-700"
                              key={row.event.id}
                            >
                              <span className="flex min-w-0 items-center justify-between gap-2">
                                <button
                                  className="min-w-0 truncate text-left text-sm font-semibold"
                                  onClick={() => goToEvent(row.event.id)}
                                  type="button"
                                >
                                  {row.event.name}
                                </button>
                                <span className="inline-flex h-[22px] shrink-0 items-center rounded-lg border border-gray-300 bg-gray-25 px-2 text-xs font-medium text-gray-700">
                                  {row.event.eventType}
                                </span>
                              </span>
                              <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                                <span>{triggerCount ? `${triggerCount} interactions` : "Unset interactions"}</span>
                                <span>{playbackCount ? `${playbackCount} playbacks` : "No playbacks"}</span>
                                <button
                                  className="ml-auto flex items-center gap-1 font-medium text-gray-700"
                                  onClick={() => goToEvent(row.event.id)}
                                  type="button"
                                >
                                  Open
                                  <ArrowRight aria-hidden="true" className="size-3.5" />
                                </button>
                                <IconButton
                                  icon={Trash2}
                                  label={`Delete ${row.event.name}`}
                                  onClick={() => openDeleteEvent(row.event)}
                                  size="compact"
                                />
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {!eventRows.length ? (
                        <EmptyState
                          action={
                            <Button leftIcon={<Plus className="size-4" />} onClick={openCreateEvent} variant="primary">
                              Add event
                            </Button>
                          }
                          title="No events in this collection"
                          description="Create the first event to schedule sound and haptic feedback."
                        />
                      ) : null}
                    </div>

                  </div>
                  </>
                  )}
                </section>
              )}
            </>
          )}
        </main>
      </div>

      {deleteTarget ? (
        <ConfirmDialog
          confirmLabel={deleteActionLabelFor(deleteTarget)}
          disabled={
            deleteProject.isPending ||
            deleteDevice.isPending ||
            deleteCollection.isPending ||
            deleteEvent.isPending ||
            deleteAssetLibraryFolder.isPending ||
            deleteAsset.isPending ||
            deleteMatrixEntry.isPending
          }
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => void handleConfirmDelete()}
          title={`${deleteActionLabelFor(deleteTarget)}?`}
          cascadeSummary={
            deleteTarget.kind === "project"
              ? "Devices, collections, events, default assets, imports, matrix rules, and share links."
              : deleteTarget.kind === "device"
                ? "Collections, events, trigger schedules, collision matrix rows, columns, entries, and share links."
                : deleteTarget.kind === "collection"
                  ? "Events, trigger schedules, collision matrix rows, columns, entries, and share links."
                  : deleteTarget.kind === "event"
                    ? "Trigger schedules, collision matrix rows, columns, entries, and share links."
                    : deleteTarget.kind === "assetFolder"
                      ? `${deleteTarget.counts.folders} child folder${pluralSuffix(
                          deleteTarget.counts.folders
                        )} and ${deleteTarget.counts.assets} asset${pluralSuffix(deleteTarget.counts.assets)}.`
                      : deleteTarget.kind === "asset"
                        ? "Scheduled playbacks that reference this asset."
                        : "The selected matrix rule and its share links."
          }
        >
          This {deleteTarget.kind.startsWith("matrix") ? "clears" : "removes"} {deleteTarget.name} and its
          dependent demo records from IndexedDB.
        </ConfirmDialog>
      ) : null}

      <ShareLinkDeleteConfirm
        disabled={shareController.deleteSharingLinkIsPending}
        onCancel={() => shareController.setShareLinkPendingDelete(null)}
        onConfirm={() => void shareController.handleDeleteShareLink()}
        shareLink={shareController.shareLinkPendingDelete}
      />

      <DialogOverlay align="end" open={dialog !== null}>
        <ShareLinkDialog
          copyShareLink={shareController.copyShareLink}
          onClose={() => setDialog(null)}
          onDelete={shareController.openDeleteShareLinkDialog}
          open={dialog === "share"}
          shareLabel={shareController.shareLabel}
          shareLink={shareController.shareLink}
        />

        <FormDialog
          className="max-w-[420px]"
          formId="create-device-form"
          onCancel={() => setDialog(null)}
          onSubmit={handleCreateDevice}
          open={dialog === "device"}
          submitLabel="Create device"
          title="Create Device"
        >
          <div className="grid max-h-[38vh] gap-4 overflow-auto border-y border-gray-200 bg-gray-50 p-3">
            {groupDevicePresetsByFormFactor().map((group) => (
              <section className="grid gap-2" key={group.formFactor}>
                <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">
                  {group.formFactor}
                </h3>
                <CardGrid className="sm:grid-cols-2 xl:grid-cols-2">
                  {group.presets.map((preset) => (
                    <SelectableCard
                      checked={devicePresetId === preset.presetId}
                      description={preset.platformName}
                      icon={<DeviceGlyph formFactor={preset.formFactor} />}
                      id={`add-device-${preset.presetId}`}
                      key={preset.presetId}
                      label={preset.deviceName}
                      name="device-preset"
                      onChange={() => selectDevicePreset(preset)}
                    />
                  ))}
                </CardGrid>
              </section>
            ))}
          </div>
          <TextInput
            autoFocus
            id="device-name"
            label="Name"
            onChange={(event) => setDeviceName(event.currentTarget.value)}
            placeholder="iPad Pro"
            required
            value={deviceName}
          />
          <Select
            id="device-platform"
            label="Platform"
            onChange={(event) => setDevicePlatformId(event.currentTarget.value)}
            required
            value={devicePlatformId || workspace.platforms[0]?.id}
          >
            {workspace.platforms.map((platform) => (
              <option key={platform.id} value={platform.id}>
                {platform.name}
              </option>
            ))}
          </Select>
          <Switch
            checked={deviceEnabled}
            id="new-device-enabled"
            label="Include in playback/export"
            onChange={(event) => setDeviceEnabled(event.currentTarget.checked)}
          />
          <FeedbackText />
        </FormDialog>

      <FormDialog
        className="max-w-[420px]"
        formId="collection-form"
        onCancel={() => setDialog(null)}
        onSubmit={dialog === "editCollection" ? handleEditCollection : handleCreateCollection}
        open={dialog === "collection" || dialog === "editCollection"}
        submitLabel={dialog === "editCollection" ? "Save" : "Create collection"}
        title={dialog === "editCollection" ? "Rename Collection" : "Create Collection"}
      >
          <TextInput
            autoFocus
            id="collection-name"
            label="Name"
            onChange={(event) => setCollectionName(event.currentTarget.value)}
            placeholder="Keyboard"
            required
            value={collectionName}
          />
          <FeedbackText />
      </FormDialog>

      <FormDialog
        className="max-w-[420px]"
        formId="event-form"
        onCancel={() => setDialog(null)}
        onSubmit={handleCreateEvent}
        open={dialog === "event"}
        submitLabel="Create event"
        title="Create Event"
      >
          <TextInput
            autoFocus
            id="event-name"
            label="Name"
            onChange={(event) => setEventName(event.currentTarget.value)}
            placeholder="Primary CTA"
            required
            value={eventName}
          />
          <Select
            id="event-type"
            label="Event type"
            onChange={(event) => setEventType(event.currentTarget.value as (typeof eventTypes)[number])}
            required
            value={eventType}
          >
            {eventTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
          <FeedbackText />
      </FormDialog>

      <FormDialog
        className="max-w-[460px]"
        disabled={!importCandidates.length}
        formId="library-import-form"
        onCancel={() => setDialog(null)}
        onSubmit={handleImportLibrary}
        open={dialog === "libraryImport"}
        submitLabel="Import library"
        title="Import Library"
      >
          <Select
            id="asset-library-import"
            label="Library"
            onChange={(event) => setImportLibraryId(event.currentTarget.value)}
            required
            value={importLibraryId || importCandidates[0]?.library.id}
          >
            {importCandidates.map((summary) => (
              <option key={summary.library.id} value={summary.library.id}>
                {summary.library.name} / {summary.assetCount} assets
              </option>
            ))}
          </Select>
          <div className="grid gap-1 border-y border-gray-200 py-2 text-sm text-gray-600">
            <div className="flex justify-between gap-3 px-2">
              <span>Default library</span>
              <span className="font-medium text-gray-700">{workspace.defaultAssetLibrary.name}</span>
            </div>
            <div className="flex justify-between gap-3 px-2">
              <span>Imported libraries</span>
              <span className="font-medium text-gray-700">{workspace.importedAssetLibraries.length}</span>
            </div>
          </div>
          <FeedbackText />
      </FormDialog>

      <CreateAssetFolderDialog
        onClose={() => setDialog(null)}
        onCreate={handleCreateAssetFolder}
        open={dialog === "assetFolder"}
      />

      <CreateAssetDialog
        onClose={() => setDialog(null)}
        onCreate={handleCreateAsset}
        open={dialog === "asset"}
      />
      </DialogOverlay>
    </section>
  );
}
