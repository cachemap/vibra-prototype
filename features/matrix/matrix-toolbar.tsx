"use client";

import { Grid2X2, Link2, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/primitives";
import type { CollisionMatrixEntry } from "@/domain";
import { MatrixAxisFilterAnchor, type MatrixFilterAnchor } from "./matrix-axis-filter-anchor";
import type { MatrixAxis, MatrixFilterCollection } from "./matrix-axis-filter";
import type { EventId } from "@/domain";

type MatrixToolbarProps = {
  collections: readonly MatrixFilterCollection[];
  coverage: number;
  deviceName: string;
  incomingEventIds: ReadonlySet<EventId>;
  matrixFilterAnchor: MatrixFilterAnchor | null;
  matrixFilterAxis: MatrixAxis;
  onChangeAxis: (axis: MatrixAxis) => void;
  onCloseFilter: () => void;
  onOpenFilter: (anchor: MatrixFilterAnchor, axis: MatrixAxis) => void;
  onShareEntry: () => void;
  onToggleEvents: (axis: MatrixAxis, eventIds: readonly EventId[], nextSelected: boolean) => void;
  pending?: boolean;
  playingEventIds: ReadonlySet<EventId>;
  selectedEntry: CollisionMatrixEntry | undefined;
};

export function MatrixToolbar({
  collections,
  coverage,
  deviceName,
  incomingEventIds,
  matrixFilterAnchor,
  matrixFilterAxis,
  onChangeAxis,
  onCloseFilter,
  onOpenFilter,
  onShareEntry,
  onToggleEvents,
  pending,
  playingEventIds,
  selectedEntry
}: MatrixToolbarProps) {
  return (
    <div className="flex min-h-[34px] flex-wrap items-center justify-between gap-3">
      <div>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Grid2X2 className="size-4 text-gray-500" />
          Collision Matrix
        </h3>
        <p className="text-xs text-gray-500">
          Candidates come from events on {deviceName}. Coverage is {coverage}%.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          disabled={!selectedEntry}
          leftIcon={<Link2 className="size-4" />}
          onClick={onShareEntry}
        >
          Share entry
        </Button>
        <div className="relative">
          <Button
            aria-expanded={matrixFilterAnchor === "toolbar"}
            leftIcon={<SlidersHorizontal className="size-4" />}
            onClick={() => onOpenFilter("toolbar", matrixFilterAxis)}
          >
            Filters
          </Button>
          <div className="absolute right-0 top-10 z-40">
            <MatrixAxisFilterAnchor
              activeAxis={matrixFilterAxis}
              anchor="toolbar"
              collections={collections}
              incomingEventIds={incomingEventIds}
              matrixFilterAnchor={matrixFilterAnchor}
              onChangeAxis={onChangeAxis}
              onClose={onCloseFilter}
              onToggleEvents={onToggleEvents}
              pending={pending}
              playingEventIds={playingEventIds}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
