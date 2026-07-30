"use client";

import { Button, EmptyState, ErrorState, LoadingState } from "@/components/primitives";
import { useAudioPreviewState } from "@/features/projects/audio-preview-context";
import { FeedbackBanner } from "@/features/feedback/feedback-context";
import { libraryErrorFallback, messageForError } from "@/lib/errors";
import { LibraryAssetTable } from "./library-asset-table";
import { LibraryAssetTiles } from "./library-asset-tiles";
import type { useLibraryController } from "./use-library-controller";
import type { useLibrarySelection } from "./use-library-selection";

type LibraryContentProps = {
  canUploadAsset: boolean;
  controller: ReturnType<typeof useLibraryController>;
  selection: ReturnType<typeof useLibrarySelection>;
};

export function LibraryContent({ canUploadAsset, controller, selection }: LibraryContentProps) {
  const audioPreview = useAudioPreviewState();

  return (
    <main className="grid min-w-0 content-start gap-5 px-4 py-5 md:px-6">
      {selection.selectedLibrarySummary ? (
        <>
          <FeedbackBanner />
          {audioPreview.errorMessage ? (
            <p className="text-sm font-medium text-gray-600">{audioPreview.errorMessage}</p>
          ) : null}

          {selection.treeQuery.isLoading ? (
            <LoadingState title="Loading library tree" description="Reading folders and assets from IndexedDB." />
          ) : null}
          {selection.treeQuery.isError ? (
            <ErrorState
              title="Library tree unavailable"
              description={messageForError(selection.treeQuery.error, libraryErrorFallback)}
            />
          ) : null}

          {!selection.treeQuery.isLoading && !selection.treeQuery.isError && selection.visibleItems.length === 0 ? (
            <EmptyState
              action={
                <Button disabled={!canUploadAsset} onClick={controller.openCreateAsset} variant="primary">
                  Create asset
                </Button>
              }
              title="This folder is empty"
              description="Upload an audio or haptic asset to shape the reusable library."
            />
          ) : null}

          {!selection.treeQuery.isLoading &&
          !selection.treeQuery.isError &&
          selection.visibleItems.length > 0 &&
          selection.view === "list" ? (
            <LibraryAssetTable
              items={selection.visibleItems}
              onDeleteAsset={controller.openDeleteAsset}
              onDeleteFolder={controller.openDeleteFolder}
              onOpenFolder={selection.goToFolder}
            />
          ) : null}

          {!selection.treeQuery.isLoading &&
          !selection.treeQuery.isError &&
          selection.visibleItems.length > 0 &&
          selection.view === "tiles" ? (
            <LibraryAssetTiles
              items={selection.visibleItems}
              onDeleteAsset={controller.openDeleteAsset}
              onDeleteFolder={controller.openDeleteFolder}
              onOpenFolder={selection.goToFolder}
            />
          ) : null}
        </>
      ) : (
        <EmptyState
          action={
            <Button onClick={controller.openCreateLibrary} variant="primary">
              Create library
            </Button>
          }
          title="No asset libraries"
          description="Create a reusable audio/haptic library to start the workspace."
        />
      )}
    </main>
  );
}
