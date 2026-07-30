"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button, EmptyState, LoadingState, PageHeader } from "@/components/primitives";
import type {
  DeviceSummary,
  ProjectWorkspaceAggregate
} from "@/data/repositories/project-repository";
import type { EventId, EventTriggerId, ProjectId, TriggerPlaybackId } from "@/domain";
import { locateEventInCollections } from "@/features/events/event-derivations";
import type { EventDeleteTarget } from "@/features/events/event-delete-confirms";
import type { EventDialogRequest } from "@/features/events/event-dialogs";
import { EventWorkspaceView } from "@/features/events/event-workspace-view";
import { useFeedbackActions, useFeedbackMessage } from "@/features/feedback/feedback-context";
import { useAudioPreviewActions } from "@/features/projects/audio-preview-context";
import {
  useDeleteEventMutation,
  useDeleteEventTriggerMutation,
  useDeleteTriggerPlaybackMutation,
  useDeviceWorkspaceQuery,
  useUpdateEventTriggerMutation
} from "@/features/projects/queries";
import { useShareLink } from "@/features/sharing/use-share-link";
import { hrefWithFlashMessage } from "@/lib/flash-message";

type EventDetailContentProps = {
  eventId: EventId;
  projectId: ProjectId;
  selectedDevice: DeviceSummary | null;
  workspace: ProjectWorkspaceAggregate;
};

export function EventDetailContent({
  eventId,
  projectId,
  selectedDevice,
  workspace
}: EventDetailContentProps) {
  const router = useRouter();
  const [dialog, setDialog] = useState<EventDialogRequest | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EventDeleteTarget | null>(null);
  const feedback = useFeedbackMessage();
  const { clearFeedback, runWithFeedback } = useFeedbackActions();
  const deviceWorkspaceQuery = useDeviceWorkspaceQuery(selectedDevice?.device.id ?? null);
  const updateEventTrigger = useUpdateEventTriggerMutation();
  const deleteEvent = useDeleteEventMutation();
  const deleteEventTrigger = useDeleteEventTriggerMutation();
  const deleteTriggerPlayback = useDeleteTriggerPlaybackMutation();
  const audioPreview = useAudioPreviewActions();
  const shareController = useShareLink({
    setDialog: (nextDialog) => setDialog(nextDialog ? { type: nextDialog } : null)
  });
  const located = useMemo(
    () => locateEventInCollections(deviceWorkspaceQuery.data?.collections ?? [], eventId),
    [deviceWorkspaceQuery.data?.collections, eventId]
  );
  const selectedEvent = located?.event ?? null;
  const selectedDeviceIsEnabled = Boolean(selectedDevice?.device.isEnabled);
  const triggerById = useMemo(
    () => new Map((deviceWorkspaceQuery.data?.triggers ?? []).map((trigger) => [trigger.id, trigger])),
    [deviceWorkspaceQuery.data?.triggers]
  );
  const assetById = useMemo(
    () => new Map((deviceWorkspaceQuery.data?.playbackAssets ?? []).map((asset) => [asset.id, asset])),
    [deviceWorkspaceQuery.data?.playbackAssets]
  );
  const availableTriggers = useMemo(() => {
    const usedTriggerIds = new Set(selectedEvent?.eventTriggers.map((eventTrigger) => eventTrigger.triggerId));

    return (deviceWorkspaceQuery.data?.triggers ?? []).filter((trigger) => !usedTriggerIds.has(trigger.id));
  }, [deviceWorkspaceQuery.data?.triggers, selectedEvent?.eventTriggers]);
  const backHref = useMemo(() => {
    const params = new URLSearchParams();

    if (selectedDevice) {
      params.set("device", selectedDevice.device.id);
    }

    if (located) {
      params.set("collection", located.collection.id);
    }

    const query = params.toString();

    return `/projects/${projectId}${query ? `?${query}` : ""}`;
  }, [located, projectId, selectedDevice]);

  const closeDialog = useCallback(() => setDialog(null), []);
  const openCreateTrigger = useCallback(() => {
    clearFeedback();
    setDialog({ type: "trigger" });
  }, [clearFeedback]);
  const openEditEvent = useCallback(() => {
    clearFeedback();
    setDialog({ type: "editEvent" });
  }, [clearFeedback]);
  const openDeleteEvent = useCallback(() => {
    if (!selectedEvent) {
      return;
    }

    clearFeedback();
    setDeleteTarget({ eventName: selectedEvent.event.name, type: "event" });
  }, [clearFeedback, selectedEvent]);
  const openCreatePlayback = useCallback(
    (eventTriggerId: EventTriggerId) => {
      clearFeedback();
      setDialog({ eventTriggerId, type: "playback" });
    },
    [clearFeedback]
  );
  const openEditPlayback = useCallback(
    (eventTriggerId: EventTriggerId, playbackId: TriggerPlaybackId) => {
      clearFeedback();
      setDialog({ eventTriggerId, playbackId, type: "editPlayback" });
    },
    [clearFeedback]
  );
  const openDeleteEventTrigger = useCallback(
    (request: { eventTriggerId: EventTriggerId; label: string; playbacksCount: number }) => {
      clearFeedback();
      setDeleteTarget({ ...request, type: "eventTrigger" });
    },
    [clearFeedback]
  );
  const openDeleteTriggerPlayback = useCallback(
    (request: { assetName: string; startOffset: number; triggerPlaybackId: TriggerPlaybackId }) => {
      clearFeedback();
      setDeleteTarget({ ...request, type: "triggerPlayback" });
    },
    [clearFeedback]
  );
  const handleTriggerEnabledChange = useCallback(
    async (eventTriggerId: EventTriggerId, isEnabled: boolean) => {
      await runWithFeedback({
        work: () => updateEventTrigger.mutateAsync({ eventTriggerId, isEnabled }),
        onSuccess: () =>
          isEnabled ? "Interaction enabled for preview." : "Interaction disabled for preview."
      });
    },
    [runWithFeedback, updateEventTrigger]
  );
  const handleConfirmDeleteTarget = useCallback(async () => {
    if (!deleteTarget || !selectedEvent) {
      return;
    }

    await runWithFeedback({
      work: async () => {
        if (deleteTarget.type === "event") {
          await deleteEvent.mutateAsync(selectedEvent.event.id);
          setDeleteTarget(null);
          router.push(hrefWithFlashMessage(backHref, `Deleted event ${selectedEvent.event.name}.`));
          return null;
        }

        if (deleteTarget.type === "eventTrigger") {
          audioPreview.stopSchedule(deleteTarget.eventTriggerId);
          await deleteEventTrigger.mutateAsync(deleteTarget.eventTriggerId);
          setDeleteTarget(null);
          return `Deleted interaction ${deleteTarget.label}.`;
        }

        await deleteTriggerPlayback.mutateAsync(deleteTarget.triggerPlaybackId);
        setDeleteTarget(null);
        return `Deleted playback ${deleteTarget.assetName}.`;
      },
      onSuccess: (message) => message
    });
  }, [
    audioPreview,
    backHref,
    deleteEvent,
    deleteEventTrigger,
    deleteTarget,
    deleteTriggerPlayback,
    router,
    runWithFeedback,
    selectedEvent
  ]);

  if (deviceWorkspaceQuery.isLoading) {
    return (
      <section className="grid gap-4 px-4 py-5">
        <PageHeader
          breadcrumbs={[{ href: "/projects", label: "Projects" }]}
          border={false}
          className="px-0 py-0"
        />
        <LoadingState title="Loading event" description="Opening the local device workspace." />
      </section>
    );
  }

  if (!selectedEvent || !located) {
    return (
      <section className="grid gap-4 px-4 py-5">
        <PageHeader
          breadcrumbs={[{ href: "/projects", label: "Projects" }]}
          border={false}
          className="px-0 py-0"
        />
        <EmptyState
          action={
            <Button
              leftIcon={<ArrowLeft className="size-4" />}
              onClick={() => router.push(`/projects/${projectId}`)}
              variant="primary"
            >
              Back to project
            </Button>
          }
          title="Event not found"
          description="This event is not part of the selected system. Open it from the project event list."
        />
      </section>
    );
  }

  return (
    <EventWorkspaceView
      assetById={assetById}
      availableTriggers={availableTriggers}
      backHref={backHref}
      deleteDisabled={deleteEvent.isPending || deleteEventTrigger.isPending || deleteTriggerPlayback.isPending}
      deleteTarget={deleteTarget}
      dialog={dialog}
      feedback={feedback}
      located={located}
      onCloseDeleteTarget={() => setDeleteTarget(null)}
      onCloseDialog={closeDialog}
      onConfirmDeleteTarget={() => void handleConfirmDeleteTarget()}
      onCreatePlayback={openCreatePlayback}
      onCreateTrigger={openCreateTrigger}
      onDeleteEvent={openDeleteEvent}
      onDeleteEventTrigger={openDeleteEventTrigger}
      onDeleteTriggerPlayback={openDeleteTriggerPlayback}
      onEditEvent={openEditEvent}
      onEditPlayback={openEditPlayback}
      onTriggerEnabledChange={(eventTriggerId, isEnabled) =>
        void handleTriggerEnabledChange(eventTriggerId, isEnabled)
      }
      playbackAssets={deviceWorkspaceQuery.data?.playbackAssets ?? []}
      selectedDevice={selectedDevice}
      selectedDeviceIsEnabled={selectedDeviceIsEnabled}
      selectedEvent={selectedEvent}
      shareController={shareController}
      triggerById={triggerById}
      workspace={workspace}
    />
  );
}
