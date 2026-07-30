"use client";

import { createContext, useContext } from "react";
import type {
  ProjectDialogRequest,
  ProjectWorkspaceActions,
  ProjectWorkspaceSelection
} from "./workspace-scope-types";
import type { DeleteTarget } from "./delete-target";

export const SelectionContext = createContext<ProjectWorkspaceSelection | null>(null);
export const ActionsContext = createContext<ProjectWorkspaceActions | null>(null);
export const DialogContext = createContext<ProjectDialogRequest | null>(null);
export const DeleteContext = createContext<DeleteTarget | null>(null);

export function useProjectWorkspaceSelection() {
  const value = useContext(SelectionContext);

  if (!value) {
    throw new Error("useProjectWorkspaceSelection must be used within ProjectWorkspaceScopeProvider.");
  }

  return value;
}

export function useProjectWorkspaceActions() {
  const value = useContext(ActionsContext);

  if (!value) {
    throw new Error("useProjectWorkspaceActions must be used within ProjectWorkspaceScopeProvider.");
  }

  return value;
}

export function useProjectDialogRequest() {
  return useContext(DialogContext);
}

export function useProjectDeleteTarget() {
  return useContext(DeleteContext);
}
