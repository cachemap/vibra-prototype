import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Square, ToggleRight } from "lucide-react";
import {
  CardGrid,
  Checkbox,
  DeviceGlyph,
  DialogOverlay,
  FormDialog,
  SelectableCard,
  TextInput
} from "@/components/primitives";
import {
  asEntityId,
  eventTypes,
  groupDevicePresetsByFormFactor,
  type DevicePreset,
  type EventType,
  type PlatformId
} from "@/domain";
import type { CreatedProjectAggregate, ProjectFolderNode } from "@/data/repositories/project-repository";
import { useFeedbackActions } from "@/features/feedback/feedback-context";
import { useCreateProjectMutation } from "@/features/projects/queries";

const starterEventGroups = [
  { label: "Notifications", eventTypes: ["Toast", "Banner"] },
  { label: "Key interactions", eventTypes: ["Button", "Toggle"] }
] as const satisfies readonly { label: string; eventTypes: readonly EventType[] }[];

const eventTypeIcon = {
  Banner: Bell,
  Button: Square,
  Toast: Bell,
  Toggle: ToggleRight
} satisfies Record<EventType, typeof Bell>;

const normalizedIncludes = (value: string, query: string) =>
  value.toLowerCase().includes(query.trim().toLowerCase());

type CreateProjectDialogProps = {
  currentFolder: ProjectFolderNode | null;
  onClose: () => void;
  platformIdByName: ReadonlyMap<string, PlatformId>;
};

export function CreateProjectDialog({
  currentFolder,
  onClose,
  platformIdByName
}: CreateProjectDialogProps) {
  const router = useRouter();
  const createProject = useCreateProjectMutation();
  const { runWithFeedback } = useFeedbackActions();
  const [projectName, setProjectName] = useState("");
  const [selectedPresetIds, setSelectedPresetIds] = useState<string[]>([]);
  const [selectedStarterEventTypes, setSelectedStarterEventTypes] = useState<EventType[]>([]);
  const [starterEventSearch, setStarterEventSearch] = useState("");
  const selectedPresets = useMemo(
    () => groupDevicePresetsByFormFactor().flatMap((group) =>
      group.presets.filter((preset) => selectedPresetIds.includes(preset.presetId))
    ),
    [selectedPresetIds]
  );

  const togglePreset = (preset: DevicePreset) => {
    setSelectedPresetIds((current) =>
      current.includes(preset.presetId)
        ? current.filter((presetId) => presetId !== preset.presetId)
        : [...current, preset.presetId]
    );
  };

  const toggleStarterEventType = (eventType: EventType) => {
    setSelectedStarterEventTypes((current) =>
      current.includes(eventType)
        ? current.filter((selectedEventType) => selectedEventType !== eventType)
        : [...current, eventType]
    );
  };

  const handleCreateProject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await runWithFeedback({
      work: async () => {
        const created: CreatedProjectAggregate = await createProject.mutateAsync({
          folderId: currentFolder?.folder.id ?? null,
          name: projectName,
          devices: selectedPresets.map((preset) => ({
            platformId: asEntityId<PlatformId>(platformIdByName.get(preset.platformName) ?? ""),
            name: preset.deviceName
          })),
          starterEventTypes: selectedStarterEventTypes
        });

        onClose();
        router.push(
          created.devices[0]
            ? `/projects/${created.project.id}?device=${created.devices[0].device.id}`
            : `/projects/${created.project.id}`
        );
        return created;
      },
      onSuccess: (created) =>
        `Created ${created.project.name} with ${created.defaultAssetLibrary.name} asset library.`
    });
  };

  return (
    <DialogOverlay>
      <FormDialog
        disabled={!projectName.trim() || createProject.isPending}
        formClassName="md:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]"
        formId="create-project-form"
        onCancel={onClose}
        onSubmit={handleCreateProject}
        size="wide"
        submitLabel="Create project"
        title="New Project"
      >
        <section className="grid content-start gap-4">
          <div className="grid gap-1">
            <h3 className="text-sm font-semibold text-gray-700">Select the systems for your project</h3>
            <p className="text-xs text-gray-500">
              {selectedPresetIds.length
                ? `${selectedPresetIds.length} selected`
                : "Optional. Start empty when the target systems are not final."}
            </p>
          </div>
          <div className="grid max-h-[54vh] gap-5 overflow-auto pr-1">
            {groupDevicePresetsByFormFactor().map((group) => (
              <section className="grid gap-2" key={group.formFactor}>
                <h4 className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">
                  {group.formFactor}
                </h4>
                <CardGrid className="xl:grid-cols-2">
                  {group.presets.map((preset) => (
                    <SelectableCard
                      checked={selectedPresetIds.includes(preset.presetId)}
                      description={preset.platformName}
                      icon={<DeviceGlyph formFactor={preset.formFactor} />}
                      id={`project-device-${preset.presetId}`}
                      key={preset.presetId}
                      label={preset.deviceName}
                      onChange={() => togglePreset(preset)}
                    />
                  ))}
                </CardGrid>
              </section>
            ))}
          </div>
        </section>

        <section className="grid content-start gap-4 border-t border-gray-200 pt-4 md:border-l md:border-t-0 md:pl-4 md:pt-0">
          <TextInput
            autoFocus
            id="project-name"
            label="Project name"
            onChange={(event) => setProjectName(event.target.value)}
            placeholder="Settings Feedback"
            required
            value={projectName}
          />
          <div className="grid gap-2">
            <TextInput
              id="starter-event-search"
              label="Starter events"
              onChange={(event) => setStarterEventSearch(event.target.value)}
              placeholder="Search Button, Toast..."
              value={starterEventSearch}
            />
            <div className="grid gap-4 border-y border-gray-200 bg-gray-50 p-3">
              {starterEventGroups.map((group) => {
                const visibleEventTypes = group.eventTypes.filter((eventType) =>
                  normalizedIncludes(eventType, starterEventSearch)
                );

                if (!visibleEventTypes.length) {
                  return null;
                }

                return (
                  <section className="grid gap-2" key={group.label}>
                    <h4 className="text-xs font-semibold text-gray-500">{group.label}</h4>
                    <div className="grid gap-2">
                      {visibleEventTypes.map((eventType) => {
                        const Icon = eventTypeIcon[eventType];

                        return (
                          <Checkbox
                            checked={selectedStarterEventTypes.includes(eventType)}
                            id={`starter-event-${eventType}`}
                            key={eventType}
                            label={
                              <span className="flex min-w-0 items-center gap-2">
                                <Icon aria-hidden="true" className="size-4 shrink-0 text-gray-500" strokeWidth={1.8} />
                                <span>{eventType}</span>
                              </span>
                            }
                            onChange={() => toggleStarterEventType(eventType)}
                          />
                        );
                      })}
                    </div>
                  </section>
                );
              })}
              {eventTypes.every((eventType) => !normalizedIncludes(eventType, starterEventSearch)) ? (
                <p className="text-sm text-gray-500">No starter events match this search.</p>
              ) : null}
            </div>
          </div>
        </section>
      </FormDialog>
    </DialogOverlay>
  );
}
