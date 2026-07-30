"use client";

import { type FormEvent, useMemo, useState } from "react";
import {
  CardGrid,
  DeviceGlyph,
  FormDialog,
  Select,
  SelectableCard,
  Switch,
  TextInput
} from "@/components/primitives";
import { asEntityId, type PlatformId } from "@/domain";
import {
  groupDevicePresetsByFormFactor,
  type DevicePreset
} from "@/domain/device-catalog";
import { useFeedbackActions, FeedbackText } from "@/features/feedback/feedback-context";
import {
  useCreateDeviceMutation,
  useProjectWorkspaceQuery
} from "@/features/projects/queries";
import {
  useProjectDialogRequest,
  useProjectWorkspaceActions,
  useProjectWorkspaceSelection
} from "./workspace-scope-context";

export function CreateDeviceDialog() {
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
