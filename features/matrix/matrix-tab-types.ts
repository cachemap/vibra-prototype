import type {
  CollisionMatrixEntry,
  DeviceId,
  EventId,
  ResolutionBehaviorName
} from "@/domain";
import type { MatrixAxis } from "./matrix-axis-filter";
import type { MatrixFilterAnchor } from "./matrix-axis-filter-anchor";

export type MatrixTabProps = {
  deviceId: DeviceId;
  deviceName: string;
  matrixBehavior: ResolutionBehaviorName;
  matrixFilterAnchor: MatrixFilterAnchor | null;
  matrixFilterAxis: MatrixAxis;
  matrixTargetEventId: string;
  onClearEntry: (entry: CollisionMatrixEntry, label: string) => void;
  onShareEntry: (entry: CollisionMatrixEntry, label: string) => void;
  selectedIncomingEventId: EventId | null;
  selectedPlayingEventId: EventId | null;
  setMatrixBehavior: (behavior: ResolutionBehaviorName) => void;
  setMatrixFilterAnchor: (anchor: MatrixFilterAnchor | null | ((current: MatrixFilterAnchor | null) => MatrixFilterAnchor | null)) => void;
  setMatrixFilterAxis: (axis: MatrixAxis) => void;
  setMatrixTargetEventId: (eventId: string) => void;
  setSelectedIncomingEventId: (eventId: EventId | null) => void;
  setSelectedPlayingEventId: (eventId: EventId | null) => void;
};
