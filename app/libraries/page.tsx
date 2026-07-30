"use client";

import { FormEvent, Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AudioLines,
  BookOpen,
  CheckCircle2,
  FileAudio,
  Folder,
  FolderPlus,
  Grid2X2,
  List,
  MousePointerClick,
  Plus,
  Sparkles,
  Trash2,
  Waves
} from "lucide-react";
import {
  Badge,
  Button,
  ConfirmDialog,
  DialogOverlay,
  EmptyState,
  ErrorState,
  FormDialog,
  IconButton,
  LoadingState,
  PageHeader,
  PageStateScaffold,
  RowActionsMenu,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TextInput
} from "@/components/primitives";
import {
  asEntityId,
  type AssetId,
  type AssetLibraryFolderId,
  type AssetLibraryId
} from "@/domain";
import type { Asset } from "@/domain";
import type { AssetLibraryFolderNode, AssetLibrarySummary } from "@/data/repositories/project-repository";
import {
  useAssetLibrariesQuery,
  useAssetLibraryTreeQuery,
  useCreateAssetLibraryFolderMutation,
  useCreateAssetLibraryMutation,
  useCreateAssetMutation,
  useDeleteAssetLibraryMutation,
  useDeleteAssetLibraryFolderMutation,
  useDeleteAssetMutation
} from "@/features/projects/queries";
import {
  AudioPreviewProvider,
  useAudioPreviewActions,
  useAudioPreviewState
} from "@/features/projects/audio-preview-context";
import {
  CreateAssetDialog,
  CreateAssetFolderDialog
} from "@/features/assets/asset-authoring-dialogs";
import { AssetNameCell, AssetPreviewCell } from "@/features/assets/asset-cells";
import {
  countAssetFolderDescendants,
  findAssetFolderNode,
  pathForAssetFolder
} from "@/features/assets/asset-folder-tree";
import { assetExtensionFor, assetSourceLabelFor } from "@/features/assets/asset-metadata";
import {
  FeedbackProvider,
  FeedbackText,
  useFeedbackActions,
  useFeedbackMessage
} from "@/features/feedback/feedback-context";
import { libraryErrorFallback, messageForError } from "@/lib/errors";
import { formatAssetDate } from "@/lib/format";
import { pluralSuffix } from "@/lib/plural";
import { hrefWithParams } from "@/lib/search-params";

const iconMap = {
  bell: AudioLines,
  "check-circle": CheckCircle2,
  folder: Folder,
  "mouse-pointer-click": MousePointerClick,
  sparkles: Sparkles
} as const;

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedLibraryParam = searchParams.get("library");
  const selectedFolderParam = searchParams.get("folder");
  const view = searchParams.get("view") === "tiles" ? "tiles" : "list";
  const librariesQuery = useAssetLibrariesQuery();
  const selectedLibrarySummary = useMemo(() => {
    const libraries = librariesQuery.data?.libraries ?? [];

    if (selectedLibraryParam) {
      const matched = libraries.find((summary) => summary.library.id === selectedLibraryParam);

      if (matched) {
        return matched;
      }
    }

    return libraries[0] ?? null;
  }, [librariesQuery.data?.libraries, selectedLibraryParam]);
  const treeQuery = useAssetLibraryTreeQuery(selectedLibrarySummary?.library.id ?? null);
  const [dialog, setDialog] = useState<"library" | "folder" | "asset" | null>(null);
  const [libraryName, setLibraryName] = useState("");
  const feedback = useFeedbackMessage();
  const { clearFeedback, runWithFeedback } = useFeedbackActions();
  const createLibrary = useCreateAssetLibraryMutation();
  const createFolder = useCreateAssetLibraryFolderMutation();
  const createAsset = useCreateAssetMutation();
  const deleteLibrary = useDeleteAssetLibraryMutation();
  const deleteFolder = useDeleteAssetLibraryFolderMutation();
  const deleteAsset = useDeleteAssetMutation();
  const audioPreview = useAudioPreviewState();
  const { stop } = useAudioPreviewActions();
  const [deleteTarget, setDeleteTarget] = useState<
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
      }
    | null
  >(null);
  const selectedFolder = useMemo(() => {
    if (!treeQuery.data) {
      return null;
    }

    if (selectedFolderParam) {
      const matched = findAssetFolderNode(
        treeQuery.data.rootFolder,
        asEntityId<AssetLibraryFolderId>(selectedFolderParam)
      );

      if (matched) {
        return matched;
      }
    }

    return treeQuery.data.rootFolder;
  }, [selectedFolderParam, treeQuery.data]);
  const folderPath = useMemo(
    () =>
      selectedFolder && treeQuery.data
        ? pathForAssetFolder(treeQuery.data.rootFolder, selectedFolder.folder.id).map((node) => node.folder)
        : [],
    [selectedFolder, treeQuery.data]
  );
  const visibleItems = useMemo(() => {
    if (!selectedFolder) {
      return [];
    }

    return [
      ...selectedFolder.childFolders.map((node) => ({ kind: "folder" as const, node })),
      ...selectedFolder.assets.map((asset) => ({ kind: "asset" as const, asset }))
    ];
  }, [selectedFolder]);
  const canCreateFolder = Boolean(selectedFolder);
  const canUploadAsset = Boolean(selectedFolder);
  const selectedFolderItemCount =
    (selectedFolder?.childFolders.length ?? 0) + (selectedFolder?.assets.length ?? 0);

  const goToLibrary = (libraryId: AssetLibraryId) => {
    router.push(hrefWithParams("/libraries", searchParams, { library: libraryId, folder: null }));
  };

  const openDeleteLibrary = (summary: AssetLibrarySummary) => {
    clearFeedback();
    setDeleteTarget({
      counts: {
        assets: summary.assetCount,
        folders: summary.folderCount
      },
      importedByProjectCount: summary.importedByProjectCount,
      kind: "library",
      libraryId: summary.library.id,
      name: summary.library.name
    });
  };

  const goToFolder = (folderId: AssetLibraryFolderId) => {
    router.push(hrefWithParams("/libraries", searchParams, { folder: folderId }));
  };

  const openCreateLibrary = () => {
    setLibraryName("");
    clearFeedback();
    setDialog("library");
  };

  const openCreateFolder = () => {
    clearFeedback();
    setDialog("folder");
  };

  const openCreateAsset = () => {
    clearFeedback();
    setDialog("asset");
  };

  const openDeleteFolder = (node: AssetLibraryFolderNode) => {
    clearFeedback();
    setDeleteTarget({
      counts: countAssetFolderDescendants(node),
      folderId: node.folder.id,
      kind: "folder",
      name: node.folder.name
    });
  };

  const openDeleteAsset = (asset: Asset) => {
    clearFeedback();
    setDeleteTarget({
      assetId: asset.id,
      kind: "asset",
      name: asset.name
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    await runWithFeedback({
      work: async () => {
      if (deleteTarget.kind === "library") {
        const fallbackLibrary = (librariesQuery.data?.libraries ?? []).find(
          (summary) => summary.library.id !== deleteTarget.libraryId
        );

        await deleteLibrary.mutateAsync(deleteTarget.libraryId);
        setDeleteTarget(null);

        if (fallbackLibrary) {
          goToLibrary(fallbackLibrary.library.id);
        } else {
          router.push("/libraries");
        }

        return `Deleted library ${deleteTarget.name}.`;
      }

      if (deleteTarget.kind === "folder") {
        const shouldReturnToRoot =
          Boolean(selectedFolderParam) &&
          folderPath.some((folder) => folder.id === deleteTarget.folderId);

        await deleteFolder.mutateAsync(deleteTarget.folderId);

        if (shouldReturnToRoot) {
          router.push(hrefWithParams("/libraries", searchParams, { folder: null }));
        }

        setDeleteTarget(null);
        return `Deleted folder ${deleteTarget.name}.`;
      } else {
        stop();
        await deleteAsset.mutateAsync(deleteTarget.assetId);
      }

      setDeleteTarget(null);
        return `Deleted asset ${deleteTarget.name}.`;
      },
      onSuccess: (message) => message
    });
  };

  const deleteIsPending = deleteLibrary.isPending || deleteFolder.isPending || deleteAsset.isPending;

  const renderActionsMenu = (label: string, onDelete: () => void, deleteLabel: string) => (
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

  const handleCreateLibrary = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await runWithFeedback({
      work: async () => {
      const created = await createLibrary.mutateAsync({ name: libraryName });
      setDialog(null);
      goToLibrary(created.library.id);
        return created;
      },
      onSuccess: (created) => `Created ${created.library.name}.`
    });
  };

  const handleCreateFolder = async ({ name, icon }: { name: string; icon: string }) => {
    if (!selectedLibrarySummary || !selectedFolder) {
      return;
    }

    await runWithFeedback({
      work: async () => {
        const folder = await createFolder.mutateAsync({
          libraryId: selectedLibrarySummary.library.id,
          parentFolderId: selectedFolder.folder.id,
          name,
          icon
        });
        setDialog(null);
        goToFolder(folder.id);
        return folder;
      },
      onSuccess: (folder) => `Created folder ${folder.name}.`
    });
  };

  const handleCreateAsset = async (input: {
    name: string;
    assetId: string;
    mediaKind: Asset["mediaKind"];
    originalFilename: string;
    blob: File;
    contentType?: string;
  }) => {
    if (!selectedLibrarySummary || !selectedFolder) {
      return;
    }

    await runWithFeedback({
      work: async () => {
        const asset = await createAsset.mutateAsync({
          libraryId: selectedLibrarySummary.library.id,
          folderId: selectedFolder.folder.id,
          ...input
        });
        setDialog(null);
        return asset;
      },
      onSuccess: (asset) => `Uploaded ${asset.mediaKind} asset ${asset.name}.`
    });
  };

  if (librariesQuery.isLoading) {
    return (
      <PageStateScaffold breadcrumbs={[{ href: "/libraries", label: "Libraries" }]}>
        <LoadingState title="Loading asset libraries" description="Preparing the local library workspace." />
      </PageStateScaffold>
    );
  }

  if (librariesQuery.isError) {
    return (
      <PageStateScaffold breadcrumbs={[{ href: "/libraries", label: "Libraries" }]}>
        <ErrorState title="Asset libraries unavailable" description={messageForError(librariesQuery.error, libraryErrorFallback)} />
      </PageStateScaffold>
    );
  }

  return (
    <section className="grid min-h-[calc(100vh-64px)] bg-gray-25">
      {selectedLibrarySummary ? (
        <div className="px-4 py-5">
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
                        onSelect: () => openDeleteFolder(selectedFolder)
                      }
                    ]}
                    label={`Open actions for ${selectedFolder.folder.name}`}
                  />
                ) : null}
                <IconButton
                  icon={Grid2X2}
                  label="Show tile view"
                  onClick={() => router.push(hrefWithParams("/libraries", searchParams, { view: "tiles" }))}
                />
                <IconButton
                  icon={List}
                  label="Show list view"
                  onClick={() => router.push(hrefWithParams("/libraries", searchParams, { view: "list" }))}
                />
                <Button
                  disabled={!canCreateFolder}
                  leftIcon={<FolderPlus className="size-4" />}
                  onClick={openCreateFolder}
                >
                  New folder
                </Button>
                <Button
                  disabled={!canUploadAsset}
                  leftIcon={<Plus className="size-4" />}
                  onClick={openCreateAsset}
                  variant="primary"
                >
                  New asset
                </Button>
              </>
            }
            breadcrumbs={[
              { label: "Libraries", href: "/libraries" },
              ...folderPath.map((folder) => ({
                label: folder.name,
                href: hrefWithParams("/libraries", searchParams, { folder: folder.id })
              }))
            ]}
            border={false}
            className="px-0 py-0"
            subtitle={`${selectedFolder?.folder.name ?? "Root"} contains ${selectedFolderItemCount} item${
              pluralSuffix(selectedFolderItemCount)
            }.`}
            title={selectedLibrarySummary.library.name}
          />
        </div>
      ) : null}

      <div className="grid min-h-0 md:grid-cols-[268px_1fr]">
        <aside className="border-b border-gray-300 bg-gray-50 px-4 py-5 md:border-b-0 md:border-r">
        <div className="grid gap-4">
          <div>
            <h1 className="text-md font-semibold text-gray-700">Asset Libraries</h1>
            <p className="mt-1 text-xs text-gray-500">Reusable audio and haptic source material.</p>
          </div>
          <TextInput
            id="library-search"
            placeholder="Search"
            aria-label="Search asset libraries"
            className="pl-9"
          />
          <div className="flex items-center justify-between text-sm font-semibold text-gray-700">
            <span>Libraries</span>
            <IconButton icon={Plus} label="Create library" onClick={openCreateLibrary} size="compact" />
          </div>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-1">
            {(librariesQuery.data?.libraries ?? []).map((summary) => {
              const selected = summary.library.id === selectedLibrarySummary?.library.id;

              return (
                <div
                  className={`grid grid-cols-[1fr_auto] items-start gap-2 rounded-xl border px-3 py-3 text-left transition-colors ${
                    selected
                      ? "border-gray-200 bg-gray-200"
                      : "border-gray-300 bg-gray-25 hover:bg-gray-100"
                  }`}
                  key={summary.library.id}
                >
                  <button
                    className="min-w-0 text-left"
                    onClick={() => goToLibrary(summary.library.id)}
                    type="button"
                  >
                    <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <BookOpen className="size-4 shrink-0 text-gray-600" strokeWidth={1.8} />
                      <span className="truncate">{summary.library.name}</span>
                    </span>
                    <span className="mt-1 block text-xs text-gray-500">
                      {summary.assetCount} assets, {summary.folderCount} folders
                    </span>
                    <span className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-medium text-gray-600">
                      {summary.defaultForProject ? (
                        <Badge>Default</Badge>
                      ) : null}
                      {summary.importedByProjectCount > 0 ? (
                        <Badge>Imported</Badge>
                      ) : null}
                    </span>
                  </button>
                  {summary.defaultForProject
                    ? null
                    : renderActionsMenu(
                        `Open actions for ${summary.library.name}`,
                        () => openDeleteLibrary(summary),
                        "Delete library"
                      )}
                </div>
              );
            })}
          </div>
        </div>
      </aside>

        <main className="grid min-w-0 content-start gap-5 px-4 py-5 md:px-6">
        {selectedLibrarySummary ? (
          <>
            {feedback ? <p className="text-sm font-medium text-gray-600" role="status">{feedback}</p> : null}
            {audioPreview.errorMessage ? (
              <p className="text-sm font-medium text-gray-600">{audioPreview.errorMessage}</p>
            ) : null}

            {treeQuery.isLoading ? (
              <LoadingState title="Loading library tree" description="Reading folders and assets from IndexedDB." />
            ) : null}
            {treeQuery.isError ? (
              <ErrorState title="Library tree unavailable" description={messageForError(treeQuery.error, libraryErrorFallback)} />
            ) : null}

            {!treeQuery.isLoading && !treeQuery.isError && visibleItems.length === 0 ? (
              <EmptyState
                action={
                  <Button disabled={!canUploadAsset} onClick={openCreateAsset} variant="primary">
                    Create asset
                  </Button>
                }
                title="This folder is empty"
                description="Upload an audio or haptic asset to shape the reusable library."
              />
            ) : null}

            {!treeQuery.isLoading && !treeQuery.isError && visibleItems.length > 0 && view === "list" ? (
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
                  {visibleItems.map((item) => {
                    if (item.kind === "folder") {
                      const Icon = iconMap[item.node.folder.icon as keyof typeof iconMap] ?? Folder;

                      return (
                        <TableRow
                          className="cursor-pointer hover:bg-gray-50"
                          key={item.node.folder.id}
                          onClick={() => goToFolder(item.node.folder.id)}
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
                            {renderActionsMenu(
                              `Open actions for ${item.node.folder.name}`,
                              () => openDeleteFolder(item.node),
                              "Delete folder"
                            )}
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
                          <AssetPreviewCell
                            asset={item.asset}
                            fallbackLabel="Visual only"
                            previewKeyPrefix="library"
                          />
                        </TableCell>
                        <TableCell>
                          {renderActionsMenu(
                            `Open actions for ${item.asset.name}`,
                            () => openDeleteAsset(item.asset),
                            "Delete asset"
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : null}

            {!treeQuery.isLoading && !treeQuery.isError && visibleItems.length > 0 && view === "tiles" ? (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3 pt-2">
                {visibleItems.map((item) => {
                  if (item.kind === "folder") {
                    const Icon = iconMap[item.node.folder.icon as keyof typeof iconMap] ?? Folder;
                    const itemCount = item.node.childFolders.length + item.node.assets.length;

                    return (
                      <div
                        className="grid min-h-[128px] content-between gap-3 rounded-lg border border-gray-300 bg-gray-25 px-3 py-3 text-left text-sm text-gray-700 hover:bg-gray-100"
                        key={item.node.folder.id}
                      >
                        <span className="flex min-w-0 items-start justify-between gap-2">
                          <button
                            className="flex min-w-0 flex-1 items-start gap-2 text-left"
                            onClick={() => goToFolder(item.node.folder.id)}
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
                          {renderActionsMenu(
                            `Open actions for ${item.node.folder.name}`,
                            () => openDeleteFolder(item.node),
                            "Delete folder"
                          )}
                        </span>
                        <span className="flex min-w-0 items-center">
                            <Badge className="truncate text-xs font-medium text-gray-600">
                              Folder
                            </Badge>
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
                          <Badge className="truncate text-xs font-medium text-gray-600">
                            {assetExtensionFor(item.asset)}
                          </Badge>
                        </span>
                        {renderActionsMenu(
                          `Open actions for ${item.asset.name}`,
                          () => openDeleteAsset(item.asset),
                          "Delete asset"
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{item.asset.name}</span>
                        <span className="block truncate text-xs text-gray-500">{assetSourceLabelFor(item.asset)}</span>
                        <span className="block truncate text-xs text-gray-500">Modified {formatAssetDate(item.asset.uploadedAt)}</span>
                      </span>
                      <span className="flex min-h-[30px] items-center">
                        <AssetPreviewCell
                          asset={item.asset}
                          fallbackLabel="Visual only"
                          previewKeyPrefix="library"
                        />
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </>
        ) : (
          <EmptyState
            action={<Button onClick={openCreateLibrary} variant="primary">Create library</Button>}
            title="No asset libraries"
            description="Create a reusable audio/haptic library to start the workspace."
          />
        )}
        </main>
      </div>

      {dialog === "library" ? (
        <DialogOverlay>
          <FormDialog
            className="w-full max-w-md"
            formId="create-library-form"
            onCancel={() => setDialog(null)}
            onSubmit={handleCreateLibrary}
            submitLabel="Create"
            title="New Library"
          >
            <TextInput
              id="library-name"
              label="Name"
              onChange={(event) => setLibraryName(event.target.value)}
              required
              value={libraryName}
            />
            <FeedbackText className="text-xs text-gray-600" />
          </FormDialog>
        </DialogOverlay>
      ) : null}

      {dialog === "folder" ? (
        <DialogOverlay>
          <CreateAssetFolderDialog
            onClose={() => setDialog(null)}
            onCreate={handleCreateFolder}
            open={dialog === "folder"}
          />
        </DialogOverlay>
      ) : null}

      {dialog === "asset" ? (
        <DialogOverlay>
          <CreateAssetDialog
            onClose={() => setDialog(null)}
            onCreate={handleCreateAsset}
            open={dialog === "asset"}
          />
        </DialogOverlay>
      ) : null}

      {deleteTarget ? (
        <ConfirmDialog
          confirmLabel={
            deleteTarget.kind === "library"
              ? "Delete library"
              : deleteTarget.kind === "folder"
                ? "Delete folder"
                : "Delete asset"
          }
          disabled={deleteIsPending}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => void handleConfirmDelete()}
          title={
            deleteTarget.kind === "library"
              ? "Delete library?"
              : deleteTarget.kind === "folder"
                ? "Delete folder?"
                : "Delete asset?"
          }
          cascadeSummary={
            deleteTarget.kind === "library"
              ? `${deleteTarget.counts.folders} folder${pluralSuffix(
                  deleteTarget.counts.folders
                )}, ${deleteTarget.counts.assets} asset${pluralSuffix(
                  deleteTarget.counts.assets
                )}, and ${deleteTarget.importedByProjectCount} project import${pluralSuffix(
                  deleteTarget.importedByProjectCount
                )}.`
              : deleteTarget.kind === "folder"
              ? `${deleteTarget.counts.folders} child folder${pluralSuffix(
                  deleteTarget.counts.folders
                )} and ${deleteTarget.counts.assets} asset${pluralSuffix(deleteTarget.counts.assets)}.`
              : "Stored file data and any scheduled playback rows that reference this asset."
          }
        >
          {deleteTarget.kind === "library"
            ? `This removes ${deleteTarget.name} from the asset library list.`
            : `This removes ${deleteTarget.name} from the selected asset library.`}
        </ConfirmDialog>
      ) : null}
    </section>
  );
}
