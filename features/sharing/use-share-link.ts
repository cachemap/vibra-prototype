"use client";

import { useState } from "react";

import { DEMO_USER_ID } from "@/data/seed";
import type { ShareTarget, SharingLink } from "@/domain";
import {
  useDeleteSharingLinkMutation,
  useGenerateSharingLinkMutation
} from "@/features/projects/queries";
import { messageForError } from "@/lib/errors";

import { shareTokenFor } from "./share-token";

type ShareLinkDialogState = "share" | null;

type UseShareLinkOptions = {
  errorFallback: string;
  setDialog: (dialog: ShareLinkDialogState) => void;
  setFeedback: (message: string | null) => void;
};

export type ShareLinkController = {
  copyShareLink: () => Promise<void>;
  deleteSharingLinkIsPending: boolean;
  handleDeleteShareLink: () => Promise<void>;
  openDeleteShareLinkDialog: () => void;
  openShareDialog: (target: ShareTarget, label: string) => Promise<void>;
  setShareLinkPendingDelete: (link: SharingLink | null) => void;
  shareLabel: string;
  shareLink: SharingLink | null;
  shareLinkPendingDelete: SharingLink | null;
};

export const useShareLink = ({
  errorFallback,
  setDialog,
  setFeedback
}: UseShareLinkOptions): ShareLinkController => {
  const [shareLink, setShareLink] = useState<SharingLink | null>(null);
  const [shareLinkPendingDelete, setShareLinkPendingDelete] = useState<SharingLink | null>(null);
  const [shareLabel, setShareLabel] = useState("");
  const generateSharingLink = useGenerateSharingLinkMutation();
  const deleteSharingLink = useDeleteSharingLinkMutation();

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
      setFeedback(messageForError(error, errorFallback));
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
      setFeedback(messageForError(error, errorFallback));
    }
  };

  return {
    copyShareLink,
    deleteSharingLinkIsPending: deleteSharingLink.isPending,
    handleDeleteShareLink,
    openDeleteShareLinkDialog,
    openShareDialog,
    setShareLinkPendingDelete,
    shareLabel,
    shareLink,
    shareLinkPendingDelete
  };
};
