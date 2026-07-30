"use client";

import { Folder, Trash2 } from "lucide-react";
import {
  RowActionsMenu,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow
} from "@/components/primitives";
import type { Asset, AssetLibraryFolderId } from "@/domain";
import type { AssetLibraryFolderNode } from "@/data/repositories/project-repository";
import { AssetNameCell, AssetPreviewCell } from "@/features/assets/asset-cells";
import { assetExtensionFor, assetSourceLabelFor } from "@/features/assets/asset-metadata";
import { formatAssetDate } from "@/lib/format";
import { libraryIconMap } from "./library-icons";
import type { LibraryVisibleItem } from "./use-library-selection";

type LibraryAssetTableProps = {
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

export function LibraryAssetTable({ items, onDeleteAsset, onDeleteFolder, onOpenFolder }: LibraryAssetTableProps) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Name</TableHeaderCell>
          <TableHeaderCell>Type</TableHeaderCell>
          <TableHeaderCell>Library</TableHeaderCell>
          <TableHeaderCell>Last modified</TableHeaderCell>
          <TableHeaderCell>Preview</TableHeaderCell>
          <TableHeaderCell className="w-12 text-right">Actions</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {items.map((item) => {
          if (item.kind === "folder") {
            const Icon = libraryIconMap[item.node.folder.icon as keyof typeof libraryIconMap] ?? Folder;

            return (
              <TableRow
                className="cursor-pointer hover:bg-gray-50"
                key={item.node.folder.id}
                onClick={() => onOpenFolder(item.node.folder.id)}
              >
                <TableCell className="font-medium">
                  <span className="flex items-center gap-2">
                    <Icon className="size-4 text-gray-600" strokeWidth={1.8} />
                    {item.node.folder.name}
                  </span>
                </TableCell>
                <TableCell>File folder</TableCell>
                <TableCell>Folder</TableCell>
                <TableCell>-</TableCell>
                <TableCell>-</TableCell>
                <TableCell>
                  <ActionsMenu
                    deleteLabel="Delete folder"
                    label={`Open actions for ${item.node.folder.name}`}
                    onDelete={() => onDeleteFolder(item.node)}
                  />
                </TableCell>
              </TableRow>
            );
          }

          return (
            <TableRow key={item.asset.id}>
              <TableCell className="font-medium">
                <AssetNameCell asset={item.asset} />
              </TableCell>
              <TableCell>{assetExtensionFor(item.asset)}</TableCell>
              <TableCell>{assetSourceLabelFor(item.asset)}</TableCell>
              <TableCell>{formatAssetDate(item.asset.uploadedAt)}</TableCell>
              <TableCell>
                <AssetPreviewCell asset={item.asset} fallbackLabel="Visual only" previewKeyPrefix="library" />
              </TableCell>
              <TableCell>
                <ActionsMenu
                  deleteLabel="Delete asset"
                  label={`Open actions for ${item.asset.name}`}
                  onDelete={() => onDeleteAsset(item.asset)}
                />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
