import type { Project, ProjectFolder } from "../entities";
import { ConflictError, NotFoundError } from "../errors";
import { errApp, okApp, type AppResult } from "../results";
import type { ProjectFolderId } from "../ids";

const folderHasChildFolders = (
  folderId: ProjectFolderId,
  folders: readonly ProjectFolder[]
): boolean => folders.some((folder) => folder.parentFolderId === folderId);

const folderHasProjects = (folderId: ProjectFolderId, projects: readonly Project[]): boolean =>
  projects.some((project) => project.folderId === folderId);

export const canAddChildFolder = (
  parentFolderId: ProjectFolderId | null,
  name: string,
  existingFolders: readonly ProjectFolder[]
): AppResult<void> => {
  if (parentFolderId !== null && !existingFolders.some((folder) => folder.id === parentFolderId)) {
    return errApp(
      new NotFoundError("Parent project folder could not be found.", {
        entity: "ProjectFolder"
      })
    );
  }

  if (
    existingFolders.some(
      (folder) => folder.parentFolderId === parentFolderId && folder.name === name
    )
  ) {
    return errApp(
      new ConflictError("A folder with that name already exists in this folder.", {
        constraint: "unique-project-folder-sibling-name"
      })
    );
  }

  return okApp(undefined);
};

export const canAddProjectToFolder = (
  folderId: ProjectFolderId | null,
  name: string,
  existingFolders: readonly ProjectFolder[],
  existingProjects: readonly Project[]
): AppResult<void> => {
  if (folderId !== null && !existingFolders.some((folder) => folder.id === folderId)) {
    return errApp(
      new NotFoundError("Project folder could not be found.", {
        entity: "ProjectFolder"
      })
    );
  }

  if (existingProjects.some((project) => project.folderId === folderId && project.name === name)) {
    return errApp(
      new ConflictError("A project with that name already exists in this folder.", {
        constraint: "unique-project-sibling-name"
      })
    );
  }

  return okApp(undefined);
};

export const allowsEmptyLeafFolder = (
  folderId: ProjectFolderId,
  existingFolders: readonly ProjectFolder[],
  existingProjects: readonly Project[]
): boolean => !folderHasChildFolders(folderId, existingFolders) && !folderHasProjects(folderId, existingProjects);
