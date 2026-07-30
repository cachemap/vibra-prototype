import type { CollectionId, DeviceId, ProjectId } from "@/domain";
import { asEntityId } from "@/domain";
import type { DeviceSummary } from "@/data/repositories/project-repository";
import { useDeviceWorkspaceQuery, useProjectWorkspaceQuery } from "@/features/projects/queries";
import { formatDeviceMeta } from "./workspace-utils";
import { useProjectWorkspaceActions, useProjectWorkspaceSelection } from "./workspace-scope-context";
import { WorkspaceTabBar } from "./workspace-tab-bar";

type WorkspaceMobileControlsProps = {
  projectId: ProjectId;
  selectedCollectionId: CollectionId | null;
  selectedDevice: DeviceSummary | null;
};

export function WorkspaceMobileControls({
  projectId,
  selectedCollectionId,
  selectedDevice
}: WorkspaceMobileControlsProps) {
  const workspaceQuery = useProjectWorkspaceQuery(projectId);
  const deviceWorkspaceQuery = useDeviceWorkspaceQuery(selectedDevice?.device.id ?? null);
  const { activeTab } = useProjectWorkspaceSelection();
  const { goToCollection, goToDevice, setActiveTab } = useProjectWorkspaceActions();
  const workspace = workspaceQuery.data;
  const collections = deviceWorkspaceQuery.data?.collections ?? [];
  const selectedTabLabel = activeTab === "events" ? "Events" : activeTab === "assets" ? "Assets" : "Matrix";

  if (!workspace) {
    return null;
  }

  return (
    <div className="grid gap-3 border-b border-gray-200 pb-3 md:hidden">
      <WorkspaceTabBar activeTab={activeTab} ariaLabel="Project workspace views" onChange={setActiveTab} />

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="grid gap-1 text-xs font-medium text-gray-500" htmlFor="mobile-device">
          Device
          <select
            className="h-[34px] rounded-lg border border-gray-300 bg-gray-25 px-3 text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-purple-500/40"
            disabled={!workspace.devices.length}
            id="mobile-device"
            onChange={(event) => goToDevice(asEntityId<DeviceId>(event.currentTarget.value))}
            value={selectedDevice?.device.id ?? ""}
          >
            {workspace.devices.length ? null : <option value="">No devices</option>}
            {workspace.devices.map((summary) => (
              <option key={summary.device.id} value={summary.device.id}>
                {summary.device.name} / {formatDeviceMeta(summary)}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-xs font-medium text-gray-500" htmlFor="mobile-collection">
          Collection
          <select
            className="h-[34px] rounded-lg border border-gray-300 bg-gray-25 px-3 text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-purple-500/40"
            disabled={!collections.length}
            id="mobile-collection"
            onChange={(event) => goToCollection(asEntityId<CollectionId>(event.currentTarget.value))}
            value={selectedCollectionId ?? ""}
          >
            {collections.length ? null : <option value="">No collections</option>}
            {collections.map((item) => (
              <option key={item.collection.id} value={item.collection.id}>
                {item.collection.name} / {item.events.length} events
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="h-5 truncate text-xs text-gray-500">
        {selectedDevice
          ? `${selectedTabLabel} on ${selectedDevice.device.name}`
          : "Create a device to configure this project."}
      </p>
    </div>
  );
}

