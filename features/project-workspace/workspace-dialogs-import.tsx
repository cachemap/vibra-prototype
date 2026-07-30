"use client";

import { type FormEvent, useMemo, useState } from "react";
import { FormDialog, Select } from "@/components/primitives";
import { asEntityId, type AssetLibraryId } from "@/domain";
import { useFeedbackActions, FeedbackText } from "@/features/feedback/feedback-context";
import {
  useAssetLibrariesQuery,
  useImportAssetLibraryMutation,
  useProjectWorkspaceQuery
} from "@/features/projects/queries";
import {
  useProjectDialogRequest,
  useProjectWorkspaceActions,
  useProjectWorkspaceSelection
} from "./workspace-scope-context";

export function ImportLibraryDialog() {
  const dialog = useProjectDialogRequest();
  const { projectId } = useProjectWorkspaceSelection();
  const { setDialogRequest } = useProjectWorkspaceActions();
  const { runWithFeedback } = useFeedbackActions();
  const workspaceQuery = useProjectWorkspaceQuery(projectId);
  const assetLibrariesQuery = useAssetLibrariesQuery();
  const importAssetLibrary = useImportAssetLibraryMutation();
  const importedLibraryIds = useMemo(
    () => new Set((workspaceQuery.data?.importedAssetLibraries ?? []).map((library) => library.id)),
    [workspaceQuery.data?.importedAssetLibraries]
  );
  const importCandidates = useMemo(() => {
    const workspace = workspaceQuery.data;

    if (!workspace) {
      return [];
    }

    return (assetLibrariesQuery.data?.libraries ?? []).filter(
      (summary) =>
        summary.library.id !== workspace.defaultAssetLibrary.id && !importedLibraryIds.has(summary.library.id)
    );
  }, [assetLibrariesQuery.data?.libraries, importedLibraryIds, workspaceQuery.data]);
  const workspace = workspaceQuery.data;
  const [importLibraryId, setImportLibraryId] = useState<string>(importCandidates[0]?.library.id ?? "");

  const handleImportLibrary = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const libraryId = importLibraryId || importCandidates[0]?.library.id;

    if (!libraryId) {
      return;
    }

    await runWithFeedback({
      work: async () => {
        const imported = await importAssetLibrary.mutateAsync({
          projectId,
          assetLibraryId: asEntityId<AssetLibraryId>(libraryId)
        });
        const library = assetLibrariesQuery.data?.libraries.find(
          (summary) => summary.library.id === imported.assetLibraryId
        )?.library;

        setDialogRequest(null);
        return library?.name ?? "asset library";
      },
      onSuccess: (libraryName) => `Imported ${libraryName} for playback selection.`
    });
  };

  return (
    <FormDialog
      className="max-w-[460px]"
      disabled={!importCandidates.length}
      formId="library-import-form"
      onCancel={() => setDialogRequest(null)}
      onSubmit={handleImportLibrary}
      open={dialog === "libraryImport"}
      submitLabel="Import library"
      title="Import Library"
    >
      <Select
        id="asset-library-import"
        label="Library"
        onChange={(event) => setImportLibraryId(event.currentTarget.value)}
        required
        value={importLibraryId || importCandidates[0]?.library.id}
      >
        {importCandidates.map((summary) => (
          <option key={summary.library.id} value={summary.library.id}>
            {summary.library.name} / {summary.assetCount} assets
          </option>
        ))}
      </Select>
      <div className="grid gap-1 border-y border-gray-200 py-2 text-sm text-gray-600">
        <div className="flex justify-between gap-3 px-2">
          <span>Default library</span>
          <span className="font-medium text-gray-700">{workspace?.defaultAssetLibrary.name}</span>
        </div>
        <div className="flex justify-between gap-3 px-2">
          <span>Imported libraries</span>
          <span className="font-medium text-gray-700">{workspace?.importedAssetLibraries.length ?? 0}</span>
        </div>
      </div>
      <FeedbackText />
    </FormDialog>
  );
}
