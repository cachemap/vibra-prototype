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
import { projectQueryKeys } from "./query-keys";

const projectRepository = createProjectRepository(db);

export const useCreateProjectMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProjectInput) =>
      projectRepository.createProject(input).then(unwrapQueryResult),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    }
  });
};

export const useDeleteProjectMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: ProjectId) => projectRepository.deleteProject(projectId).then(unwrapQueryResult),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    }
  });
};

export const useCreateProjectFolderMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProjectFolderInput) =>
      projectRepository.createProjectFolder(input).then(unwrapQueryResult),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    }
  });
};

export const useDeleteProjectFolderMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectFolderId: ProjectFolderId) =>
      projectRepository.deleteProjectFolder(projectFolderId).then(unwrapQueryResult),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    }
  });
};

export const useCreateAssetLibraryMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAssetLibraryInput) =>
      projectRepository.createAssetLibrary(input).then(unwrapQueryResult),
    onSuccess: (createdLibrary) => {
      void queryClient.invalidateQueries({
        queryKey: projectQueryKeys.assetLibraryTree(createdLibrary.library.id)
      });
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    }
  });
};

export const useDeleteAssetLibraryMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assetLibraryId: AssetLibraryId) =>
      projectRepository.deleteAssetLibrary(assetLibraryId).then(unwrapQueryResult),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    }
  });
};

export const useCreateAssetLibraryFolderMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAssetLibraryFolderInput) =>
      projectRepository.createAssetLibraryFolder(input).then(unwrapQueryResult),
    onSuccess: (folder) => {
      void queryClient.invalidateQueries({
        queryKey: projectQueryKeys.assetLibraryTree(folder.libraryId)
      });
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    }
  });
};

export const useDeleteAssetLibraryFolderMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assetLibraryFolderId: AssetLibraryFolderId) =>
      projectRepository.deleteAssetLibraryFolder(assetLibraryFolderId).then(unwrapQueryResult),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    }
  });
};

export const useCreateAssetMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAssetInput) => projectRepository.createAsset(input).then(unwrapQueryResult),
    onSuccess: (asset) => {
      void queryClient.invalidateQueries({
        queryKey: projectQueryKeys.assetLibraryTree(asset.libraryId)
      });
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    }
  });
};

export const useDeleteAssetMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assetId: AssetId) => projectRepository.deleteAsset(assetId).then(unwrapQueryResult),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    }
  });
};

export const useImportAssetLibraryMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ImportAssetLibraryInput) =>
      projectRepository.importAssetLibrary(input).then(unwrapQueryResult),
    onSuccess: (libraryImport) => {
      void queryClient.invalidateQueries({
        queryKey: projectQueryKeys.workspace(libraryImport.projectId)
      });
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    }
  });
};
