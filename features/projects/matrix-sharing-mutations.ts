"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { db } from "../../data/db";
import {
  createProjectRepository,
  type GenerateSharingLinkInput,
  type SelectCollisionMatrixEventInput,
  type UpsertCollisionMatrixEntryInput
} from "../../data/repositories/project-repository";
import { unwrapQueryResult } from "../../domain";
import type { CollisionMatrixEntryId, SharingLinkId } from "../../domain/ids";
import { projectQueryKeys } from "./query-keys";

const projectRepository = createProjectRepository(db);

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
