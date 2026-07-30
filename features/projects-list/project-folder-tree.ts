import type { ProjectFolderId } from "@/domain";
import type { ProjectFolderNode } from "@/data/repositories/project-repository";
import { findTreeNode, pathToTreeNode } from "@/lib/tree";

const projectFolderTreeShape = {
  childrenOf: (node: ProjectFolderNode) => node.childFolders,
  idOf: (node: ProjectFolderNode) => node.folder.id
};

export const findProjectFolderNode = (
  nodes: readonly ProjectFolderNode[],
  folderId: ProjectFolderId
): ProjectFolderNode | null => findTreeNode(nodes, folderId, projectFolderTreeShape);

export const findProjectFolderPath = (
  nodes: readonly ProjectFolderNode[],
  folderId: ProjectFolderId,
  path: ProjectFolderNode[] = []
): ProjectFolderNode[] | null => {
  const foundPath = pathToTreeNode(nodes, folderId, projectFolderTreeShape);

  return foundPath.length ? [...path, ...foundPath] : null;
};

export const countProjectsInFolder = (node: ProjectFolderNode): number =>
  node.projects.length + node.childFolders.reduce((total, child) => total + countProjectsInFolder(child), 0);
