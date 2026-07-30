"use client";

import { Check, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Popover, Switch } from "@/components/primitives";
import { cx, focusRing } from "@/components/primitives/class-names";
import type { CollectionId, EventId } from "@/domain";

export type MatrixAxis = "playing" | "incoming";

export type MatrixFilterEvent = {
  id: EventId;
  name: string;
};

export type MatrixFilterCollection = {
  events: readonly MatrixFilterEvent[];
  id: CollectionId;
  name: string;
};

type SelectionState = "all" | "none" | "partial";

const axisNoun: Record<MatrixAxis, string> = {
  playing: "playing row",
  incoming: "incoming column"
};

const axisNounPlural: Record<MatrixAxis, string> = {
  playing: "playing rows",
  incoming: "incoming columns"
};

const axisLabel: Record<MatrixAxis, string> = {
  playing: "Playing",
  incoming: "Incoming"
};

const selectionStateFor = (
  events: readonly MatrixFilterEvent[],
  selectedEventIds: ReadonlySet<EventId>
): SelectionState => {
  if (events.length === 0) {
    return "none";
  }

  const selectedCount = events.filter((event) => selectedEventIds.has(event.id)).length;

  if (selectedCount === 0) {
    return "none";
  }

  return selectedCount === events.length ? "all" : "partial";
};

type SelectionBubbleProps = {
  disabled?: boolean;
  label: string;
  onToggle: () => void;
  state: SelectionState;
};

function SelectionBubble({ disabled = false, label, onToggle, state }: SelectionBubbleProps) {
  return (
    <button
      aria-checked={state === "all" ? "true" : state === "partial" ? "mixed" : "false"}
      aria-label={label}
      className={cx(
        "inline-flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
        focusRing,
        state === "all"
          ? "border-purple-500 bg-purple-500 text-gray-25 hover:border-purple-600 hover:bg-purple-600"
          : state === "partial"
            ? "border-purple-500 text-transparent"
            : "border-gray-300 bg-gray-25 text-transparent hover:border-gray-400",
        disabled ? "cursor-not-allowed opacity-60" : null
      )}
      disabled={disabled}
      onClick={onToggle}
      role="checkbox"
      style={
        state === "partial"
          ? { backgroundImage: "linear-gradient(90deg, #7A5AF8 50%, #FDFDFD 50%)" }
          : undefined
      }
      title={label}
      type="button"
    >
      <Check aria-hidden="true" className="size-3" strokeWidth={2.4} />
    </button>
  );
}

type MatrixAxisFilterProps = {
  activeAxis: MatrixAxis;
  className?: string;
  collections: readonly MatrixFilterCollection[];
  incomingEventIds: ReadonlySet<EventId>;
  onChangeAxis: (axis: MatrixAxis) => void;
  onClose: () => void;
  onToggleEvents: (axis: MatrixAxis, eventIds: readonly EventId[], nextSelected: boolean) => void;
  pending?: boolean;
  playingEventIds: ReadonlySet<EventId>;
};

export function MatrixAxisFilter({
  activeAxis,
  className,
  collections,
  incomingEventIds,
  onChangeAxis,
  onClose,
  onToggleEvents,
  pending = false,
  playingEventIds
}: MatrixAxisFilterProps) {
  const [collapsedCollectionIds, setCollapsedCollectionIds] = useState<ReadonlySet<CollectionId>>(
    new Set()
  );

  const selectedEventIds = activeAxis === "playing" ? playingEventIds : incomingEventIds;
  const allEvents = collections.flatMap((collection) => collection.events);
  const allSelectionState = selectionStateFor(allEvents, selectedEventIds);

  const toggleCollapsed = (collectionId: CollectionId) => {
    setCollapsedCollectionIds((current) => {
      const next = new Set(current);

      if (next.has(collectionId)) {
        next.delete(collectionId);
      } else {
        next.add(collectionId);
      }

      return next;
    });
  };

  return (
    <>
      <button
        aria-label="Close matrix filters"
        className="fixed inset-0 z-30 cursor-default"
        onClick={onClose}
        tabIndex={-1}
        type="button"
      />
      <Popover
        className={cx("relative z-40 w-[336px] max-w-[calc(100vw-32px)] p-3", className)}
        open
      >
        <div
          className="grid gap-3"
          data-testid="matrix-axis-filter"
          onKeyDown={(keyboardEvent) => {
            if (keyboardEvent.key === "Escape") {
              onClose();
            }
          }}
          role="group"
        >
          <p className="text-sm font-semibold text-gray-700">Filters</p>

          <div className="inline-flex items-center gap-1" role="tablist">
            {(["playing", "incoming"] as const).map((axis) => (
              <button
                aria-selected={axis === activeAxis}
                className={cx(
                  "h-8 rounded-full px-3 text-sm font-medium transition-colors",
                  focusRing,
                  axis === activeAxis
                    ? "bg-gray-200 text-gray-700"
                    : "text-gray-500 hover:bg-gray-100"
                )}
                key={axis}
                onClick={() => onChangeAxis(axis)}
                role="tab"
                type="button"
              >
                {axisLabel[axis]}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-gray-200 pt-3">
            <span className="text-sm text-gray-500">Collections</span>
            <Switch
              checked={allSelectionState === "all"}
              className="flex-row-reverse text-gray-600"
              disabled={pending || allEvents.length === 0}
              id={`matrix-filter-all-${activeAxis}`}
              label="All"
              onChange={(changeEvent) =>
                onToggleEvents(
                  activeAxis,
                  allEvents.map((event) => event.id),
                  changeEvent.currentTarget.checked
                )
              }
            />
          </div>

          <div className="grid max-h-72 content-start gap-0.5 overflow-y-auto">
            {collections.length === 0 ? (
              <p className="px-1 py-2 text-sm text-gray-500">
                This device has no collections with events yet.
              </p>
            ) : null}

            {collections.map((collection) => {
              const collapsed = collapsedCollectionIds.has(collection.id);
              const collectionState = selectionStateFor(collection.events, selectedEventIds);
              const ChevronIcon = collapsed ? ChevronRight : ChevronDown;

              return (
                <div className="grid gap-0.5" key={collection.id}>
                  <div className="flex h-9 items-center gap-1 rounded-lg px-1 hover:bg-gray-100">
                    <button
                      aria-expanded={!collapsed}
                      aria-label={`${collapsed ? "Expand" : "Collapse"} ${collection.name}`}
                      className={cx(
                        "inline-flex size-5 shrink-0 items-center justify-center rounded-lg text-gray-500",
                        focusRing
                      )}
                      onClick={() => toggleCollapsed(collection.id)}
                      type="button"
                    >
                      <ChevronIcon aria-hidden="true" className="size-4" strokeWidth={1.8} />
                    </button>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-700">
                      {collection.name}
                    </span>
                    <SelectionBubble
                      disabled={pending || collection.events.length === 0}
                      label={`Toggle ${axisNounPlural[activeAxis]} in ${collection.name}`}
                      onToggle={() =>
                        onToggleEvents(
                          activeAxis,
                          collection.events.map((event) => event.id),
                          collectionState !== "all"
                        )
                      }
                      state={collectionState}
                    />
                  </div>

                  {collapsed
                    ? null
                    : collection.events.map((event) => {
                        const selected = selectedEventIds.has(event.id);

                        return (
                          <div
                            className="flex h-9 items-center gap-2 rounded-lg pl-7 pr-1 hover:bg-gray-100"
                            key={event.id}
                          >
                            <span className="min-w-0 flex-1 truncate text-sm text-gray-600">
                              {event.name}
                            </span>
                            <SelectionBubble
                              disabled={pending}
                              label={`Toggle ${axisNoun[activeAxis]} ${event.name}`}
                              onToggle={() => onToggleEvents(activeAxis, [event.id], !selected)}
                              state={selected ? "all" : "none"}
                            />
                          </div>
                        );
                      })}
                </div>
              );
            })}
          </div>
        </div>
      </Popover>
    </>
  );
}
