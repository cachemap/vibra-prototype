"use client";

import { useMemo } from "react";
import type { AssetLibrary, AssetLibraryFolder, AssetLibraryFolderId, AssetLibraryId } from "@/domain";
import type {
  AssetLibraryFolderNode,
  AssetLibrarySummary,
  ProjectWorkspaceAggregate
} from "@/data/repositories/project-repository";
import {
  findAssetFolderNode,
  pathForAssetFolder
} from "@/features/assets/asset-folder-tree";
import type { ProjectAssetItem } from "./project-asset-table";

type ProjectAssetLibrary = {
  library: AssetLibrary;
  status: string;
};

type WorkspaceAssetModelInput = {
  activeAssetFolderId: AssetLibraryFolderId | null;
  activeAssetLibraryId: AssetLibraryId | null;
  assetLibrarySummaries: readonly AssetLibrarySummary[];
  assetTreeRoot: AssetLibraryFolderNode | null;
  searchTerm: string;
  workspace: ProjectWorkspaceAggregate;
};

export type WorkspaceAssetModel = {
  importCandidateCount: number;
  itemCount: number;
  items: readonly ProjectAssetItem[];
  librarySummaryById: ReadonlyMap<AssetLibraryId, AssetLibrarySummary>;
  projectAssetLibraries: readonly ProjectAssetLibrary[];
  selectedFolder: AssetLibraryFolderNode | null;
  selectedFolderPath: readonly AssetLibraryFolder[];
  selectedLibrary: ProjectAssetLibrary | null;
};

export function useWorkspaceAssetModel({
  activeAssetFolderId,
  activeAssetLibraryId,
  assetLibrarySummaries,
  assetTreeRoot,
  searchTerm,
  workspace
}: WorkspaceAssetModelInput): WorkspaceAssetModel {
  const importCandidateCount = useMemo(() => {
    const importedLibraryIds = new Set(workspace.importedAssetLibraries.map((library) => library.id));

    return assetLibrarySummaries.filter(
      (summary) =>
        summary.library.id !== workspace.defaultAssetLibrary.id && !importedLibraryIds.has(summary.library.id)
    ).length;
  }, [assetLibrarySummaries, workspace.defaultAssetLibrary.id, workspace.importedAssetLibraries]);

  const selectedFolder = useMemo(() => {
    if (!assetTreeRoot) {
      return null;
    }

    if (activeAssetFolderId) {
      const matched = findAssetFolderNode(assetTreeRoot, activeAssetFolderId);

      if (matched) {
        return matched;
      }
    }

    return assetTreeRoot;
  }, [activeAssetFolderId, assetTreeRoot]);

  const selectedFolderPath = useMemo(
    () =>
      selectedFolder && assetTreeRoot
        ? pathForAssetFolder(assetTreeRoot, selectedFolder.folder.id).map((node) => node.folder)
        : [],
    [assetTreeRoot, selectedFolder]
  );

  const items = useMemo(() => {
    if (!selectedFolder) {
      return [];
    }

    return [
      ...selectedFolder.childFolders.map((node) => ({
        kind: "folder" as const,
        node
      })),
      ...selectedFolder.assets.map((asset) => ({
        kind: "asset" as const,
        asset
      }))
    ];
  }, [selectedFolder]);

  const librarySummaryById = useMemo(
    () => new Map(assetLibrarySummaries.map((summary) => [summary.library.id, summary])),
    [assetLibrarySummaries]
  );

  const allProjectAssetLibraries = useMemo<readonly ProjectAssetLibrary[]>(
    () => [
      { library: workspace.defaultAssetLibrary, status: "Default" },
      ...workspace.importedAssetLibraries.map((library) => ({ library, status: "Imported" }))
    ],
    [workspace.defaultAssetLibrary, workspace.importedAssetLibraries]
  );

  const projectAssetLibraries = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return allProjectAssetLibraries.filter(({ library }) =>
      normalizedSearch ? library.name.toLowerCase().includes(normalizedSearch) : true
    );
  }, [allProjectAssetLibraries, searchTerm]);

  const selectedLibrary =
    allProjectAssetLibraries.find(({ library }) => library.id === activeAssetLibraryId) ??
    allProjectAssetLibraries[0] ??
    null;

  return {
    importCandidateCount,
    itemCount: (selectedFolder?.childFolders.length ?? 0) + (selectedFolder?.assets.length ?? 0),
    items,
    librarySummaryById,
    projectAssetLibraries,
    selectedFolder,
    selectedFolderPath,
    selectedLibrary
  };
}
