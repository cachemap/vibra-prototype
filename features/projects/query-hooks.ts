"use client";

import { useQuery } from "@tanstack/react-query";

import { db } from "../../data/db";
import { createProjectRepository } from "../../data/repositories/project-repository";
import { unwrapQueryResult } from "../../domain";
import type { AssetLibraryId, DeviceId, ProjectId, UserId } from "../../domain/ids";
import { projectQueryKeys } from "./query-keys";

const projectRepository = createProjectRepository(db);

export const useProjectTreeQuery = (userId: UserId) =>
  useQuery({
    queryKey: projectQueryKeys.tree(userId),
    queryFn: async () => unwrapQueryResult(await projectRepository.loadProjectTree(userId))
  });

export const useProjectWorkspaceQuery = (projectId: ProjectId) =>
  useQuery({
    queryKey: projectQueryKeys.workspace(projectId),
    queryFn: async () => unwrapQueryResult(await projectRepository.loadProjectWorkspace(projectId))
  });

export const useAssetLibrariesQuery = () =>
  useQuery({
    queryKey: projectQueryKeys.assetLibraries(),
    queryFn: async () => unwrapQueryResult(await projectRepository.loadAssetLibraries())
  });

export const useAssetLibraryTreeQuery = (libraryId: AssetLibraryId | null) =>
  useQuery({
    enabled: Boolean(libraryId),
    queryKey: libraryId ? projectQueryKeys.assetLibraryTree(libraryId) : [...projectQueryKeys.all, "asset-library-tree"],
    queryFn: async () => {
      if (!libraryId) {
        throw new Error("Asset library id is required.");
      }

      return unwrapQueryResult(await projectRepository.loadAssetLibraryTree(libraryId));
    }
  });

export const useDeviceWorkspaceQuery = (deviceId: DeviceId | null) =>
  useQuery({
    enabled: Boolean(deviceId),
    queryKey: deviceId ? projectQueryKeys.deviceWorkspace(deviceId) : [...projectQueryKeys.all, "device-workspace"],
    queryFn: async () => {
      if (!deviceId) {
        throw new Error("Device id is required.");
      }

      return unwrapQueryResult(await projectRepository.loadDeviceWorkspace(deviceId));
    }
  });

export const useSharingLinkPreviewQuery = (shareToken: string) =>
  useQuery({
    queryKey: [...projectQueryKeys.shareLink(shareToken), "preview"] as const,
    queryFn: async () => unwrapQueryResult(await projectRepository.loadSharingLinkPreview(shareToken))
  });
