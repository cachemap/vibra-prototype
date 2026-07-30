import { Trash2 } from "lucide-react";
import { RowActionsMenu } from "@/components/primitives";
import type { ProjectListDeleteTarget, ProjectListRow } from "./project-row-model";

type ProjectsRowActionsProps = {
  onDelete: (target: ProjectListDeleteTarget) => void;
  row: ProjectListRow;
};

export function ProjectsRowActions({ onDelete, row }: ProjectsRowActionsProps) {
  return (
    <div className="flex justify-end">
      <RowActionsMenu
        grouped
        items={[
          {
            destructive: true,
            icon: <Trash2 aria-hidden="true" size={16} />,
            label: `Delete ${row.kind.toLowerCase()}`,
            onSelect: () => onDelete(row)
          }
        ]}
        label={`Open actions for ${row.name}`}
        size="compact"
      />
    </div>
  );
}
