"use client";

import type { SharingLinkPreviewAggregate } from "@/data/repositories/project-repository";
import { AudioPreviewProvider } from "@/features/projects/audio-preview-context";

import { SharePreviewDevice } from "./share-preview-device";
import { SharePreviewEvent } from "./share-preview-event";
import { SharePreviewHeader, targetKindFor, targetLabelFor } from "./share-preview-header";
import { SharePreviewMatrix } from "./share-preview-matrix";
import { SharePreviewSummaryTable } from "./share-preview-summary-table";

type SharePreviewContentProps = {
  onCopyLink: () => void;
  preview: SharingLinkPreviewAggregate;
  sharePath: string;
};

export function SharePreviewContent({ onCopyLink, preview, sharePath }: SharePreviewContentProps) {
  const target = preview.target;
  const targetLabel = targetLabelFor(target);
  const targetKind = targetKindFor(target);

  return (
    <AudioPreviewProvider>
      <SharePreviewHeader onCopyLink={onCopyLink} preview={preview} sharePath={sharePath} />
      <SharePreviewSummaryTable
        createdBy={preview.createdByUser.preferredName}
        sharePath={sharePath}
        targetKind={targetKind}
        targetLabel={targetLabel}
      />
      {target.kind === "project" ? <SharePreviewDevice target={target} /> : null}
      {target.kind === "event" ? <SharePreviewEvent target={target} /> : null}
      {target.kind === "collisionMatrixEntry" ? <SharePreviewMatrix target={target} /> : null}
    </AudioPreviewProvider>
  );
}
