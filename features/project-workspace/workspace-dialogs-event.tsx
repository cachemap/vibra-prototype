"use client";

import { type FormEvent, useState } from "react";
import { FormDialog, Select, TextInput } from "@/components/primitives";
import { eventTypes } from "@/domain";
import { useFeedbackActions, FeedbackText } from "@/features/feedback/feedback-context";
import {
  useCreateEventMutation,
  useDeviceWorkspaceQuery
} from "@/features/projects/queries";
import {
  useProjectDialogRequest,
  useProjectWorkspaceActions,
  useProjectWorkspaceSelection
} from "./workspace-scope-context";

export function CreateEventDialog() {
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
