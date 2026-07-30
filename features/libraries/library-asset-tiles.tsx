"use client";

import { FileAudio, Folder, Trash2, Waves } from "lucide-react";
import { Badge, RowActionsMenu } from "@/components/primitives";
import type { Asset, AssetLibraryFolderId } from "@/domain";
import type { AssetLibraryFolderNode } from "@/data/repositories/project-repository";
import { AssetPreviewCell } from "@/features/assets/asset-cells";
import { assetExtensionFor, assetSourceLabelFor } from "@/features/assets/asset-metadata";
import { formatAssetDate } from "@/lib/format";
import { pluralSuffix } from "@/lib/plural";
import { libraryIconMap } from "./library-icons";
import type { LibraryVisibleItem } from "./use-library-selection";

type LibraryAssetTilesProps = {
  items: readonly LibraryVisibleItem[];
  onDeleteAsset: (asset: Asset) => void;
  onDeleteFolder: (node: AssetLibraryFolderNode) => void;
  onOpenFolder: (folderId: AssetLibraryFolderId) => void;
};

function ActionsMenu({ deleteLabel, label, onDelete }: { deleteLabel: string; label: string; onDelete: () => void }) {
  return (
    <span className="inline-flex justify-end">
      <RowActionsMenu
        items={[
          {
            destructive: true,
            icon: <Trash2 className="size-4" />,
            label: deleteLabel,
            onSelect: onDelete
          }
        ]}
        label={label}
        size="compact"
      />
    </span>
  );
}

export function LibraryAssetTiles({ items, onDeleteAsset, onDeleteFolder, onOpenFolder }: LibraryAssetTilesProps) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3 pt-2">
      {items.map((item) => {
        if (item.kind === "folder") {
          const Icon = libraryIconMap[item.node.folder.icon as keyof typeof libraryIconMap] ?? Folder;
          const itemCount = item.node.childFolders.length + item.node.assets.length;

          return (
            <div
              className="grid min-h-[128px] content-between gap-3 rounded-lg border border-gray-300 bg-gray-25 px-3 py-3 text-left text-sm text-gray-700 hover:bg-gray-100"
              key={item.node.folder.id}
            >
              <span className="flex min-w-0 items-start justify-between gap-2">
                <button
                  className="flex min-w-0 flex-1 items-start gap-2 text-left"
                  onClick={() => onOpenFolder(item.node.folder.id)}
                  type="button"
                >
                  <Icon className="size-5 shrink-0 text-gray-700" strokeWidth={1.6} />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{item.node.folder.name}</span>
                    <span className="block text-xs text-gray-500">
                      {itemCount} item{pluralSuffix(itemCount)}
                    </span>
                  </span>
                </button>
                <ActionsMenu
                  deleteLabel="Delete folder"
                  label={`Open actions for ${item.node.folder.name}`}
                  onDelete={() => onDeleteFolder(item.node)}
                />
              </span>
              <span className="flex min-w-0 items-center">
                <Badge className="truncate text-xs font-medium text-gray-600">Folder</Badge>
              </span>
            </div>
          );
        }

        const Icon = item.asset.mediaKind === "audio" ? FileAudio : Waves;

        return (
          <div
            className="grid min-h-[156px] content-between gap-3 rounded-lg border border-gray-300 bg-gray-25 px-3 py-3 text-left text-sm text-gray-700"
            key={item.asset.id}
          >
            <span className="flex min-w-0 items-start justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2">
                <Icon className="size-5 shrink-0 text-gray-700" strokeWidth={1.6} />
                <Badge className="truncate text-xs font-medium text-gray-600">{assetExtensionFor(item.asset)}</Badge>
              </span>
              <ActionsMenu
                deleteLabel="Delete asset"
                label={`Open actions for ${item.asset.name}`}
                onDelete={() => onDeleteAsset(item.asset)}
              />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-medium">{item.asset.name}</span>
              <span className="block truncate text-xs text-gray-500">{assetSourceLabelFor(item.asset)}</span>
              <span className="block truncate text-xs text-gray-500">Modified {formatAssetDate(item.asset.uploadedAt)}</span>
            </span>
            <span className="flex min-h-[30px] items-center">
              <AssetPreviewCell asset={item.asset} fallbackLabel="Visual only" previewKeyPrefix="library" />
            </span>
          </div>
        );
      })}
    </div>
  );
}
