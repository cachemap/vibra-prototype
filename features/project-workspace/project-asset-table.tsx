import { BookOpen, MoreVertical, Trash2 } from "lucide-react";
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

export type ProjectAssetItem =
  | {
      kind: "folder";
      node: AssetLibraryFolderNode;
    }
  | {
      kind: "asset";
      asset: Asset;
    };

type ProjectAssetTableProps = {
  items: readonly ProjectAssetItem[];
  onDeleteAsset: (asset: Asset) => void;
  onDeleteFolder: (node: AssetLibraryFolderNode) => void;
  onOpenFolder: (folderId: AssetLibraryFolderId) => void;
};

export function ProjectAssetTable({
  items,
  onDeleteAsset,
  onDeleteFolder,
  onOpenFolder
}: ProjectAssetTableProps) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Name</TableHeaderCell>
          <TableHeaderCell>Type</TableHeaderCell>
          <TableHeaderCell>Source</TableHeaderCell>
          <TableHeaderCell>Preview</TableHeaderCell>
          <TableHeaderCell className="w-12 text-right">Actions</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {items.map((item) => {
          if (item.kind === "folder") {
            return (
              <TableRow
                className="cursor-pointer hover:bg-gray-50"
                key={item.node.folder.id}
                onClick={() => onOpenFolder(item.node.folder.id)}
              >
                <TableCell className="font-medium">
                  <span className="flex items-center gap-2">
                    <BookOpen className="size-4 text-gray-600" strokeWidth={1.8} />
                    {item.node.folder.name}
                  </span>
                </TableCell>
                <TableCell>Folder</TableCell>
                <TableCell>Folder</TableCell>
                <TableCell>-</TableCell>
                <TableCell>
                  <div className="flex justify-end" onClick={(event) => event.stopPropagation()}>
                    <RowActionsMenu
                      grouped
                      icon={MoreVertical}
                      items={[
                        {
                          destructive: true,
                          icon: <Trash2 aria-hidden="true" className="size-4" />,
                          label: "Delete folder",
                          onSelect: () => onDeleteFolder(item.node)
                        }
                      ]}
                      label={`Open actions for ${item.node.folder.name}`}
                      size="compact"
                    />
                  </div>
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
              <TableCell>
                <AssetPreviewCell
                  asset={item.asset}
                  fallbackLabel="Visual"
                  previewKeyPrefix="asset-library"
                />
              </TableCell>
              <TableCell>
                <div className="flex justify-end">
                  <RowActionsMenu
                    grouped
                    icon={MoreVertical}
                    items={[
                      {
                        destructive: true,
                        icon: <Trash2 aria-hidden="true" className="size-4" />,
                        label: "Delete asset",
                        onSelect: () => onDeleteAsset(item.asset)
                      }
                    ]}
                    label={`Open actions for ${item.asset.name}`}
                    size="compact"
                  />
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
