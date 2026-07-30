"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { db } from "../../data/db";
import {
  createProjectRepository,
  type CreateAssetInput,
  type CreateAssetLibraryFolderInput,
  type CreateAssetLibraryInput,
  type CreateProjectFolderInput,
  type CreateProjectInput,
  type ImportAssetLibraryInput
} from "../../data/repositories/project-repository";
import { unwrapQueryResult } from "../../domain";
import type { AssetId, AssetLibraryFolderId, AssetLibraryId, ProjectFolderId, ProjectId } from "../../domain/ids";
import {
  invalidateAssetLibraryList,
  invalidateAssetLibraryTree,
  invalidateAssetLibraryTrees,
  invalidateDeviceWorkspaces,
  invalidateProjectTreeViews,
  invalidateProjectWorkspace,
  invalidateProjectWorkspaces,
  invalidateShareLinks
} from "./invalidation";

const projectRepository = createProjectRepository(db);

export const useCreateProjectMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProjectInput) =>
      projectRepository.createProject(input).then(unwrapQueryResult),
    onSuccess: (createdProject) => {
      void invalidateProjectTreeViews(queryClient);
      void invalidateProjectWorkspace(queryClient, createdProject.project.id);
      void invalidateAssetLibraryList(queryClient);
      void invalidateAssetLibraryTree(queryClient, createdProject.defaultAssetLibrary.id);
    }
  });
};

export const useDeleteProjectMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: ProjectId) => projectRepository.deleteProject(projectId).then(unwrapQueryResult),
    onSuccess: () => {
      void invalidateProjectTreeViews(queryClient);
      void invalidateProjectWorkspaces(queryClient);
      void invalidateAssetLibraryList(queryClient);
      void invalidateAssetLibraryTrees(queryClient);
      void invalidateDeviceWorkspaces(queryClient);
      void invalidateShareLinks(queryClient);
    }
  });
};

export const useCreateProjectFolderMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProjectFolderInput) =>
      projectRepository.createProjectFolder(input).then(unwrapQueryResult),
    onSuccess: () => {
      void invalidateProjectTreeViews(queryClient);
    }
  });
};

export const useDeleteProjectFolderMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectFolderId: ProjectFolderId) =>
      projectRepository.deleteProjectFolder(projectFolderId).then(unwrapQueryResult),
    onSuccess: () => {
      void invalidateProjectTreeViews(queryClient);
      void invalidateProjectWorkspaces(queryClient);
      void invalidateAssetLibraryList(queryClient);
      void invalidateAssetLibraryTrees(queryClient);
      void invalidateDeviceWorkspaces(queryClient);
      void invalidateShareLinks(queryClient);
    }
  });
};

export const useCreateAssetLibraryMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAssetLibraryInput) =>
      projectRepository.createAssetLibrary(input).then(unwrapQueryResult),
    onSuccess: (createdLibrary) => {
      void invalidateAssetLibraryList(queryClient);
      void invalidateAssetLibraryTree(queryClient, createdLibrary.library.id);
    }
  });
};

export const useDeleteAssetLibraryMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assetLibraryId: AssetLibraryId) =>
      projectRepository.deleteAssetLibrary(assetLibraryId).then(unwrapQueryResult),
    onSuccess: () => {
      void invalidateAssetLibraryList(queryClient);
      void invalidateAssetLibraryTrees(queryClient);
      void invalidateProjectWorkspaces(queryClient);
      void invalidateDeviceWorkspaces(queryClient);
      void invalidateShareLinks(queryClient);
    }
  });
};

export const useCreateAssetLibraryFolderMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAssetLibraryFolderInput) =>
      projectRepository.createAssetLibraryFolder(input).then(unwrapQueryResult),
    onSuccess: (folder) => {
      void invalidateAssetLibraryList(queryClient);
      void invalidateAssetLibraryTree(queryClient, folder.libraryId);
    }
  });
};

export const useDeleteAssetLibraryFolderMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assetLibraryFolderId: AssetLibraryFolderId) =>
      projectRepository.deleteAssetLibraryFolder(assetLibraryFolderId).then(unwrapQueryResult),
    onSuccess: () => {
      void invalidateAssetLibraryList(queryClient);
      void invalidateAssetLibraryTrees(queryClient);
      void invalidateDeviceWorkspaces(queryClient);
      void invalidateShareLinks(queryClient);
    }
  });
};

export const useCreateAssetMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAssetInput) => projectRepository.createAsset(input).then(unwrapQueryResult),
    onSuccess: (asset) => {
      void invalidateAssetLibraryList(queryClient);
      void invalidateAssetLibraryTree(queryClient, asset.libraryId);
      void invalidateDeviceWorkspaces(queryClient);
    }
  });
};

export const useDeleteAssetMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assetId: AssetId) => projectRepository.deleteAsset(assetId).then(unwrapQueryResult),
    onSuccess: () => {
      void invalidateAssetLibraryList(queryClient);
      void invalidateAssetLibraryTrees(queryClient);
      void invalidateDeviceWorkspaces(queryClient);
      void invalidateShareLinks(queryClient);
    }
  });
};

export const useImportAssetLibraryMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ImportAssetLibraryInput) =>
      projectRepository.importAssetLibrary(input).then(unwrapQueryResult),
    onSuccess: (libraryImport) => {
      void invalidateProjectWorkspace(queryClient, libraryImport.projectId);
      void invalidateAssetLibraryList(queryClient);
      void invalidateDeviceWorkspaces(queryClient);
    }
  });
};
