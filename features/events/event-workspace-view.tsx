"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/primitives";
import type {
  DeviceEventAggregate,
  DeviceSummary,
  DeviceWorkspaceAggregate,
  ProjectWorkspaceAggregate
} from "@/data/repositories/project-repository";
import type { Asset, EventTriggerId, Trigger, TriggerPlaybackId } from "@/domain";
import type { LocatedEvent } from "@/features/events/event-derivations";
import type { EventDeleteTarget } from "@/features/events/event-delete-confirms";
import { EventDeleteConfirms } from "@/features/events/event-delete-confirms";
import type { EventDialogRequest } from "@/features/events/event-dialogs";
import { EventDialogs } from "@/features/events/event-dialogs";
import { EventHeader } from "@/features/events/event-header";
import { EventTimeline } from "@/features/events/event-timeline";
import type { ShareLinkController } from "@/features/sharing/use-share-link";
import { ShareLinkDeleteConfirm } from "@/features/sharing/share-link-dialog";

type EventWorkspaceViewProps = {
  assetById: ReadonlyMap<Asset["id"], DeviceWorkspaceAggregate["playbackAssets"][number]>;
  availableTriggers: readonly Trigger[];
  backHref: string;
  deleteDisabled: boolean;
  deleteTarget: EventDeleteTarget | null;
  dialog: EventDialogRequest | null;
  feedback: string | null;
  located: LocatedEvent;
  onCloseDeleteTarget: () => void;
  onCloseDialog: () => void;
  onConfirmDeleteTarget: () => void;
  onCreatePlayback: (eventTriggerId: EventTriggerId) => void;
  onCreateTrigger: () => void;
  onDeleteEvent: () => void;
  onDeleteEventTrigger: (request: {
    eventTriggerId: EventTriggerId;
    label: string;
    playbacksCount: number;
  }) => void;
  onDeleteTriggerPlayback: (request: {
    assetName: string;
    startOffset: number;
    triggerPlaybackId: TriggerPlaybackId;
  }) => void;
  onEditEvent: () => void;
  onEditPlayback: (eventTriggerId: EventTriggerId, playbackId: TriggerPlaybackId) => void;
  onTriggerEnabledChange: (eventTriggerId: EventTriggerId, isEnabled: boolean) => void;
  playbackAssets: readonly DeviceWorkspaceAggregate["playbackAssets"][number][];
  selectedDevice: DeviceSummary | null;
  selectedDeviceIsEnabled: boolean;
  selectedEvent: DeviceEventAggregate;
  shareController: ShareLinkController;
  triggerById: ReadonlyMap<Trigger["id"], Trigger>;
  workspace: ProjectWorkspaceAggregate;
};

export function EventWorkspaceView({
  assetById,
  availableTriggers,
  backHref,
  deleteDisabled,
  deleteTarget,
  dialog,
  feedback,
  located,
  onCloseDeleteTarget,
  onCloseDialog,
  onConfirmDeleteTarget,
  onCreatePlayback,
  onCreateTrigger,
  onDeleteEvent,
  onDeleteEventTrigger,
  onDeleteTriggerPlayback,
  onEditEvent,
  onEditPlayback,
  onTriggerEnabledChange,
  playbackAssets,
  selectedDevice,
  selectedDeviceIsEnabled,
  selectedEvent,
  shareController,
  triggerById,
  workspace
}: EventWorkspaceViewProps) {
  return (
    <section className="grid min-h-[calc(100vh-64px)] grid-rows-[auto_1fr] bg-gray-25">
      <EventHeader
        backHref={backHref}
        located={located}
        onDeleteEvent={onDeleteEvent}
        onEditEvent={onEditEvent}
        selectedDevice={selectedDevice}
        shareController={shareController}
        workspace={workspace}
      />

      <main className="grid min-w-0 content-start items-start gap-5 px-4 py-4">
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
              onClick={onCreateTrigger}
              variant="primary"
            >
              Interaction
            </Button>
          </div>
          <EventTimeline
            assetById={assetById}
            onCreatePlayback={onCreatePlayback}
            onDeleteEventTrigger={onDeleteEventTrigger}
            onDeleteTriggerPlayback={onDeleteTriggerPlayback}
            onEditPlayback={onEditPlayback}
            onTriggerEnabledChange={onTriggerEnabledChange}
            selectedDeviceIsEnabled={selectedDeviceIsEnabled}
            selectedEvent={selectedEvent}
            triggerById={triggerById}
          />
        </div>

        {feedback && dialog === null ? (
          <p className="text-sm text-gray-600" role="status">
            {feedback}
          </p>
        ) : null}
      </main>

      <EventDeleteConfirms
        deleteTarget={deleteTarget}
        disabled={deleteDisabled}
        onCancel={onCloseDeleteTarget}
        onConfirm={onConfirmDeleteTarget}
      />

      <ShareLinkDeleteConfirm
        disabled={shareController.deleteSharingLinkIsPending}
        onCancel={() => shareController.setShareLinkPendingDelete(null)}
        onConfirm={() => void shareController.handleDeleteShareLink()}
        shareLink={shareController.shareLinkPendingDelete}
      />

      <EventDialogs
        assetById={assetById}
        availableTriggers={availableTriggers}
        onClose={onCloseDialog}
        playbackAssets={playbackAssets}
        request={dialog}
        selectedEvent={selectedEvent}
        shareController={shareController}
        triggerById={triggerById}
      />
    </section>
  );
}
