"use client";

import { Switch } from "@/components/primitives";
import type { DeviceSummary } from "@/data/repositories/project-repository";
import { useFeedbackActions } from "@/features/feedback/feedback-context";
import { useUpdateDeviceMutation } from "@/features/projects/queries";

type WorkspaceDeviceStatusProps = {
  selectedDevice: DeviceSummary;
};

export function WorkspaceDeviceStatus({ selectedDevice }: WorkspaceDeviceStatusProps) {
  const { runWithFeedback } = useFeedbackActions();
  const updateDevice = useUpdateDeviceMutation();

  const handleDeviceEnabledChange = async (isEnabled: boolean) => {
    await runWithFeedback({
      work: () =>
        updateDevice.mutateAsync({
          deviceId: selectedDevice.device.id,
          isEnabled
        }),
      onSuccess: () =>
        isEnabled
          ? `${selectedDevice.device.name} is included in playback and export.`
          : `${selectedDevice.device.name} is excluded from playback and export.`
    });
  };

  return (
    <>
      <div className="hidden flex-wrap items-center justify-between gap-3 md:flex">
        <div className="grid gap-1">
          <h2 className="text-md font-semibold text-gray-700">{selectedDevice.device.name}</h2>
        </div>
        <Switch
          checked={selectedDevice.device.isEnabled}
          disabled={updateDevice.isPending}
          id="device-enabled"
          label="Included in playback/export"
          onChange={(event) => void handleDeviceEnabledChange(event.currentTarget.checked)}
        />
      </div>

      {selectedDevice.device.isEnabled ? null : (
        <div className="border-y border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-700" role="status">
          This device is excluded from playback and export until it is enabled again.
        </div>
      )}
    </>
  );
}
