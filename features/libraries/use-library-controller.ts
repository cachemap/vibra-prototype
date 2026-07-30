"use client";

import { FormEvent, useState } from "react";
import type { Asset } from "@/domain";
import type { AssetLibraryFolderNode, AssetLibrarySummary } from "@/data/repositories/project-repository";
import {
  useCreateAssetLibraryFolderMutation,
  useCreateAssetLibraryMutation,
  useCreateAssetMutation,
  useDeleteAssetLibraryMutation,
  useDeleteAssetLibraryFolderMutation,
  useDeleteAssetMutation
} from "@/features/projects/queries";
import { useAudioPreviewActions } from "@/features/projects/audio-preview-context";
import { countAssetFolderDescendants } from "@/features/assets/asset-folder-tree";
import { useFeedbackActions } from "@/features/feedback/feedback-context";
import type { LibraryDeleteTarget } from "./library-delete-confirm";
import type { LibraryDialog } from "./library-dialogs";
import type { useLibrarySelection } from "./use-library-selection";

type LibrarySelection = ReturnType<typeof useLibrarySelection>;

export function useLibraryController(selection: LibrarySelection) {
  const [dialog, setDialog] = useState<LibraryDialog>(null);
  const [libraryName, setLibraryName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<LibraryDeleteTarget | null>(null);
  const { clearFeedback, runWithFeedback } = useFeedbackActions();
  const { stop } = useAudioPreviewActions();
  const createLibrary = useCreateAssetLibraryMutation();
  const createFolder = useCreateAssetLibraryFolderMutation();
  const createAsset = useCreateAssetMutation();
  const deleteLibrary = useDeleteAssetLibraryMutation();
  const deleteFolder = useDeleteAssetLibraryFolderMutation();
  const deleteAsset = useDeleteAssetMutation();

  const openCreateLibrary = () => {
    setLibraryName("");
    clearFeedback();
    setDialog("library");
  };

  const openCreateFolder = () => {
    clearFeedback();
    setDialog("folder");
  };

  const openCreateAsset = () => {
    clearFeedback();
    setDialog("asset");
  };

  const openDeleteLibrary = (summary: AssetLibrarySummary) => {
    clearFeedback();
    setDeleteTarget({
      counts: {
        assets: summary.assetCount,
        folders: summary.folderCount
      },
      importedByProjectCount: summary.importedByProjectCount,
      kind: "library",
      libraryId: summary.library.id,
      name: summary.library.name
    });
  };

  const openDeleteFolder = (node: AssetLibraryFolderNode) => {
    clearFeedback();
    setDeleteTarget({
      counts: countAssetFolderDescendants(node),
      folderId: node.folder.id,
      kind: "folder",
      name: node.folder.name
    });
  };

  const openDeleteAsset = (asset: Asset) => {
    clearFeedback();
    setDeleteTarget({
      assetId: asset.id,
      kind: "asset",
      name: asset.name
    });
  };

  const handleCreateLibrary = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await runWithFeedback({
      work: async () => {
        const created = await createLibrary.mutateAsync({ name: libraryName });
        setDialog(null);
        selection.goToLibrary(created.library.id);
        return created;
      },
      onSuccess: (created) => `Created ${created.library.name}.`
    });
  };

  const handleCreateFolder = async ({ name, icon }: { name: string; icon: string }) => {
    if (!selection.selectedLibrarySummary || !selection.selectedFolder) {
      return;
    }

    const selectedFolder = selection.selectedFolder;
    const selectedLibrarySummary = selection.selectedLibrarySummary;
    await runWithFeedback({
      work: async () => {
        const folder = await createFolder.mutateAsync({
          libraryId: selectedLibrarySummary.library.id,
          parentFolderId: selectedFolder.folder.id,
          name,
          icon
        });
        setDialog(null);
        selection.goToFolder(folder.id);
        return folder;
      },
      onSuccess: (folder) => `Created folder ${folder.name}.`
    });
  };

  const handleCreateAsset = async (input: {
    name: string;
    assetId: string;
    mediaKind: Asset["mediaKind"];
    originalFilename: string;
    blob: File;
    contentType?: string;
  }) => {
    if (!selection.selectedLibrarySummary || !selection.selectedFolder) {
      return;
    }

    const selectedFolder = selection.selectedFolder;
    const selectedLibrarySummary = selection.selectedLibrarySummary;
    await runWithFeedback({
      work: async () => {
        const asset = await createAsset.mutateAsync({
          libraryId: selectedLibrarySummary.library.id,
          folderId: selectedFolder.folder.id,
          ...input
        });
        setDialog(null);
        return asset;
      },
      onSuccess: (asset) => `Uploaded ${asset.mediaKind} asset ${asset.name}.`
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    await runWithFeedback({
      work: async () => {
        if (deleteTarget.kind === "library") {
          const fallbackLibrary = (selection.librariesQuery.data?.libraries ?? []).find(
            (summary) => summary.library.id !== deleteTarget.libraryId
          );

          await deleteLibrary.mutateAsync(deleteTarget.libraryId);
          setDeleteTarget(null);

          if (fallbackLibrary) {
            selection.goToLibrary(fallbackLibrary.library.id);
          } else {
            selection.router.push("/libraries");
          }

          return `Deleted library ${deleteTarget.name}.`;
        }

        if (deleteTarget.kind === "folder") {
          const shouldReturnToRoot =
            Boolean(selection.selectedFolderParam) &&
            selection.folderPath.some((folder) => folder.id === deleteTarget.folderId);

          await deleteFolder.mutateAsync(deleteTarget.folderId);

          if (shouldReturnToRoot) {
            selection.router.push(selection.clearFolderHref());
          }

          setDeleteTarget(null);
          return `Deleted folder ${deleteTarget.name}.`;
        }

        stop();
        await deleteAsset.mutateAsync(deleteTarget.assetId);
        setDeleteTarget(null);
        return `Deleted asset ${deleteTarget.name}.`;
      },
      onSuccess: (message) => message
    });
  };

  return {
    deleteIsPending: deleteLibrary.isPending || deleteFolder.isPending || deleteAsset.isPending,
    deleteTarget,
    dialog,
    handleConfirmDelete,
    handleCreateAsset,
    handleCreateFolder,
    handleCreateLibrary,
    libraryName,
    openCreateAsset,
    openCreateFolder,
    openCreateLibrary,
    openDeleteAsset,
    openDeleteFolder,
    openDeleteLibrary,
    setDeleteTarget,
    setDialog,
    setLibraryName
  };
}
