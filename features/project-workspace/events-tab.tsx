import { Edit3, Plus, Trash2 } from "lucide-react";
import { Button, EmptyState } from "@/components/primitives";
import type { Collection, EventId } from "@/domain";
import type { DeviceSummary } from "@/data/repositories/project-repository";
import type { EventRowModel } from "./event-row-model";
import { EventsCards } from "./events-cards";
import { EventsTable } from "./events-table";

type EventsTabProps = {
  eventRows: readonly EventRowModel[];
  onAddCollection: () => void;
  onAddEvent: () => void;
  onDeleteCollection: () => void;
  onDeleteEvent: (event: { id: EventId; name: string }) => void;
  onOpenEvent: (eventId: EventId) => void;
  onRenameCollection: () => void;
  selectedCollection: { collection: Collection } | null;
  selectedDevice: DeviceSummary;
};

export function EventsTab({
  eventRows,
  onAddCollection,
  onAddEvent,
  onDeleteCollection,
  onDeleteEvent,
  onOpenEvent,
  onRenameCollection,
  selectedCollection,
  selectedDevice
}: EventsTabProps) {
  return (
    <>
      <div className="flex min-h-[34px] flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-700">
            {selectedCollection?.collection.name ?? "No collection selected"}
          </h3>
          <p className="text-xs text-gray-500">Collections are scoped to {selectedDevice.device.name}.</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            disabled={!selectedCollection}
            leftIcon={<Edit3 className="size-4" />}
            onClick={onRenameCollection}
          >
            Rename
          </Button>
          <Button
            disabled={!selectedCollection}
            leftIcon={<Trash2 className="size-4" />}
            onClick={onDeleteCollection}
          >
            Delete
          </Button>
          <Button leftIcon={<Plus className="size-4" />} onClick={onAddCollection}>
            Collection
          </Button>
          <Button
            disabled={!selectedCollection}
            leftIcon={<Plus className="size-4" />}
            onClick={onAddEvent}
            variant="primary"
          >
            Add event
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        <div className="min-w-0">
          <EventsTable eventRows={eventRows} onDeleteEvent={onDeleteEvent} onOpenEvent={onOpenEvent} />
          <EventsCards eventRows={eventRows} onDeleteEvent={onDeleteEvent} onOpenEvent={onOpenEvent} />

          {!eventRows.length ? (
            <EmptyState
              action={
                <Button leftIcon={<Plus className="size-4" />} onClick={onAddEvent} variant="primary">
                  Add event
                </Button>
              }
              title="No events in this collection"
              description="Create the first event to schedule sound and haptic feedback."
            />
          ) : null}
        </div>
      </div>
    </>
  );
}
