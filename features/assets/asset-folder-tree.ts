import type { AssetLibraryFolderId } from "@/domain";
import type { AssetLibraryFolderNode } from "@/data/repositories/project-repository";
import { findTreeNode, flattenTree, pathToTreeNode } from "@/lib/tree";

const assetFolderTreeShape = {
  childrenOf: (node: AssetLibraryFolderNode) => node.childFolders,
  idOf: (node: AssetLibraryFolderNode) => node.folder.id
};

export type AssetFolderDescendantCounts = {
  assets: number;
  folders: number;
};

export const flattenAssetFolders = (node: AssetLibraryFolderNode): AssetLibraryFolderNode[] =>
  flattenTree(node, assetFolderTreeShape);

export const findAssetFolderNode = (
  node: AssetLibraryFolderNode,
  folderId: AssetLibraryFolderId
): AssetLibraryFolderNode | null => findTreeNode([node], folderId, assetFolderTreeShape);

export const pathForAssetFolder = (
  node: AssetLibraryFolderNode,
  folderId: AssetLibraryFolderId
): AssetLibraryFolderNode[] => pathToTreeNode([node], folderId, assetFolderTreeShape);

export const countAssetFolderDescendants = (
  node: AssetLibraryFolderNode
): AssetFolderDescendantCounts =>
  node.childFolders.reduce(
    (counts: AssetFolderDescendantCounts, child): AssetFolderDescendantCounts => {
      const childCounts = countAssetFolderDescendants(child);

      return {
        assets: counts.assets + childCounts.assets,
        folders: counts.folders + 1 + childCounts.folders
      };
    },
    { assets: node.assets.length, folders: 0 }
  );
