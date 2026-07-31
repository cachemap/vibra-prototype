"use client";

import { Suspense } from "react";
import { ErrorState, LoadingState, PageStateScaffold } from "@/components/primitives";
import { AudioPreviewProvider } from "@/features/projects/audio-preview-context";
import { FeedbackProvider } from "@/features/feedback/feedback-context";
import { LibraryContent } from "@/features/libraries/library-content";
import { LibraryDeleteConfirm } from "@/features/libraries/library-delete-confirm";
import { LibraryDialogs } from "@/features/libraries/library-dialogs";
import { LibraryRail } from "@/features/libraries/library-rail";
import { LibraryToolbar } from "@/features/libraries/library-toolbar";
import { useLibraryController } from "@/features/libraries/use-library-controller";
import { useLibrarySelection } from "@/features/libraries/use-library-selection";
import { libraryErrorFallback, messageForError } from "@/lib/errors";

export default function LibrariesPage() {
  return (
    <Suspense fallback={<LoadingState title="Loading asset libraries" />}>
      <FeedbackProvider errorFallback={libraryErrorFallback}>
        <AudioPreviewProvider>
          <LibrariesWorkspace />
        </AudioPreviewProvider>
      </FeedbackProvider>
    </Suspense>
  );
}

function LibrariesWorkspace() {
  const selection = useLibrarySelection();
  const controller = useLibraryController(selection);

  if (selection.librariesQuery.isLoading) {
    return (
      <PageStateScaffold breadcrumbs={[{ href: "/libraries", label: "Libraries" }]}>
        <LoadingState title="Loading asset libraries" description="Preparing the local library workspace." />
      </PageStateScaffold>
    );
  }

  if (selection.librariesQuery.isError) {
    return (
      <PageStateScaffold breadcrumbs={[{ href: "/libraries", label: "Libraries" }]}>
        <ErrorState
          title="Asset libraries unavailable"
          description={messageForError(selection.librariesQuery.error, libraryErrorFallback)}
        />
      </PageStateScaffold>
    );
  }

  const canCreateFolder = Boolean(selection.selectedFolder);
  const canUploadAsset = Boolean(selection.selectedFolder);
  return (
    <section className="grid min-h-[calc(100vh-64px)] grid-rows-[auto_1fr] bg-gray-25">
      {selection.selectedLibrarySummary ? (
        <LibraryToolbar
          canCreateFolder={canCreateFolder}
          canUploadAsset={canUploadAsset}
          folderHref={selection.folderHref}
          folderPath={selection.folderPath}
          itemCount={selection.selectedFolderItemCount}
          onCreateAsset={controller.openCreateAsset}
          onCreateFolder={controller.openCreateFolder}
          onDeleteFolder={controller.openDeleteFolder}
          selectedFolder={selection.selectedFolder}
          selectedLibraryName={selection.selectedLibrarySummary.library.name}
          setView={selection.setView}
        />
      ) : null}

      <div className="grid min-h-0 md:grid-cols-[268px_1fr]">
        <LibraryRail
          libraries={selection.filteredLibraries}
          librarySearchTerm={selection.librarySearchTerm}
          onCreateLibrary={controller.openCreateLibrary}
          onDeleteLibrary={controller.openDeleteLibrary}
          onLibrarySearchTermChange={selection.setLibrarySearchTerm}
          onSelectLibrary={selection.goToLibrary}
          selectedLibraryId={selection.selectedLibrarySummary?.library.id ?? null}
        />

        <LibraryContent canUploadAsset={canUploadAsset} controller={controller} selection={selection} />
      </div>

      <LibraryDialogs
        dialog={controller.dialog}
        libraryName={controller.libraryName}
        onClose={() => controller.setDialog(null)}
        onCreateAsset={controller.handleCreateAsset}
        onCreateFolder={controller.handleCreateFolder}
        onCreateLibrary={controller.handleCreateLibrary}
        onLibraryNameChange={controller.setLibraryName}
      />

      <LibraryDeleteConfirm
        disabled={controller.deleteIsPending}
        onCancel={() => controller.setDeleteTarget(null)}
        onConfirm={() => void controller.handleConfirmDelete()}
        target={controller.deleteTarget}
      />
    </section>
  );
}
