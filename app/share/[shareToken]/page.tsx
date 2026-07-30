"use client";

import { useParams } from "next/navigation";

import { Breadcrumbs, Button, ErrorState, LoadingState } from "@/components/primitives";
import { useSharingLinkPreviewQuery } from "@/features/projects/queries";
import { SharePreviewContent } from "@/features/share-preview/share-preview-content";
import { messageForError, shareErrorFallback } from "@/lib/errors";

export default function SharePage() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const previewQuery = useSharingLinkPreviewQuery(shareToken);
  const sharePath = `/share/${shareToken}`;

  const copyLink = async () => {
    const absoluteUrl = `${window.location.origin}${sharePath}`;

    try {
      await navigator.clipboard.writeText(absoluteUrl);
    } catch {
      await navigator.clipboard.writeText(sharePath);
    }
  };

  if (previewQuery.isLoading) {
    return (
      <section className="px-4 py-5">
        <LoadingState title="Loading share target" description="Resolving the local Vibra preview." />
      </section>
    );
  }

  if (previewQuery.isError || !previewQuery.data) {
    return (
      <section className="grid gap-5 px-4 py-5">
        <Breadcrumbs
          items={[
            { href: "/projects", label: "Projects" },
            { label: "Invalid share link" }
          ]}
        />
        <ErrorState
          title="Invalid share link"
          description={messageForError(previewQuery.error, shareErrorFallback)}
          action={<Button onClick={() => void previewQuery.refetch()}>Retry</Button>}
        />
      </section>
    );
  }

  return (
    <section className="grid gap-5 px-4 py-5">
      <SharePreviewContent
        onCopyLink={() => void copyLink()}
        preview={previewQuery.data}
        sharePath={sharePath}
      />
      <div className="min-h-10 border-y border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-700">
        Disabled devices and disabled event interactions remain visible here, but are excluded from playback/export.
      </div>
    </section>
  );
}
