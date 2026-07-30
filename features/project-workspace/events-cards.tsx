import { ArrowRight, Trash2 } from "lucide-react";
import { IconButton } from "@/components/primitives";
import type { EventId } from "@/domain";
import type { EventRowModel } from "./event-row-model";

type EventsCardsProps = {
  eventRows: readonly EventRowModel[];
  onDeleteEvent: (event: { id: EventId; name: string }) => void;
  onOpenEvent: (eventId: EventId) => void;
};

export function EventsCards({ eventRows, onDeleteEvent, onOpenEvent }: EventsCardsProps) {
  return (
    <div className="grid border-y border-gray-300 md:hidden">
      <div className="grid h-10 grid-cols-[1fr_auto] items-center bg-gray-50 px-3 text-xs font-medium text-gray-500">
        <span>Events</span>
        <span>{eventRows.length}</span>
      </div>
      {eventRows.map((row) => (
        <div
          className="grid gap-2 border-t border-gray-200 bg-gray-25 px-3 py-2 text-left text-gray-700"
          key={row.event.id}
        >
          <span className="flex min-w-0 items-center justify-between gap-2">
            <button
              className="min-w-0 truncate text-left text-sm font-semibold"
              onClick={() => onOpenEvent(row.event.id)}
              type="button"
            >
              {row.event.name}
            </button>
            <span className="inline-flex h-[22px] shrink-0 items-center rounded-lg border border-gray-300 bg-gray-25 px-2 text-xs font-medium text-gray-700">
              {row.event.eventType}
            </span>
          </span>
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
            <span>{row.triggerCount ? `${row.triggerCount} interactions` : "Unset interactions"}</span>
            <span>{row.playbackCount ? `${row.playbackCount} playbacks` : "No playbacks"}</span>
            <button
              className="ml-auto flex items-center gap-1 font-medium text-gray-700"
              onClick={() => onOpenEvent(row.event.id)}
              type="button"
            >
              Open
              <ArrowRight aria-hidden="true" className="size-3.5" />
            </button>
            <IconButton
              icon={Trash2}
              label={`Delete ${row.event.name}`}
              onClick={() => onDeleteEvent(row.event)}
              size="compact"
            />
          </span>
        </div>
      ))}
    </div>
  );
}
