"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import {
  Button,
  CardGrid,
  ConfirmDialog,
  DeviceGlyph,
  DialogOverlay,
  ErrorState,
  FormDialog,
  LoadingState,
  PageStateScaffold,
  Select,
  SelectableCard,
  Switch,
  TextInput
} from "@/components/primitives";
import {
  asEntityId,
  eventTypes,
  type Asset,
  type AssetLibraryFolderId,
  type AssetLibraryId,
  type CollisionMatrixEntry,
  type EventId,
  type PlatformId,
  type ProjectId
} from "@/domain";
import type { AssetLibraryFolderNode } from "@/data/repositories/project-repository";
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
import { AudioPreviewProvider, useAudioPreviewActions } from "@/features/projects/audio-preview-context";
import { MatrixTab } from "@/features/matrix/matrix-tab";
import { EmptyProjectWorkspace } from "@/features/project-workspace/workspace-empty-state";
import { AssetsTab } from "@/features/project-workspace/assets-tab";
import { eventRowModelsFor } from "@/features/project-workspace/event-row-model";
import { EventsTab } from "@/features/project-workspace/events-tab";
import { WorkspaceLayout } from "@/features/project-workspace/workspace-layout";
import {
  ProjectWorkspaceScopeProvider,
  type DeleteTarget,
  useProjectDeleteTarget,
  useProjectDialogRequest,
  useProjectWorkspaceActions,
  useProjectWorkspaceSelection
} from "@/features/project-workspace/workspace-scope-context";
import {
  CreateAssetDialog,
  CreateAssetFolderDialog
} from "@/features/assets/asset-authoring-dialogs";
import {
  countAssetFolderDescendants,
  findAssetFolderNode,
  pathForAssetFolder
} from "@/features/assets/asset-folder-tree";
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

const deleteActionLabelFor = (target: DeleteTarget) => {
  if (target.kind === "matrixEntry") {
    return "Clear matrix rule";
  }

  if (target.kind === "assetFolder") {
    return "Delete folder";
  }

  return `Delete ${target.kind}`;
};


export default function ProjectPage() {
  const { projectId: projectIdParam } = useParams<{ projectId: string }>();
  const searchParams = useSearchParams();
  const projectId = asEntityId<ProjectId>(projectIdParam);

  return (
    <FeedbackProvider errorFallback={workspaceErrorFallback} initialMessage={searchParams.get("feedback")}>
      <AudioPreviewProvider>
        <ProjectWorkspaceScopeProvider projectId={projectId}>
          <ProjectWorkspace />
        </ProjectWorkspaceScopeProvider>
      </AudioPreviewProvider>
    </FeedbackProvider>
  );
}

function ProjectWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dialog = useProjectDialogRequest();
  const deleteTarget = useProjectDeleteTarget();
  const {
    activeAssetFolderId: selectedProjectAssetFolderId,
    activeAssetLibraryId: activeProjectAssetLibraryId,
    activeTab: activeWorkspaceTab,
    collectionId: selectedCollectionId,
    deviceId: selectedDeviceId,
    matrixBehavior,
    matrixFilterAnchor,
    matrixFilterAxis,
    matrixIncomingEventId: selectedMatrixIncomingEventId,
    matrixPlayingEventId: selectedMatrixPlayingEventId,
    matrixTargetEventId,
    projectId,
    searchTerm: workspaceSearch
  } = useProjectWorkspaceSelection();
  const {
    goToCollection,
    goToDevice,
    goToEvent,
    openDialog,
    requestDelete,
    selectAssetFolder: setSelectedProjectAssetFolderId,
    selectAssetLibrary: goToProjectAssetLibrary,
    setDeleteTarget,
    setDialogRequest: setDialog,
    setMatrixSelection
  } = useProjectWorkspaceActions();
  const [deviceName, setDeviceName] = useState("");
  const [devicePlatformId, setDevicePlatformId] = useState("");
  const [devicePresetId, setDevicePresetId] = useState("");
  const [deviceEnabled, setDeviceEnabled] = useState(true);
  const [collectionName, setCollectionName] = useState("");
  const [eventName, setEventName] = useState("");
  const [eventType, setEventType] = useState<(typeof eventTypes)[number]>("Button");
  const [importLibraryId, setImportLibraryId] = useState("");
  const feedback = useFeedbackMessage();
  const { runWithFeedback } = useFeedbackActions();

  const workspaceQuery = useProjectWorkspaceQuery(projectId);
  const assetLibrariesQuery = useAssetLibrariesQuery();
  const projectAssetTreeQuery = useAssetLibraryTreeQuery(activeProjectAssetLibraryId);
  const selectedDevice = useMemo(() => {
    const devices = workspaceQuery.data?.devices ?? [];

    if (selectedDeviceId) {
      const matched = devices.find((summary) => summary.device.id === selectedDeviceId);

      if (matched) {
        return matched;
      }
    }

    return devices[0] ?? null;
  }, [selectedDeviceId, workspaceQuery.data?.devices]);
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

    if (selectedCollectionId) {
      const matched = collections.find((item) => item.collection.id === selectedCollectionId);

      if (matched) {
        return matched;
      }
    }

    return collections[0] ?? null;
  }, [deviceWorkspaceQuery.data?.collections, selectedCollectionId]);
  const eventRows = useMemo(
    () => eventRowModelsFor(selectedCollection?.events ?? []),
    [selectedCollection?.events]
  );
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
      selectedProjectAssetFolder && projectAssetTreeQuery.data
        ? pathForAssetFolder(
            projectAssetTreeQuery.data.rootFolder,
            selectedProjectAssetFolder.folder.id
          ).map((node) => node.folder)
        : [],
    [projectAssetTreeQuery.data, selectedProjectAssetFolder]
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
  const goToProjectAssetFolder = (folderId: AssetLibraryFolderId) => {
    setSelectedProjectAssetFolderId(folderId);
  };

  const openCreateDevice = () => {
    setDeviceName("");
    setDevicePlatformId(workspaceQuery.data?.platforms[0]?.id ?? "");
    setDevicePresetId("");
    setDeviceEnabled(true);
    openDialog("device");
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
    openDialog("collection");
  };

  const openEditCollection = () => {
    setCollectionName(selectedCollection?.collection.name ?? "");
    openDialog("editCollection");
  };

  const openCreateEvent = () => {
    setEventName("");
    setEventType("Button");
    openDialog("event");
  };

  const openImportLibrary = () => {
    setImportLibraryId(importCandidates[0]?.library.id ?? "");
    openDialog("libraryImport");
  };

  const openCreateAssetFolder = () => {
    openDialog("assetFolder");
  };

  const openCreateAsset = () => {
    openDialog("asset");
  };

  const openDeleteCollection = () => {
    if (!selectedCollection) {
      return;
    }

    requestDelete({
      kind: "collection",
      id: selectedCollection.collection.id,
      name: selectedCollection.collection.name
    });
  };

  const openDeleteEvent = (event: { id: EventId; name: string }) => {
    requestDelete({
      kind: "event",
      id: event.id,
      name: event.name
    });
  };

  const openClearMatrixEntry = (entry: CollisionMatrixEntry, name: string) => {
    requestDelete({
      kind: "matrixEntry",
      id: entry.id,
      name
    });
  };

  const openDeleteProjectAssetFolder = (node: AssetLibraryFolderNode) => {
    requestDelete({
      counts: countAssetFolderDescendants(node),
      kind: "assetFolder",
      id: node.folder.id,
      name: node.folder.name
    });
  };

  const openDeleteProjectAsset = (asset: Asset) => {
    requestDelete({
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
        setMatrixSelection({ matrixBehavior: "Preempt", matrixTargetEventId: "" });
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
  const normalizedWorkspaceSearch = workspaceSearch.trim().toLowerCase();
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

  return (
    <WorkspaceLayout
      onAddCollection={openCreateCollection}
      onAddDevice={openCreateDevice}
      projectId={projectId}
      selectedCollectionId={selectedCollection?.collection.id ?? null}
      selectedDevice={selectedDevice}
      shareController={shareController}
    >
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
                      setMatrixBehavior={(behavior) => setMatrixSelection({ matrixBehavior: behavior })}
                      setMatrixFilterAnchor={(anchor) => {
                        if (typeof anchor === "function") {
                          setMatrixSelection({ matrixFilterAnchor: anchor(matrixFilterAnchor) });
                        } else {
                          setMatrixSelection({ matrixFilterAnchor: anchor });
                        }
                      }}
                      setMatrixFilterAxis={(axis) => setMatrixSelection({ matrixFilterAxis: axis })}
                      setMatrixTargetEventId={(eventId) => setMatrixSelection({ matrixTargetEventId: eventId })}
                      setSelectedIncomingEventId={(eventId) =>
                        setMatrixSelection({ matrixIncomingEventId: eventId })
                      }
                      setSelectedPlayingEventId={(eventId) =>
                        setMatrixSelection({ matrixPlayingEventId: eventId })
                      }
                    />
                  ) : activeWorkspaceTab === "assets" ? (
                    <AssetsTab
                      assetLibrariesLoading={assetLibrariesQuery.isLoading}
                      deviceName={selectedDevice.device.name}
                      importCandidateCount={importCandidates.length}
                      itemCount={selectedProjectAssetFolderItemCount}
                      items={visibleProjectAssetItems}
                      librarySummaryById={librarySummaryById}
                      onCreateAsset={openCreateAsset}
                      onCreateFolder={openCreateAssetFolder}
                      onDeleteAsset={openDeleteProjectAsset}
                      onDeleteFolder={openDeleteProjectAssetFolder}
                      onImportLibrary={openImportLibrary}
                      onOpenFolder={goToProjectAssetFolder}
                      onSelectLibrary={goToProjectAssetLibrary}
                      projectAssetLibraries={projectAssetLibraries}
                      selectedFolder={selectedProjectAssetFolder}
                      selectedFolderPath={projectAssetFolderPath}
                      selectedLibrary={selectedProjectAssetLibrary}
                      treeError={projectAssetTreeQuery.error}
                      treeIsError={projectAssetTreeQuery.isError}
                      treeIsLoading={projectAssetTreeQuery.isLoading}
                    />
                  ) : (
                    <EventsTab
                      eventRows={eventRows}
                      onAddCollection={openCreateCollection}
                      onAddEvent={openCreateEvent}
                      onDeleteCollection={openDeleteCollection}
                      onDeleteEvent={openDeleteEvent}
                      onOpenEvent={goToEvent}
                      onRenameCollection={openEditCollection}
                      selectedCollection={selectedCollection}
                      selectedDevice={selectedDevice}
                    />
                  )}
                </section>
              )}
            </>
          )}
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
    </WorkspaceLayout>
  );
}
