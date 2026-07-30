"use client";

import { type FormEvent, useState } from "react";

import { FormDialog, Select, TextInput } from "@/components/primitives";
import type { DeviceEventAggregate } from "@/data/repositories/project-repository";
import { eventTypes } from "@/domain";
import { FeedbackText, useFeedbackActions } from "@/features/feedback/feedback-context";
import { useUpdateEventMutation } from "@/features/projects/queries";

type EditEventDialogProps = {
  onClose: () => void;
  open: boolean;
  selectedEvent: DeviceEventAggregate;
};

export function EditEventDialog({ onClose, open, selectedEvent }: EditEventDialogProps) {
  const [eventName, setEventName] = useState(selectedEvent.event.name);
  const [eventType, setEventType] = useState<(typeof eventTypes)[number]>(selectedEvent.event.eventType);
  const updateEvent = useUpdateEventMutation();
  const { runWithFeedback } = useFeedbackActions();

  const handleSubmit = async (formEvent: FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();

    await runWithFeedback({
      work: async () => {
        const updated = await updateEvent.mutateAsync({
          eventId: selectedEvent.event.id,
          name: eventName,
          eventType
        });

        onClose();
        return updated;
      },
      onSuccess: (updated) => `Updated ${updated.name}.`
    });
  };

  return (
    <FormDialog
      className="max-w-[420px]"
      formId="event-form"
      onCancel={onClose}
      onSubmit={handleSubmit}
      open={open}
      submitLabel="Save"
      title="Edit Event"
    >
      <TextInput
        autoFocus
        id="event-name"
        label="Name"
        onChange={(formEvent) => setEventName(formEvent.currentTarget.value)}
        placeholder="Primary CTA"
        required
        value={eventName}
      />
      <Select
        id="event-type"
        label="Event type"
        onChange={(formEvent) =>
          setEventType(formEvent.currentTarget.value as (typeof eventTypes)[number])
        }
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
