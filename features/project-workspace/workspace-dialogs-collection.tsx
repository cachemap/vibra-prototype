"use client";

import { type FormEvent, useState } from "react";
import { FormDialog, TextInput } from "@/components/primitives";
import { useFeedbackActions, FeedbackText } from "@/features/feedback/feedback-context";
import {
  useCreateCollectionMutation,
  useDeviceWorkspaceQuery,
  useUpdateCollectionMutation
} from "@/features/projects/queries";
import {
  useProjectDialogRequest,
  useProjectWorkspaceActions,
  useProjectWorkspaceSelection
} from "./workspace-scope-context";

export function CollectionDialog() {
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
