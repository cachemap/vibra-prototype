"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { db } from "../../data/db";
import {
  createProjectRepository,
  type CreateAssetInput,
  type CreateAssetLibraryFolderInput,
  type CreateAssetLibraryInput,
  type CreateCollectionInput,
  type CreateDeviceInput,
  type CreateEventInput,
  type CreateEventTriggerInput,
  type CreateProjectFolderInput,
  type CreateProjectInput,
  type CreateTriggerPlaybackInput,
  type GenerateSharingLinkInput,
  type ImportAssetLibraryInput,
  type SelectCollisionMatrixEventInput,
  type UpdateDeviceInput,
  type UpdateCollectionInput,
  type UpdateEventInput,
  type UpdateEventTriggerInput,
  type UpdateTriggerPlaybackInput,
  type UpsertCollisionMatrixEntryInput
} from "../../data/repositories/project-repository";
import { unwrapQueryResult } from "../../domain";
import type {
  AssetId,
  AssetLibraryFolderId,
  AssetLibraryId,
  CollectionId,
  CollisionMatrixEntryId,
  CollisionMatrixId,
  DeviceId,
  EventId,
  EventTriggerId,
  ProjectFolderId,
  ProjectId,
  SharingLinkId,
  TriggerPlaybackId,
  UserId
} from "../../domain/ids";

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

export const useCreateDeviceMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateDeviceInput) =>
      projectRepository.createDevice(input).then(unwrapQueryResult),
    onSuccess: (createdDevice) => {
      void queryClient.invalidateQueries({
        queryKey: projectQueryKeys.workspace(createdDevice.device.projectId)
      });
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    }
  });
};

export const useUpdateDeviceMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateDeviceInput) =>
      projectRepository.updateDevice(input).then(unwrapQueryResult),
    onSuccess: (device) => {
      void queryClient.invalidateQueries({
        queryKey: projectQueryKeys.workspace(device.projectId)
      });
      void queryClient.invalidateQueries({
        queryKey: projectQueryKeys.deviceWorkspace(device.id)
      });
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    }
  });
};

export const useDeleteDeviceMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deviceId: DeviceId) => projectRepository.deleteDevice(deviceId).then(unwrapQueryResult),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    }
  });
};

export const useCreateCollectionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCollectionInput) =>
      projectRepository.createCollection(input).then(unwrapQueryResult),
    onSuccess: (collection) => {
      void queryClient.invalidateQueries({
        queryKey: projectQueryKeys.deviceWorkspace(collection.deviceId)
      });
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    }
  });
};

export const useUpdateCollectionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateCollectionInput) =>
      projectRepository.updateCollection(input).then(unwrapQueryResult),
    onSuccess: (collection) => {
      void queryClient.invalidateQueries({
        queryKey: projectQueryKeys.deviceWorkspace(collection.deviceId)
      });
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    }
  });
};

export const useDeleteCollectionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (collectionId: CollectionId) =>
      projectRepository.deleteCollection(collectionId).then(unwrapQueryResult),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    }
  });
};

export const useCreateEventMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateEventInput) => projectRepository.createEvent(input).then(unwrapQueryResult),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    }
  });
};

export const useDeleteEventMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventId: EventId) => projectRepository.deleteEvent(eventId).then(unwrapQueryResult),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    }
  });
};

export const useUpdateEventMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateEventInput) => projectRepository.updateEvent(input).then(unwrapQueryResult),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    }
  });
};

export const useCreateEventTriggerMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateEventTriggerInput) =>
      projectRepository.createEventTrigger(input).then(unwrapQueryResult),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    }
  });
};

export const useUpdateEventTriggerMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateEventTriggerInput) =>
      projectRepository.updateEventTrigger(input).then(unwrapQueryResult),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    }
  });
};

export const useDeleteEventTriggerMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventTriggerId: EventTriggerId) =>
      projectRepository.deleteEventTrigger(eventTriggerId).then(unwrapQueryResult),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    }
  });
};

export const useCreateTriggerPlaybackMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTriggerPlaybackInput) =>
      projectRepository.createTriggerPlayback(input).then(unwrapQueryResult),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    }
  });
};

export const useUpdateTriggerPlaybackMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateTriggerPlaybackInput) =>
      projectRepository.updateTriggerPlayback(input).then(unwrapQueryResult),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    }
  });
};

export const useDeleteTriggerPlaybackMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (triggerPlaybackId: TriggerPlaybackId) =>
      projectRepository.deleteTriggerPlayback(triggerPlaybackId).then(unwrapQueryResult),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    }
  });
};

export const useSelectCollisionMatrixRowMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SelectCollisionMatrixEventInput) =>
      projectRepository.selectCollisionMatrixRow(input).then(unwrapQueryResult),
    onSuccess: (row) => {
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.collisionMatrix(row.matrixId) });
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    }
  });
};

export const useSelectCollisionMatrixColumnMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SelectCollisionMatrixEventInput) =>
      projectRepository.selectCollisionMatrixColumn(input).then(unwrapQueryResult),
    onSuccess: (column) => {
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.collisionMatrix(column.matrixId) });
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    }
  });
};

export const useDeselectCollisionMatrixRowMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SelectCollisionMatrixEventInput) =>
      projectRepository.deselectCollisionMatrixRow(input).then(unwrapQueryResult),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    }
  });
};

export const useDeselectCollisionMatrixColumnMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SelectCollisionMatrixEventInput) =>
      projectRepository.deselectCollisionMatrixColumn(input).then(unwrapQueryResult),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    }
  });
};

export const useUpsertCollisionMatrixEntryMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpsertCollisionMatrixEntryInput) =>
      projectRepository.upsertCollisionMatrixEntry(input).then(unwrapQueryResult),
    onSuccess: (entry) => {
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.collisionMatrix(entry.matrixId) });
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    }
  });
};

export const useDeleteCollisionMatrixEntryMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (collisionMatrixEntryId: CollisionMatrixEntryId) =>
      projectRepository.deleteCollisionMatrixEntry(collisionMatrixEntryId).then(unwrapQueryResult),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    }
  });
};

export const useGenerateSharingLinkMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: GenerateSharingLinkInput) =>
      projectRepository.generateSharingLink(input).then(unwrapQueryResult),
    onSuccess: (sharingLink) => {
      const shareToken = sharingLink.url.split("/").at(-1) ?? sharingLink.id;

      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.shareLink(shareToken) });
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    }
  });
};

export const useDeleteSharingLinkMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sharingLinkId: SharingLinkId) =>
      projectRepository.deleteSharingLink(sharingLinkId).then(unwrapQueryResult),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    }
  });
};
