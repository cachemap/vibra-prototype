import type { PlatformId } from "@/domain";
import type { ProjectFolderNode } from "@/data/repositories/project-repository";
import { CreateFolderDialog } from "./create-folder-dialog";
import { CreateProjectDialog } from "./create-project-dialog";

export type ProjectsListDialog = "folder" | "project" | null;

type ProjectsDialogsProps = {
  currentFolder: ProjectFolderNode | null;
  dialog: ProjectsListDialog;
  onClose: () => void;
  platformIdByName: ReadonlyMap<string, PlatformId>;
};

export function ProjectsDialogs(props: ProjectsDialogsProps) {
  if (props.dialog === "folder") {
    return (
      <CreateFolderDialog
        currentFolder={props.currentFolder}
        onClose={props.onClose}
      />
    );
  }

  if (props.dialog === "project") {
    return (
      <CreateProjectDialog
        currentFolder={props.currentFolder}
        onClose={props.onClose}
        platformIdByName={props.platformIdByName}
      />
    );
  }

  return null;
}
