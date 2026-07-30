import type { AssetLibraryId, CollisionMatrixId, DeviceId, ProjectId, UserId } from "../../domain/ids";

export const projectQueryKeys = {
  all: ["projects"] as const,
  trees: () => [...projectQueryKeys.all, "tree"] as const,
  tree: (userId: UserId) => [...projectQueryKeys.trees(), userId] as const,
  workspaces: () => [...projectQueryKeys.all, "workspace"] as const,
  workspace: (projectId: ProjectId) => [...projectQueryKeys.workspaces(), projectId] as const,
  assetLibraries: () => [...projectQueryKeys.all, "asset-libraries"] as const,
  assetLibraryTrees: () => [...projectQueryKeys.all, "asset-library-tree"] as const,
  assetLibraryTree: (libraryId: AssetLibraryId) =>
    [...projectQueryKeys.assetLibraryTrees(), libraryId] as const,
  deviceWorkspaces: () => [...projectQueryKeys.all, "device-workspace"] as const,
  deviceWorkspace: (deviceId: DeviceId) =>
    [...projectQueryKeys.deviceWorkspaces(), deviceId] as const,
  collisionMatrices: () => [...projectQueryKeys.all, "collision-matrix"] as const,
  collisionMatrix: (matrixId: CollisionMatrixId) =>
    [...projectQueryKeys.collisionMatrices(), matrixId] as const,
  shareLinks: () => [...projectQueryKeys.all, "share-link"] as const,
  shareLink: (shareToken: string) => [...projectQueryKeys.shareLinks(), shareToken] as const
};
