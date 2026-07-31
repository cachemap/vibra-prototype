"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowRight, GripVertical, MoreVertical, Trash2 } from "lucide-react";
import { Button, RowActionsMenu, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/primitives";
import type { EventId } from "@/domain";
import type { EventRowModel } from "./event-row-model";

type EventsTableProps = {
  eventRows: readonly EventRowModel[];
  onDeleteEvent: (event: { id: EventId; name: string }) => void;
  onOpenEvent: (eventId: EventId) => void;
  onReorder: (orderedEventIds: EventId[]) => void;
  reorderPending: boolean;
};

export function EventsTable({
  eventRows,
  onDeleteEvent,
  onOpenEvent,
  onReorder,
  reorderPending
}: EventsTableProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id || reorderPending) {
      return;
    }

    const oldIndex = eventRows.findIndex((row) => row.event.id === active.id);
    const newIndex = eventRows.findIndex((row) => row.event.id === over.id);

    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    const orderedEventIds = eventRows.map((row) => row.event.id);
    const [movedEventId] = orderedEventIds.splice(oldIndex, 1);

    if (!movedEventId) {
      return;
    }

    orderedEventIds.splice(newIndex, 0, movedEventId);
    onReorder(orderedEventIds);
  };

  return (
    <div className="hidden md:block">
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} sensors={sensors}>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell className="w-10 px-2">
                <span className="sr-only">Reorder</span>
              </TableHeaderCell>
              <TableHeaderCell>Event</TableHeaderCell>
              <TableHeaderCell>Event type</TableHeaderCell>
              <TableHeaderCell>Interactions</TableHeaderCell>
              <TableHeaderCell>Scheduled playbacks</TableHeaderCell>
              <TableHeaderCell className="w-24" />
            </TableRow>
          </TableHead>
          <SortableContext items={eventRows.map((row) => row.event.id)} strategy={verticalListSortingStrategy}>
            <TableBody>
              {eventRows.map((row) => (
                <SortableEventRow
                  key={row.event.id}
                  onDeleteEvent={onDeleteEvent}
                  onOpenEvent={onOpenEvent}
                  reorderPending={reorderPending}
                  row={row}
                />
              ))}
            </TableBody>
          </SortableContext>
        </Table>
      </DndContext>
    </div>
  );
}

type SortableEventRowProps = Omit<EventsTableProps, "eventRows" | "onReorder"> & {
  row: EventRowModel;
};

function SortableEventRow({ onDeleteEvent, onOpenEvent, reorderPending, row }: SortableEventRowProps) {
  const { attributes, isDragging, listeners, setActivatorNodeRef, setNodeRef, transform, transition } = useSortable({
    disabled: reorderPending,
    id: row.event.id
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <TableRow
      className={`relative hover:bg-gray-50 motion-safe:transition-[transform,opacity,box-shadow] motion-reduce:!transition-none${
        isDragging ? " z-10 bg-gray-25 opacity-80 shadow-lg" : ""
      }`}
      data-testid={`event-row-${row.event.id}`}
      ref={setNodeRef}
      style={style}
    >
      <TableCell className="w-10 px-2">
        <button
          aria-label={`Reorder ${row.event.name}`}
          className="flex size-7 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-purple-500/40 disabled:cursor-not-allowed disabled:text-gray-400"
          disabled={reorderPending}
          ref={setActivatorNodeRef}
          type="button"
          {...attributes}
          {...listeners}
        >
          <GripVertical aria-hidden="true" className="size-4" />
        </button>
      </TableCell>
      <TableCell className="font-medium">
        <button
          className="grid w-full min-w-0 gap-0.5 text-left text-gray-700"
          onClick={() => onOpenEvent(row.event.id)}
          type="button"
        >
          <span className="truncate">{row.event.name}</span>
        </button>
      </TableCell>
      <TableCell>
        <span className="inline-flex h-[22px] items-center rounded-lg border border-gray-300 bg-gray-25 px-2 text-xs font-medium text-gray-700">
          {row.event.eventType}
        </span>
      </TableCell>
      <TableCell>
        {row.triggerCount ? `${row.triggerCount} bound` : <span className="text-gray-500">Unset</span>}
      </TableCell>
      <TableCell>{row.playbackCount ? `${row.playbackCount} scheduled` : "0 scheduled"}</TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-1">
          <Button
            onClick={() => onOpenEvent(row.event.id)}
            rightIcon={<ArrowRight className="size-4" />}
            size="compact"
          >
            Open
          </Button>
          <RowActionsMenu
            grouped
            icon={MoreVertical}
            items={[
              {
                destructive: true,
                icon: <Trash2 aria-hidden="true" className="size-4" />,
                label: "Delete event",
                onSelect: () => onDeleteEvent(row.event)
              }
            ]}
            label={`Open actions for ${row.event.name}`}
            size="compact"
          />
        </div>
      </TableCell>
    </TableRow>
  );
}
