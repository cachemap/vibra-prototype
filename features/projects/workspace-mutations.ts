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
  type DeviceWorkspaceAggregate,
  type ReorderCollectionEventsInput,
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
import { projectQueryKeys } from "./query-keys";

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

export const useReorderCollectionEventsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ReorderCollectionEventsInput) =>
      projectRepository.reorderCollectionEvents(input).then(unwrapQueryResult),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: projectQueryKeys.deviceWorkspaces() });

      const snapshots = queryClient.getQueriesData<DeviceWorkspaceAggregate>({
        queryKey: projectQueryKeys.deviceWorkspaces()
      });
      const orderByEventId = new Map(input.orderedEventIds.map((eventId, index) => [eventId, index]));

      for (const [queryKey] of snapshots) {
        queryClient.setQueryData<DeviceWorkspaceAggregate | undefined>(queryKey, (workspace) => {
          if (!workspace?.collections.some((collection) => collection.collection.id === input.collectionId)) {
            return workspace;
          }

          return {
            ...workspace,
            collections: workspace.collections.map((collection) =>
              collection.collection.id === input.collectionId
                ? {
                    ...collection,
                    events: [...collection.events].sort(
                      (first, second) =>
                        (orderByEventId.get(first.event.id) ?? first.event.sortOrder) -
                          (orderByEventId.get(second.event.id) ?? second.event.sortOrder) ||
                        first.event.name.localeCompare(second.event.name) ||
                        first.event.id.localeCompare(second.event.id)
                    )
                  }
                : collection
            )
          };
        });
      }

      return { snapshots };
    },
    onError: (_error, _input, context) => {
      for (const [queryKey, snapshot] of context?.snapshots ?? []) {
        queryClient.setQueryData(queryKey, snapshot);
      }
    },
    onSettled: () => {
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
