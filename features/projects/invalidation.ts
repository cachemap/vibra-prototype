"use client";

import type { QueryClient } from "@tanstack/react-query";

import type { AssetLibraryId, CollisionMatrixId, DeviceId, ProjectId } from "../../domain/ids";
import { projectQueryKeys } from "./query-keys";

export const invalidateProjectTreeViews = (queryClient: QueryClient) =>
  queryClient.invalidateQueries({ queryKey: projectQueryKeys.trees() });

export const invalidateProjectWorkspace = (queryClient: QueryClient, projectId: ProjectId) =>
  queryClient.invalidateQueries({ queryKey: projectQueryKeys.workspace(projectId) });

export const invalidateProjectWorkspaces = (queryClient: QueryClient) =>
  queryClient.invalidateQueries({ queryKey: projectQueryKeys.workspaces() });

export const invalidateAssetLibraryList = (queryClient: QueryClient) =>
  queryClient.invalidateQueries({ queryKey: projectQueryKeys.assetLibraries() });

export const invalidateAssetLibraryTree = (queryClient: QueryClient, libraryId: AssetLibraryId) =>
  queryClient.invalidateQueries({ queryKey: projectQueryKeys.assetLibraryTree(libraryId) });

export const invalidateAssetLibraryTrees = (queryClient: QueryClient) =>
  queryClient.invalidateQueries({ queryKey: projectQueryKeys.assetLibraryTrees() });

export const invalidateDeviceWorkspace = (queryClient: QueryClient, deviceId: DeviceId) =>
  queryClient.invalidateQueries({ queryKey: projectQueryKeys.deviceWorkspace(deviceId) });

export const invalidateDeviceWorkspaces = (queryClient: QueryClient) =>
  queryClient.invalidateQueries({ queryKey: projectQueryKeys.deviceWorkspaces() });

export const invalidateCollisionMatrix = (queryClient: QueryClient, matrixId: CollisionMatrixId) =>
  queryClient.invalidateQueries({ queryKey: projectQueryKeys.collisionMatrix(matrixId) });

export const invalidateCollisionMatrices = (queryClient: QueryClient) =>
  queryClient.invalidateQueries({ queryKey: projectQueryKeys.collisionMatrices() });

export const invalidateShareLinks = (queryClient: QueryClient) =>
  queryClient.invalidateQueries({ queryKey: projectQueryKeys.shareLinks() });
