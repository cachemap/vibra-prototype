"use client";

import { useMemo } from "react";
import { Button, ErrorState, Switch } from "@/components/primitives";
import type { Asset, CollisionMatrixEntry, EventId } from "@/domain";
import type { AssetLibraryFolderNode } from "@/data/repositories/project-repository";
import {
  useAssetLibrariesQuery,
  useAssetLibraryTreeQuery,
  useDeviceWorkspaceQuery,
  useProjectWorkspaceQuery,
  useUpdateDeviceMutation
} from "@/features/projects/queries";
import { MatrixTab } from "@/features/matrix/matrix-tab";
import { EmptyProjectWorkspace } from "./workspace-empty-state";
import { AssetsTab } from "./assets-tab";
import { eventRowModelsFor } from "./event-row-model";
import { EventsTab } from "./events-tab";
import { WorkspaceDeleteConfirm } from "./workspace-delete-confirm";
import { WorkspaceDialogs } from "./workspace-dialogs";
import { WorkspaceLayout } from "./workspace-layout";
import {
  useProjectWorkspaceActions,
  useProjectWorkspaceSelection
} from "./workspace-scope-context";
import {
  countAssetFolderDescendants,
  findAssetFolderNode,
  pathForAssetFolder
} from "@/features/assets/asset-folder-tree";
import { useFeedbackActions, useFeedbackMessage } from "@/features/feedback/feedback-context";
import { messageForError, workspaceErrorFallback } from "@/lib/errors";
import { useShareLink } from "@/features/sharing/use-share-link";

export function ProjectWorkspaceLoaded() {
  const {
    collectionId: selectedCollectionId,
    deviceId: selectedDeviceId,
    projectId
  } = useProjectWorkspaceSelection();
  const { openDialog, setDialogRequest } = useProjectWorkspaceActions();
  const workspaceQuery = useProjectWorkspaceQuery(projectId);
  const workspaceDevices = workspaceQuery.data?.devices ?? [];
  const selectedDevice =
    (selectedDeviceId ? workspaceDevices.find((summary) => summary.device.id === selectedDeviceId) : null) ??
    workspaceDevices[0] ??
    null;
  const shareController = useShareLink({
    setDialog: setDialogRequest
  });

  return (
    <WorkspaceLayout
      dialogLayer={
        <>
          <WorkspaceDeleteConfirm />
          <WorkspaceDialogs shareController={shareController} />
        </>
      }
      onAddCollection={() => openDialog("collection")}
      onAddDevice={() => openDialog("device")}
      projectId={projectId}
      selectedCollectionId={selectedCollectionId}
      selectedDevice={selectedDevice}
      shareController={shareController}
    >
      <ProjectWorkspaceBody shareController={shareController} />
    </WorkspaceLayout>
  );
}

function ProjectWorkspaceBody({ shareController }: { shareController: ReturnType<typeof useShareLink> }) {
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
    goToEvent,
    openDialog,
    requestDelete,
    selectAssetFolder: setSelectedProjectAssetFolderId,
    selectAssetLibrary: goToProjectAssetLibrary,
    setMatrixSelection
  } = useProjectWorkspaceActions();
  const feedback = useFeedbackMessage();
  const { runWithFeedback } = useFeedbackActions();
  const workspaceQuery = useProjectWorkspaceQuery(projectId);
  const assetLibrariesQuery = useAssetLibrariesQuery();
  const projectAssetTreeQuery = useAssetLibraryTreeQuery(activeProjectAssetLibraryId);
  const workspaceDevices = workspaceQuery.data?.devices ?? [];
  const selectedDevice =
    (selectedDeviceId ? workspaceDevices.find((summary) => summary.device.id === selectedDeviceId) : null) ??
    workspaceDevices[0] ??
    null;
  const deviceWorkspaceQuery = useDeviceWorkspaceQuery(selectedDevice?.device.id ?? null);
  const updateDevice = useUpdateDeviceMutation();
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
  const importedLibraryIds = new Set((workspaceQuery.data?.importedAssetLibraries ?? []).map((library) => library.id));
  const importCandidates = workspaceQuery.data
    ? (assetLibrariesQuery.data?.libraries ?? []).filter(
        (summary) =>
          summary.library.id !== workspaceQuery.data.defaultAssetLibrary.id && !importedLibraryIds.has(summary.library.id)
      )
    : [];
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
  const normalizedWorkspaceSearch = workspaceSearch.trim().toLowerCase();
  const librarySummaryById = new Map(
    (assetLibrariesQuery.data?.libraries ?? []).map((summary) => [summary.library.id, summary])
  );
  const allProjectAssetLibraries = [
    { library: workspaceQuery.data!.defaultAssetLibrary, status: "Default" },
    ...workspaceQuery.data!.importedAssetLibraries.map((library) => ({ library, status: "Imported" }))
  ];
  const projectAssetLibraries = allProjectAssetLibraries.filter(({ library }) =>
    normalizedWorkspaceSearch ? library.name.toLowerCase().includes(normalizedWorkspaceSearch) : true
  );
  const selectedProjectAssetLibrary =
    allProjectAssetLibraries.find(({ library }) => library.id === activeProjectAssetLibraryId) ??
    allProjectAssetLibraries[0] ??
    null;

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

  if (!selectedDevice) {
    return <EmptyProjectWorkspace onAddDevice={() => openDialog("device")} />;
  }

  return (
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
              setSelectedIncomingEventId={(eventId) => setMatrixSelection({ matrixIncomingEventId: eventId })}
              setSelectedPlayingEventId={(eventId) => setMatrixSelection({ matrixPlayingEventId: eventId })}
            />
          ) : activeWorkspaceTab === "assets" ? (
            <AssetsTab
              assetLibrariesLoading={assetLibrariesQuery.isLoading}
              deviceName={selectedDevice.device.name}
              importCandidateCount={importCandidates.length}
              itemCount={selectedProjectAssetFolderItemCount}
              items={visibleProjectAssetItems}
              librarySummaryById={librarySummaryById}
              onCreateAsset={() => openDialog("asset")}
              onCreateFolder={() => openDialog("assetFolder")}
              onDeleteAsset={openDeleteProjectAsset}
              onDeleteFolder={openDeleteProjectAssetFolder}
              onImportLibrary={() => openDialog("libraryImport")}
              onOpenFolder={setSelectedProjectAssetFolderId}
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
              onAddCollection={() => openDialog("collection")}
              onAddEvent={() => openDialog("event")}
              onDeleteCollection={openDeleteCollection}
              onDeleteEvent={openDeleteEvent}
              onOpenEvent={goToEvent}
              onRenameCollection={() => openDialog("editCollection")}
              selectedCollection={selectedCollection}
              selectedDevice={selectedDevice}
            />
          )}
        </section>
      )}
    </>
  );
}
