"use client";

import { useMemo } from "react";
import { Button, ErrorState } from "@/components/primitives";
import {
  useAssetLibrariesQuery,
  useAssetLibraryTreeQuery,
  useDeviceWorkspaceQuery,
  useProjectWorkspaceQuery
} from "@/features/projects/queries";
import { MatrixTab } from "@/features/matrix/matrix-tab";
import { EmptyProjectWorkspace } from "./workspace-empty-state";
import { AssetsTab } from "./assets-tab";
import { eventRowModelsFor } from "./event-row-model";
import { EventsTab } from "./events-tab";
import { WorkspaceDeviceStatus } from "./workspace-device-status";
import { WorkspaceDeleteConfirm } from "./workspace-delete-confirm";
import { WorkspaceDialogs } from "./workspace-dialogs";
import { WorkspaceLayout } from "./workspace-layout";
import {
  useProjectWorkspaceActions,
  useProjectWorkspaceSelection
} from "./workspace-scope-context";
import { useFeedbackMessage } from "@/features/feedback/feedback-context";
import { messageForError, workspaceErrorFallback } from "@/lib/errors";
import { useShareLink } from "@/features/sharing/use-share-link";
import { useWorkspaceAssetModel } from "./workspace-asset-model";
import {
  assetDeleteTarget,
  assetFolderDeleteTarget,
  collectionDeleteTarget,
  eventDeleteTarget,
  matrixEntryDeleteTarget
} from "./workspace-delete-requests";

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
  const workspaceQuery = useProjectWorkspaceQuery(projectId);
  const assetLibrariesQuery = useAssetLibrariesQuery();
  const projectAssetTreeQuery = useAssetLibraryTreeQuery(activeProjectAssetLibraryId);
  const workspaceDevices = workspaceQuery.data?.devices ?? [];
  const selectedDevice =
    (selectedDeviceId ? workspaceDevices.find((summary) => summary.device.id === selectedDeviceId) : null) ??
    workspaceDevices[0] ??
    null;
  const deviceWorkspaceQuery = useDeviceWorkspaceQuery(selectedDevice?.device.id ?? null);
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
  const assetModel = useWorkspaceAssetModel({
    activeAssetFolderId: selectedProjectAssetFolderId,
    activeAssetLibraryId: activeProjectAssetLibraryId,
    assetLibrarySummaries: assetLibrariesQuery.data?.libraries ?? [],
    assetTreeRoot: projectAssetTreeQuery.data?.rootFolder ?? null,
    searchTerm: workspaceSearch,
    workspace: workspaceQuery.data!
  });

  const openDeleteCollection = () => {
    if (!selectedCollection) {
      return;
    }

    requestDelete(collectionDeleteTarget(selectedCollection));
  };

  const openDeleteEvent = (event: Parameters<typeof eventDeleteTarget>[0]) =>
    requestDelete(eventDeleteTarget(event));

  const openClearMatrixEntry = (entry: Parameters<typeof matrixEntryDeleteTarget>[0], name: string) =>
    requestDelete(matrixEntryDeleteTarget(entry, name));

  const openDeleteProjectAssetFolder = (node: Parameters<typeof assetFolderDeleteTarget>[0]) =>
    requestDelete(assetFolderDeleteTarget(node));

  const openDeleteProjectAsset = (asset: Parameters<typeof assetDeleteTarget>[0]) =>
    requestDelete(assetDeleteTarget(asset));

  if (!selectedDevice) {
    return <EmptyProjectWorkspace onAddDevice={() => openDialog("device")} />;
  }

  return (
    <>
      <WorkspaceDeviceStatus selectedDevice={selectedDevice} />

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
              importCandidateCount={assetModel.importCandidateCount}
              itemCount={assetModel.itemCount}
              items={assetModel.items}
              librarySummaryById={assetModel.librarySummaryById}
              onCreateAsset={() => openDialog("asset")}
              onCreateFolder={() => openDialog("assetFolder")}
              onDeleteAsset={openDeleteProjectAsset}
              onDeleteFolder={openDeleteProjectAssetFolder}
              onImportLibrary={() => openDialog("libraryImport")}
              onOpenFolder={setSelectedProjectAssetFolderId}
              onSelectLibrary={goToProjectAssetLibrary}
              projectAssetLibraries={assetModel.projectAssetLibraries}
              selectedFolder={assetModel.selectedFolder}
              selectedFolderPath={assetModel.selectedFolderPath}
              selectedLibrary={assetModel.selectedLibrary}
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
