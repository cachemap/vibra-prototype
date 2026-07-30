"use client";

import { DialogOverlay } from "@/components/primitives";
import {
  ShareLinkDeleteConfirm,
  ShareLinkDialog
} from "@/features/sharing/share-link-dialog";
import type { ShareLinkController } from "@/features/sharing/use-share-link";
import { AssetDialog, AssetFolderDialog } from "./workspace-dialogs-asset";
import { CollectionDialog } from "./workspace-dialogs-collection";
import { CreateDeviceDialog } from "./workspace-dialogs-device";
import { CreateEventDialog } from "./workspace-dialogs-event";
import { ImportLibraryDialog } from "./workspace-dialogs-import";
import {
  useProjectDialogRequest,
  useProjectWorkspaceActions
} from "./workspace-scope-context";

type WorkspaceDialogsProps = {
  shareController: ShareLinkController;
};

export function WorkspaceDialogs({ shareController }: WorkspaceDialogsProps) {
  const dialog = useProjectDialogRequest();
  const { setDialogRequest } = useProjectWorkspaceActions();

  return (
    <>
      <ShareLinkDeleteConfirm
        disabled={shareController.deleteSharingLinkIsPending}
        onCancel={() => shareController.setShareLinkPendingDelete(null)}
        onConfirm={() => void shareController.handleDeleteShareLink()}
        shareLink={shareController.shareLinkPendingDelete}
      />

      <DialogOverlay align="end" open={dialog !== null}>
        {dialog === "share" ? (
          <ShareLinkDialog
            copyShareLink={shareController.copyShareLink}
            onClose={() => setDialogRequest(null)}
            onDelete={shareController.openDeleteShareLinkDialog}
            open
            shareLabel={shareController.shareLabel}
            shareLink={shareController.shareLink}
          />
        ) : null}

        {dialog === "device" ? <CreateDeviceDialog /> : null}
        {dialog === "collection" || dialog === "editCollection" ? <CollectionDialog /> : null}
        {dialog === "event" ? <CreateEventDialog /> : null}
        {dialog === "libraryImport" ? <ImportLibraryDialog /> : null}
        {dialog === "assetFolder" ? <AssetFolderDialog /> : null}
        {dialog === "asset" ? <AssetDialog /> : null}
      </DialogOverlay>
    </>
  );
}
