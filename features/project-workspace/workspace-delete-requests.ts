import type { Asset, Collection, CollisionMatrixEntry, EventId } from "@/domain";
import type { AssetLibraryFolderNode } from "@/data/repositories/project-repository";
import { countAssetFolderDescendants } from "@/features/assets/asset-folder-tree";

export const collectionDeleteTarget = (collection: { collection: Collection }) => ({
  kind: "collection" as const,
  id: collection.collection.id,
  name: collection.collection.name
});

export const eventDeleteTarget = (event: { id: EventId; name: string }) => ({
  kind: "event" as const,
  id: event.id,
  name: event.name
});

export const matrixEntryDeleteTarget = (entry: CollisionMatrixEntry, name: string) => ({
  kind: "matrixEntry" as const,
  id: entry.id,
  name
});

export const assetFolderDeleteTarget = (node: AssetLibraryFolderNode) => ({
  counts: countAssetFolderDescendants(node),
  kind: "assetFolder" as const,
  id: node.folder.id,
  name: node.folder.name
});

export const assetDeleteTarget = (asset: Asset) => ({
  kind: "asset" as const,
  id: asset.id,
  name: asset.name
});
