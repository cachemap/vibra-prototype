"use client";

import { ConfirmDialog } from "@/components/primitives";
import type { AssetId, AssetLibraryFolderId, AssetLibraryId } from "@/domain";
import { pluralSuffix } from "@/lib/plural";

export type LibraryDeleteTarget =
  | {
      assetId: AssetId;
      kind: "asset";
      name: string;
    }
  | {
      counts: {
        assets: number;
        folders: number;
      };
      importedByProjectCount: number;
      kind: "library";
      libraryId: AssetLibraryId;
      name: string;
    }
  | {
      counts: {
        assets: number;
        folders: number;
      };
      folderId: AssetLibraryFolderId;
      kind: "folder";
      name: string;
    };

function confirmLabelFor(target: LibraryDeleteTarget) {
  switch (target.kind) {
    case "library":
      return "Delete library";
    case "folder":
      return "Delete folder";
    case "asset":
      return "Delete asset";
  }
}

function titleFor(target: LibraryDeleteTarget) {
  switch (target.kind) {
    case "library":
      return "Delete library?";
    case "folder":
      return "Delete folder?";
    case "asset":
      return "Delete asset?";
  }
}

function cascadeSummaryFor(target: LibraryDeleteTarget) {
  switch (target.kind) {
    case "library":
      return `${target.counts.folders} folder${pluralSuffix(target.counts.folders)}, ${target.counts.assets} asset${pluralSuffix(
        target.counts.assets
      )}, and ${target.importedByProjectCount} project import${pluralSuffix(target.importedByProjectCount)}.`;
    case "folder":
      return `${target.counts.folders} child folder${pluralSuffix(target.counts.folders)} and ${
        target.counts.assets
      } asset${pluralSuffix(target.counts.assets)}.`;
    case "asset":
      return "Stored file data and any scheduled playback rows that reference this asset.";
  }
}

function bodyCopyFor(target: LibraryDeleteTarget) {
  switch (target.kind) {
    case "library":
      return `This removes ${target.name} from the asset library list.`;
    case "folder":
    case "asset":
      return `This removes ${target.name} from the selected asset library.`;
  }
}

type LibraryDeleteConfirmProps = {
  disabled: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  target: LibraryDeleteTarget | null;
};

export function LibraryDeleteConfirm({ disabled, onCancel, onConfirm, target }: LibraryDeleteConfirmProps) {
  if (!target) {
    return null;
  }

  return (
    <ConfirmDialog
      confirmLabel={confirmLabelFor(target)}
      disabled={disabled}
      onCancel={onCancel}
      onConfirm={onConfirm}
      title={titleFor(target)}
      cascadeSummary={cascadeSummaryFor(target)}
    >
      {bodyCopyFor(target)}
    </ConfirmDialog>
  );
}
