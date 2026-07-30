"use client";

import type { SharingLinkPreviewAggregate } from "@/data/repositories/project-repository";
import { AudioPreviewProvider } from "@/features/projects/audio-preview-context";

import { SharePreviewDevice } from "./share-preview-device";
import { SharePreviewEvent } from "./share-preview-event";
import { SharePreviewHeader } from "./share-preview-header";
import { SharePreviewMatrix } from "./share-preview-matrix";

type SharePreviewContentProps = {
  onCopyLink: () => void;
  preview: SharingLinkPreviewAggregate;
};

export function SharePreviewContent({ onCopyLink, preview }: SharePreviewContentProps) {
  const target = preview.target;

  return (
    <AudioPreviewProvider>
      <SharePreviewHeader onCopyLink={onCopyLink} preview={preview} />
      {target.kind === "project" ? <SharePreviewDevice target={target} /> : null}
      {target.kind === "event" ? <SharePreviewEvent target={target} /> : null}
      {target.kind === "collisionMatrixEntry" ? <SharePreviewMatrix target={target} /> : null}
    </AudioPreviewProvider>
  );
}
