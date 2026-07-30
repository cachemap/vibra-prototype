import { Boxes, Folder } from "lucide-react";
import type { ProjectFolderId, ProjectId } from "@/domain";
import type { ProjectFolderNode, ProjectTreeAggregate } from "@/data/repositories/project-repository";
import { countProjectsInFolder } from "./project-folder-tree";

export type ProjectListRow =
  | {
      createdAt: string;
      href: string;
      icon: typeof Folder;
      id: ProjectFolderId;
      kind: "Folder";
      name: string;
      parentFolderId: ProjectFolderId | null;
      stat: string;
    }
  | {
      createdAt: string;
      href: string;
      icon: typeof Boxes;
      id: ProjectId;
      kind: "Project";
      name: string;
      stat: string;
    };

export type FolderDeleteTarget = Extract<ProjectListRow, { kind: "Folder" }>;
export type ProjectDeleteTarget = Extract<ProjectListRow, { kind: "Project" }>;
export type ProjectListDeleteTarget =
  | Pick<FolderDeleteTarget, "id" | "kind" | "name" | "parentFolderId" | "stat">
  | Pick<ProjectDeleteTarget, "id" | "kind" | "name" | "stat">;

const rowForFolder = (node: ProjectFolderNode, stat: string): ProjectListRow => ({
  createdAt: node.folder.createdAt,
  href: `/projects?folder=${node.folder.id}`,
  icon: Folder,
  id: node.folder.id,
  kind: "Folder",
  name: node.folder.name,
  parentFolderId: node.folder.parentFolderId,
  stat
});

export const rowsForProjectFolder = (
  tree: ProjectTreeAggregate,
  currentFolder: ProjectFolderNode | null
): ProjectListRow[] => {
  if (!currentFolder) {
    return [
      ...tree.roots.map((node) => rowForFolder(node, `${countProjectsInFolder(node)} projects`)),
      ...tree.rootProjects.map((project) => ({
        createdAt: project.createdAt,
        href: `/projects/${project.id}`,
        icon: Boxes,
        id: project.id,
        kind: "Project" as const,
        name: project.name,
        stat: "Default library ready"
      }))
    ];
  }

  return [
    ...currentFolder.childFolders.map((node) =>
      rowForFolder(node, node.isEmptyLeaf ? "Empty leaf" : `${countProjectsInFolder(node)} projects`)
    ),
    ...currentFolder.projects.map((project) => ({
      createdAt: project.createdAt,
      href: `/projects/${project.id}`,
      icon: Boxes,
      id: project.id,
      kind: "Project" as const,
      name: project.name,
      stat: "Default library ready"
    }))
  ];
};

export const deleteTargetForCurrentFolder = (
  currentFolder: ProjectFolderNode | null
): ProjectListDeleteTarget | null =>
  currentFolder
    ? {
        id: currentFolder.folder.id,
        kind: "Folder",
        name: currentFolder.folder.name,
        parentFolderId: currentFolder.folder.parentFolderId,
        stat: currentFolder.isEmptyLeaf ? "Empty leaf" : `${countProjectsInFolder(currentFolder)} projects`
      }
    : null;
