"use client";

import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  asEntityId,
  type AssetLibraryFolderId,
  type AssetLibraryId,
  type CollectionId,
  type DeviceId,
  type EventId,
  type InterruptionRecovery,
  type ResolutionBehaviorName
} from "@/domain";
import type { ProjectId } from "@/domain";
import type { DeviceSummary } from "@/data/repositories/project-repository";
import { useAssetLibraryTreeQuery, useProjectWorkspaceQuery } from "@/features/projects/queries";
import { useFeedbackActions } from "@/features/feedback/feedback-context";
import { hrefWithParams } from "@/lib/search-params";
import type { MatrixAxis } from "@/features/matrix/matrix-axis-filter";
import type { MatrixFilterAnchor } from "@/features/matrix/matrix-axis-filter-anchor";
import type { DeleteTarget } from "./delete-target";
import type {
  MatrixSelection,
  ProjectDialogRequest,
  ProjectWorkspaceActions,
  ProjectWorkspaceSelection,
  ProjectWorkspaceTab
} from "./workspace-scope-types";
import {
  ActionsContext,
  DeleteContext,
  DialogContext,
  SelectionContext
} from "./workspace-scope-hooks";

export type {
  ProjectDialogRequest,
  ProjectWorkspaceActions,
  ProjectWorkspaceSelection,
  ProjectWorkspaceTab
} from "./workspace-scope-types";
export {
  useProjectDeleteTarget,
  useProjectDialogRequest,
  useProjectWorkspaceActions,
  useProjectWorkspaceSelection
} from "./workspace-scope-hooks";

type ProjectWorkspaceScopeProviderProps = {
  children: ReactNode;
  projectId: ProjectId;
};

export function ProjectWorkspaceScopeProvider({ children, projectId }: ProjectWorkspaceScopeProviderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clearFeedback } = useFeedbackActions();
  const workspaceQuery = useProjectWorkspaceQuery(projectId);
  const [dialog, setDialog] = useState<ProjectDialogRequest | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [activeTab, setActiveTab] = useState<ProjectWorkspaceTab>("events");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAssetLibraryId, setSelectedAssetLibraryId] = useState<AssetLibraryId | null>(null);
  const [selectedAssetFolderId, setSelectedAssetFolderId] = useState<AssetLibraryFolderId | null>(null);
  const [matrixPlayingEventId, setMatrixPlayingEventId] = useState<EventId | null>(null);
  const [matrixIncomingEventId, setMatrixIncomingEventId] = useState<EventId | null>(null);
  const [matrixBehavior, setMatrixBehavior] = useState<ResolutionBehaviorName>("Preempt");
  const [matrixTargetEventId, setMatrixTargetEventId] = useState("");
  const [matrixPostInterruptionRecovery, setMatrixPostInterruptionRecovery] =
    useState<InterruptionRecovery | null>("Stay stopped");
  const [matrixSystemInterruptionRecovery, setMatrixSystemInterruptionRecovery] =
    useState<InterruptionRecovery | null>("Stay stopped");
  const [matrixFilterAnchor, setMatrixFilterAnchor] = useState<MatrixFilterAnchor | null>(null);
  const [matrixFilterAxis, setMatrixFilterAxis] = useState<MatrixAxis>("playing");

  const projectAssetLibraryIds = useMemo(() => {
    const workspace = workspaceQuery.data;

    if (!workspace) {
      return [];
    }

    return [
      workspace.defaultAssetLibrary.id,
      ...workspace.importedAssetLibraries.map((library) => library.id)
    ];
  }, [workspaceQuery.data]);
  const activeAssetLibraryId = useMemo(() => {
    if (selectedAssetLibraryId && projectAssetLibraryIds.includes(selectedAssetLibraryId)) {
      return selectedAssetLibraryId;
    }

    return projectAssetLibraryIds[0] ?? null;
  }, [projectAssetLibraryIds, selectedAssetLibraryId]);

  const assetTreeQuery = useAssetLibraryTreeQuery(activeAssetLibraryId);
  const selectedDeviceId = useMemo(() => {
    const devices = workspaceQuery.data?.devices ?? [];
    const selectedDeviceParam = searchParams.get("device");

    if (selectedDeviceParam) {
      const matched = devices.find((summary: DeviceSummary) => summary.device.id === selectedDeviceParam);

      if (matched) {
        return matched.device.id;
      }
    }

    return devices[0]?.device.id ?? null;
  }, [searchParams, workspaceQuery.data?.devices]);
  const selectedCollectionId = useMemo(() => {
    const selectedCollectionParam = searchParams.get("collection");

    return selectedCollectionParam ? asEntityId<CollectionId>(selectedCollectionParam) : null;
  }, [searchParams]);

  const resolvedAssetFolderId = useMemo(() => {
    if (!assetTreeQuery.data) {
      return selectedAssetFolderId;
    }

    return selectedAssetFolderId ?? assetTreeQuery.data.rootFolder.folder.id;
  }, [assetTreeQuery.data, selectedAssetFolderId]);

  const navRef = useRef({ projectId, router, searchParams, selectedCollectionId, selectedDeviceId });

  useEffect(() => {
    navRef.current = { projectId, router, searchParams, selectedCollectionId, selectedDeviceId };
  }, [projectId, router, searchParams, selectedCollectionId, selectedDeviceId]);

  // Provider children are passed through, not rendered inline, so provider state changes can bail out
  // for non-consuming subtrees. The ref is updated after render and read only inside later callbacks.
  const goToDevice = useCallback((deviceId: DeviceId | null) => {
    const nav = navRef.current;
    nav.router.push(`/projects/${nav.projectId}${hrefWithParams("", nav.searchParams, { device: deviceId, collection: null })}`);
  }, []);

  const goToCollection = useCallback((collectionId: CollectionId) => {
    const nav = navRef.current;
    nav.router.push(`/projects/${nav.projectId}${hrefWithParams("", nav.searchParams, { collection: collectionId })}`);
  }, []);

  const goToEvent = useCallback((eventId: EventId) => {
    const nav = navRef.current;

    nav.router.push(
      `/projects/${nav.projectId}/events/${eventId}${hrefWithParams("", nav.searchParams, {
        collection: nav.selectedCollectionId,
        device: nav.selectedDeviceId
      })}`
    );
  }, []);

  const openDialog = useCallback((request: ProjectDialogRequest) => {
    clearFeedback();
    setDialog(request);
  }, [clearFeedback]);

  const requestDelete = useCallback((target: DeleteTarget) => {
    clearFeedback();
    setDeleteTarget(target);
  }, [clearFeedback]);

  const selectAssetLibrary = useCallback((libraryId: AssetLibraryId) => {
    setSelectedAssetLibraryId(libraryId);
    setSelectedAssetFolderId(null);
  }, []);

  const setMatrixSelection = useCallback((next: Partial<MatrixSelection>) => {
    if ("matrixBehavior" in next && next.matrixBehavior) {
      setMatrixBehavior(next.matrixBehavior);
    }
    if ("matrixFilterAnchor" in next) {
      setMatrixFilterAnchor(next.matrixFilterAnchor ?? null);
    }
    if ("matrixFilterAxis" in next && next.matrixFilterAxis) {
      setMatrixFilterAxis(next.matrixFilterAxis);
    }
    if ("matrixIncomingEventId" in next) {
      setMatrixIncomingEventId(next.matrixIncomingEventId ?? null);
    }
    if ("matrixPostInterruptionRecovery" in next) {
      setMatrixPostInterruptionRecovery(next.matrixPostInterruptionRecovery ?? null);
    }
    if ("matrixPlayingEventId" in next) {
      setMatrixPlayingEventId(next.matrixPlayingEventId ?? null);
    }
    if ("matrixSystemInterruptionRecovery" in next) {
      setMatrixSystemInterruptionRecovery(next.matrixSystemInterruptionRecovery ?? null);
    }
    if ("matrixTargetEventId" in next && typeof next.matrixTargetEventId === "string") {
      setMatrixTargetEventId(next.matrixTargetEventId);
    }
  }, []);

  const selection = useMemo<ProjectWorkspaceSelection>(
    () => ({
      activeAssetFolderId: resolvedAssetFolderId,
      activeAssetLibraryId,
      activeTab,
      collectionId: selectedCollectionId,
      deviceId: selectedDeviceId,
      matrixBehavior,
      matrixFilterAnchor,
      matrixFilterAxis,
      matrixIncomingEventId,
      matrixPostInterruptionRecovery,
      matrixPlayingEventId,
      matrixSystemInterruptionRecovery,
      matrixTargetEventId,
      projectId,
      searchTerm
    }),
    [
      activeAssetLibraryId,
      activeTab,
      matrixBehavior,
      matrixFilterAnchor,
      matrixFilterAxis,
      matrixIncomingEventId,
      matrixPostInterruptionRecovery,
      matrixPlayingEventId,
      matrixSystemInterruptionRecovery,
      matrixTargetEventId,
      projectId,
      resolvedAssetFolderId,
      searchTerm,
      selectedCollectionId,
      selectedDeviceId
    ]
  );

  const actions = useMemo<ProjectWorkspaceActions>(
    () => ({
      goToCollection,
      goToDevice,
      goToEvent,
      openDialog,
      requestDelete,
      selectAssetFolder: setSelectedAssetFolderId,
      selectAssetLibrary,
      setActiveTab,
      setDeleteTarget,
      setDialogRequest: setDialog,
      setMatrixSelection,
      setSearchTerm
    }),
    [goToCollection, goToDevice, goToEvent, openDialog, requestDelete, selectAssetLibrary, setMatrixSelection]
  );

  return (
    <SelectionContext.Provider value={selection}>
      <ActionsContext.Provider value={actions}>
        <DialogContext.Provider value={dialog}>
          <DeleteContext.Provider value={deleteTarget}>{children}</DeleteContext.Provider>
        </DialogContext.Provider>
      </ActionsContext.Provider>
    </SelectionContext.Provider>
  );
}
