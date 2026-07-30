"use client";

import { Copy, ExternalLink, Trash2 } from "lucide-react";

import {
  Button,
  ConfirmDialog,
  Dialog
} from "@/components/primitives";
import type { SharingLink } from "@/domain";

import { shareTokenFor } from "./share-token";

type ShareLinkDialogProps = {
  copyShareLink: () => Promise<void>;
  onClose: () => void;
  onDelete: () => void;
  open: boolean;
  shareLabel: string;
  shareLink: SharingLink | null;
};

export function ShareLinkDialog({
  copyShareLink,
  onClose,
  onDelete,
  open,
  shareLabel,
  shareLink
}: ShareLinkDialogProps) {
  return (
    <Dialog
      actions={
        <>
          <Button onClick={onClose}>Close</Button>
          <Button
            disabled={!shareLink}
            leftIcon={<Trash2 className="size-4" />}
            onClick={onDelete}
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
      open={open}
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
  );
}

type ShareLinkDeleteConfirmProps = {
  disabled: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  shareLink: SharingLink | null;
};

export function ShareLinkDeleteConfirm({
  disabled,
  onCancel,
  onConfirm,
  shareLink
}: ShareLinkDeleteConfirmProps) {
  if (!shareLink) {
    return null;
  }

  return (
    <ConfirmDialog
      confirmLabel="Delete link"
      disabled={disabled}
      onCancel={onCancel}
      onConfirm={onConfirm}
      title="Delete share link?"
    >
      This removes /share/{shareTokenFor(shareLink)} from IndexedDB. The shared preview URL will stop
      resolving.
    </ConfirmDialog>
  );
}
