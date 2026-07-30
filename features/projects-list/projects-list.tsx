import { FolderPlus, Plus } from "lucide-react";
import { Button, EmptyState } from "@/components/primitives";
import type { ProjectFolderNode } from "@/data/repositories/project-repository";
import type { ProjectListDeleteTarget, ProjectListRow } from "./project-row-model";
import { ProjectsCards } from "./projects-cards";
import { ProjectsTable } from "./projects-table";

type ProjectsListProps = {
  allRowCount: number;
  currentFolder: ProjectFolderNode | null;
  onCreateFolder: () => void;
  onCreateProject: () => void;
  onDelete: (target: ProjectListDeleteTarget) => void;
  rows: readonly ProjectListRow[];
  searchTerm: string;
};

export function ProjectsList({
  allRowCount,
  currentFolder,
  onCreateFolder,
  onCreateProject,
  onDelete,
  rows,
  searchTerm
}: ProjectsListProps) {
  if (rows.length === 0) {
    const hasSearch = searchTerm.trim().length > 0;

    return (
      <EmptyState
        action={
          hasSearch && allRowCount > 0 ? null : (
            <div className="flex flex-wrap justify-center gap-2">
              <Button leftIcon={<FolderPlus className="size-4" />} onClick={onCreateFolder}>
                Create folder
              </Button>
              <Button leftIcon={<Plus className="size-4" />} onClick={onCreateProject} variant="primary">
                Create project
              </Button>
            </div>
          )
        }
        title={hasSearch && allRowCount > 0 ? "No matching projects" : currentFolder ? "Empty folder" : "No projects yet"}
        description={
          hasSearch && allRowCount > 0
            ? "Try a different project, folder, or type."
            : currentFolder
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
