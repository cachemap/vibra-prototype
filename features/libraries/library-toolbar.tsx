"use client";

import { FolderPlus, Grid2X2, List, Plus, Trash2 } from "lucide-react";
import { Button, IconButton, PageHeader, RowActionsMenu } from "@/components/primitives";
import type { AssetLibraryFolder } from "@/domain";
import type { AssetLibraryFolderNode } from "@/data/repositories/project-repository";
import { pluralSuffix } from "@/lib/plural";
import type { LibraryView } from "./use-library-selection";

type LibraryToolbarProps = {
  canCreateFolder: boolean;
  canUploadAsset: boolean;
  folderHref: (folder: AssetLibraryFolder) => string;
  folderPath: readonly AssetLibraryFolder[];
  itemCount: number;
  onCreateAsset: () => void;
  onCreateFolder: () => void;
  onDeleteFolder: (node: AssetLibraryFolderNode) => void;
  selectedFolder: AssetLibraryFolderNode | null;
  selectedLibraryName: string;
  setView: (view: LibraryView) => void;
};

export function LibraryToolbar({
  canCreateFolder,
  canUploadAsset,
  folderHref,
  folderPath,
  itemCount,
  onCreateAsset,
  onCreateFolder,
  onDeleteFolder,
  selectedFolder,
  selectedLibraryName,
  setView
}: LibraryToolbarProps) {
  return (
    <PageHeader
      actions={
        <>
          {selectedFolder?.folder.parentFolderId ? (
            <RowActionsMenu
              items={[
                {
                  destructive: true,
                  icon: <Trash2 aria-hidden="true" className="size-4" />,
                  label: "Delete folder",
                  onSelect: () => onDeleteFolder(selectedFolder)
                }
              ]}
              label={`Open actions for ${selectedFolder.folder.name}`}
            />
          ) : null}
          <IconButton icon={Grid2X2} label="Show tile view" onClick={() => setView("tiles")} />
          <IconButton icon={List} label="Show list view" onClick={() => setView("list")} />
          <Button disabled={!canCreateFolder} leftIcon={<FolderPlus className="size-4" />} onClick={onCreateFolder}>
            New folder
          </Button>
          <Button disabled={!canUploadAsset} leftIcon={<Plus className="size-4" />} onClick={onCreateAsset} variant="primary">
            New asset
          </Button>
        </>
      }
      breadcrumbs={[
        { label: "Libraries", href: "/libraries" },
        ...folderPath.map((folder) => ({
          label: folder.name,
          href: folderHref(folder)
        }))
      ]}
      border={false}
      subtitle={`${selectedFolder?.folder.name ?? "Root"} contains ${itemCount} item${pluralSuffix(itemCount)}.`}
      title={selectedLibraryName}
    />
  );
}
