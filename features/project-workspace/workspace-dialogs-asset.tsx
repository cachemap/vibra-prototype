"use client";

import type { Asset } from "@/domain";
import { CreateAssetDialog, CreateAssetFolderDialog } from "@/features/assets/asset-authoring-dialogs";
import { findAssetFolderNode } from "@/features/assets/asset-folder-tree";
import { useFeedbackActions } from "@/features/feedback/feedback-context";
import {
  useAssetLibraryTreeQuery,
  useCreateAssetLibraryFolderMutation,
  useCreateAssetMutation
} from "@/features/projects/queries";
import { workspaceErrorFallback } from "@/lib/errors";
import {
  useProjectDialogRequest,
  useProjectWorkspaceActions,
  useProjectWorkspaceSelection
} from "./workspace-scope-context";

export function AssetFolderDialog() {
  const dialog = useProjectDialogRequest();
  const {
    activeAssetFolderId,
    activeAssetLibraryId
  } = useProjectWorkspaceSelection();
  const {
    selectAssetFolder,
    setDialogRequest
  } = useProjectWorkspaceActions();
  const { runWithFeedback } = useFeedbackActions();
  const projectAssetTreeQuery = useAssetLibraryTreeQuery(activeAssetLibraryId);
  const createAssetLibraryFolder = useCreateAssetLibraryFolderMutation();
  const selectedProjectAssetFolder =
    projectAssetTreeQuery.data && activeAssetFolderId
      ? findAssetFolderNode(projectAssetTreeQuery.data.rootFolder, activeAssetFolderId)
      : projectAssetTreeQuery.data?.rootFolder ?? null;

  const handleCreateAssetFolder = async ({ name, icon }: { name: string; icon: string }) => {
    if (!activeAssetLibraryId || !selectedProjectAssetFolder) {
      return;
    }

    const folder = await runWithFeedback({
      work: async () => {
        const createdFolder = await createAssetLibraryFolder.mutateAsync({
          libraryId: activeAssetLibraryId,
          parentFolderId: selectedProjectAssetFolder.folder.id,
          name,
          icon
        });

        setDialogRequest(null);
        selectAssetFolder(createdFolder.id);
        return createdFolder;
      },
      onSuccess: (createdFolder) => `Created folder ${createdFolder.name}.`
    });

    if (!folder) {
      throw new Error(workspaceErrorFallback);
    }
  };

  return (
    <CreateAssetFolderDialog
      onClose={() => setDialogRequest(null)}
      onCreate={handleCreateAssetFolder}
      open={dialog === "assetFolder"}
    />
  );
}

export function AssetDialog() {
  const dialog = useProjectDialogRequest();
  const {
    activeAssetFolderId,
    activeAssetLibraryId
  } = useProjectWorkspaceSelection();
  const { setDialogRequest } = useProjectWorkspaceActions();
  const { runWithFeedback } = useFeedbackActions();
  const projectAssetTreeQuery = useAssetLibraryTreeQuery(activeAssetLibraryId);
  const createAsset = useCreateAssetMutation();
  const selectedProjectAssetFolder =
    projectAssetTreeQuery.data && activeAssetFolderId
      ? findAssetFolderNode(projectAssetTreeQuery.data.rootFolder, activeAssetFolderId)
      : projectAssetTreeQuery.data?.rootFolder ?? null;

  const handleCreateAsset = async (input: {
    name: string;
    assetId: string;
    mediaKind: Asset["mediaKind"];
    originalFilename: string;
    blob: File;
    contentType?: string;
  }) => {
    if (!activeAssetLibraryId || !selectedProjectAssetFolder) {
      return;
    }

    const asset = await runWithFeedback({
      work: async () => {
        const createdAsset = await createAsset.mutateAsync({
          libraryId: activeAssetLibraryId,
          folderId: selectedProjectAssetFolder.folder.id,
          ...input
        });

        setDialogRequest(null);
        return createdAsset;
      },
      onSuccess: (createdAsset) => `Uploaded ${createdAsset.mediaKind} asset ${createdAsset.name}.`
    });

    if (!asset) {
      throw new Error(workspaceErrorFallback);
    }
  };

  return (
    <CreateAssetDialog
      onClose={() => setDialogRequest(null)}
      onCreate={handleCreateAsset}
      open={dialog === "asset"}
    />
  );
}
