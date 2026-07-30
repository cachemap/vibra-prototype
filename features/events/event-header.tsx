"use client";

import Link from "next/link";
import { ArrowLeft, Edit3, Link2, Trash2 } from "lucide-react";

import { Button, PageHeader, RowActionsMenu } from "@/components/primitives";
import type {
  DeviceSummary,
  DeviceCollectionAggregate,
  ProjectWorkspaceAggregate
} from "@/data/repositories/project-repository";
import type { ShareLinkController } from "@/features/sharing/use-share-link";

type EventHeaderProps = {
  backHref: string;
  located: {
    collection: DeviceCollectionAggregate["collection"];
    event: DeviceCollectionAggregate["events"][number];
  };
  onDeleteEvent: () => void;
  onEditEvent: () => void;
  selectedDevice: DeviceSummary | null;
  shareController: ShareLinkController;
  workspace: ProjectWorkspaceAggregate;
};

export function EventHeader({
  backHref,
  located,
  onDeleteEvent,
  onEditEvent,
  selectedDevice,
  shareController,
  workspace
}: EventHeaderProps) {
  const deviceName = selectedDevice?.device.name ?? "System";
  const selectedEvent = located.event;

  return (
    <PageHeader
      actions={
        <>
          <Link href={backHref}>
            <Button leftIcon={<ArrowLeft className="size-4" />}>Back to events</Button>
          </Link>
          <Button
            leftIcon={<Link2 className="size-4" />}
            onClick={() =>
              void shareController.openShareDialog(
                { kind: "event", eventId: selectedEvent.event.id },
                selectedEvent.event.name
              )
            }
          >
            Share
          </Button>
          <Button leftIcon={<Edit3 className="size-4" />} onClick={onEditEvent} variant="primary">
            Edit event
          </Button>
          <RowActionsMenu
            grouped
            items={[
              {
                destructive: true,
                icon: <Trash2 aria-hidden="true" className="size-4" />,
                label: "Delete event",
                onSelect: onDeleteEvent
              }
            ]}
            label={`Open actions for ${selectedEvent.event.name}`}
          />
        </>
      }
      breadcrumbs={[
        { href: "/projects", label: "Projects" },
        ...(workspace.folder
          ? [{ href: `/projects?folder=${workspace.folder.id}`, label: workspace.folder.name }]
          : []),
        { href: backHref, label: workspace.project.name },
        { href: backHref, label: located.collection.name }
      ]}
      subtitle={`${selectedEvent.event.eventType} / ${deviceName}`}
      title={selectedEvent.event.name}
    />
  );
}
