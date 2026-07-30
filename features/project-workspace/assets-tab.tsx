import { Fragment } from "react";
import { BookOpen, FolderPlus, MoreVertical, Plus, Trash2 } from "lucide-react";
import { Button, EmptyState, ErrorState, LoadingState, RowActionsMenu } from "@/components/primitives";
import type { Asset, AssetLibrary, AssetLibraryFolder, AssetLibraryFolderId, AssetLibraryId } from "@/domain";
import type { AssetLibraryFolderNode, AssetLibrarySummary } from "@/data/repositories/project-repository";
import { messageForError, workspaceErrorFallback } from "@/lib/errors";
import { pluralSuffix } from "@/lib/plural";
import { AssetLibraryRail } from "./asset-library-rail";
import { ProjectAssetTable, type ProjectAssetItem } from "./project-asset-table";

type ProjectAssetLibrary = {
  library: AssetLibrary;
  status: string;
};

type AssetsTabProps = {
  assetLibrariesLoading: boolean;
  importCandidateCount: number;
  itemCount: number;
  items: readonly ProjectAssetItem[];
  librarySummaryById: ReadonlyMap<AssetLibraryId, AssetLibrarySummary>;
  onCreateAsset: () => void;
  onCreateFolder: () => void;
  onDeleteAsset: (asset: Asset) => void;
  onDeleteFolder: (node: AssetLibraryFolderNode) => void;
  onImportLibrary: () => void;
  onOpenFolder: (folderId: AssetLibraryFolderId) => void;
  onSelectLibrary: (libraryId: AssetLibraryId) => void;
  projectAssetLibraries: readonly ProjectAssetLibrary[];
  selectedFolder: AssetLibraryFolderNode | null;
  selectedFolderPath: readonly AssetLibraryFolder[];
  selectedLibrary: ProjectAssetLibrary | null;
  treeError: unknown;
  treeIsError: boolean;
  treeIsLoading: boolean;
  deviceName: string;
};

export function AssetsTab({
  assetLibrariesLoading,
  importCandidateCount,
  itemCount,
  items,
  librarySummaryById,
  onCreateAsset,
  onCreateFolder,
  onDeleteAsset,
  onDeleteFolder,
  onImportLibrary,
  onOpenFolder,
  onSelectLibrary,
  projectAssetLibraries,
  selectedFolder,
  selectedFolderPath,
  selectedLibrary,
  treeError,
  treeIsError,
  treeIsLoading,
  deviceName
}: AssetsTabProps) {
  return (
    <div className="grid gap-4" data-testid="project-asset-libraries">
      <div className="flex min-h-[34px] flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <BookOpen className="size-4 text-gray-500" />
            Asset Libraries
          </h3>
          <p className="text-xs text-gray-500">Libraries available to events on {deviceName}.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {selectedFolder?.folder.parentFolderId ? (
            <RowActionsMenu
              grouped
              icon={MoreVertical}
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
          <Button disabled={!selectedFolder} leftIcon={<FolderPlus className="size-4" />} onClick={onCreateFolder}>
            New folder
          </Button>
          <Button
            disabled={!selectedFolder}
            leftIcon={<Plus className="size-4" />}
            onClick={onCreateAsset}
            variant="primary"
          >
            New asset
          </Button>
          <Button
            disabled={!importCandidateCount || assetLibrariesLoading}
            leftIcon={<Plus className="size-4" />}
            onClick={onImportLibrary}
          >
            Import library
          </Button>
        </div>
      </div>

      {projectAssetLibraries.length ? (
        <div className="grid gap-4 xl:grid-cols-[268px_1fr]">
          <AssetLibraryRail
            libraries={projectAssetLibraries}
            librarySummaryById={librarySummaryById}
            onSelectLibrary={onSelectLibrary}
            selectedLibraryId={selectedLibrary?.library.id ?? null}
          />

          <div className="grid min-w-0 content-start gap-3">
            <div className="flex min-h-[34px] flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1 text-sm text-gray-500">
                  <span className="truncate font-medium text-gray-600">
                    {selectedLibrary?.library.name ?? "Asset library"}
                  </span>
                  {selectedFolderPath.map((folder) => (
                    <Fragment key={folder.id}>
                      <span aria-hidden="true">/</span>
                      <button
                        className="max-w-[220px] truncate rounded-md px-1 font-medium text-gray-600 hover:bg-gray-100"
                        onClick={() => onOpenFolder(folder.id)}
                        type="button"
                      >
                        {folder.name}
                      </button>
                    </Fragment>
                  ))}
                </div>
                <h4 className="truncate text-md font-semibold text-gray-700">
                  {selectedFolder?.folder.name ?? "Library contents"}
                </h4>
                <p className="text-xs text-gray-500">
                  {itemCount} item{pluralSuffix(itemCount)} available for playback scheduling.
                </p>
              </div>
            </div>

            {treeIsLoading ? (
              <LoadingState title="Loading asset library" description="Reading folders and assets." />
            ) : null}
            {treeIsError ? (
              <ErrorState
                title="Asset library unavailable"
                description={messageForError(treeError, workspaceErrorFallback)}
              />
            ) : null}

            {!treeIsLoading && !treeIsError && items.length === 0 ? (
              <EmptyState
                action={
                  <Button onClick={onCreateAsset} variant="primary">
                    Create asset
                  </Button>
                }
                title="This folder is empty"
                description="Upload an audio or haptic asset to make it available for playback scheduling."
              />
            ) : null}

            {!treeIsLoading && !treeIsError && items.length > 0 ? (
              <ProjectAssetTable
                items={items}
                onDeleteAsset={onDeleteAsset}
                onDeleteFolder={onDeleteFolder}
                onOpenFolder={onOpenFolder}
              />
            ) : null}
          </div>
        </div>
      ) : (
        <EmptyState title="No matching libraries" description="Clear search to show this project's asset libraries." />
      )}
    </div>
  );
}
