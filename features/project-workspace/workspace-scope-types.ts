import type { Dispatch, SetStateAction } from "react";
import type {
  AssetLibraryFolderId,
  AssetLibraryId,
  CollectionId,
  DeviceId,
  EventId,
  ProjectId,
  ResolutionBehaviorName
} from "@/domain";
import type { MatrixAxis } from "@/features/matrix/matrix-axis-filter";
import type { MatrixFilterAnchor } from "@/features/matrix/matrix-axis-filter-anchor";
import type { DeleteTarget } from "./delete-target";

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

export type MatrixSelection = {
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
