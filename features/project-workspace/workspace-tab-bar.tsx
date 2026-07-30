import type { ProjectWorkspaceTab } from "./workspace-scope-context";

type WorkspaceTabBarProps = {
  activeTab: ProjectWorkspaceTab;
  ariaLabel?: string;
  onChange: (tab: ProjectWorkspaceTab) => void;
};

export function WorkspaceTabBar({ activeTab, ariaLabel, onChange }: WorkspaceTabBarProps) {
  return (
    <div className="grid grid-cols-3 gap-1" role="tablist" aria-label={ariaLabel}>
      <button
        className={`h-8 rounded-lg text-sm font-medium ${
          activeTab === "events" ? "bg-gray-200 text-gray-700" : "text-gray-500 hover:bg-gray-100"
        }`}
        aria-selected={activeTab === "events"}
        onClick={() => onChange("events")}
        role="tab"
        type="button"
      >
        Events
      </button>
      <button
        className={`h-8 rounded-lg text-sm font-medium ${
          activeTab === "assets" ? "bg-gray-200 text-gray-700" : "text-gray-500 hover:bg-gray-100"
        }`}
        aria-selected={activeTab === "assets"}
        onClick={() => onChange("assets")}
        role="tab"
        type="button"
      >
        Assets
      </button>
      <button
        className={`h-8 rounded-lg text-sm font-medium ${
          activeTab === "matrix" ? "bg-gray-200 text-gray-700" : "text-gray-500 hover:bg-gray-100"
        }`}
        aria-selected={activeTab === "matrix"}
        onClick={() => onChange("matrix")}
        role="tab"
        type="button"
      >
        Matrix
      </button>
    </div>
  );
}

