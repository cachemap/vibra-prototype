import type {
  Asset,
  AssetLibrary,
  AssetLibraryFolder,
  Project,
  ProjectAssetLibraryImport
} from "../entities";
import { ConflictError, ConstraintError, NotFoundError } from "../errors";
import { errApp, okApp, type AppResult } from "../results";
import type { AssetLibraryFolderId, AssetLibraryId, ProjectId } from "../ids";

export interface ProjectCreationRecords {
  project: Project;
  defaultAssetLibrary: AssetLibrary;
  rootFolder: AssetLibraryFolder;
}

export const validateProjectCreationRecords = ({
  project,
  defaultAssetLibrary,
  rootFolder
}: ProjectCreationRecords): AppResult<void> => {
  if (project.defaultAssetLibraryId !== defaultAssetLibrary.id) {
    return errApp(
      new ConstraintError("Project creation must link exactly one default asset library.", {
        constraint: "project-default-library"
      })
    );
  }

  if (defaultAssetLibrary.defaultForProjectId !== project.id) {
    return errApp(
      new ConstraintError("The default asset library must belong to the created project.", {
        constraint: "project-default-library-owner"
      })
    );
  }

  if (rootFolder.libraryId !== defaultAssetLibrary.id || rootFolder.parentFolderId !== null) {
    return errApp(
      new ConstraintError("Project creation must create one root folder for the default library.", {
        constraint: "project-default-library-root"
      })
    );
  }

  return okApp(undefined);
};

export const canImportAssetLibrary = (
  project: Project,
  assetLibraryId: AssetLibraryId
): AppResult<void> => {
  if (project.defaultAssetLibraryId === assetLibraryId) {
    return errApp(
      new ConflictError("A project cannot import its own default asset library.", {
        constraint: "project-import-own-default-library"
      })
    );
  }

  return okApp(undefined);
};

export const canUseAssetInProject = (
  project: Project,
  asset: Asset,
  imports: readonly ProjectAssetLibraryImport[]
): AppResult<void> => {
  const importedLibraryIds = new Set(
    imports.filter((record) => record.projectId === project.id).map((record) => record.assetLibraryId)
  );

  if (asset.libraryId === project.defaultAssetLibraryId || importedLibraryIds.has(asset.libraryId)) {
    return okApp(undefined);
  }

  return errApp(
    new ConstraintError("Playback assets must come from the project default library or an imported library.", {
      constraint: "project-asset-eligibility"
    })
  );
};

export const canAddChildFolderToAssetFolder = (
  parentFolderId: AssetLibraryFolderId,
  name: string,
  existingFolders: readonly AssetLibraryFolder[]
): AppResult<void> => {
  if (!existingFolders.some((folder) => folder.id === parentFolderId)) {
    return errApp(
      new NotFoundError("Parent asset folder could not be found.", {
        entity: "AssetLibraryFolder"
      })
    );
  }

  if (
    existingFolders.some(
      (folder) => folder.parentFolderId === parentFolderId && folder.name === name
    )
  ) {
    return errApp(
      new ConflictError("An asset folder with that name already exists in this folder.", {
        constraint: "unique-asset-folder-sibling-name"
      })
    );
  }

  return okApp(undefined);
};

export const canAddAssetToFolder = (
  folderId: AssetLibraryFolderId,
  name: string,
  existingFolders: readonly AssetLibraryFolder[],
  existingAssets: readonly Asset[]
): AppResult<void> => {
  if (!existingFolders.some((folder) => folder.id === folderId)) {
    return errApp(
      new NotFoundError("Asset folder could not be found.", {
        entity: "AssetLibraryFolder"
      })
    );
  }

  if (existingAssets.some((asset) => asset.folderId === folderId && asset.name === name)) {
    return errApp(
      new ConflictError("An asset with that name already exists in this folder.", {
        constraint: "unique-asset-sibling-name"
      })
    );
  }

  return okApp(undefined);
};

export const countDefaultLibrariesForProject = (
  projectId: ProjectId,
  assetLibraries: readonly AssetLibrary[]
): number => assetLibraries.filter((library) => library.defaultForProjectId === projectId).length;
