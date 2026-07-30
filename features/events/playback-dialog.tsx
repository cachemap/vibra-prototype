"use client";

import { type FormEvent, useState } from "react";
import { FileAudio, Waves } from "lucide-react";

import { FormDialog, TextInput } from "@/components/primitives";
import type { DeviceEventAggregate, DeviceWorkspaceAggregate } from "@/data/repositories/project-repository";
import { asEntityId, type Asset, type AssetId } from "@/domain";
import { FeedbackText, useFeedbackActions } from "@/features/feedback/feedback-context";
import {
  useCreateTriggerPlaybackMutation,
  useUpdateTriggerPlaybackMutation
} from "@/features/projects/queries";
import { formatSeconds } from "@/lib/format";

import type { EventDialogRequest } from "./event-dialogs";

type PlaybackDialogProps = {
  assetById: ReadonlyMap<Asset["id"], DeviceWorkspaceAggregate["playbackAssets"][number]>;
  onClose: () => void;
  playbackAssets: readonly DeviceWorkspaceAggregate["playbackAssets"][number][];
  request: Extract<EventDialogRequest, { type: "playback" | "editPlayback" }> | null;
  selectedEvent: DeviceEventAggregate;
};

export function PlaybackDialog({
  assetById,
  onClose,
  playbackAssets,
  request,
  selectedEvent
}: PlaybackDialogProps) {
  const selectedPlayback =
    request?.type === "editPlayback"
      ? selectedEvent.eventTriggers
          .find((item) => item.id === request.eventTriggerId)
          ?.playbacks.find((item) => item.id === request.playbackId)
      : null;
  const [playbackAssetId, setPlaybackAssetId] = useState(
    selectedPlayback?.assetId ?? playbackAssets[0]?.id ?? ""
  );
  const [playbackOffset, setPlaybackOffset] = useState(String(selectedPlayback?.startOffset ?? 0));
  const createTriggerPlayback = useCreateTriggerPlaybackMutation();
  const updateTriggerPlayback = useUpdateTriggerPlaybackMutation();
  const { runWithFeedback } = useFeedbackActions();

  const handleSubmit = async (formEvent: FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();

    if (!request || !playbackAssetId) {
      return;
    }

    await runWithFeedback({
      work: async () => {
        const playback =
          request.type === "editPlayback"
            ? await updateTriggerPlayback.mutateAsync({
                triggerPlaybackId: request.playbackId,
                assetId: asEntityId<AssetId>(playbackAssetId),
                startOffset: Number(playbackOffset)
              })
            : await createTriggerPlayback.mutateAsync({
                eventTriggerId: request.eventTriggerId,
                assetId: asEntityId<AssetId>(playbackAssetId),
                startOffset: Number(playbackOffset)
              });
        const asset = assetById.get(playback.assetId);

        onClose();
        return { assetName: asset?.name ?? "asset", startOffset: playback.startOffset };
      },
      onSuccess: ({ assetName, startOffset }) =>
        request.type === "editPlayback"
          ? `Updated ${assetName} at ${formatSeconds(startOffset)}.`
          : `Scheduled ${assetName} at ${formatSeconds(startOffset)}.`
    });
  };

  return (
    <FormDialog
      className="max-w-[420px]"
      disabled={!playbackAssets.length}
      formId="playback-form"
      onCancel={onClose}
      onSubmit={handleSubmit}
      open={request !== null}
      submitLabel={request?.type === "editPlayback" ? "Save playback" : "Add playback"}
      title={request?.type === "editPlayback" ? "Edit Playback" : "Add Playback"}
    >
      <fieldset className="grid gap-2">
        <legend className="text-sm font-medium text-gray-700">Asset</legend>
        <div className="grid max-h-72 gap-1 overflow-auto border-y border-gray-300 py-1">
          {playbackAssets.map((asset) => {
            const selected = (playbackAssetId || playbackAssets[0]?.id) === asset.id;
            const Icon = asset.mediaKind === "audio" ? FileAudio : Waves;

            return (
              <label
                className={`grid min-h-10 cursor-pointer grid-cols-[auto_1fr_auto] items-center gap-2 px-2 text-sm ${
                  selected ? "bg-gray-200 text-gray-700" : "text-gray-600 hover:bg-gray-100"
                }`}
                key={asset.id}
              >
                <input
                  checked={selected}
                  className="size-4 accent-purple-500"
                  name="playback-asset"
                  onChange={() => setPlaybackAssetId(asset.id)}
                  type="radio"
                  value={asset.id}
                />
                <span className="flex min-w-0 items-center gap-2">
                  <Icon aria-hidden="true" className="size-4 shrink-0 text-gray-500" />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{asset.name}</span>
                    <span className="block truncate text-xs text-gray-500">{asset.libraryName}</span>
                  </span>
                </span>
                <span className="text-xs font-medium text-gray-500">{asset.mediaKind}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
      <TextInput
        id="playback-offset"
        inputMode="decimal"
        label="Start offset"
        min="0"
        onChange={(formEvent) => setPlaybackOffset(formEvent.currentTarget.value)}
        placeholder="0.15"
        required
        step="0.01"
        type="number"
        value={playbackOffset}
      />
      <FeedbackText />
    </FormDialog>
  );
}
