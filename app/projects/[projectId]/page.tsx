"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Fragment, FormEvent, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  CornerDownLeft,
  Edit3,
  FileAudio,
  FolderPlus,
  Grid2X2,
  Link2,
  MoreVertical,
  Move,
  Pause,
  Plus,
  Search,
  SlidersHorizontal,
  Smartphone,
  Timer,
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
  resolutionBehaviorNames,
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
  useDeleteCollisionMatrixEntryMutation,
  useDeselectCollisionMatrixColumnMutation,
  useDeselectCollisionMatrixRowMutation,
  useSelectCollisionMatrixColumnMutation,
  useSelectCollisionMatrixRowMutation,
  useUpdateCollectionMutation,
  useUpdateDeviceMutation,
  useUpsertCollisionMatrixEntryMutation
} from "@/features/projects/queries";
import {
  AudioPreviewIconButton,
  useAudioPreviewPlayer,
  type AudioPreviewItem
} from "@/features/projects/audio-preview";
import {
  MatrixAxisFilter,
  type MatrixAxis,
  type MatrixFilterCollection
} from "@/features/projects/matrix-axis-filter";
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

const matrixRowHeaderWidth = "168px";

const behaviorCopy: Record<ResolutionBehaviorName, string> = {
  Preempt: "Incoming stops the playing one and takes over.",
  Suppress: "Incoming does not play. The playing one continues.",
  Queue: "Incoming waits and plays when the current one finishes.",
  "Co-play": "Both play at full level.",
  "Not possible": "These two cannot occur at the same time."
};

const behaviorIconFor = (behavior: ResolutionBehaviorName) => {
  if (behavior === "Preempt") {
    return CornerDownLeft;
  }

  if (behavior === "Suppress") {
    return ArrowRight;
  }

  if (behavior === "Queue") {
    return Timer;
  }

  if (behavior === "Co-play") {
    return Move;
  }

  return Pause;
};

const behaviorCellClass = (entry: CollisionMatrixEntry | undefined, selected: boolean) => {
  if (selected) {
    return "bg-gray-200 text-gray-700";
  }

  if (!entry) {
    return "text-gray-500";
  }

  return "text-gray-700";
};

const behaviorBubbleClass = (entry: CollisionMatrixEntry | undefined, selected: boolean) =>
  selected
    ? "border-gray-300 bg-gray-25 text-gray-700"
    : entry?.resolutionBehavior.behaviorName === "Not possible"
      ? "border-gray-200 bg-gray-100 text-gray-500"
      : "border-gray-200 bg-gray-25 text-gray-700";

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
  const { projectId: projectIdParam } = useParams<{ projectId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = asEntityId<ProjectId>(projectIdParam);
  const selectedDeviceParam = searchParams.get("device");
  const selectedCollectionParam = searchParams.get("collection");
  const returnFeedback = searchParams.get("feedback");
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
  const [matrixFilterAnchor, setMatrixFilterAnchor] = useState<
    "playingAxis" | "incomingAxis" | "toolbar" | null
  >(null);
  const [matrixFilterAxis, setMatrixFilterAxis] = useState<MatrixAxis>("playing");
  const [feedback, setFeedback] = useState<string | null>(returnFeedback);
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
  const selectMatrixRow = useSelectCollisionMatrixRowMutation();
  const selectMatrixColumn = useSelectCollisionMatrixColumnMutation();
  const deselectMatrixRow = useDeselectCollisionMatrixRowMutation();
  const deselectMatrixColumn = useDeselectCollisionMatrixColumnMutation();
  const upsertMatrixEntry = useUpsertCollisionMatrixEntryMutation();
  const deleteMatrixEntry = useDeleteCollisionMatrixEntryMutation();
  const audioPreview = useAudioPreviewPlayer();
  const shareController = useShareLink({
    errorFallback: workspaceErrorFallback,
    setDialog: (nextDialog) => setDialog(nextDialog),
    setFeedback
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
  const matrixEvents = useMemo(
    () =>
      (deviceWorkspaceQuery.data?.collections ?? []).flatMap((collection) =>
        collection.events.map((event) => event.event)
      ),
    [deviceWorkspaceQuery.data?.collections]
  );
  const matrixEventById = useMemo(
    () => new Map(matrixEvents.map((event) => [event.id, event])),
    [matrixEvents]
  );
  const matrixFilterCollections = useMemo<MatrixFilterCollection[]>(
    () =>
      (deviceWorkspaceQuery.data?.collections ?? []).map((collection) => ({
        id: collection.collection.id,
        name: collection.collection.name,
        events: collection.events.map((event) => ({ id: event.event.id, name: event.event.name }))
      })),
    [deviceWorkspaceQuery.data?.collections]
  );
  const matrixRowEventIds = useMemo(
    () => new Set((deviceWorkspaceQuery.data?.matrixRows ?? []).map((row) => row.eventId)),
    [deviceWorkspaceQuery.data?.matrixRows]
  );
  const matrixColumnEventIds = useMemo(
    () => new Set((deviceWorkspaceQuery.data?.matrixColumns ?? []).map((column) => column.eventId)),
    [deviceWorkspaceQuery.data?.matrixColumns]
  );
  const selectedMatrixEntry = useMemo(
    () =>
      (deviceWorkspaceQuery.data?.matrixEntries ?? []).find(
        (entry) =>
          entry.playingEventId === selectedMatrixPlayingEventId &&
          entry.incomingEventId === selectedMatrixIncomingEventId
      ),
    [
      deviceWorkspaceQuery.data?.matrixEntries,
      selectedMatrixIncomingEventId,
      selectedMatrixPlayingEventId
    ]
  );
  const matrixCoverage = useMemo(() => {
    const rowCount = deviceWorkspaceQuery.data?.matrixRows.length ?? 0;
    const columnCount = deviceWorkspaceQuery.data?.matrixColumns.length ?? 0;
    const possibleCells = rowCount * columnCount;

    if (!possibleCells) {
      return 0;
    }

    return Math.round(((deviceWorkspaceQuery.data?.matrixEntries.length ?? 0) / possibleCells) * 100);
  }, [
    deviceWorkspaceQuery.data?.matrixColumns,
    deviceWorkspaceQuery.data?.matrixEntries,
    deviceWorkspaceQuery.data?.matrixRows
  ]);

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
    setFeedback(null);
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
    setFeedback(null);
    setDialog("collection");
  };

  const openEditCollection = () => {
    setCollectionName(selectedCollection?.collection.name ?? "");
    setFeedback(null);
    setDialog("editCollection");
  };

  const openCreateEvent = () => {
    setEventName("");
    setEventType("Button");
    setFeedback(null);
    setDialog("event");
  };

  const openImportLibrary = () => {
    setImportLibraryId(importCandidates[0]?.library.id ?? "");
    setFeedback(null);
    setDialog("libraryImport");
  };

  const openCreateAssetFolder = () => {
    setFeedback(null);
    setDialog("assetFolder");
  };

  const openCreateAsset = () => {
    setFeedback(null);
    setDialog("asset");
  };

  const openDeleteProject = () => {
    if (!workspaceQuery.data) {
      return;
    }

    setFeedback(null);
    setDeleteTarget({
      kind: "project",
      id: workspaceQuery.data.project.id,
      name: workspaceQuery.data.project.name
    });
  };

  const openDeleteDevice = (summary: DeviceSummary) => {
    setFeedback(null);
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

    setFeedback(null);
    setDeleteTarget({
      kind: "collection",
      id: selectedCollection.collection.id,
      name: selectedCollection.collection.name
    });
  };

  const openDeleteEvent = (event: { id: EventId; name: string }) => {
    setFeedback(null);
    setDeleteTarget({
      kind: "event",
      id: event.id,
      name: event.name
    });
  };

  const openClearMatrixEntry = () => {
    if (!selectedMatrixEntry) {
      return;
    }

    setFeedback(null);
    setDeleteTarget({
      kind: "matrixEntry",
      id: selectedMatrixEntry.id,
      name: `${matrixEventById.get(selectedMatrixEntry.playingEventId)?.name ?? "Playing event"} x ${
        matrixEventById.get(selectedMatrixEntry.incomingEventId)?.name ?? "incoming event"
      }`
    });
  };

  const openDeleteProjectAssetFolder = (node: AssetLibraryFolderNode) => {
    setFeedback(null);
    setDeleteTarget({
      counts: countAssetFolderDescendants(node),
      kind: "assetFolder",
      id: node.folder.id,
      name: node.folder.name
    });
  };

  const openDeleteProjectAsset = (asset: Asset) => {
    setFeedback(null);
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

    setFeedback(null);

    try {
      const created = await createDevice.mutateAsync({
        projectId,
        platformId: asEntityId<PlatformId>(platformId),
        name: deviceName,
        isEnabled: deviceEnabled
      });

      setDialog(null);
      setDeviceName("");
      setDevicePresetId("");
      setFeedback(`Created ${created.device.name} with a new Collision Matrix.`);
      goToDevice(created.device.id);
    } catch (error) {
      setFeedback(messageForError(error, workspaceErrorFallback));
    }
  };

  const handleCreateCollection = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedDevice) {
      return;
    }

    setFeedback(null);

    try {
      const collection = await createCollection.mutateAsync({
        deviceId: selectedDevice.device.id,
        name: collectionName
      });

      setDialog(null);
      setCollectionName("");
      setFeedback(`Created ${collection.name} for ${selectedDevice.device.name}.`);
      goToCollection(collection.id);
    } catch (error) {
      setFeedback(messageForError(error, workspaceErrorFallback));
    }
  };

  const handleEditCollection = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedCollection) {
      return;
    }

    setFeedback(null);

    try {
      const collection = await updateCollection.mutateAsync({
        collectionId: selectedCollection.collection.id,
        name: collectionName
      });

      setDialog(null);
      setFeedback(`Renamed collection to ${collection.name}.`);
    } catch (error) {
      setFeedback(messageForError(error, workspaceErrorFallback));
    }
  };

  const handleCreateEvent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedCollection) {
      return;
    }

    setFeedback(null);

    try {
      const created = await createEvent.mutateAsync({
        collectionId: selectedCollection.collection.id,
        name: eventName,
        eventType
      });

      setDialog(null);
      setEventName("");
      setFeedback(`Created ${created.name} in ${selectedCollection.collection.name}.`);
      goToEvent(created.id);
    } catch (error) {
      setFeedback(messageForError(error, workspaceErrorFallback));
    }
  };

  const handleImportLibrary = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!importLibraryId) {
      return;
    }

    setFeedback(null);

    try {
      const imported = await importAssetLibrary.mutateAsync({
        projectId,
        assetLibraryId: asEntityId<AssetLibraryId>(importLibraryId)
      });
      const library = assetLibrariesQuery.data?.libraries.find(
        (summary) => summary.library.id === imported.assetLibraryId
      )?.library;

      setDialog(null);
      setFeedback(`Imported ${library?.name ?? "asset library"} for playback selection.`);
    } catch (error) {
      setFeedback(messageForError(error, workspaceErrorFallback));
    }
  };

  const handleCreateAssetFolder = async ({ name, icon }: { name: string; icon: string }) => {
    if (!selectedProjectAssetLibrary || !selectedProjectAssetFolder) {
      return;
    }

    setFeedback(null);

    try {
      const folder = await createAssetLibraryFolder.mutateAsync({
        libraryId: selectedProjectAssetLibrary.library.id,
        parentFolderId: selectedProjectAssetFolder.folder.id,
        name,
        icon
      });

      setDialog(null);
      setFeedback(`Created folder ${folder.name}.`);
      goToProjectAssetFolder(folder.id);
    } catch (error) {
      setFeedback(messageForError(error, workspaceErrorFallback));
      throw error;
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

    setFeedback(null);

    try {
      const asset = await createAsset.mutateAsync({
        libraryId: selectedProjectAssetLibrary.library.id,
        folderId: selectedProjectAssetFolder.folder.id,
        ...input
      });

      setDialog(null);
      setFeedback(`Uploaded ${asset.mediaKind} asset ${asset.name}.`);
    } catch (error) {
      setFeedback(messageForError(error, workspaceErrorFallback));
      throw error;
    }
  };

  const handleDeviceEnabledChange = async (isEnabled: boolean) => {
    if (!selectedDevice) {
      return;
    }

    setFeedback(null);

    try {
      await updateDevice.mutateAsync({
        deviceId: selectedDevice.device.id,
        isEnabled
      });
      setFeedback(
        isEnabled
          ? `${selectedDevice.device.name} is included in playback and export.`
          : `${selectedDevice.device.name} is excluded from playback and export.`
      );
    } catch (error) {
      setFeedback(messageForError(error, workspaceErrorFallback));
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    setFeedback(null);

    try {
      if (deleteTarget.kind === "project") {
        await deleteProject.mutateAsync(deleteTarget.id);
        setDeleteTarget(null);
        writeFlashMessage(`Deleted project ${deleteTarget.name}.`);
        router.push("/projects");
        return;
      }

      if (deleteTarget.kind === "collection") {
        const remainingCollections = (deviceWorkspaceQuery.data?.collections ?? []).filter(
          (item) => item.collection.id !== deleteTarget.id
        );
        const fallbackCollectionId = remainingCollections[0]?.collection.id ?? null;

        await deleteCollection.mutateAsync(deleteTarget.id);
        setDeleteTarget(null);
        setFeedback(`Deleted collection ${deleteTarget.name}.`);

        if (selectedCollection?.collection.id === deleteTarget.id) {
          router.push(
            `/projects/${projectId}${hrefWithParams("", searchParams, {
              collection: fallbackCollectionId
            })}`
          );
        }

        return;
      }

      if (deleteTarget.kind === "event") {
        await deleteEvent.mutateAsync(deleteTarget.id);
        setDeleteTarget(null);
        setFeedback(`Deleted event ${deleteTarget.name}.`);
        return;
      }

      if (deleteTarget.kind === "assetFolder") {
        const deletedPathContainedSelection =
          selectedProjectAssetFolderId === deleteTarget.id ||
          projectAssetFolderPath.some((folder) => folder.id === deleteTarget.id);

        await deleteAssetLibraryFolder.mutateAsync(deleteTarget.id);
        setDeleteTarget(null);
        setFeedback(`Deleted folder ${deleteTarget.name}.`);

        if (deletedPathContainedSelection) {
          setSelectedProjectAssetFolderId(null);
        }

        return;
      }

      if (deleteTarget.kind === "asset") {
        audioPreview.stop();
        await deleteAsset.mutateAsync(deleteTarget.id);
        setDeleteTarget(null);
        setFeedback(`Deleted asset ${deleteTarget.name}.`);
        return;
      }

      if (deleteTarget.kind === "matrixEntry") {
        await deleteMatrixEntry.mutateAsync(deleteTarget.id);
        setDeleteTarget(null);
        setMatrixBehavior("Preempt");
        setMatrixTargetEventId("");
        setFeedback(`Cleared matrix rule ${deleteTarget.name}.`);
        return;
      }

      const remainingDevices = (workspaceQuery.data?.devices ?? []).filter(
        (summary) => summary.device.id !== deleteTarget.id
      );
      const fallbackDeviceId = remainingDevices[0]?.device.id ?? null;

      await deleteDevice.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      setFeedback(`Deleted device ${deleteTarget.name}.`);

      if (selectedDevice?.device.id === deleteTarget.id) {
        router.push(
          `/projects/${projectId}${hrefWithParams("", searchParams, {
            device: fallbackDeviceId,
            collection: null
          })}`
        );
      }
    } catch (error) {
      setFeedback(messageForError(error, workspaceErrorFallback));
    }
  };

  const renderMatrixAxisFilter = () => (
    <MatrixAxisFilter
      activeAxis={matrixFilterAxis}
      collections={matrixFilterCollections}
      incomingEventIds={matrixColumnEventIds}
      onChangeAxis={setMatrixFilterAxis}
      onClose={() => setMatrixFilterAnchor(null)}
      onToggleEvents={(axis, eventIds, nextSelected) =>
        void handleToggleMatrixAxisEvents(axis, eventIds, nextSelected)
      }
      pending={
        selectMatrixRow.isPending ||
        selectMatrixColumn.isPending ||
        deselectMatrixRow.isPending ||
        deselectMatrixColumn.isPending
      }
      playingEventIds={matrixRowEventIds}
    />
  );

  const openMatrixFilter = (anchor: "playingAxis" | "incomingAxis" | "toolbar", axis: MatrixAxis) => {
    setFeedback(null);
    setMatrixFilterAxis(axis);
    setMatrixFilterAnchor((current) => (current === anchor ? null : anchor));
  };

  const handleToggleMatrixAxisEvents = async (
    axis: MatrixAxis,
    eventIds: readonly EventId[],
    nextSelected: boolean
  ) => {
    const matrixId = deviceWorkspaceQuery.data?.collisionMatrix.id;

    if (!matrixId) {
      return;
    }

    const selectedEventIds = axis === "playing" ? matrixRowEventIds : matrixColumnEventIds;
    const changingEventIds = eventIds.filter(
      (eventId) => selectedEventIds.has(eventId) !== nextSelected
    );

    if (changingEventIds.length === 0) {
      return;
    }

    setFeedback(null);

    try {
      for (const eventId of changingEventIds) {
        if (nextSelected && axis === "playing") {
          await selectMatrixRow.mutateAsync({ matrixId, eventId });
        } else if (nextSelected) {
          await selectMatrixColumn.mutateAsync({ matrixId, eventId });
        } else if (axis === "playing") {
          await deselectMatrixRow.mutateAsync({ matrixId, eventId });
        } else {
          await deselectMatrixColumn.mutateAsync({ matrixId, eventId });
        }
      }

      if (!nextSelected) {
        if (
          axis === "playing" &&
          selectedMatrixPlayingEventId &&
          changingEventIds.includes(selectedMatrixPlayingEventId)
        ) {
          setSelectedMatrixPlayingEventId(null);
          setMatrixTargetEventId("");
        }

        if (
          axis === "incoming" &&
          selectedMatrixIncomingEventId &&
          changingEventIds.includes(selectedMatrixIncomingEventId)
        ) {
          setSelectedMatrixIncomingEventId(null);
          setMatrixTargetEventId("");
        }
      }

      const axisLabel = axis === "playing" ? "playing rows" : "incoming columns";
      const changedLabel =
        changingEventIds.length === 1
          ? (matrixEventById.get(changingEventIds[0])?.name ?? "1 event")
          : `${changingEventIds.length} events`;

      setFeedback(
        nextSelected
          ? `Added ${changedLabel} to ${axisLabel}.`
          : `Removed ${changedLabel} from ${axisLabel}.`
      );
    } catch (error) {
      setFeedback(messageForError(error, workspaceErrorFallback));
    }
  };

  const handleSelectMatrixCell = (playingEventId: EventId, incomingEventId: EventId) => {
    const entry = (deviceWorkspaceQuery.data?.matrixEntries ?? []).find(
      (candidate) =>
        candidate.playingEventId === playingEventId && candidate.incomingEventId === incomingEventId
    );

    setSelectedMatrixPlayingEventId(playingEventId);
    setSelectedMatrixIncomingEventId(incomingEventId);
    setMatrixBehavior(entry?.resolutionBehavior.behaviorName ?? "Preempt");
    setMatrixTargetEventId(entry?.resolutionBehavior.targetEventId ?? "");
  };

  const handleSaveMatrixEntry = async () => {
    const matrixId = deviceWorkspaceQuery.data?.collisionMatrix.id;

    if (!matrixId || !selectedMatrixPlayingEventId || !selectedMatrixIncomingEventId) {
      return;
    }

    const targetEventId = matrixBehavior === "Suppress" ? matrixTargetEventId : matrixTargetEventId || "";

    setFeedback(null);

    try {
      const entry = await upsertMatrixEntry.mutateAsync({
        matrixId,
        playingEventId: selectedMatrixPlayingEventId,
        incomingEventId: selectedMatrixIncomingEventId,
        resolutionBehavior: {
          behaviorName: matrixBehavior,
          targetEventId: targetEventId ? asEntityId<EventId>(targetEventId) : null
        }
      });

      setFeedback(
        `Set ${matrixEventById.get(entry.playingEventId)?.name ?? "playing event"} x ${
          matrixEventById.get(entry.incomingEventId)?.name ?? "incoming event"
        } to ${entry.resolutionBehavior.behaviorName}.`
      );
    } catch (error) {
      setFeedback(messageForError(error, workspaceErrorFallback));
    }
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
                    <div className="grid gap-4">
                      <div className="flex min-h-[34px] flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <Grid2X2 className="size-4 text-gray-500" />
                            Collision Matrix
                          </h3>
                          <p className="text-xs text-gray-500">
                            Candidates come from events on {selectedDevice.device.name}. Coverage is {matrixCoverage}%.
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            disabled={!selectedMatrixEntry}
                            leftIcon={<Link2 className="size-4" />}
                            onClick={() => {
                              if (!selectedMatrixEntry) {
                                return;
                              }

                              void shareController.openShareDialog(
                                {
                                  kind: "collisionMatrixEntry",
                                  collisionMatrixEntryId: selectedMatrixEntry.id
                                },
                                `${matrixEventById.get(selectedMatrixEntry.playingEventId)?.name ?? "Playing event"} x ${
                                  matrixEventById.get(selectedMatrixEntry.incomingEventId)?.name ?? "incoming event"
                                }`
                              );
                            }}
                          >
                            Share entry
                          </Button>
                          <div className="relative">
                            <Button
                              aria-expanded={matrixFilterAnchor === "toolbar"}
                              leftIcon={<SlidersHorizontal className="size-4" />}
                              onClick={() => openMatrixFilter("toolbar", matrixFilterAxis)}
                            >
                              Filters
                            </Button>
                            <div className="absolute right-0 top-10 z-40">
                              {matrixFilterAnchor === "toolbar" ? renderMatrixAxisFilter() : null}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid min-w-0 gap-4">
                          <div className="grid gap-3 border-y border-gray-300 bg-gray-50 px-3 py-3">
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700">Resolution Behavior</h4>
                              <p className="text-xs text-gray-500">
                                {selectedMatrixPlayingEventId && selectedMatrixIncomingEventId
                                  ? `${matrixEventById.get(selectedMatrixPlayingEventId)?.name ?? "Playing event"} when ${
                                      matrixEventById.get(selectedMatrixIncomingEventId)?.name ?? "incoming event"
                                    } arrives.`
                                  : "Choose a playing row and incoming column before saving."}
                              </p>
                            </div>

                            <div className="grid gap-2 sm:grid-cols-[1fr_1fr]">
                              <div className="grid gap-1 border-l border-gray-300 bg-gray-25 px-3 py-2">
                                <span className="text-xs font-medium text-gray-500">Playing</span>
                                <span className="truncate text-sm font-semibold text-gray-700">
                                  {selectedMatrixPlayingEventId
                                    ? (matrixEventById.get(selectedMatrixPlayingEventId)?.name ?? "Playing event")
                                    : "No row selected"}
                                </span>
                              </div>
                              <div className="grid gap-1 border-l border-gray-300 bg-gray-25 px-3 py-2">
                                <span className="text-xs font-medium text-gray-500">Incoming</span>
                                <span className="truncate text-sm font-semibold text-gray-700">
                                  {selectedMatrixIncomingEventId
                                    ? (matrixEventById.get(selectedMatrixIncomingEventId)?.name ?? "Incoming event")
                                    : "No column selected"}
                                </span>
                              </div>
                            </div>

                            <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                              <Select
                                id="matrix-behavior"
                                label="Behavior"
                                onChange={(event) => {
                                  const nextBehavior = event.currentTarget.value as ResolutionBehaviorName;
                                  setMatrixBehavior(nextBehavior);
                                  if (nextBehavior !== "Suppress") {
                                    setMatrixTargetEventId("");
                                  }
                                }}
                                value={matrixBehavior}
                              >
                                {resolutionBehaviorNames.map((behavior) => (
                                  <option key={behavior} value={behavior}>
                                    {behavior}
                                  </option>
                                ))}
                              </Select>
                              <Select
                                disabled={matrixBehavior !== "Suppress"}
                                id="matrix-target"
                                label="Target"
                                onChange={(event) => setMatrixTargetEventId(event.currentTarget.value)}
                                value={matrixTargetEventId}
                              >
                                <option value="">No target</option>
                                {selectedMatrixPlayingEventId ? (
                                  <option value={selectedMatrixPlayingEventId}>
                                    Playing / {matrixEventById.get(selectedMatrixPlayingEventId)?.name}
                                  </option>
                                ) : null}
                                {selectedMatrixIncomingEventId ? (
                                  <option value={selectedMatrixIncomingEventId}>
                                    Incoming / {matrixEventById.get(selectedMatrixIncomingEventId)?.name}
                                  </option>
                                ) : null}
                              </Select>
                              <div className="flex items-end gap-2">
                                <Button
                                  disabled={!selectedMatrixEntry}
                                  leftIcon={<Trash2 className="size-4" />}
                                  onClick={openClearMatrixEntry}
                                  variant="destructive"
                                >
                                  Clear rule
                                </Button>
                                <Button
                                  disabled={!selectedMatrixPlayingEventId || !selectedMatrixIncomingEventId}
                                  onClick={() => void handleSaveMatrixEntry()}
                                  variant="primary"
                                >
                                  Save rule
                                </Button>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600">{behaviorCopy[matrixBehavior]}</p>
                          </div>

                          <div
                            className="grid max-h-[calc(100vh-580px)] min-h-[200px] grid-rows-[auto_1fr] border-y border-gray-300 bg-gray-50"
                            data-testid="collision-matrix-grid"
                          >
                            <div
                              className="grid items-center border-b border-gray-200 bg-gray-100"
                              style={{ gridTemplateColumns: `${matrixRowHeaderWidth} 1fr` }}
                            >
                              <div className="relative flex h-12 items-center border-r border-gray-200 px-2">
                                <Button
                                  aria-expanded={matrixFilterAnchor === "playingAxis"}
                                  onClick={() => openMatrixFilter("playingAxis", "playing")}
                                  rightIcon={<ChevronDown className="size-4" />}
                                >
                                  Playing
                                </Button>
                                <div className="absolute left-2 top-12 z-40">
                                  {matrixFilterAnchor === "playingAxis" ? renderMatrixAxisFilter() : null}
                                </div>
                              </div>
                              <div className="relative flex h-12 min-w-0 items-center justify-center px-2">
                                <Button
                                  aria-expanded={matrixFilterAnchor === "incomingAxis"}
                                  onClick={() => openMatrixFilter("incomingAxis", "incoming")}
                                  rightIcon={<ChevronDown className="size-4" />}
                                >
                                  Incoming
                                </Button>
                                <div className="absolute left-1/2 top-12 z-40 -translate-x-1/2">
                                  {matrixFilterAnchor === "incomingAxis" ? renderMatrixAxisFilter() : null}
                                </div>
                              </div>
                            </div>

                            {(deviceWorkspaceQuery.data?.matrixRows.length ?? 0) > 0 &&
                            (deviceWorkspaceQuery.data?.matrixColumns.length ?? 0) > 0 ? (
                              <div className="grid min-h-0 overflow-hidden">
                                <div className="grid min-h-0">
                                  <div className="min-h-0 overflow-auto overscroll-x-contain">
                                    <div
                                      className="grid min-w-full content-start"
                                      style={{
                                        gridTemplateColumns: `${matrixRowHeaderWidth} repeat(${deviceWorkspaceQuery.data?.matrixColumns.length ?? 0}, minmax(119px, 1fr))`
                                      }}
                                    >
                                      <div className="sticky left-0 top-0 z-30 h-10 border border-gray-200 bg-gray-100 shadow-[1px_0_0_#E9EAEB]" />
                                    {(deviceWorkspaceQuery.data?.matrixColumns ?? []).map((column) => (
                                      <button
                                        className={`sticky top-0 z-20 flex h-10 items-center justify-center border border-gray-200 px-2 text-center text-xs font-semibold ${
                                          selectedMatrixIncomingEventId === column.eventId
                                            ? "bg-gray-200 text-gray-700"
                                            : "bg-gray-100 text-gray-600"
                                        }`}
                                        key={column.eventId}
                                        onClick={() => setSelectedMatrixIncomingEventId(column.eventId)}
                                        type="button"
                                      >
                                        <span className="line-clamp-2">
                                          {matrixEventById.get(column.eventId)?.name}
                                        </span>
                                      </button>
                                    ))}
                                    {(deviceWorkspaceQuery.data?.matrixRows ?? []).map((row) => (
                                      <Fragment key={row.eventId}>
                                        <button
                                          className={`sticky left-0 z-10 h-10 border border-gray-200 px-2 text-left text-xs font-semibold shadow-[1px_0_0_#E9EAEB] ${
                                            selectedMatrixPlayingEventId === row.eventId
                                              ? "bg-gray-200 text-gray-700"
                                              : "bg-gray-100 text-gray-600"
                                          }`}
                                          onClick={() => setSelectedMatrixPlayingEventId(row.eventId)}
                                          type="button"
                                        >
                                          <span className="block truncate">{matrixEventById.get(row.eventId)?.name}</span>
                                        </button>
                                        {(deviceWorkspaceQuery.data?.matrixColumns ?? []).map((column) => {
                                          const entry = (deviceWorkspaceQuery.data?.matrixEntries ?? []).find(
                                            (candidate) =>
                                              candidate.playingEventId === row.eventId &&
                                              candidate.incomingEventId === column.eventId
                                          );
                                          const selected =
                                            selectedMatrixPlayingEventId === row.eventId &&
                                            selectedMatrixIncomingEventId === column.eventId;
                                          const highlighted =
                                            selected ||
                                            selectedMatrixPlayingEventId === row.eventId ||
                                            selectedMatrixIncomingEventId === column.eventId;
                                          const BehaviorIcon = entry
                                            ? behaviorIconFor(entry.resolutionBehavior.behaviorName)
                                            : null;

                                          return (
                                            <button
                                              aria-label={
                                                entry
                                                  ? `${entry.resolutionBehavior.behaviorName}: ${
                                                      matrixEventById.get(row.eventId)?.name ?? "playing event"
                                                    } when ${
                                                      matrixEventById.get(column.eventId)?.name ?? "incoming event"
                                                    } arrives`
                                                  : `Unset: ${matrixEventById.get(row.eventId)?.name ?? "playing event"} when ${
                                                      matrixEventById.get(column.eventId)?.name ?? "incoming event"
                                                    } arrives`
                                              }
                                              className={`flex h-10 w-full items-center justify-center border border-gray-200 px-1.5 text-xs font-medium tabular-nums ${
                                                highlighted ? "bg-gray-200" : "bg-gray-25"
                                              } ${behaviorCellClass(entry, selected)}`}
                                              key={`${row.eventId}-${column.eventId}`}
                                              onClick={() => handleSelectMatrixCell(row.eventId, column.eventId)}
                                              type="button"
                                            >
                                              {entry && BehaviorIcon ? (
                                                <span
                                                  className={`inline-flex h-6 max-w-full items-center gap-1 rounded-lg border px-2 ${behaviorBubbleClass(
                                                    entry,
                                                    selected
                                                  )}`}
                                                  title={behaviorCopy[entry.resolutionBehavior.behaviorName]}
                                                >
                                                  <BehaviorIcon
                                                    aria-hidden="true"
                                                    className="size-3.5 shrink-0"
                                                    strokeWidth={1.8}
                                                  />
                                                  <span className="truncate">
                                                    {entry.resolutionBehavior.behaviorName === "Not possible"
                                                      ? "N/A"
                                                      : entry.resolutionBehavior.behaviorName}
                                                  </span>
                                                </span>
                                              ) : (
                                                <span className="text-gray-500" title="Unset">
                                                  -
                                                </span>
                                              )}
                                            </button>
                                          );
                                        })}
                                      </Fragment>
                                    ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <EmptyState
                                title="Select matrix rows and columns"
                                description="Add at least one playing row and incoming column to expose matrix cells."
                              />
                            )}
                          </div>
                      </div>
                    </div>
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
                                            <AudioPreviewIconButton
                                              activeKey={audioPreview.activeKey}
                                              item={previewItem}
                                              onPlay={(audioItem) => void audioPreview.playItem(audioItem)}
                                              onStop={audioPreview.stop}
                                            />
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
            deselectMatrixRow.isPending ||
            deselectMatrixColumn.isPending ||
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
          {feedback ? <p className="text-sm text-gray-600">{feedback}</p> : null}
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
          {feedback ? <p className="text-sm text-gray-600">{feedback}</p> : null}
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
          {feedback ? <p className="text-sm text-gray-600">{feedback}</p> : null}
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
          {feedback ? <p className="text-sm text-gray-600">{feedback}</p> : null}
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
