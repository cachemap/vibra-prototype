import { FolderPlus, Plus, Trash2 } from "lucide-react";
import { Button, PageHeader, RowActionsMenu } from "@/components/primitives";
import type { BreadcrumbItem } from "@/components/primitives/breadcrumbs";
import type { ProjectListDeleteTarget } from "./project-row-model";

type ProjectsHeaderProps = {
  breadcrumbs: BreadcrumbItem[];
  currentFolderDeleteTarget: ProjectListDeleteTarget | null;
  onCreateFolder: () => void;
  onCreateProject: () => void;
  onDeleteFolder: (target: ProjectListDeleteTarget) => void;
  subtitle: string;
  title: string;
};

export function ProjectsHeader({
  breadcrumbs,
  currentFolderDeleteTarget,
  onCreateFolder,
  onCreateProject,
  onDeleteFolder,
  subtitle,
  title
}: ProjectsHeaderProps) {
  return (
    <PageHeader
      actions={
        <>
          {currentFolderDeleteTarget ? (
            <RowActionsMenu
              grouped
              items={[
                {
                  destructive: true,
                  icon: <Trash2 aria-hidden="true" size={16} />,
                  label: "Delete folder",
                  onSelect: () => onDeleteFolder(currentFolderDeleteTarget)
                }
              ]}
              label={`Open actions for ${currentFolderDeleteTarget.name}`}
            />
          ) : null}
          <Button
            leftIcon={<FolderPlus className="size-4" />}
            onClick={onCreateFolder}
          >
            New folder
          </Button>
          <Button
            leftIcon={<Plus className="size-4" />}
            onClick={onCreateProject}
            variant="primary"
          >
            New
          </Button>
        </>
      }
      breadcrumbs={breadcrumbs}
      border={false}
      className="px-0 py-0"
      subtitle={subtitle}
      title={title}
    />
  );
}
