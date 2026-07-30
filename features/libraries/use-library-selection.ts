"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { asEntityId, type AssetLibraryFolderId, type AssetLibraryId } from "@/domain";
import type { Asset, AssetLibraryFolder } from "@/domain";
import type { AssetLibraryFolderNode } from "@/data/repositories/project-repository";
import { useAssetLibrariesQuery, useAssetLibraryTreeQuery } from "@/features/projects/queries";
import { findAssetFolderNode, pathForAssetFolder } from "@/features/assets/asset-folder-tree";
import { hrefWithParams } from "@/lib/search-params";
import { filterAssetLibraries } from "./library-search";

export type LibraryView = "list" | "tiles";

export type LibraryVisibleItem =
  | { kind: "folder"; node: AssetLibraryFolderNode }
  | { kind: "asset"; asset: Asset };

export function useLibrarySelection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedLibraryParam = searchParams.get("library");
  const selectedFolderParam = searchParams.get("folder");
  const view: LibraryView = searchParams.get("view") === "tiles" ? "tiles" : "list";
  const [librarySearchTerm, setLibrarySearchTerm] = useState("");
  const librariesQuery = useAssetLibrariesQuery();
  const filteredLibraries = useMemo(
    () => filterAssetLibraries(librariesQuery.data?.libraries ?? [], librarySearchTerm),
    [librariesQuery.data?.libraries, librarySearchTerm]
  );
  const selectedLibrarySummary = useMemo(() => {
    const libraries = librariesQuery.data?.libraries ?? [];

    if (selectedLibraryParam) {
      const matched = libraries.find((summary) => summary.library.id === selectedLibraryParam);

      if (matched) {
        return matched;
      }
    }

    return libraries[0] ?? null;
  }, [librariesQuery.data?.libraries, selectedLibraryParam]);
  const treeQuery = useAssetLibraryTreeQuery(selectedLibrarySummary?.library.id ?? null);
  const selectedFolder = useMemo(() => {
    if (!treeQuery.data) {
      return null;
    }

    if (selectedFolderParam) {
      const matched = findAssetFolderNode(
        treeQuery.data.rootFolder,
        asEntityId<AssetLibraryFolderId>(selectedFolderParam)
      );

      if (matched) {
        return matched;
      }
    }

    return treeQuery.data.rootFolder;
  }, [selectedFolderParam, treeQuery.data]);
  const folderPath = useMemo(
    () =>
      selectedFolder && treeQuery.data
        ? pathForAssetFolder(treeQuery.data.rootFolder, selectedFolder.folder.id).map((node) => node.folder)
        : [],
    [selectedFolder, treeQuery.data]
  );
  const visibleItems = useMemo<LibraryVisibleItem[]>(() => {
    if (!selectedFolder) {
      return [];
    }

    return [
      ...selectedFolder.childFolders.map((node) => ({ kind: "folder" as const, node })),
      ...selectedFolder.assets.map((asset) => ({ kind: "asset" as const, asset }))
    ];
  }, [selectedFolder]);
  const selectedFolderItemCount =
    (selectedFolder?.childFolders.length ?? 0) + (selectedFolder?.assets.length ?? 0);

  const goToLibrary = (libraryId: AssetLibraryId) => {
    router.push(hrefWithParams("/libraries", searchParams, { library: libraryId, folder: null }));
  };

  const goToFolder = (folderId: AssetLibraryFolderId) => {
    router.push(hrefWithParams("/libraries", searchParams, { folder: folderId }));
  };

  const setView = (nextView: LibraryView) => {
    router.push(hrefWithParams("/libraries", searchParams, { view: nextView }));
  };

  const folderHref = (folder: AssetLibraryFolder) =>
    hrefWithParams("/libraries", searchParams, { folder: folder.id });

  const clearFolderHref = () => hrefWithParams("/libraries", searchParams, { folder: null });

  return {
    clearFolderHref,
    folderHref,
    folderPath,
    filteredLibraries,
    goToFolder,
    goToLibrary,
    librarySearchTerm,
    librariesQuery,
    router,
    searchParams,
    selectedFolder,
    selectedFolderItemCount,
    selectedFolderParam,
    selectedLibrarySummary,
    setLibrarySearchTerm,
    setView,
    treeQuery,
    view,
    visibleItems
  };
}
