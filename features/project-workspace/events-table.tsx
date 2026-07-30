import { ArrowRight, MoreVertical, Trash2 } from "lucide-react";
import { Button, RowActionsMenu, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/primitives";
import type { EventId } from "@/domain";
import type { EventRowModel } from "./event-row-model";

type EventsTableProps = {
  eventRows: readonly EventRowModel[];
  onDeleteEvent: (event: { id: EventId; name: string }) => void;
  onOpenEvent: (eventId: EventId) => void;
};

export function EventsTable({ eventRows, onDeleteEvent, onOpenEvent }: EventsTableProps) {
  return (
    <div className="hidden md:block">
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Event</TableHeaderCell>
            <TableHeaderCell>Event type</TableHeaderCell>
            <TableHeaderCell>Interactions</TableHeaderCell>
            <TableHeaderCell>Scheduled playbacks</TableHeaderCell>
            <TableHeaderCell className="w-24" />
          </TableRow>
        </TableHead>
        <TableBody>
          {eventRows.map((row) => (
            <TableRow className="hover:bg-gray-50" key={row.event.id}>
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
