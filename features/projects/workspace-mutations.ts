"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { db } from "../../data/db";
import {
  createProjectRepository,
  type CreateCollectionInput,
  type CreateDeviceInput,
  type CreateEventInput,
  type CreateEventTriggerInput,
  type CreateTriggerPlaybackInput,
  type UpdateCollectionInput,
  type UpdateDeviceInput,
  type UpdateEventInput,
  type UpdateEventTriggerInput,
  type UpdateTriggerPlaybackInput
} from "../../data/repositories/project-repository";
import { unwrapQueryResult } from "../../domain";
import type { CollectionId, DeviceId, EventId, EventTriggerId, TriggerPlaybackId } from "../../domain/ids";
import {
  invalidateCollisionMatrices,
  invalidateDeviceWorkspace,
  invalidateDeviceWorkspaces,
  invalidateProjectWorkspace,
  invalidateProjectWorkspaces,
  invalidateShareLinks
} from "./invalidation";

const projectRepository = createProjectRepository(db);

export const useCreateDeviceMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateDeviceInput) =>
      projectRepository.createDevice(input).then(unwrapQueryResult),
    onSuccess: (createdDevice) => {
      void invalidateProjectWorkspace(queryClient, createdDevice.device.projectId);
      void invalidateDeviceWorkspace(queryClient, createdDevice.device.id);
    }
  });
};

export const useUpdateDeviceMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateDeviceInput) =>
      projectRepository.updateDevice(input).then(unwrapQueryResult),
    onSuccess: (device) => {
      void invalidateProjectWorkspace(queryClient, device.projectId);
      void invalidateDeviceWorkspace(queryClient, device.id);
      void invalidateShareLinks(queryClient);
    }
  });
};

export const useDeleteDeviceMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deviceId: DeviceId) => projectRepository.deleteDevice(deviceId).then(unwrapQueryResult),
    onSuccess: () => {
      void invalidateProjectWorkspaces(queryClient);
      void invalidateDeviceWorkspaces(queryClient);
      void invalidateCollisionMatrices(queryClient);
      void invalidateShareLinks(queryClient);
    }
  });
};

export const useCreateCollectionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCollectionInput) =>
      projectRepository.createCollection(input).then(unwrapQueryResult),
    onSuccess: (collection) => {
      void invalidateProjectWorkspaces(queryClient);
      void invalidateDeviceWorkspace(queryClient, collection.deviceId);
      void invalidateCollisionMatrices(queryClient);
    }
  });
};

export const useUpdateCollectionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateCollectionInput) =>
      projectRepository.updateCollection(input).then(unwrapQueryResult),
    onSuccess: (collection) => {
      void invalidateDeviceWorkspace(queryClient, collection.deviceId);
      void invalidateCollisionMatrices(queryClient);
    }
  });
};

export const useDeleteCollectionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (collectionId: CollectionId) =>
      projectRepository.deleteCollection(collectionId).then(unwrapQueryResult),
    onSuccess: () => {
      void invalidateProjectWorkspaces(queryClient);
      void invalidateDeviceWorkspaces(queryClient);
      void invalidateCollisionMatrices(queryClient);
      void invalidateShareLinks(queryClient);
    }
  });
};

export const useCreateEventMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateEventInput) => projectRepository.createEvent(input).then(unwrapQueryResult),
    onSuccess: () => {
      void invalidateProjectWorkspaces(queryClient);
      void invalidateDeviceWorkspaces(queryClient);
      void invalidateCollisionMatrices(queryClient);
    }
  });
};

export const useDeleteEventMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventId: EventId) => projectRepository.deleteEvent(eventId).then(unwrapQueryResult),
    onSuccess: () => {
      void invalidateProjectWorkspaces(queryClient);
      void invalidateDeviceWorkspaces(queryClient);
      void invalidateCollisionMatrices(queryClient);
      void invalidateShareLinks(queryClient);
    }
  });
};

export const useUpdateEventMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateEventInput) => projectRepository.updateEvent(input).then(unwrapQueryResult),
    onSuccess: () => {
      void invalidateDeviceWorkspaces(queryClient);
      void invalidateCollisionMatrices(queryClient);
      void invalidateShareLinks(queryClient);
    }
  });
};

export const useCreateEventTriggerMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateEventTriggerInput) =>
      projectRepository.createEventTrigger(input).then(unwrapQueryResult),
    onSuccess: () => {
      void invalidateDeviceWorkspaces(queryClient);
      void invalidateShareLinks(queryClient);
    }
  });
};

export const useUpdateEventTriggerMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateEventTriggerInput) =>
      projectRepository.updateEventTrigger(input).then(unwrapQueryResult),
    onSuccess: () => {
      void invalidateDeviceWorkspaces(queryClient);
      void invalidateShareLinks(queryClient);
    }
  });
};

export const useDeleteEventTriggerMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventTriggerId: EventTriggerId) =>
      projectRepository.deleteEventTrigger(eventTriggerId).then(unwrapQueryResult),
    onSuccess: () => {
      void invalidateDeviceWorkspaces(queryClient);
      void invalidateShareLinks(queryClient);
    }
  });
};

export const useCreateTriggerPlaybackMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTriggerPlaybackInput) =>
      projectRepository.createTriggerPlayback(input).then(unwrapQueryResult),
    onSuccess: () => {
      void invalidateDeviceWorkspaces(queryClient);
      void invalidateShareLinks(queryClient);
    }
  });
};

export const useUpdateTriggerPlaybackMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateTriggerPlaybackInput) =>
      projectRepository.updateTriggerPlayback(input).then(unwrapQueryResult),
    onSuccess: () => {
      void invalidateDeviceWorkspaces(queryClient);
      void invalidateShareLinks(queryClient);
    }
  });
};

export const useDeleteTriggerPlaybackMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (triggerPlaybackId: TriggerPlaybackId) =>
      projectRepository.deleteTriggerPlayback(triggerPlaybackId).then(unwrapQueryResult),
    onSuccess: () => {
      void invalidateDeviceWorkspaces(queryClient);
      void invalidateShareLinks(queryClient);
    }
  });
};
