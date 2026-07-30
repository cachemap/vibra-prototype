import { useMemo } from "react";
import type { ProjectFolderId } from "@/domain";
import type { ProjectTreeAggregate } from "@/data/repositories/project-repository";
import { findProjectFolderNode, findProjectFolderPath } from "./project-folder-tree";
import { rowsForProjectFolder } from "./project-row-model";
import { filterProjectRows } from "./project-search";

export function useProjectsListModel(
  tree: ProjectTreeAggregate | undefined,
  selectedFolderId: ProjectFolderId | null,
  searchTerm = ""
) {
  const currentFolder = useMemo(() => {
    if (!tree || !selectedFolderId) {
      return null;
    }

    return findProjectFolderNode(tree.roots, selectedFolderId);
  }, [selectedFolderId, tree]);

  const folderPath = useMemo(() => {
    if (!tree || !selectedFolderId) {
      return [];
    }

    return findProjectFolderPath(tree.roots, selectedFolderId) ?? [];
  }, [selectedFolderId, tree]);

  const allRows = useMemo(() => (tree ? rowsForProjectFolder(tree, currentFolder) : []), [currentFolder, tree]);
  const rows = useMemo(() => filterProjectRows(allRows, searchTerm), [allRows, searchTerm]);
  const platformIdByName = useMemo(
    () => new Map((tree?.platforms ?? []).map((platform) => [platform.name, platform.id])),
    [tree?.platforms]
  );

  return { allRows, currentFolder, folderPath, platformIdByName, rows };
}
