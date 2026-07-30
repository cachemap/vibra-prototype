import { FolderPlus, Plus } from "lucide-react";
import { Button, EmptyState } from "@/components/primitives";
import type { ProjectFolderNode } from "@/data/repositories/project-repository";
import type { ProjectListDeleteTarget, ProjectListRow } from "./project-row-model";
import { ProjectsCards } from "./projects-cards";
import { ProjectsTable } from "./projects-table";

type ProjectsListProps = {
  currentFolder: ProjectFolderNode | null;
  onCreateFolder: () => void;
  onCreateProject: () => void;
  onDelete: (target: ProjectListDeleteTarget) => void;
  rows: readonly ProjectListRow[];
};

export function ProjectsList({
  currentFolder,
  onCreateFolder,
  onCreateProject,
  onDelete,
  rows
}: ProjectsListProps) {
  if (rows.length === 0) {
    return (
      <EmptyState
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button leftIcon={<FolderPlus className="size-4" />} onClick={onCreateFolder}>
              Create folder
            </Button>
            <Button leftIcon={<Plus className="size-4" />} onClick={onCreateProject} variant="primary">
              Create project
            </Button>
          </div>
        }
        title={currentFolder ? "Empty folder" : "No projects yet"}
        description={
          currentFolder
            ? "This folder is ready for folders or projects."
            : "Create a root folder or project to start the workspace."
        }
      />
    );
  }

  return (
    <>
      <ProjectsTable onDelete={onDelete} rows={rows} />
      <ProjectsCards onDelete={onDelete} rows={rows} />
    </>
  );
}
