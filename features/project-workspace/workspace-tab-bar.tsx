import { Tabs, type TabItem } from "@/components/primitives";
import type { ProjectWorkspaceTab } from "./workspace-scope-context";

type WorkspaceTabBarProps = {
  activeTab: ProjectWorkspaceTab;
  ariaLabel?: string;
  onChange: (tab: ProjectWorkspaceTab) => void;
};

const workspaceTabs: Array<TabItem & { id: ProjectWorkspaceTab }> = [
  { id: "events", label: "Events" },
  { id: "assets", label: "Assets" },
  { id: "matrix", label: "Matrix" }
];

export function WorkspaceTabBar({ activeTab, ariaLabel, onChange }: WorkspaceTabBarProps) {
  return (
    <Tabs
      activeId={activeTab}
      ariaLabel={ariaLabel}
      className="w-full justify-stretch"
      items={workspaceTabs}
      onChange={(tab) => onChange(tab as ProjectWorkspaceTab)}
    />
  );
}
