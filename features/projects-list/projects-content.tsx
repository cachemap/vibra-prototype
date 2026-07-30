"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DEMO_USER_ID } from "@/data/seed";
import {
  useDeleteProjectFolderMutation,
  useDeleteProjectMutation,
  useProjectTreeQuery
} from "@/features/projects/queries";
import { useFeedbackActions, useFeedbackMessage } from "@/features/feedback/feedback-context";
import {
  asEntityId,
  type ProjectFolderId,
  type ProjectId
} from "@/domain";
import { pluralSuffix } from "@/lib/plural";
import { hrefWithParams } from "@/lib/search-params";
import {
  deleteTargetForCurrentFolder,
  type ProjectListDeleteTarget
} from "./project-row-model";
import { ProjectsDeleteConfirm } from "./projects-delete-confirm";
import { ProjectsDialogs, type ProjectsListDialog } from "./projects-dialogs";
import { ProjectsHeader } from "./projects-header";
import { ProjectsList } from "./projects-list";
import { ProjectsErrorState, ProjectsLoadingState } from "./projects-query-state";
import { ProjectsToolbar } from "./projects-toolbar";
import { useProjectsListModel } from "./use-projects-list-model";

export function ProjectsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedFolderParam = searchParams.get("folder");
  const selectedFolderId = selectedFolderParam
    ? asEntityId<ProjectFolderId>(selectedFolderParam)
    : null;
  const [dialog, setDialog] = useState<ProjectsListDialog>(null);
  const feedback = useFeedbackMessage();
  const { clearFeedback, runWithFeedback } = useFeedbackActions();
  const [deleteTarget, setDeleteTarget] = useState<ProjectListDeleteTarget | null>(null);
  const treeQuery = useProjectTreeQuery(DEMO_USER_ID);
  const deleteFolder = useDeleteProjectFolderMutation();
  const deleteProject = useDeleteProjectMutation();

  const { currentFolder, folderPath, platformIdByName, rows } = useProjectsListModel(
    treeQuery.data,
    selectedFolderId
  );
  const folderHrefFor = (folderId: ProjectFolderId | null) =>
    hrefWithParams("/projects", searchParams, { folder: folderId });

  const openProjectDialog = () => {
    clearFeedback();
    setDialog("project");
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    await runWithFeedback({
      work: async () => {
        if (deleteTarget.kind === "Folder") {
          await deleteFolder.mutateAsync(deleteTarget.id as ProjectFolderId);
          router.push(folderHrefFor(deleteTarget.parentFolderId));
        } else {
          await deleteProject.mutateAsync(deleteTarget.id as ProjectId);
        }

        setDeleteTarget(null);
        return deleteTarget;
      },
      onSuccess: (deletedTarget) =>
        `Deleted ${deletedTarget.kind.toLowerCase()} ${deletedTarget.name}.`
    });
  };

  if (treeQuery.isLoading) {
    return <ProjectsLoadingState />;
  }

  if (treeQuery.isError) {
    return <ProjectsErrorState error={treeQuery.error} onRetry={() => void treeQuery.refetch()} />;
  }

  const title = currentFolder?.folder.name ?? "Projects";
  const rowCountLabel = `${rows.length} row${pluralSuffix(rows.length)}`;
  const breadcrumbs = [
    { href: "/projects", label: "Projects" },
    ...folderPath.map((node) => ({
      href: `/projects?folder=${node.folder.id}`,
      label: node.folder.name
    }))
  ];
  const currentFolderDeleteTarget = deleteTargetForCurrentFolder(currentFolder);
  const deleteIsPending = deleteFolder.isPending || deleteProject.isPending;

  return (
    <section className="grid gap-4 px-4 py-5">
      <ProjectsHeader
        breadcrumbs={breadcrumbs}
        currentFolderDeleteTarget={currentFolderDeleteTarget}
        onCreateFolder={() => setDialog("folder")}
        onCreateProject={openProjectDialog}
        onDeleteFolder={setDeleteTarget}
        subtitle={
          currentFolder
            ? `${rowCountLabel} in this folder`
            : "Accessible shared folders for the prototype user"
        }
        title={title}
      />
      <ProjectsToolbar />

      {feedback ? (
        <p className="min-h-10 border-y border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700" role="status">
          {feedback}
        </p>
      ) : null}

      <ProjectsDialogs
        currentFolder={currentFolder}
        dialog={dialog}
        onClose={() => setDialog(null)}
        platformIdByName={platformIdByName}
      />

      <ProjectsDeleteConfirm
        disabled={deleteIsPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void handleConfirmDelete()}
        target={deleteTarget}
      />

      <ProjectsList
        currentFolder={currentFolder}
        onCreateFolder={() => setDialog("folder")}
        onCreateProject={openProjectDialog}
        onDelete={setDeleteTarget}
        rows={rows}
      />
    </section>
  );
}
