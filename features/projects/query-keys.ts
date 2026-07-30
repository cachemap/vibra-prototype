import type { AssetLibraryId, CollisionMatrixId, DeviceId, ProjectId, UserId } from "../../domain/ids";

export const projectQueryKeys = {
  all: ["projects"] as const,
  tree: (userId: UserId) => [...projectQueryKeys.all, "tree", userId] as const,
  workspace: (projectId: ProjectId) => [...projectQueryKeys.all, "workspace", projectId] as const,
  assetLibraries: () => [...projectQueryKeys.all, "asset-libraries"] as const,
  assetLibraryTree: (libraryId: AssetLibraryId) =>
    [...projectQueryKeys.all, "asset-library-tree", libraryId] as const,
  deviceWorkspace: (deviceId: DeviceId) =>
    [...projectQueryKeys.all, "device-workspace", deviceId] as const,
  collisionMatrix: (matrixId: CollisionMatrixId) =>
    [...projectQueryKeys.all, "collision-matrix", matrixId] as const,
  shareLink: (shareToken: string) => [...projectQueryKeys.all, "share-link", shareToken] as const
};
