"use client";

import type { FormEvent } from "react";
import { DialogOverlay, FormDialog, TextInput } from "@/components/primitives";
import type { Asset } from "@/domain";
import { CreateAssetDialog, CreateAssetFolderDialog } from "@/features/assets/asset-authoring-dialogs";
import { FeedbackText } from "@/features/feedback/feedback-context";

export type LibraryDialog = "library" | "folder" | "asset" | null;

type LibraryDialogsProps = {
  dialog: LibraryDialog;
  libraryName: string;
  onClose: () => void;
  onCreateAsset: (input: {
    name: string;
    assetId: string;
    mediaKind: Asset["mediaKind"];
    originalFilename: string;
    blob: File;
    contentType?: string;
  }) => Promise<void>;
  onCreateFolder: (input: { name: string; icon: string }) => Promise<void>;
  onCreateLibrary: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onLibraryNameChange: (name: string) => void;
};

export function LibraryDialogs({
  dialog,
  libraryName,
  onClose,
  onCreateAsset,
  onCreateFolder,
  onCreateLibrary,
  onLibraryNameChange
}: LibraryDialogsProps) {
  return (
    <>
      {dialog === "library" ? (
        <DialogOverlay>
          <FormDialog
            className="w-full max-w-md"
            formId="create-library-form"
            onCancel={onClose}
            onSubmit={onCreateLibrary}
            submitLabel="Create"
            title="New Library"
          >
            <TextInput
              id="library-name"
              label="Name"
              onChange={(event) => onLibraryNameChange(event.target.value)}
              required
              value={libraryName}
            />
            <FeedbackText className="text-xs text-gray-600" />
          </FormDialog>
        </DialogOverlay>
      ) : null}

      {dialog === "folder" ? (
        <DialogOverlay>
          <CreateAssetFolderDialog onClose={onClose} onCreate={onCreateFolder} open={dialog === "folder"} />
        </DialogOverlay>
      ) : null}

      {dialog === "asset" ? (
        <DialogOverlay>
          <CreateAssetDialog onClose={onClose} onCreate={onCreateAsset} open={dialog === "asset"} />
        </DialogOverlay>
      ) : null}
    </>
  );
}
