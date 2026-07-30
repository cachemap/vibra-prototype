"use client";

import { type FormEvent, useMemo, useState } from "react";
import {
  CardGrid,
  DeviceGlyph,
  DialogOverlay,
  FormDialog,
  Select,
  SelectableCard,
  Switch,
  TextInput
} from "@/components/primitives";
import {
  asEntityId,
  eventTypes,
  type Asset,
  type AssetLibraryId,
  type PlatformId
} from "@/domain";
import {
  groupDevicePresetsByFormFactor,
  type DevicePreset
} from "@/domain/device-catalog";
import { CreateAssetDialog, CreateAssetFolderDialog } from "@/features/assets/asset-authoring-dialogs";
import { findAssetFolderNode } from "@/features/assets/asset-folder-tree";
import { useFeedbackActions, FeedbackText } from "@/features/feedback/feedback-context";
import {
  useAssetLibrariesQuery,
  useAssetLibraryTreeQuery,
  useCreateAssetLibraryFolderMutation,
  useCreateAssetMutation,
  useCreateCollectionMutation,
  useCreateDeviceMutation,
  useCreateEventMutation,
  useDeviceWorkspaceQuery,
  useImportAssetLibraryMutation,
  useProjectWorkspaceQuery,
  useUpdateCollectionMutation
} from "@/features/projects/queries";
import type { ShareLinkController } from "@/features/sharing/use-share-link";
import {
  ShareLinkDeleteConfirm,
  ShareLinkDialog
} from "@/features/sharing/share-link-dialog";
import { workspaceErrorFallback } from "@/lib/errors";
import {
  useProjectDialogRequest,
  useProjectWorkspaceActions,
  useProjectWorkspaceSelection
} from "./workspace-scope-context";

type WorkspaceDialogsProps = {
  shareController: ShareLinkController;
};

export function WorkspaceDialogs({ shareController }: WorkspaceDialogsProps) {
  const dialog = useProjectDialogRequest();
  const { setDialogRequest } = useProjectWorkspaceActions();

  return (
    <>
      <ShareLinkDeleteConfirm
        disabled={shareController.deleteSharingLinkIsPending}
        onCancel={() => shareController.setShareLinkPendingDelete(null)}
        onConfirm={() => void shareController.handleDeleteShareLink()}
        shareLink={shareController.shareLinkPendingDelete}
      />

      <DialogOverlay align="end" open={dialog !== null}>
        {dialog === "share" ? (
          <ShareLinkDialog
            copyShareLink={shareController.copyShareLink}
            onClose={() => setDialogRequest(null)}
            onDelete={shareController.openDeleteShareLinkDialog}
            open
            shareLabel={shareController.shareLabel}
            shareLink={shareController.shareLink}
          />
        ) : null}

        {dialog === "device" ? <CreateDeviceDialog /> : null}
        {dialog === "collection" || dialog === "editCollection" ? <CollectionDialog /> : null}
        {dialog === "event" ? <CreateEventDialog /> : null}
        {dialog === "libraryImport" ? <ImportLibraryDialog /> : null}
        {dialog === "assetFolder" ? <AssetFolderDialog /> : null}
        {dialog === "asset" ? <AssetDialog /> : null}
      </DialogOverlay>
    </>
  );
}

function CreateDeviceDialog() {
  const dialog = useProjectDialogRequest();
  const { projectId } = useProjectWorkspaceSelection();
  const { goToDevice, setDialogRequest } = useProjectWorkspaceActions();
  const { runWithFeedback } = useFeedbackActions();
  const workspaceQuery = useProjectWorkspaceQuery(projectId);
  const createDevice = useCreateDeviceMutation();
  const workspace = workspaceQuery.data;
  const [deviceName, setDeviceName] = useState("");
  const [devicePlatformId, setDevicePlatformId] = useState(workspace?.platforms[0]?.id ?? "");
  const [devicePresetId, setDevicePresetId] = useState("");
  const [deviceEnabled, setDeviceEnabled] = useState(true);
  const platformIdByName = useMemo(
    () => new Map((workspace?.platforms ?? []).map((platform) => [platform.name, platform.id])),
    [workspace?.platforms]
  );

  const selectDevicePreset = (preset: DevicePreset) => {
    const platformId = platformIdByName.get(preset.platformName);

    setDevicePresetId(preset.presetId);
    setDeviceName(preset.deviceName);

    if (platformId) {
      setDevicePlatformId(platformId);
    }
  };

  const handleCreateDevice = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const platformId = devicePlatformId || workspace?.platforms[0]?.id;

    if (!platformId) {
      return;
    }

    await runWithFeedback({
      work: async () => {
        const created = await createDevice.mutateAsync({
          projectId,
          platformId: asEntityId<PlatformId>(platformId),
          name: deviceName,
          isEnabled: deviceEnabled
        });

        setDialogRequest(null);
        setDeviceName("");
        setDevicePresetId("");
        goToDevice(created.device.id);
        return created;
      },
      onSuccess: (created) => `Created ${created.device.name} with a new Collision Matrix.`
    });
  };

  return (
    <FormDialog
      className="max-w-[420px]"
      formId="create-device-form"
      onCancel={() => setDialogRequest(null)}
      onSubmit={handleCreateDevice}
      open={dialog === "device"}
      submitLabel="Create device"
      title="Create Device"
    >
      <div className="grid max-h-[38vh] gap-4 overflow-auto border-y border-gray-200 bg-gray-50 p-3">
        {groupDevicePresetsByFormFactor().map((group) => (
          <section className="grid gap-2" key={group.formFactor}>
            <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">
              {group.formFactor}
            </h3>
            <CardGrid className="sm:grid-cols-2 xl:grid-cols-2">
              {group.presets.map((preset) => (
                <SelectableCard
                  checked={devicePresetId === preset.presetId}
                  description={preset.platformName}
                  icon={<DeviceGlyph formFactor={preset.formFactor} />}
                  id={`add-device-${preset.presetId}`}
                  key={preset.presetId}
                  label={preset.deviceName}
                  name="device-preset"
                  onChange={() => selectDevicePreset(preset)}
                />
              ))}
            </CardGrid>
          </section>
        ))}
      </div>
      <TextInput
        autoFocus
        id="device-name"
        label="Name"
        onChange={(event) => setDeviceName(event.currentTarget.value)}
        placeholder="iPad Pro"
        required
        value={deviceName}
      />
      <Select
        id="device-platform"
        label="Platform"
        onChange={(event) => setDevicePlatformId(event.currentTarget.value)}
        required
        value={devicePlatformId || workspace?.platforms[0]?.id}
      >
        {(workspace?.platforms ?? []).map((platform) => (
          <option key={platform.id} value={platform.id}>
            {platform.name}
          </option>
        ))}
      </Select>
      <Switch
        checked={deviceEnabled}
        id="new-device-enabled"
        label="Include in playback/export"
        onChange={(event) => setDeviceEnabled(event.currentTarget.checked)}
      />
      <FeedbackText />
    </FormDialog>
  );
}

function CollectionDialog() {
  const dialog = useProjectDialogRequest();
  const { collectionId, deviceId } = useProjectWorkspaceSelection();
  const { goToCollection, setDialogRequest } = useProjectWorkspaceActions();
  const { runWithFeedback } = useFeedbackActions();
  const deviceWorkspaceQuery = useDeviceWorkspaceQuery(deviceId);
  const createCollection = useCreateCollectionMutation();
  const updateCollection = useUpdateCollectionMutation();
  const selectedDevice = deviceWorkspaceQuery.data?.device;
  const selectedCollection =
    deviceWorkspaceQuery.data?.collections.find((item) => item.collection.id === collectionId) ??
    deviceWorkspaceQuery.data?.collections[0] ??
    null;
  const [collectionName, setCollectionName] = useState(
    dialog === "editCollection" ? selectedCollection?.collection.name ?? "" : ""
  );

  const handleCreateCollection = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedDevice) {
      return;
    }

    await runWithFeedback({
      work: async () => {
        const collection = await createCollection.mutateAsync({
          deviceId: selectedDevice.id,
          name: collectionName
        });

        setDialogRequest(null);
        setCollectionName("");
        goToCollection(collection.id);
        return collection;
      },
      onSuccess: (collection) => `Created ${collection.name} for ${selectedDevice.name}.`
    });
  };

  const handleEditCollection = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedCollection) {
      return;
    }

    await runWithFeedback({
      work: async () => {
        const collection = await updateCollection.mutateAsync({
          collectionId: selectedCollection.collection.id,
          name: collectionName
        });

        setDialogRequest(null);
        return collection;
      },
      onSuccess: (collection) => `Renamed collection to ${collection.name}.`
    });
  };

  return (
    <FormDialog
      className="max-w-[420px]"
      formId="collection-form"
      onCancel={() => setDialogRequest(null)}
      onSubmit={dialog === "editCollection" ? handleEditCollection : handleCreateCollection}
      open={dialog === "collection" || dialog === "editCollection"}
      submitLabel={dialog === "editCollection" ? "Save" : "Create collection"}
      title={dialog === "editCollection" ? "Rename Collection" : "Create Collection"}
    >
      <TextInput
        autoFocus
        id="collection-name"
        label="Name"
        onChange={(event) => setCollectionName(event.currentTarget.value)}
        placeholder="Keyboard"
        required
        value={collectionName}
      />
      <FeedbackText />
    </FormDialog>
  );
}

function CreateEventDialog() {
  const dialog = useProjectDialogRequest();
  const { collectionId, deviceId } = useProjectWorkspaceSelection();
  const { goToEvent, setDialogRequest } = useProjectWorkspaceActions();
  const { runWithFeedback } = useFeedbackActions();
  const deviceWorkspaceQuery = useDeviceWorkspaceQuery(deviceId);
  const createEvent = useCreateEventMutation();
  const [eventName, setEventName] = useState("");
  const [eventType, setEventType] = useState<(typeof eventTypes)[number]>("Button");
  const selectedCollection =
    deviceWorkspaceQuery.data?.collections.find((item) => item.collection.id === collectionId) ??
    deviceWorkspaceQuery.data?.collections[0] ??
    null;

  const handleCreateEvent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedCollection) {
      return;
    }

    await runWithFeedback({
      work: async () => {
        const created = await createEvent.mutateAsync({
          collectionId: selectedCollection.collection.id,
          name: eventName,
          eventType
        });

        setDialogRequest(null);
        setEventName("");
        goToEvent(created.id);
        return created;
      },
      onSuccess: (created) => `Created ${created.name} in ${selectedCollection.collection.name}.`
    });
  };

  return (
    <FormDialog
      className="max-w-[420px]"
      formId="event-form"
      onCancel={() => setDialogRequest(null)}
      onSubmit={handleCreateEvent}
      open={dialog === "event"}
      submitLabel="Create event"
      title="Create Event"
    >
      <TextInput
        autoFocus
        id="event-name"
        label="Name"
        onChange={(event) => setEventName(event.currentTarget.value)}
        placeholder="Primary CTA"
        required
        value={eventName}
      />
      <Select
        id="event-type"
        label="Event type"
        onChange={(event) => setEventType(event.currentTarget.value as (typeof eventTypes)[number])}
        required
        value={eventType}
      >
        {eventTypes.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </Select>
      <FeedbackText />
    </FormDialog>
  );
}

function ImportLibraryDialog() {
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

function AssetFolderDialog() {
  const dialog = useProjectDialogRequest();
  const {
    activeAssetFolderId,
    activeAssetLibraryId
  } = useProjectWorkspaceSelection();
  const {
    selectAssetFolder,
    setDialogRequest
  } = useProjectWorkspaceActions();
  const { runWithFeedback } = useFeedbackActions();
  const projectAssetTreeQuery = useAssetLibraryTreeQuery(activeAssetLibraryId);
  const createAssetLibraryFolder = useCreateAssetLibraryFolderMutation();
  const selectedProjectAssetFolder =
    projectAssetTreeQuery.data && activeAssetFolderId
      ? findAssetFolderNode(projectAssetTreeQuery.data.rootFolder, activeAssetFolderId)
      : projectAssetTreeQuery.data?.rootFolder ?? null;

  const handleCreateAssetFolder = async ({ name, icon }: { name: string; icon: string }) => {
    if (!activeAssetLibraryId || !selectedProjectAssetFolder) {
      return;
    }

    const folder = await runWithFeedback({
      work: async () => {
        const createdFolder = await createAssetLibraryFolder.mutateAsync({
          libraryId: activeAssetLibraryId,
          parentFolderId: selectedProjectAssetFolder.folder.id,
          name,
          icon
        });

        setDialogRequest(null);
        selectAssetFolder(createdFolder.id);
        return createdFolder;
      },
      onSuccess: (createdFolder) => `Created folder ${createdFolder.name}.`
    });

    if (!folder) {
      throw new Error(workspaceErrorFallback);
    }
  };

  return (
    <CreateAssetFolderDialog
      onClose={() => setDialogRequest(null)}
      onCreate={handleCreateAssetFolder}
      open={dialog === "assetFolder"}
    />
  );
}

function AssetDialog() {
  const dialog = useProjectDialogRequest();
  const {
    activeAssetFolderId,
    activeAssetLibraryId
  } = useProjectWorkspaceSelection();
  const { setDialogRequest } = useProjectWorkspaceActions();
  const { runWithFeedback } = useFeedbackActions();
  const projectAssetTreeQuery = useAssetLibraryTreeQuery(activeAssetLibraryId);
  const createAsset = useCreateAssetMutation();
  const selectedProjectAssetFolder =
    projectAssetTreeQuery.data && activeAssetFolderId
      ? findAssetFolderNode(projectAssetTreeQuery.data.rootFolder, activeAssetFolderId)
      : projectAssetTreeQuery.data?.rootFolder ?? null;

  const handleCreateAsset = async (input: {
    name: string;
    assetId: string;
    mediaKind: Asset["mediaKind"];
    originalFilename: string;
    blob: File;
    contentType?: string;
  }) => {
    if (!activeAssetLibraryId || !selectedProjectAssetFolder) {
      return;
    }

    const asset = await runWithFeedback({
      work: async () => {
        const createdAsset = await createAsset.mutateAsync({
          libraryId: activeAssetLibraryId,
          folderId: selectedProjectAssetFolder.folder.id,
          ...input
        });

        setDialogRequest(null);
        return createdAsset;
      },
      onSuccess: (createdAsset) => `Uploaded ${createdAsset.mediaKind} asset ${createdAsset.name}.`
    });

    if (!asset) {
      throw new Error(workspaceErrorFallback);
    }
  };

  return (
    <CreateAssetDialog
      onClose={() => setDialogRequest(null)}
      onCreate={handleCreateAsset}
      open={dialog === "asset"}
    />
  );
}
