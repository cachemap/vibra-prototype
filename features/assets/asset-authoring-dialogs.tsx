"use client";

import { FormEvent, useState } from "react";
import { FileAudio, Upload, Waves } from "lucide-react";

import { Button, Dialog, TextInput } from "@/components/primitives";
import {
  AppError,
  UnsupportedMediaError,
  ValidationError,
  toUserFacingErrorMessage,
  type Asset
} from "@/domain";

export interface CreateAssetFolderDialogInput {
  name: string;
  icon: string;
}

export interface CreateAssetDialogInput {
  name: string;
  assetId: string;
  mediaKind: Asset["mediaKind"];
  originalFilename: string;
  blob: File;
  contentType?: string;
}

export const messageForAssetAuthoringError = (error: unknown): string => {
  if (error instanceof AppError) {
    return `${toUserFacingErrorMessage(error)} ${error.message}`;
  }

  return "The local asset library could not be updated.";
};

export const extensionForFilename = (filename: string) => filename.split(".").pop()?.toLowerCase() ?? "";

export const readableNameFromFilename = (filename: string) =>
  filename
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export const assetIdFromFilename = (filename: string) =>
  `asset-${filename
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()}`;

export const inferMediaKindFromFile = (file: File): Asset["mediaKind"] => {
  const extension = extensionForFilename(file.name);

  if (
    file.type.startsWith("audio/") ||
    ["aac", "aif", "aiff", "flac", "m4a", "mp3", "ogg", "wav", "webm"].includes(extension)
  ) {
    return "audio";
  }

  if (["ahap", "haptic"].includes(extension) || file.type === "application/x-ahap+json") {
    return "haptic";
  }

  throw new UnsupportedMediaError("Upload an audio file or an AHAP haptic file.", {
    field: "file"
  });
};

export const iconForMediaKind = (mediaKind: Asset["mediaKind"]) =>
  mediaKind === "audio" ? FileAudio : Waves;

export const uploadHintForFile = (file: File | null) => {
  if (!file) {
    return "Audio files play in browser previews; haptics remain visual.";
  }

  try {
    return `${inferMediaKindFromFile(file)} asset, ${Math.max(1, Math.round(file.size / 1024))} KB`;
  } catch {
    return "Unsupported file type.";
  }
};

function AssetFileIcon({ file }: { file: File | null }) {
  let mediaKind: Asset["mediaKind"] | null = null;

  if (file) {
    try {
      mediaKind = inferMediaKindFromFile(file);
    } catch {
      // Fall back to the neutral upload icon while the inline hint explains the unsupported type.
    }
  }

  if (mediaKind === "audio") {
    return <FileAudio className="size-4 shrink-0 text-gray-600" strokeWidth={1.8} />;
  }

  if (mediaKind === "haptic") {
    return <Waves className="size-4 shrink-0 text-gray-600" strokeWidth={1.8} />;
  }

  return <Upload className="size-4 shrink-0 text-gray-600" strokeWidth={1.8} />;
}

export function CreateAssetFolderDialog({
  onClose,
  onCreate,
  open
}: {
  onClose: () => void;
  onCreate: (input: CreateAssetFolderDialogInput) => Promise<void>;
  open: boolean;
}) {
  const [folderName, setFolderName] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const reset = () => {
    setFolderName("");
    setFeedback(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    try {
      await onCreate({ name: folderName, icon: "folder" });
      reset();
    } catch (error) {
      setFeedback(messageForAssetAuthoringError(error));
    }
  };

  return (
    <Dialog
      actions={
        <>
          <Button onClick={close}>Cancel</Button>
          <Button form="create-asset-folder-form" type="submit" variant="primary">
            Create
          </Button>
        </>
      }
      className="w-full max-w-md"
      open={open}
      title="New Folder"
    >
      <form className="grid gap-4" id="create-asset-folder-form" onSubmit={handleSubmit}>
        <TextInput
          id="folder-name"
          label="Name"
          onChange={(event) => setFolderName(event.target.value)}
          required
          value={folderName}
        />
        {feedback ? <p className="text-xs text-gray-600">{feedback}</p> : null}
      </form>
    </Dialog>
  );
}

export function CreateAssetDialog({
  onClose,
  onCreate,
  open
}: {
  onClose: () => void;
  onCreate: (input: CreateAssetDialogInput) => Promise<void>;
  open: boolean;
}) {
  const [assetName, setAssetName] = useState("");
  const [assetFile, setAssetFile] = useState<File | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const reset = () => {
    setAssetName("");
    setAssetFile(null);
    setFeedback(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    try {
      if (!assetFile) {
        throw new ValidationError("Choose an audio or AHAP file to upload.", { field: "file" });
      }

      const mediaKind = inferMediaKindFromFile(assetFile);
      const originalFilename = assetFile.name;

      await onCreate({
        name: assetName.trim() || readableNameFromFilename(originalFilename),
        assetId: assetIdFromFilename(originalFilename),
        mediaKind,
        originalFilename,
        blob: assetFile,
        contentType: assetFile.type || (mediaKind === "haptic" ? "application/json" : undefined)
      });
      reset();
    } catch (error) {
      setFeedback(messageForAssetAuthoringError(error));
    }
  };

  return (
    <Dialog
      actions={
        <>
          <Button onClick={close}>Cancel</Button>
          <Button form="create-asset-form" type="submit" variant="primary">
            Upload
          </Button>
        </>
      }
      className="w-full max-w-md"
      open={open}
      title="New Asset"
    >
      <form className="grid gap-4" id="create-asset-form" onSubmit={handleSubmit}>
        <TextInput
          id="asset-name"
          label="Display name"
          onChange={(event) => setAssetName(event.target.value)}
          placeholder={assetFile ? readableNameFromFilename(assetFile.name) : "Derived from filename"}
          value={assetName}
        />
        <label className="grid gap-1.5 text-sm text-gray-700" htmlFor="asset-file">
          <span className="font-medium">File</span>
          <span className="flex min-h-[64px] items-center gap-3 rounded-lg border border-gray-300 bg-gray-25 px-3 py-2 text-sm text-gray-700">
            <AssetFileIcon file={assetFile} />
            <span className="grid gap-0.5">
              <span>{assetFile ? assetFile.name : "Choose an audio or AHAP file"}</span>
              <span className="text-xs text-gray-500">{uploadHintForFile(assetFile)}</span>
            </span>
          </span>
          <input
            accept="audio/*,.aac,.aif,.aiff,.flac,.m4a,.mp3,.ogg,.wav,.webm,.ahap,.haptic"
            className="text-sm text-gray-600 file:mr-3 file:h-[30px] file:rounded-lg file:border file:border-gray-300 file:bg-gray-25 file:px-2.5 file:text-xs file:font-semibold file:text-gray-700"
            id="asset-file"
            onChange={(event) => {
              setAssetFile(event.currentTarget.files?.[0] ?? null);
              setFeedback(null);
            }}
            required
            type="file"
          />
        </label>
        {feedback ? <p className="text-xs text-gray-600">{feedback}</p> : null}
      </form>
    </Dialog>
  );
}
