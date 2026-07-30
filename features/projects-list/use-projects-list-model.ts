import { useMemo } from "react";
import type { ProjectFolderId } from "@/domain";
import type { ProjectTreeAggregate } from "@/data/repositories/project-repository";
import { findProjectFolderNode, findProjectFolderPath } from "./project-folder-tree";
import { rowsForProjectFolder } from "./project-row-model";

export function useProjectsListModel(
  tree: ProjectTreeAggregate | undefined,
  selectedFolderId: ProjectFolderId | null
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

  const rows = useMemo(() => (tree ? rowsForProjectFolder(tree, currentFolder) : []), [currentFolder, tree]);
  const platformIdByName = useMemo(
    () => new Map((tree?.platforms ?? []).map((platform) => [platform.name, platform.id])),
    [tree?.platforms]
  );

  return { currentFolder, folderPath, platformIdByName, rows };
}
