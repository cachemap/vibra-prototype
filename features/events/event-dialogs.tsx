"use client";

import { DialogOverlay } from "@/components/primitives";
import type { DeviceEventAggregate, DeviceWorkspaceAggregate } from "@/data/repositories/project-repository";
import type { Asset, EventTriggerId, Trigger, TriggerPlaybackId } from "@/domain";
import { CreateTriggerDialog } from "@/features/events/create-trigger-dialog";
import { EditEventDialog } from "@/features/events/edit-event-dialog";
import { PlaybackDialog } from "@/features/events/playback-dialog";
import {
  ShareLinkDialog
} from "@/features/sharing/share-link-dialog";
import type { ShareLinkController } from "@/features/sharing/use-share-link";

export type EventDialogRequest =
  | {
      type: "editEvent";
    }
  | {
      type: "trigger";
    }
  | {
      eventTriggerId: EventTriggerId;
      type: "playback";
    }
  | {
      eventTriggerId: EventTriggerId;
      playbackId: TriggerPlaybackId;
      type: "editPlayback";
    }
  | {
      type: "share";
    };

type EventDialogsProps = {
  assetById: ReadonlyMap<Asset["id"], DeviceWorkspaceAggregate["playbackAssets"][number]>;
  availableTriggers: readonly Trigger[];
  onClose: () => void;
  playbackAssets: readonly DeviceWorkspaceAggregate["playbackAssets"][number][];
  request: EventDialogRequest | null;
  selectedEvent: DeviceEventAggregate;
  shareController: ShareLinkController;
  triggerById: ReadonlyMap<Trigger["id"], Trigger>;
};

export function EventDialogs({
  assetById,
  availableTriggers,
  onClose,
  playbackAssets,
  request,
  selectedEvent,
  shareController,
  triggerById
}: EventDialogsProps) {
  return (
    <DialogOverlay align="end" open={request !== null}>
      <ShareLinkDialog
        copyShareLink={shareController.copyShareLink}
        onClose={onClose}
        onDelete={shareController.openDeleteShareLinkDialog}
        open={request?.type === "share"}
        shareLabel={shareController.shareLabel}
        shareLink={shareController.shareLink}
      />

      <EditEventDialog onClose={onClose} open={request?.type === "editEvent"} selectedEvent={selectedEvent} />
      <CreateTriggerDialog
        availableTriggers={availableTriggers}
        onClose={onClose}
        open={request?.type === "trigger"}
        selectedEvent={selectedEvent}
        triggerById={triggerById}
      />
      <PlaybackDialog
        assetById={assetById}
        onClose={onClose}
        playbackAssets={playbackAssets}
        request={request?.type === "playback" || request?.type === "editPlayback" ? request : null}
        selectedEvent={selectedEvent}
      />
    </DialogOverlay>
  );
}
