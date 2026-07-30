import { AppError, toUserFacingErrorMessage } from "../domain";

export const workspaceErrorFallback = "The local demo workspace could not be updated.";
export const eventWorkspaceErrorFallback = "The local demo workspace could not be updated.";
export const libraryErrorFallback = "The local asset library could not be updated.";
export const projectsErrorFallback = "The local demo data could not be updated.";
export const shareErrorFallback = "The local share preview could not be opened.";

export const messageForError = (error: unknown, fallback: string): string => {
  if (error instanceof AppError) {
    return `${toUserFacingErrorMessage(error)} ${error.message}`;
  }

  return fallback;
};
