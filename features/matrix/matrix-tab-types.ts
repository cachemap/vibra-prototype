import type {
  CollisionMatrixEntry,
  DeviceId,
  EventId,
  InterruptionRecovery,
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
  matrixPostInterruptionRecovery: InterruptionRecovery | null;
  matrixSystemInterruptionRecovery: InterruptionRecovery | null;
  matrixTargetEventId: string;
  onClearEntry: (entry: CollisionMatrixEntry, label: string) => void;
  onShareEntry: (entry: CollisionMatrixEntry, label: string) => void;
  selectedIncomingEventId: EventId | null;
  selectedPlayingEventId: EventId | null;
  setMatrixBehavior: (behavior: ResolutionBehaviorName) => void;
  setMatrixFilterAnchor: (anchor: MatrixFilterAnchor | null | ((current: MatrixFilterAnchor | null) => MatrixFilterAnchor | null)) => void;
  setMatrixFilterAxis: (axis: MatrixAxis) => void;
  setMatrixPostInterruptionRecovery: (recovery: InterruptionRecovery | null) => void;
  setMatrixSystemInterruptionRecovery: (recovery: InterruptionRecovery | null) => void;
  setMatrixTargetEventId: (eventId: string) => void;
  setSelectedIncomingEventId: (eventId: EventId | null) => void;
  setSelectedPlayingEventId: (eventId: EventId | null) => void;
};
