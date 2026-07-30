import { ConfirmDialog } from "@/components/primitives";
import type { ProjectListDeleteTarget } from "./project-row-model";

function cascadeSummaryFor(target: ProjectListDeleteTarget) {
  switch (target.kind) {
    case "Folder":
      return "Child folders, projects, devices, events, assets, matrix rules, and share links in this folder tree.";
    case "Project":
      return "Devices, collections, events, the default asset library, imported-library links, matrix rules, assets, and share links for this project.";
  }
}

type ProjectsDeleteConfirmProps = {
  disabled: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  target: ProjectListDeleteTarget | null;
};

export function ProjectsDeleteConfirm({ disabled, onCancel, onConfirm, target }: ProjectsDeleteConfirmProps) {
  if (!target) {
    return null;
  }

  return (
    <ConfirmDialog
      confirmLabel={`Delete ${target.kind.toLowerCase()}`}
      disabled={disabled}
      onCancel={onCancel}
      onConfirm={onConfirm}
      title={`Delete ${target.kind.toLowerCase()}?`}
      cascadeSummary={cascadeSummaryFor(target)}
    >
      This removes {target.name} and its demo workspace records from IndexedDB.
    </ConfirmDialog>
  );
}
