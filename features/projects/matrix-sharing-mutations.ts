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
import {
  invalidateCollisionMatrices,
  invalidateCollisionMatrix,
  invalidateDeviceWorkspaces,
  invalidateShareLinks
} from "./invalidation";

const projectRepository = createProjectRepository(db);

export const useSelectCollisionMatrixRowMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SelectCollisionMatrixEventInput) =>
      projectRepository.selectCollisionMatrixRow(input).then(unwrapQueryResult),
    onSuccess: (row) => {
      void invalidateCollisionMatrix(queryClient, row.matrixId);
      void invalidateDeviceWorkspaces(queryClient);
    }
  });
};

export const useSelectCollisionMatrixColumnMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SelectCollisionMatrixEventInput) =>
      projectRepository.selectCollisionMatrixColumn(input).then(unwrapQueryResult),
    onSuccess: (column) => {
      void invalidateCollisionMatrix(queryClient, column.matrixId);
      void invalidateDeviceWorkspaces(queryClient);
    }
  });
};

export const useDeselectCollisionMatrixRowMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SelectCollisionMatrixEventInput) =>
      projectRepository.deselectCollisionMatrixRow(input).then(unwrapQueryResult),
    onSuccess: (_result, input) => {
      void invalidateCollisionMatrix(queryClient, input.matrixId);
      void invalidateDeviceWorkspaces(queryClient);
      void invalidateShareLinks(queryClient);
    }
  });
};

export const useDeselectCollisionMatrixColumnMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SelectCollisionMatrixEventInput) =>
      projectRepository.deselectCollisionMatrixColumn(input).then(unwrapQueryResult),
    onSuccess: (_result, input) => {
      void invalidateCollisionMatrix(queryClient, input.matrixId);
      void invalidateDeviceWorkspaces(queryClient);
      void invalidateShareLinks(queryClient);
    }
  });
};

export const useUpsertCollisionMatrixEntryMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpsertCollisionMatrixEntryInput) =>
      projectRepository.upsertCollisionMatrixEntry(input).then(unwrapQueryResult),
    onSuccess: (entry) => {
      void invalidateCollisionMatrix(queryClient, entry.matrixId);
      void invalidateDeviceWorkspaces(queryClient);
      void invalidateShareLinks(queryClient);
    }
  });
};

export const useDeleteCollisionMatrixEntryMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (collisionMatrixEntryId: CollisionMatrixEntryId) =>
      projectRepository.deleteCollisionMatrixEntry(collisionMatrixEntryId).then(unwrapQueryResult),
    onSuccess: () => {
      void invalidateCollisionMatrices(queryClient);
      void invalidateDeviceWorkspaces(queryClient);
      void invalidateShareLinks(queryClient);
    }
  });
};

export const useGenerateSharingLinkMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: GenerateSharingLinkInput) =>
      projectRepository.generateSharingLink(input).then(unwrapQueryResult),
    onSuccess: () => {
      void invalidateShareLinks(queryClient);
    }
  });
};

export const useDeleteSharingLinkMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sharingLinkId: SharingLinkId) =>
      projectRepository.deleteSharingLink(sharingLinkId).then(unwrapQueryResult),
    onSuccess: () => {
      void invalidateShareLinks(queryClient);
    }
  });
};
