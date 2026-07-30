"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import {
  ArrowLeft,
  Edit3,
  Copy,
  ExternalLink,
  FileAudio,
  Link2,
  MoreHorizontal,
  Play,
  Plus,
  Square,
  Trash2,
  Waves
} from "lucide-react";
import {
  ActionMenu,
  Button,
  ConfirmDialog,
  Dialog,
  DialogOverlay,
  EmptyState,
  ErrorState,
  IconButton,
  LoadingState,
  MenuGroup,
  MenuItem,
  PageHeader,
  Select,
  Switch,
  TextInput,
  Timeline,
  type TimelineLane
} from "@/components/primitives";
import {
  asEntityId,
  eventTypes,
  type AssetId,
  type EventId,
  type EventTriggerId,
  type ShareTarget,
  type SharingLink,
  type ProjectId,
  type TriggerId,
  type TriggerPlaybackId
} from "@/domain";
import { DEMO_USER_ID } from "@/data/seed";
import {
  useCreateEventTriggerMutation,
  useCreateTriggerPlaybackMutation,
  useDeleteEventMutation,
  useDeleteEventTriggerMutation,
  useDeleteSharingLinkMutation,
  useDeleteTriggerPlaybackMutation,
  useDeviceWorkspaceQuery,
  useGenerateSharingLinkMutation,
  useProjectWorkspaceQuery,
  useUpdateEventMutation,
  useUpdateEventTriggerMutation,
  useUpdateTriggerPlaybackMutation
} from "@/features/projects/queries";
import {
  useAudioPreviewPlayer,
  type AudioPreviewItem
} from "@/features/projects/audio-preview";
import { eventWorkspaceErrorFallback, messageForError } from "@/lib/errors";
import { hrefWithFlashMessage } from "@/lib/flash-message";
import { formatSeconds } from "@/lib/format";
import { pluralSuffix } from "@/lib/plural";

const shareTokenFor = (link: SharingLink) => link.url.split("/").at(-1) ?? link.id;

const timelineTailSeconds = 0.45;

type DeleteTarget =
  | {
      eventTriggerId: EventTriggerId;
      label: string;
      playbacksCount: number;
      type: "eventTrigger";
    }
  | {
      assetName: string;
      startOffset: number;
      triggerPlaybackId: TriggerPlaybackId;
      type: "triggerPlayback";
    };

export default function EventDetailPage() {
  const { projectId: projectIdParam, eventId: eventIdParam } = useParams<{
    projectId: string;
    eventId: string;
  }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = asEntityId<ProjectId>(projectIdParam);
  const eventId = asEntityId<EventId>(eventIdParam);
  const deviceParam = searchParams.get("device");

  const [dialog, setDialog] = useState<
    "editEvent" | "trigger" | "playback" | "editPlayback" | "share" | null
  >(null);
  const [eventName, setEventName] = useState("");
  const [eventType, setEventType] = useState<(typeof eventTypes)[number]>("Button");
  const [triggerId, setTriggerId] = useState("");
  const [triggerLabel, setTriggerLabel] = useState("");
  const [triggerEnabled, setTriggerEnabled] = useState(true);
  const [selectedEventTriggerId, setSelectedEventTriggerId] = useState<EventTriggerId | null>(null);
  const [selectedPlaybackId, setSelectedPlaybackId] = useState<TriggerPlaybackId | null>(null);
  const [playbackAssetId, setPlaybackAssetId] = useState("");
  const [playbackOffset, setPlaybackOffset] = useState("0");
  const [shareLink, setShareLink] = useState<SharingLink | null>(null);
  const [shareLinkPendingDelete, setShareLinkPendingDelete] = useState<SharingLink | null>(null);
  const [shareLabel, setShareLabel] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [openEventActions, setOpenEventActions] = useState(false);
  const [deleteEventIsOpen, setDeleteEventIsOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

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
  const deviceWorkspaceQuery = useDeviceWorkspaceQuery(selectedDevice?.device.id ?? null);
  const updateEvent = useUpdateEventMutation();
  const deleteEvent = useDeleteEventMutation();
  const createEventTrigger = useCreateEventTriggerMutation();
  const updateEventTrigger = useUpdateEventTriggerMutation();
  const deleteEventTrigger = useDeleteEventTriggerMutation();
  const createTriggerPlayback = useCreateTriggerPlaybackMutation();
  const updateTriggerPlayback = useUpdateTriggerPlaybackMutation();
  const deleteTriggerPlayback = useDeleteTriggerPlaybackMutation();
  const generateSharingLink = useGenerateSharingLinkMutation();
  const deleteSharingLink = useDeleteSharingLinkMutation();
  const audioPreview = useAudioPreviewPlayer();

  const located = useMemo(
    () =>
      (deviceWorkspaceQuery.data?.collections ?? [])
        .flatMap((collection) =>
          collection.events.map((row) => ({ collection: collection.collection, event: row }))
        )
        .find((candidate) => candidate.event.event.id === eventId) ?? null,
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
  const timelinePlaybacks = useMemo(
    () =>
      (selectedEvent?.eventTriggers ?? [])
        .flatMap((eventTrigger) =>
          eventTrigger.playbacks.map((playback) => ({
            eventTrigger,
            playback,
            asset: assetById.get(playback.assetId)
          }))
        )
        .sort(
          (first, second) =>
            first.playback.startOffset - second.playback.startOffset ||
            (first.asset?.name ?? "").localeCompare(second.asset?.name ?? "")
        ),
    [assetById, selectedEvent?.eventTriggers]
  );
  const timelineMaxSeconds = useMemo(
    () =>
      Math.max(
        1,
        ...timelinePlaybacks.map(({ playback }) => playback.startOffset + timelineTailSeconds)
      ),
    [timelinePlaybacks]
  );
  const previewItemsByEventTriggerId = useMemo(() => {
    const grouped = new Map<EventTriggerId, AudioPreviewItem[]>();

    timelinePlaybacks.forEach(({ asset, eventTrigger, playback }) => {
      if (!asset) {
        return;
      }

      const previewItem: AudioPreviewItem = {
        asset,
        isEnabled: selectedDeviceIsEnabled && eventTrigger.isEnabled,
        key: `event-${playback.id}`,
        startOffset: playback.startOffset
      };

      grouped.set(eventTrigger.id, [...(grouped.get(eventTrigger.id) ?? []), previewItem]);
    });

    return grouped;
  }, [selectedDeviceIsEnabled, timelinePlaybacks]);


  const timelineLanes: TimelineLane[] = (selectedEvent?.eventTriggers ?? []).map((eventTrigger) => {
    const trigger = triggerById.get(eventTrigger.triggerId);
    const triggerName = trigger?.name ?? eventTrigger.triggerId;
    const isLaneDisabled = !eventTrigger.isEnabled || !selectedDeviceIsEnabled;
    const laneItems = previewItemsByEventTriggerId.get(eventTrigger.id) ?? [];
    const isLanePlayable = !isLaneDisabled && laneItems.length > 0;
    const isLanePlaying = audioPreview.isSchedulePlaying(eventTrigger.id);
    const playbacks = [...eventTrigger.playbacks].sort(
      (first, second) => first.startOffset - second.startOffset
    );

    const deleteInteractionButton = (
      <IconButton
        icon={Trash2}
        label={`Delete interaction ${triggerName}`}
        onClick={() => {
          audioPreview.stopSchedule(eventTrigger.id);
          setFeedback(null);
          setDeleteTarget({
            eventTriggerId: eventTrigger.id,
            label: eventTrigger.label || triggerName,
            playbacksCount: eventTrigger.playbacks.length,
            type: "eventTrigger"
          });
        }}
        size="compact"
      />
    );

    return {
      blocks: playbacks.map((playback) => {
        const asset = assetById.get(playback.assetId);

        return {
          controls: (
            <span className="flex items-center gap-1">
              <IconButton
                icon={MoreHorizontal}
                label={`Edit playback ${asset?.name ?? playback.assetId}`}
                onClick={() => openEditPlayback(eventTrigger.id, playback.id)}
                size="compact"
              />
              <IconButton
                icon={Trash2}
                label={`Delete playback ${asset?.name ?? playback.assetId}`}
                onClick={() => {
                  audioPreview.stopSchedule(eventTrigger.id);
                  setFeedback(null);
                  setDeleteTarget({
                    assetName: asset?.name ?? playback.assetId,
                    startOffset: playback.startOffset,
                    triggerPlaybackId: playback.id,
                    type: "triggerPlayback"
                  });
                }}
                size="compact"
              />
            </span>
          ),
          id: playback.id,
          isDisabled: isLaneDisabled,
          kind: asset?.mediaKind === "haptic" ? ("haptic" as const) : ("audio" as const),
          label: asset?.name ?? playback.assetId,
          meta: formatSeconds(playback.startOffset),
          offsetSeconds: playback.startOffset
        };
      }),
      controls: (
        <span className="flex items-center gap-1">
          <IconButton
            disabled={!isLanePlayable}
            icon={isLanePlaying ? Square : Play}
            label={`${isLanePlaying ? "Stop" : "Play"} ${triggerName}`}
            onClick={() => {
              if (isLanePlaying) {
                audioPreview.stopSchedule(eventTrigger.id);
                return;
              }

              audioPreview.playSchedule(eventTrigger.id, laneItems, timelineMaxSeconds);
            }}
            size="compact"
          />
          {deleteInteractionButton}
        </span>
      ),
      emptyAction: (
        <Button
          leftIcon={<Plus className="size-4" />}
          onClick={() => openCreatePlayback(eventTrigger.id)}
          size="compact"
        >
          Playback
        </Button>
      ),
      id: eventTrigger.id,
      isDisabled: isLaneDisabled,
      label: triggerName,
      meta: (
        <Switch
          checked={eventTrigger.isEnabled}
          id={`event-trigger-${eventTrigger.id}`}
          label={eventTrigger.isEnabled ? "Enabled" : "Disabled"}
          onChange={(toggleEvent) =>
            void handleTriggerEnabledChange(eventTrigger.id, toggleEvent.currentTarget.checked)
          }
        />
      ),
      title: eventTrigger.label || triggerName,
      playheadLabel: triggerName.slice(0, 1).toUpperCase(),
      playheadSeconds: audioPreview.playheadFor(eventTrigger.id),
      trailingAction: (
        <IconButton
          icon={Plus}
          label={`Add playback to ${triggerName}`}
          onClick={() => openCreatePlayback(eventTrigger.id)}
          size="compact"
        />
      )
    };
  });


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

  const openEditEvent = () => {
    setEventName(selectedEvent?.event.name ?? "");
    setEventType(selectedEvent?.event.eventType ?? "Button");
    setFeedback(null);
    setDialog("editEvent");
  };

  const openDeleteEvent = () => {
    setOpenEventActions(false);
    setFeedback(null);
    setDeleteEventIsOpen(true);
  };

  const openCreateTrigger = () => {
    setTriggerId(availableTriggers[0]?.id ?? "");
    setTriggerLabel("");
    setTriggerEnabled(true);
    setFeedback(null);
    setDialog("trigger");
  };

  const openCreatePlayback = (eventTriggerId: EventTriggerId) => {
    setSelectedEventTriggerId(eventTriggerId);
    setSelectedPlaybackId(null);
    setPlaybackAssetId(deviceWorkspaceQuery.data?.playbackAssets[0]?.id ?? "");
    setPlaybackOffset("0");
    setFeedback(null);
    setDialog("playback");
  };

  const openEditPlayback = (eventTriggerId: EventTriggerId, playbackId: TriggerPlaybackId) => {
    const eventTrigger = selectedEvent?.eventTriggers.find((item) => item.id === eventTriggerId);
    const playback = eventTrigger?.playbacks.find((item) => item.id === playbackId);

    setSelectedEventTriggerId(eventTriggerId);
    setSelectedPlaybackId(playbackId);
    setPlaybackAssetId(playback?.assetId ?? deviceWorkspaceQuery.data?.playbackAssets[0]?.id ?? "");
    setPlaybackOffset(String(playback?.startOffset ?? 0));
    setFeedback(null);
    setDialog("editPlayback");
  };

  const openShareDialog = async (target: ShareTarget, label: string) => {
    setFeedback(null);
    setShareLabel(label);
    setShareLink(null);
    setDialog("share");

    try {
      const generated = await generateSharingLink.mutateAsync({
        target,
        createdByUserId: DEMO_USER_ID
      });

      setShareLink(generated);
      setFeedback(`Generated share link for ${label}.`);
    } catch (error) {
      setFeedback(messageForError(error, eventWorkspaceErrorFallback));
    }
  };

  const copyShareLink = async () => {
    if (!shareLink) {
      return;
    }

    const url = `${window.location.origin}/share/${shareTokenFor(shareLink)}`;

    try {
      await navigator.clipboard.writeText(url);
      setFeedback("Copied share link.");
    } catch {
      setFeedback(url);
    }
  };

  const openDeleteShareLinkDialog = () => {
    if (!shareLink) {
      return;
    }

    setDialog(null);
    setFeedback(null);
    setShareLinkPendingDelete(shareLink);
  };

  const handleDeleteShareLink = async () => {
    if (!shareLinkPendingDelete) {
      return;
    }

    setFeedback(null);

    try {
      const deletedToken = shareTokenFor(shareLinkPendingDelete);

      await deleteSharingLink.mutateAsync(shareLinkPendingDelete.id);
      setShareLinkPendingDelete(null);
      setShareLink(null);
      setFeedback(`Deleted share link /share/${deletedToken}.`);
    } catch (error) {
      setFeedback(messageForError(error, eventWorkspaceErrorFallback));
    }
  };

  const handleEditEvent = async (formEvent: FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();

    if (!selectedEvent) {
      return;
    }

    setFeedback(null);

    try {
      const updated = await updateEvent.mutateAsync({
        eventId: selectedEvent.event.id,
        name: eventName,
        eventType
      });

      setDialog(null);
      setFeedback(`Updated ${updated.name}.`);
    } catch (error) {
      setFeedback(messageForError(error, eventWorkspaceErrorFallback));
    }
  };

  const handleCreateTrigger = async (formEvent: FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();

    if (!selectedEvent || !triggerId) {
      return;
    }

    setFeedback(null);

    try {
      const created = await createEventTrigger.mutateAsync({
        eventId: selectedEvent.event.id,
        triggerId: asEntityId<TriggerId>(triggerId),
        label: triggerLabel || null,
        isEnabled: triggerEnabled
      });
      const trigger = triggerById.get(created.triggerId);

      setDialog(null);
      setFeedback(`Added ${trigger?.name ?? "interaction"} to ${selectedEvent.event.name}.`);
    } catch (error) {
      setFeedback(messageForError(error, eventWorkspaceErrorFallback));
    }
  };

  const handleCreatePlayback = async (formEvent: FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();

    if (!selectedEventTriggerId || !playbackAssetId) {
      return;
    }

    setFeedback(null);

    try {
      const created = await createTriggerPlayback.mutateAsync({
        eventTriggerId: selectedEventTriggerId,
        assetId: asEntityId<AssetId>(playbackAssetId),
        startOffset: Number(playbackOffset)
      });
      const asset = assetById.get(created.assetId);

      setDialog(null);
      setFeedback(`Scheduled ${asset?.name ?? "asset"} at ${formatSeconds(created.startOffset)}.`);
    } catch (error) {
      setFeedback(messageForError(error, eventWorkspaceErrorFallback));
    }
  };

  const handleEditPlayback = async (formEvent: FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();

    if (!selectedPlaybackId || !playbackAssetId) {
      return;
    }

    setFeedback(null);

    try {
      const updated = await updateTriggerPlayback.mutateAsync({
        triggerPlaybackId: selectedPlaybackId,
        assetId: asEntityId<AssetId>(playbackAssetId),
        startOffset: Number(playbackOffset)
      });
      const asset = assetById.get(updated.assetId);

      setDialog(null);
      setFeedback(`Updated ${asset?.name ?? "asset"} at ${formatSeconds(updated.startOffset)}.`);
    } catch (error) {
      setFeedback(messageForError(error, eventWorkspaceErrorFallback));
    }
  };

  const handleTriggerEnabledChange = async (eventTriggerId: EventTriggerId, isEnabled: boolean) => {
    setFeedback(null);

    try {
      await updateEventTrigger.mutateAsync({ eventTriggerId, isEnabled });
      setFeedback(isEnabled ? "Interaction enabled for preview." : "Interaction disabled for preview.");
    } catch (error) {
      setFeedback(messageForError(error, eventWorkspaceErrorFallback));
    }
  };

  const handleConfirmDeleteEvent = async () => {
    if (!selectedEvent) {
      return;
    }

    setFeedback(null);

    try {
      await deleteEvent.mutateAsync(selectedEvent.event.id);
      setDeleteEventIsOpen(false);
      router.push(hrefWithFlashMessage(backHref, `Deleted event ${selectedEvent.event.name}.`));
    } catch (error) {
      setFeedback(messageForError(error, eventWorkspaceErrorFallback));
    }
  };

  const handleConfirmDeleteTarget = async () => {
    if (!deleteTarget) {
      return;
    }

    setFeedback(null);

    try {
      if (deleteTarget.type === "eventTrigger") {
        audioPreview.stopSchedule(deleteTarget.eventTriggerId);
        await deleteEventTrigger.mutateAsync(deleteTarget.eventTriggerId);
        setFeedback(`Deleted interaction ${deleteTarget.label}.`);
      } else {
        await deleteTriggerPlayback.mutateAsync(deleteTarget.triggerPlaybackId);
        setFeedback(`Deleted playback ${deleteTarget.assetName}.`);
      }

      setDeleteTarget(null);
    } catch (error) {
      setFeedback(messageForError(error, eventWorkspaceErrorFallback));
    }
  };

  if (workspaceQuery.isLoading || deviceWorkspaceQuery.isLoading) {
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

  if (workspaceQuery.isError) {
    return (
      <section className="grid gap-4 px-4 py-5">
        <PageHeader
          breadcrumbs={[{ href: "/projects", label: "Projects" }]}
          border={false}
          className="px-0 py-0"
        />
        <ErrorState
          action={<Button onClick={() => void workspaceQuery.refetch()}>Retry</Button>}
          title="Event could not load"
          description={messageForError(workspaceQuery.error, eventWorkspaceErrorFallback)}
        />
      </section>
    );
  }

  const workspace = workspaceQuery.data;

  if (!workspace || !selectedEvent || !located) {
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

  const deviceName = selectedDevice?.device.name ?? "System";

  return (
    <section className="grid min-h-[calc(100vh-64px)] grid-rows-[auto_1fr] bg-gray-25">
      <PageHeader
        actions={
          <>
            <Link href={backHref}>
              <Button leftIcon={<ArrowLeft className="size-4" />}>Back to events</Button>
            </Link>
            <Button
              leftIcon={<Link2 className="size-4" />}
              onClick={() =>
                void openShareDialog(
                  { kind: "event", eventId: selectedEvent.event.id },
                  selectedEvent.event.name
                )
              }
            >
              Share
            </Button>
            <Button leftIcon={<Edit3 className="size-4" />} onClick={openEditEvent} variant="primary">
              Edit event
            </Button>
            <ActionMenu
              label={`Open actions for ${selectedEvent.event.name}`}
              onOpenChange={setOpenEventActions}
              open={openEventActions}
            >
              <MenuGroup>
                <MenuItem
                  destructive
                  icon={<Trash2 aria-hidden="true" className="size-4" />}
                  onClick={openDeleteEvent}
                >
                  Delete event
                </MenuItem>
              </MenuGroup>
            </ActionMenu>
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

      <main className="grid min-w-0 content-start gap-5 px-4 py-4">
        <div className="grid min-w-0 gap-2">
          <div className="flex min-h-[34px] flex-wrap items-center justify-between gap-2">
            <div className="grid gap-0.5">
              <h2 className="text-sm font-semibold text-gray-700">Event playback timeline</h2>
              <p className="text-xs text-gray-500">
                Start each interaction on its own to hear how its scheduled offsets land.
              </p>
            </div>
            <Button
              disabled={!availableTriggers.length}
              leftIcon={<Plus className="size-4" />}
              onClick={openCreateTrigger}
              variant="primary"
            >
              Interaction
            </Button>
          </div>
          {timelineLanes.length ? (
            <Timeline lanes={timelineLanes} maxSeconds={timelineMaxSeconds} />
          ) : (
            <EmptyState
              title="No interactions bound yet"
              description="Bind an interaction such as onPress to schedule sound and haptic playbacks."
            />
          )}
          {audioPreview.errorMessage ? (
            <p className="text-sm text-gray-600">{audioPreview.errorMessage}</p>
          ) : null}
        </div>


        {feedback && dialog === null ? (
          <p className="text-sm text-gray-600" role="status">
            {feedback}
          </p>
        ) : null}
      </main>

      {deleteEventIsOpen ? (
        <ConfirmDialog
          confirmLabel="Delete event"
          disabled={deleteEvent.isPending}
          onCancel={() => setDeleteEventIsOpen(false)}
          onConfirm={() => void handleConfirmDeleteEvent()}
          title="Delete event?"
          cascadeSummary="Trigger schedules, collision matrix rows, columns, entries, and share links."
        >
          This removes {selectedEvent.event.name} and its dependent demo records from IndexedDB.
        </ConfirmDialog>
      ) : null}

      {deleteTarget ? (
        <ConfirmDialog
          confirmLabel={deleteTarget.type === "eventTrigger" ? "Delete interaction" : "Delete playback"}
          disabled={deleteEventTrigger.isPending || deleteTriggerPlayback.isPending}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => void handleConfirmDeleteTarget()}
          title={deleteTarget.type === "eventTrigger" ? "Delete interaction?" : "Delete playback?"}
          cascadeSummary={
            deleteTarget.type === "eventTrigger"
              ? `${deleteTarget.playbacksCount} scheduled playback${pluralSuffix(deleteTarget.playbacksCount)}.`
              : "No dependent records."
          }
        >
          {deleteTarget.type === "eventTrigger"
            ? `This removes ${deleteTarget.label} from the event timeline.`
            : `This removes ${deleteTarget.assetName} at ${formatSeconds(
                deleteTarget.startOffset
              )} from the timeline.`}
        </ConfirmDialog>
      ) : null}

      {shareLinkPendingDelete ? (
        <ConfirmDialog
          confirmLabel="Delete link"
          disabled={deleteSharingLink.isPending}
          onCancel={() => setShareLinkPendingDelete(null)}
          onConfirm={() => void handleDeleteShareLink()}
          title="Delete share link?"
        >
          This removes /share/{shareTokenFor(shareLinkPendingDelete)} from IndexedDB. The shared preview URL
          will stop resolving.
        </ConfirmDialog>
      ) : null}

      <DialogOverlay align="end" open={dialog !== null}>
        <Dialog
          actions={
            <>
              <Button onClick={() => setDialog(null)}>Close</Button>
              <Button
                disabled={!shareLink}
                leftIcon={<Trash2 className="size-4" />}
                onClick={openDeleteShareLinkDialog}
                variant="destructive"
              >
                Delete link
              </Button>
              <Button
                disabled={!shareLink}
                leftIcon={<Copy className="size-4" />}
                onClick={() => void copyShareLink()}
              >
                Copy link
              </Button>
              <Button
                disabled={!shareLink}
                leftIcon={<ExternalLink className="size-4" />}
                onClick={() => {
                  if (shareLink) {
                    window.open(`/share/${shareTokenFor(shareLink)}`, "_blank", "noopener,noreferrer");
                  }
                }}
                variant="primary"
              >
                Open preview
              </Button>
            </>
          }
          className="max-w-[460px]"
          open={dialog === "share"}
          title="Share Link"
        >
          <div className="grid gap-4">
            <div className="grid gap-1">
              <p className="text-xs font-medium text-gray-500">Target</p>
              <p className="text-sm font-semibold text-gray-700">{shareLabel || "Selected target"}</p>
            </div>
            <div className="grid gap-1">
              <p className="text-xs font-medium text-gray-500">Generated URL</p>
              <p className="break-all border-y border-gray-200 bg-gray-50 px-2 py-2 text-sm text-gray-700">
                {shareLink ? `/share/${shareTokenFor(shareLink)}` : "Generating share link..."}
              </p>
            </div>
          </div>
        </Dialog>

        <Dialog
          actions={
            <>
              <Button onClick={() => setDialog(null)}>Cancel</Button>
              <Button form="event-form" type="submit" variant="primary">
                Save
              </Button>
            </>
          }
          className="max-w-[420px]"
          open={dialog === "editEvent"}
          title="Edit Event"
        >
          <form className="grid gap-4" id="event-form" onSubmit={handleEditEvent}>
            <TextInput
              autoFocus
              id="event-name"
              label="Name"
              onChange={(formEvent) => setEventName(formEvent.currentTarget.value)}
              placeholder="Primary CTA"
              required
              value={eventName}
            />
            <Select
              id="event-type"
              label="Event type"
              onChange={(formEvent) =>
                setEventType(formEvent.currentTarget.value as (typeof eventTypes)[number])
              }
              required
              value={eventType}
            >
              {eventTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
            {feedback ? <p className="text-sm text-gray-600">{feedback}</p> : null}
          </form>
        </Dialog>

        <Dialog
          actions={
            <>
              <Button onClick={() => setDialog(null)}>Cancel</Button>
              <Button disabled={!availableTriggers.length} form="trigger-form" type="submit" variant="primary">
                Add interaction
              </Button>
            </>
          }
          className="max-w-[420px]"
          open={dialog === "trigger"}
          title="Add Interaction"
        >
          <form className="grid gap-4" id="trigger-form" onSubmit={handleCreateTrigger}>
            <Select
              id="trigger-name"
              label="Interaction"
              onChange={(formEvent) => setTriggerId(formEvent.currentTarget.value)}
              required
              value={triggerId || availableTriggers[0]?.id}
            >
              {availableTriggers.map((trigger) => (
                <option key={trigger.id} value={trigger.id}>
                  {trigger.name}
                </option>
              ))}
            </Select>
            <TextInput
              id="trigger-label"
              label="Label"
              onChange={(formEvent) => setTriggerLabel(formEvent.currentTarget.value)}
              placeholder="Pressed with valid cart"
              value={triggerLabel}
            />
            <Switch
              checked={triggerEnabled}
              id="trigger-enabled"
              label="Enabled in preview"
              onChange={(formEvent) => setTriggerEnabled(formEvent.currentTarget.checked)}
            />
            {feedback ? <p className="text-sm text-gray-600">{feedback}</p> : null}
          </form>
        </Dialog>

        <Dialog
          actions={
            <>
              <Button onClick={() => setDialog(null)}>Cancel</Button>
              <Button
                disabled={!deviceWorkspaceQuery.data?.playbackAssets.length}
                form="playback-form"
                type="submit"
                variant="primary"
              >
                {dialog === "editPlayback" ? "Save playback" : "Add playback"}
              </Button>
            </>
          }
          className="max-w-[420px]"
          open={dialog === "playback" || dialog === "editPlayback"}
          title={dialog === "editPlayback" ? "Edit Playback" : "Add Playback"}
        >
          <form
            className="grid gap-4"
            id="playback-form"
            onSubmit={dialog === "editPlayback" ? handleEditPlayback : handleCreatePlayback}
          >
            <fieldset className="grid gap-2">
              <legend className="text-sm font-medium text-gray-700">Asset</legend>
              <div className="grid max-h-72 gap-1 overflow-auto border-y border-gray-300 py-1">
                {(deviceWorkspaceQuery.data?.playbackAssets ?? []).map((asset) => {
                  const selected =
                    (playbackAssetId || deviceWorkspaceQuery.data?.playbackAssets[0]?.id) === asset.id;
                  const Icon = asset.mediaKind === "audio" ? FileAudio : Waves;

                  return (
                    <label
                      className={`grid min-h-10 cursor-pointer grid-cols-[auto_1fr_auto] items-center gap-2 px-2 text-sm ${
                        selected ? "bg-gray-200 text-gray-700" : "text-gray-600 hover:bg-gray-100"
                      }`}
                      key={asset.id}
                    >
                      <input
                        checked={selected}
                        className="size-4 accent-purple-500"
                        name="playback-asset"
                        onChange={() => setPlaybackAssetId(asset.id)}
                        type="radio"
                        value={asset.id}
                      />
                      <span className="flex min-w-0 items-center gap-2">
                        <Icon aria-hidden="true" className="size-4 shrink-0 text-gray-500" />
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{asset.name}</span>
                          <span className="block truncate text-xs text-gray-500">{asset.libraryName}</span>
                        </span>
                      </span>
                      <span className="text-xs font-medium text-gray-500">{asset.mediaKind}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
            <TextInput
              id="playback-offset"
              inputMode="decimal"
              label="Start offset"
              min="0"
              onChange={(formEvent) => setPlaybackOffset(formEvent.currentTarget.value)}
              placeholder="0.15"
              required
              step="0.01"
              type="number"
              value={playbackOffset}
            />
            {feedback ? <p className="text-sm text-gray-600">{feedback}</p> : null}
          </form>
        </Dialog>
      </DialogOverlay>
    </section>
  );
}
