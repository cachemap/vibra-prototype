"use client";

import { useState } from "react";

import { DEMO_USER_ID } from "@/data/seed";
import type { ShareTarget, SharingLink } from "@/domain";
import {
  useDeleteSharingLinkMutation,
  useGenerateSharingLinkMutation
} from "@/features/projects/queries";
import { useFeedbackActions } from "@/features/feedback/feedback-context";

import { shareTokenFor } from "./share-token";

type ShareLinkDialogState = "share" | null;

type UseShareLinkOptions = {
  setDialog: (dialog: ShareLinkDialogState) => void;
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

export const useShareLink = ({ setDialog }: UseShareLinkOptions): ShareLinkController => {
  const [shareLink, setShareLink] = useState<SharingLink | null>(null);
  const [shareLinkPendingDelete, setShareLinkPendingDelete] = useState<SharingLink | null>(null);
  const [shareLabel, setShareLabel] = useState("");
  const { clearFeedback, reportError, setFeedback } = useFeedbackActions();
  const generateSharingLink = useGenerateSharingLinkMutation();
  const deleteSharingLink = useDeleteSharingLinkMutation();

  const openShareDialog = async (target: ShareTarget, label: string) => {
    clearFeedback();
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
      reportError(error);
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

    clearFeedback();
    setShareLinkPendingDelete(shareLink);
  };

  const handleDeleteShareLink = async () => {
    if (!shareLinkPendingDelete) {
      return;
    }

    clearFeedback();

    try {
      const deletedToken = shareTokenFor(shareLinkPendingDelete);

      await deleteSharingLink.mutateAsync(shareLinkPendingDelete.id);
      setShareLinkPendingDelete(null);
      setShareLink(null);
      setFeedback(`Deleted share link /share/${deletedToken}.`);
    } catch (error) {
      reportError(error);
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
