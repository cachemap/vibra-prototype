"use client";

import { type FormEvent, useState } from "react";

import { FormDialog, Select, Switch, TextInput } from "@/components/primitives";
import type { DeviceEventAggregate } from "@/data/repositories/project-repository";
import { asEntityId, type Trigger, type TriggerId } from "@/domain";
import { FeedbackText, useFeedbackActions } from "@/features/feedback/feedback-context";
import { useCreateEventTriggerMutation } from "@/features/projects/queries";

type CreateTriggerDialogProps = {
  availableTriggers: readonly Trigger[];
  onClose: () => void;
  open: boolean;
  selectedEvent: DeviceEventAggregate;
  triggerById: ReadonlyMap<Trigger["id"], Trigger>;
};

export function CreateTriggerDialog({
  availableTriggers,
  onClose,
  open,
  selectedEvent,
  triggerById
}: CreateTriggerDialogProps) {
  const [triggerId, setTriggerId] = useState<string>(availableTriggers[0]?.id ?? "");
  const [triggerLabel, setTriggerLabel] = useState("");
  const [triggerEnabled, setTriggerEnabled] = useState(true);
  const createEventTrigger = useCreateEventTriggerMutation();
  const { runWithFeedback } = useFeedbackActions();

  const handleSubmit = async (formEvent: FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();

    if (!triggerId) {
      return;
    }

    await runWithFeedback({
      work: async () => {
        const created = await createEventTrigger.mutateAsync({
          eventId: selectedEvent.event.id,
          triggerId: asEntityId<TriggerId>(triggerId),
          label: triggerLabel || null,
          isEnabled: triggerEnabled
        });
        const trigger = triggerById.get(created.triggerId);

        onClose();
        return { triggerName: trigger?.name ?? "interaction" };
      },
      onSuccess: ({ triggerName }) => `Added ${triggerName} to ${selectedEvent.event.name}.`
    });
  };

  return (
    <FormDialog
      className="max-w-[420px]"
      disabled={!availableTriggers.length}
      formId="trigger-form"
      onCancel={onClose}
      onSubmit={handleSubmit}
      open={open}
      submitLabel="Add interaction"
      title="Add Interaction"
    >
      <Select
        id="trigger-name"
        label="Interaction"
        onChange={(formEvent) => setTriggerId(formEvent.currentTarget.value)}
        required
        value={triggerId || availableTriggers[0]?.id}
      >
        {availableTriggers.map((trigger) => (
          <option key={trigger.id} value={trigger.id}>
            {trigger.name}
          </option>
        ))}
      </Select>
      <TextInput
        id="trigger-label"
        label="Label"
        onChange={(formEvent) => setTriggerLabel(formEvent.currentTarget.value)}
        placeholder="Pressed with valid cart"
        value={triggerLabel}
      />
      <Switch
        checked={triggerEnabled}
        id="trigger-enabled"
        label="Enabled in preview"
        onChange={(formEvent) => setTriggerEnabled(formEvent.currentTarget.checked)}
      />
      <FeedbackText />
    </FormDialog>
  );
}
