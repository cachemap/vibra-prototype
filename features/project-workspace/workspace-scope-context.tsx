"use client";

import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  asEntityId,
  type AssetId,
  type AssetLibraryFolderId,
  type AssetLibraryId,
  type CollectionId,
  type CollisionMatrixEntryId,
  type DeviceId,
  type EventId,
  type ProjectId,
  type ResolutionBehaviorName
} from "@/domain";
import type { DeviceSummary } from "@/data/repositories/project-repository";
import { useAssetLibraryTreeQuery, useProjectWorkspaceQuery } from "@/features/projects/queries";
import { useFeedbackActions } from "@/features/feedback/feedback-context";
import { hrefWithParams } from "@/lib/search-params";
import type { MatrixAxis } from "@/features/matrix/matrix-axis-filter";
import type { MatrixFilterAnchor } from "@/features/matrix/matrix-axis-filter-anchor";

export type ProjectWorkspaceTab = "events" | "assets" | "matrix";

export type ProjectDialogRequest =
  | "device"
  | "collection"
  | "editCollection"
  | "event"
  | "assetFolder"
  | "asset"
  | "libraryImport"
  | "share";

export type DeleteTarget =
  | { kind: "project"; id: ProjectId; name: string }
  | { kind: "device"; id: DeviceId; name: string }
  | { kind: "collection"; id: CollectionId; name: string }
  | { kind: "event"; id: EventId; name: string }
  | { counts: { assets: number; folders: number }; kind: "assetFolder"; id: AssetLibraryFolderId; name: string }
  | { kind: "asset"; id: AssetId; name: string }
  | { kind: "matrixEntry"; id: CollisionMatrixEntryId; name: string };

type MatrixSelection = {
  matrixBehavior: ResolutionBehaviorName;
  matrixFilterAnchor: MatrixFilterAnchor | null;
  matrixFilterAxis: MatrixAxis;
  matrixIncomingEventId: EventId | null;
  matrixPlayingEventId: EventId | null;
  matrixTargetEventId: string;
};

export type ProjectWorkspaceSelection = MatrixSelection & {
  activeAssetFolderId: AssetLibraryFolderId | null;
  activeAssetLibraryId: AssetLibraryId | null;
  activeTab: ProjectWorkspaceTab;
  collectionId: CollectionId | null;
  deviceId: DeviceId | null;
  projectId: ProjectId;
  searchTerm: string;
};

export type ProjectWorkspaceActions = {
  goToCollection: (collectionId: CollectionId) => void;
  goToDevice: (deviceId: DeviceId | null) => void;
  goToEvent: (eventId: EventId) => void;
  openDialog: (request: ProjectDialogRequest) => void;
  requestDelete: (target: DeleteTarget) => void;
  selectAssetFolder: (folderId: AssetLibraryFolderId | null) => void;
  selectAssetLibrary: (libraryId: AssetLibraryId) => void;
  setActiveTab: (tab: ProjectWorkspaceTab) => void;
  setDeleteTarget: Dispatch<SetStateAction<DeleteTarget | null>>;
  setDialogRequest: Dispatch<SetStateAction<ProjectDialogRequest | null>>;
  setMatrixSelection: (next: Partial<MatrixSelection>) => void;
  setSearchTerm: (term: string) => void;
};

const SelectionContext = createContext<ProjectWorkspaceSelection | null>(null);
const ActionsContext = createContext<ProjectWorkspaceActions | null>(null);
const DialogContext = createContext<ProjectDialogRequest | null>(null);
const DeleteContext = createContext<DeleteTarget | null>(null);

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
    if ("matrixPlayingEventId" in next) {
      setMatrixPlayingEventId(next.matrixPlayingEventId ?? null);
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
      matrixPlayingEventId,
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
      matrixPlayingEventId,
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

export function useProjectWorkspaceSelection() {
  const value = useContext(SelectionContext);

  if (!value) {
    throw new Error("useProjectWorkspaceSelection must be used within ProjectWorkspaceScopeProvider.");
  }

  return value;
}

export function useProjectWorkspaceActions() {
  const value = useContext(ActionsContext);

  if (!value) {
    throw new Error("useProjectWorkspaceActions must be used within ProjectWorkspaceScopeProvider.");
  }

  return value;
}

export function useProjectDialogRequest() {
  return useContext(DialogContext);
}

export function useProjectDeleteTarget() {
  return useContext(DeleteContext);
}
