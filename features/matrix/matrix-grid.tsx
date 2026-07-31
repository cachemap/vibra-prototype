"use client";

import { Fragment, useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { Button, EmptyState } from "@/components/primitives";
import type {
  CollisionMatrixColumn,
  CollisionMatrixEntry,
  CollisionMatrixRow,
  Event,
  EventId
} from "@/domain";
import {
  behaviorBubbleClass,
  behaviorCellClass,
  behaviorCopy,
  behaviorIconFor
} from "./behavior";
import { MatrixAxisFilterAnchor, type MatrixFilterAnchor } from "./matrix-axis-filter-anchor";
import type { MatrixAxis, MatrixFilterCollection } from "./matrix-axis-filter";

const matrixRowHeaderWidth = "168px";

export const matrixEntryKeyFor = (playingEventId: EventId, incomingEventId: EventId) =>
  `${playingEventId}:${incomingEventId}`;

type MatrixGridProps = {
  collections: readonly MatrixFilterCollection[];
  columns: readonly CollisionMatrixColumn[];
  entries: readonly CollisionMatrixEntry[];
  eventById: ReadonlyMap<EventId, Event>;
  incomingEventIds: ReadonlySet<EventId>;
  matrixFilterAnchor: MatrixFilterAnchor | null;
  matrixFilterAxis: MatrixAxis;
  onChangeAxis: (axis: MatrixAxis) => void;
  onCloseFilter: () => void;
  onIncomingEventIdChange: (eventId: EventId) => void;
  onOpenFilter: (anchor: MatrixFilterAnchor, axis: MatrixAxis) => void;
  onPlayingEventIdChange: (eventId: EventId) => void;
  onSelectCell: (playingEventId: EventId, incomingEventId: EventId) => void;
  onToggleEvents: (axis: MatrixAxis, eventIds: readonly EventId[], nextSelected: boolean) => void;
  pending?: boolean;
  playingEventIds: ReadonlySet<EventId>;
  rows: readonly CollisionMatrixRow[];
  selectedIncomingEventId: EventId | null;
  selectedPlayingEventId: EventId | null;
};

export function MatrixGrid({
  collections,
  columns,
  entries,
  eventById,
  incomingEventIds,
  matrixFilterAnchor,
  matrixFilterAxis,
  onChangeAxis,
  onCloseFilter,
  onIncomingEventIdChange,
  onOpenFilter,
  onPlayingEventIdChange,
  onSelectCell,
  onToggleEvents,
  pending,
  playingEventIds,
  rows,
  selectedIncomingEventId,
  selectedPlayingEventId
}: MatrixGridProps) {
  const entryByPair = useMemo(
    () => new Map(entries.map((entry) => [matrixEntryKeyFor(entry.playingEventId, entry.incomingEventId), entry])),
    [entries]
  );

  return (
    <div
      className="grid max-h-[calc(100vh-580px)] min-h-[200px] grid-rows-[auto_1fr] border-y border-gray-300 bg-gray-50"
      data-testid="collision-matrix-grid"
    >
      <div
        className="grid items-center border-b border-gray-200 bg-gray-100"
        style={{ gridTemplateColumns: `${matrixRowHeaderWidth} 1fr` }}
      >
        <div className="relative flex h-12 items-center border-r border-gray-200 px-2">
          <Button
            aria-expanded={matrixFilterAnchor === "playingAxis"}
            onClick={() => onOpenFilter("playingAxis", "playing")}
            rightIcon={<ChevronDown className="size-4" />}
          >
            Playing
          </Button>
          <div className="absolute left-2 top-12 z-40">
            <MatrixAxisFilterAnchor
              activeAxis={matrixFilterAxis}
              anchor="playingAxis"
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
        <div className="relative flex h-12 min-w-0 items-center justify-center px-2">
          <Button
            aria-expanded={matrixFilterAnchor === "incomingAxis"}
            onClick={() => onOpenFilter("incomingAxis", "incoming")}
            rightIcon={<ChevronDown className="size-4" />}
          >
            Incoming
          </Button>
          <div className="absolute left-1/2 top-12 z-40 -translate-x-1/2">
            <MatrixAxisFilterAnchor
              activeAxis={matrixFilterAxis}
              anchor="incomingAxis"
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

      {rows.length > 0 && columns.length > 0 ? (
        <div className="grid min-h-0 overflow-hidden">
          <div className="grid min-h-0">
            <div className="min-h-0 overflow-auto overscroll-x-contain">
              <div
                className="grid min-w-full content-start"
                style={{
                  gridTemplateColumns: `${matrixRowHeaderWidth} repeat(${columns.length}, minmax(119px, 1fr))`
                }}
              >
                <div className="sticky left-0 top-0 z-30 h-10 border border-gray-200 bg-gray-100 shadow-[1px_0_0_rgb(var(--gray-200))]" />
                {columns.map((column) => (
                  <button
                    className={`sticky top-0 z-20 flex h-10 items-center justify-center border border-gray-200 px-2 text-center text-xs font-semibold ${
                      selectedIncomingEventId === column.eventId
                        ? "bg-gray-200 text-gray-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                    key={column.eventId}
                    onClick={() => onIncomingEventIdChange(column.eventId)}
                    type="button"
                  >
                    <span className="line-clamp-2">
                      {eventById.get(column.eventId)?.name}
                    </span>
                  </button>
                ))}
                {rows.map((row) => (
                  <Fragment key={row.eventId}>
                    <button
                      className={`sticky left-0 z-10 h-10 border border-gray-200 px-2 text-left text-xs font-semibold shadow-[1px_0_0_rgb(var(--gray-200))] ${
                        selectedPlayingEventId === row.eventId
                          ? "bg-gray-200 text-gray-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                      onClick={() => onPlayingEventIdChange(row.eventId)}
                      type="button"
                    >
                      <span className="block truncate">{eventById.get(row.eventId)?.name}</span>
                    </button>
                    {columns.map((column) => {
                      const entry = entryByPair.get(matrixEntryKeyFor(row.eventId, column.eventId));
                      const selected =
                        selectedPlayingEventId === row.eventId &&
                        selectedIncomingEventId === column.eventId;
                      const highlighted =
                        selected ||
                        selectedPlayingEventId === row.eventId ||
                        selectedIncomingEventId === column.eventId;
                      const BehaviorIcon = entry
                        ? behaviorIconFor(entry.resolutionBehavior.behaviorName)
                        : null;

                      return (
                        <button
                          aria-label={
                            entry
                              ? `${entry.resolutionBehavior.behaviorName}: ${
                                  eventById.get(row.eventId)?.name ?? "playing event"
                                } when ${
                                  eventById.get(column.eventId)?.name ?? "incoming event"
                                } arrives`
                              : `Unset: ${eventById.get(row.eventId)?.name ?? "playing event"} when ${
                                  eventById.get(column.eventId)?.name ?? "incoming event"
                                } arrives`
                          }
                          className={`flex h-10 w-full items-center justify-center border border-gray-200 px-1.5 text-xs font-medium tabular-nums ${
                            highlighted ? "bg-gray-200" : "bg-gray-25"
                          } ${behaviorCellClass(entry, selected)}`}
                          key={`${row.eventId}-${column.eventId}`}
                          onClick={() => onSelectCell(row.eventId, column.eventId)}
                          type="button"
                        >
                          {entry && BehaviorIcon ? (
                            <span
                              className={`inline-flex h-6 max-w-full items-center gap-1 rounded-lg border px-2 ${behaviorBubbleClass(
                                entry,
                                selected
                              )}`}
                              title={behaviorCopy[entry.resolutionBehavior.behaviorName]}
                            >
                              <BehaviorIcon
                                aria-hidden="true"
                                className="size-3.5 shrink-0"
                                strokeWidth={1.8}
                              />
                              <span className="truncate">
                                {entry.resolutionBehavior.behaviorName === "Not possible"
                                  ? "N/A"
                                  : entry.resolutionBehavior.behaviorName}
                              </span>
                            </span>
                          ) : (
                            <span className="text-gray-500" title="Unset">
                              -
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <EmptyState
          title="Select matrix rows and columns"
          description="Add at least one playing row and incoming column to expose matrix cells."
        />
      )}
    </div>
  );
}
