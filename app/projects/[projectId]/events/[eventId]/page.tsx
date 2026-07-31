"use client";

import { useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";

import { Button, ErrorState, LoadingState, PageHeader } from "@/components/primitives";
import { asEntityId, type EventId, type ProjectId } from "@/domain";
import { EventDetailContent } from "@/features/events/event-detail-content";
import { FeedbackProvider } from "@/features/feedback/feedback-context";
import { AudioPreviewProvider } from "@/features/projects/audio-preview-context";
import { useProjectWorkspaceQuery } from "@/features/projects/queries";
import { eventWorkspaceErrorFallback, messageForError } from "@/lib/errors";

export default function EventDetailPage() {
  return (
    <FeedbackProvider errorFallback={eventWorkspaceErrorFallback}>
      <AudioPreviewProvider>
        <EventDetailWorkspace />
      </AudioPreviewProvider>
    </FeedbackProvider>
  );
}

function EventDetailWorkspace() {
  const { projectId: projectIdParam, eventId: eventIdParam } = useParams<{
    projectId: string;
    eventId: string;
  }>();
  const searchParams = useSearchParams();
  const projectId = asEntityId<ProjectId>(projectIdParam);
  const eventId = asEntityId<EventId>(eventIdParam);
  const deviceParam = searchParams.get("device");
  const workspaceQuery = useProjectWorkspaceQuery(projectId);
  const selectedDevice = useMemo(() => {
    const devices = workspaceQuery.data?.devices ?? [];

    if (deviceParam) {
      const matched = devices.find((summary) => summary.device.id === deviceParam);

      if (matched) {
        return matched;
      }
    }

    return devices[0] ?? null;
  }, [deviceParam, workspaceQuery.data?.devices]);

  if (workspaceQuery.isLoading) {
    return (
      <section className="grid">
        <PageHeader
          breadcrumbs={[{ href: "/projects", label: "Projects" }]}
          border={false}
        />
        <div className="px-[var(--page-gutter-x)] py-[var(--page-gutter-y)]">
          <LoadingState title="Loading event" description="Opening the local device workspace." />
        </div>
      </section>
    );
  }

  if (workspaceQuery.isError) {
    return (
      <section className="grid">
        <PageHeader
          breadcrumbs={[{ href: "/projects", label: "Projects" }]}
          border={false}
        />
        <div className="px-[var(--page-gutter-x)] py-[var(--page-gutter-y)]">
          <ErrorState
            action={<Button onClick={() => void workspaceQuery.refetch()}>Retry</Button>}
            title="Event could not load"
            description={messageForError(workspaceQuery.error, eventWorkspaceErrorFallback)}
          />
        </div>
      </section>
    );
  }

  const workspace = workspaceQuery.data;

  return workspace ? (
    <EventDetailContent
      eventId={eventId}
      projectId={projectId}
      selectedDevice={selectedDevice}
      workspace={workspace}
    />
  ) : null;
}
