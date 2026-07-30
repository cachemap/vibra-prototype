import { MoreVertical, Plus, Search, Smartphone, Trash2 } from "lucide-react";
import { IconButton, RowActionsMenu } from "@/components/primitives";
import type { CollectionId, ProjectId } from "@/domain";
import type { DeviceSummary } from "@/data/repositories/project-repository";
import { useDeviceWorkspaceQuery, useProjectWorkspaceQuery } from "@/features/projects/queries";
import { formatDeviceMeta } from "./workspace-utils";
import { useProjectWorkspaceActions, useProjectWorkspaceSelection } from "./workspace-scope-context";
import { WorkspaceTabBar } from "./workspace-tab-bar";

type WorkspaceSidebarProps = {
  onAddCollection: () => void;
  onAddDevice: () => void;
  projectId: ProjectId;
  selectedCollectionId: CollectionId | null;
  selectedDevice: DeviceSummary | null;
};

export function WorkspaceSidebar({
  onAddCollection,
  onAddDevice,
  projectId,
  selectedCollectionId,
  selectedDevice
}: WorkspaceSidebarProps) {
  const workspaceQuery = useProjectWorkspaceQuery(projectId);
  const deviceWorkspaceQuery = useDeviceWorkspaceQuery(selectedDevice?.device.id ?? null);
  const { activeTab, searchTerm } = useProjectWorkspaceSelection();
  const { goToCollection, goToDevice, requestDelete, setActiveTab, setSearchTerm } = useProjectWorkspaceActions();
  const workspace = workspaceQuery.data;
  const collections = deviceWorkspaceQuery.data?.collections ?? [];
  const normalizedWorkspaceSearch = searchTerm.trim().toLowerCase();
  const filteredDevices = normalizedWorkspaceSearch
    ? (workspace?.devices ?? []).filter((summary) =>
        [summary.device.name, summary.platform.name].some((value) =>
          value.toLowerCase().includes(normalizedWorkspaceSearch)
        )
      )
    : workspace?.devices ?? [];
  const filteredCollections = normalizedWorkspaceSearch
    ? collections.filter((item) => item.collection.name.toLowerCase().includes(normalizedWorkspaceSearch))
    : collections;

  if (!workspace) {
    return null;
  }

  return (
    <aside className="hidden content-start gap-5 border-r border-gray-300 bg-gray-50 px-4 py-4 md:grid">
      <WorkspaceTabBar activeTab={activeTab} onChange={setActiveTab} />

      <label className="relative block" htmlFor="workspace-search">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-500"
          strokeWidth={1.8}
        />
        <input
          className="h-[34px] w-full rounded-lg border border-gray-300 bg-gray-25 px-9 text-sm text-gray-700 outline-none transition-shadow placeholder:text-gray-400 focus:border-gray-300 focus:ring-2 focus:ring-purple-500/40"
          id="workspace-search"
          onChange={(event) => setSearchTerm(event.currentTarget.value)}
          placeholder="Search"
          type="search"
          value={searchTerm}
        />
      </label>

      <div className="grid gap-2">
        <div className="flex h-8 items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Systems</h2>
          <IconButton icon={Plus} label="Add device" onClick={onAddDevice} size="compact" />
        </div>
        <div className="grid gap-1" data-testid="device-list">
          {filteredDevices.length ? (
            filteredDevices.map((summary) => {
              const active = selectedDevice?.device.id === summary.device.id;

              return (
                <div
                  className={`grid min-h-10 grid-cols-[1fr_auto] items-center gap-1 rounded-lg transition-colors ${
                    active ? "bg-gray-200 text-gray-700" : "text-gray-600 hover:bg-gray-100"
                  }`}
                  key={summary.device.id}
                >
                  <button
                    className="grid min-h-10 min-w-0 grid-cols-[1fr_auto] items-center gap-2 rounded-lg px-2.5 text-left text-sm"
                    onClick={() => goToDevice(summary.device.id)}
                    type="button"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <Smartphone aria-hidden="true" className="size-4 shrink-0 text-gray-500" />
                      <span className="truncate font-medium">{summary.device.name}</span>
                    </span>
                    <span className="text-xs text-gray-500">{formatDeviceMeta(summary)}</span>
                  </button>
                  <div className="pr-1">
                    <RowActionsMenu
                      grouped
                      icon={MoreVertical}
                      items={[
                        {
                          destructive: true,
                          icon: <Trash2 aria-hidden="true" className="size-4" />,
                          label: "Delete device",
                          onSelect: () =>
                            requestDelete({
                              kind: "device",
                              id: summary.device.id,
                              name: summary.device.name
                            })
                        }
                      ]}
                      label={`Open actions for ${summary.device.name}`}
                      size="compact"
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <p className="px-2 text-xs text-gray-500">
              {workspace.devices.length ? "No matching systems." : "No systems yet."}
            </p>
          )}
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4">
        <div className="mb-2 flex h-8 items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Collections</h2>
          <IconButton
            disabled={!selectedDevice}
            icon={Plus}
            label="Add collection"
            onClick={onAddCollection}
            size="compact"
          />
        </div>
        {deviceWorkspaceQuery.isLoading ? (
          <p className="px-2 text-xs text-gray-500">Loading collections</p>
        ) : !selectedDevice ? (
          <p className="px-2 text-xs text-gray-500">Select a system before adding collections.</p>
        ) : filteredCollections.length ? (
          <div className="grid gap-1" data-testid="collection-list">
            {filteredCollections.map((item) => {
              const active = selectedCollectionId === item.collection.id;

              return (
                <button
                  className={`grid min-h-10 grid-cols-[1fr_auto] items-center gap-2 rounded-lg px-2.5 text-left text-sm transition-colors ${
                    active ? "bg-gray-200 text-gray-700" : "text-gray-600 hover:bg-gray-100"
                  }`}
                  key={item.collection.id}
                  onClick={() => goToCollection(item.collection.id)}
                  type="button"
                >
                  <span className="truncate font-medium">{item.collection.name}</span>
                  <span className="text-xs text-gray-500">{item.events.length}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="px-2 text-xs text-gray-500">No matching collections.</p>
        )}
      </div>
    </aside>
  );
}

