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
import { projectQueryKeys } from "./query-keys";

const projectRepository = createProjectRepository(db);

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
