"use client";

import { MatrixAxisFilter, type MatrixAxis, type MatrixFilterCollection } from "./matrix-axis-filter";
import type { EventId } from "@/domain";

export type MatrixFilterAnchor = "playingAxis" | "incomingAxis" | "toolbar";

type MatrixAxisFilterAnchorProps = {
  activeAxis: MatrixAxis;
  anchor: MatrixFilterAnchor;
  collections: readonly MatrixFilterCollection[];
  incomingEventIds: ReadonlySet<EventId>;
  matrixFilterAnchor: MatrixFilterAnchor | null;
  onChangeAxis: (axis: MatrixAxis) => void;
  onClose: () => void;
  onToggleEvents: (axis: MatrixAxis, eventIds: readonly EventId[], nextSelected: boolean) => void;
  pending?: boolean;
  playingEventIds: ReadonlySet<EventId>;
};

export function MatrixAxisFilterAnchor({
  activeAxis,
  anchor,
  collections,
  incomingEventIds,
  matrixFilterAnchor,
  onChangeAxis,
  onClose,
  onToggleEvents,
  pending,
  playingEventIds
}: MatrixAxisFilterAnchorProps) {
  if (matrixFilterAnchor !== anchor) {
    return null;
  }

  return (
    <MatrixAxisFilter
      activeAxis={activeAxis}
      collections={collections}
      incomingEventIds={incomingEventIds}
      onChangeAxis={onChangeAxis}
      onClose={onClose}
      onToggleEvents={onToggleEvents}
      pending={pending}
      playingEventIds={playingEventIds}
    />
  );
}
