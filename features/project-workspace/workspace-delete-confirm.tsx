"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ConfirmDialog } from "@/components/primitives";
import {
  useDeleteAssetLibraryFolderMutation,
  useDeleteAssetMutation,
  useDeleteCollectionMutation,
  useDeleteCollisionMatrixEntryMutation,
  useDeleteDeviceMutation,
  useDeleteEventMutation,
  useDeleteProjectMutation,
  useDeviceWorkspaceQuery,
  useProjectWorkspaceQuery
} from "@/features/projects/queries";
import { useAudioPreviewActions } from "@/features/projects/audio-preview-context";
import { useFeedbackActions } from "@/features/feedback/feedback-context";
import { writeFlashMessage } from "@/lib/flash-message";
import { hrefWithParams } from "@/lib/search-params";
import {
  cascadeSummaryFor,
  deleteActionLabelFor,
  deleteBodyCopyFor
} from "./delete-target";
import {
  useProjectDeleteTarget,
  useProjectWorkspaceActions,
  useProjectWorkspaceSelection
} from "./workspace-scope-context";

export function WorkspaceDeleteConfirm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const deleteTarget = useProjectDeleteTarget();
  const {
    activeAssetFolderId,
    collectionId,
    deviceId,
    projectId
  } = useProjectWorkspaceSelection();
  const {
    selectAssetFolder,
    setDeleteTarget,
    setMatrixSelection
  } = useProjectWorkspaceActions();
  const { runWithFeedback } = useFeedbackActions();
  const audioPreview = useAudioPreviewActions();
  const workspaceQuery = useProjectWorkspaceQuery(projectId);
  const deviceWorkspaceQuery = useDeviceWorkspaceQuery(deviceId);
  const deleteProject = useDeleteProjectMutation();
  const deleteDevice = useDeleteDeviceMutation();
  const deleteCollection = useDeleteCollectionMutation();
  const deleteEvent = useDeleteEventMutation();
  const deleteAssetLibraryFolder = useDeleteAssetLibraryFolderMutation();
  const deleteAsset = useDeleteAssetMutation();
  const deleteMatrixEntry = useDeleteCollisionMatrixEntryMutation();

  if (!deleteTarget) {
    return null;
  }

  const handleConfirmDelete = async () => {
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

          if (collectionId === deleteTarget.id) {
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
          await deleteAssetLibraryFolder.mutateAsync(deleteTarget.id);
          setDeleteTarget(null);

          if (activeAssetFolderId === deleteTarget.id) {
            selectAssetFolder(null);
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

        if (deviceId === deleteTarget.id) {
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

  return (
    <ConfirmDialog
      cascadeSummary={cascadeSummaryFor(deleteTarget)}
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
    >
      {deleteBodyCopyFor(deleteTarget)}
    </ConfirmDialog>
  );
}
