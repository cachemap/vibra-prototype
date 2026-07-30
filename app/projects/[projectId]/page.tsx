"use client";

import { useParams, useSearchParams } from "next/navigation";
import {
  Button,
  ErrorState,
  LoadingState,
  PageStateScaffold
} from "@/components/primitives";
import { asEntityId, type ProjectId } from "@/domain";
import { useProjectWorkspaceQuery } from "@/features/projects/queries";
import { AudioPreviewProvider } from "@/features/projects/audio-preview-context";
import { ProjectWorkspaceLoaded } from "@/features/project-workspace/workspace-content";
import {
  ProjectWorkspaceScopeProvider,
  useProjectWorkspaceSelection
} from "@/features/project-workspace/workspace-scope-context";
import { FeedbackProvider } from "@/features/feedback/feedback-context";
import { messageForError, workspaceErrorFallback } from "@/lib/errors";

export default function ProjectPage() {
  const { projectId: projectIdParam } = useParams<{ projectId: string }>();
  const searchParams = useSearchParams();
  const projectId = asEntityId<ProjectId>(projectIdParam);

  return (
    <FeedbackProvider errorFallback={workspaceErrorFallback} initialMessage={searchParams.get("feedback")}>
      <AudioPreviewProvider>
        <ProjectWorkspaceScopeProvider projectId={projectId}>
          <ProjectWorkspace />
        </ProjectWorkspaceScopeProvider>
      </AudioPreviewProvider>
    </FeedbackProvider>
  );
}

function ProjectWorkspace() {
  const { projectId } = useProjectWorkspaceSelection();
  const workspaceQuery = useProjectWorkspaceQuery(projectId);

  if (workspaceQuery.isLoading) {
    return (
      <PageStateScaffold breadcrumbs={[{ href: "/projects", label: "Projects" }]}>
        <LoadingState title="Loading project workspace" description="Opening the local device workspace." />
      </PageStateScaffold>
    );
  }

  if (workspaceQuery.isError) {
    return (
      <PageStateScaffold breadcrumbs={[{ href: "/projects", label: "Projects" }]}>
        <ErrorState
          action={<Button onClick={() => void workspaceQuery.refetch()}>Retry</Button>}
          title="Project workspace could not load"
          description={messageForError(workspaceQuery.error, workspaceErrorFallback)}
        />
      </PageStateScaffold>
    );
  }

  if (!workspaceQuery.data) {
    return (
      <PageStateScaffold breadcrumbs={[{ href: "/projects", label: "Projects" }]}>
        <LoadingState title="Loading project workspace" description="Opening the local device workspace." />
      </PageStateScaffold>
    );
  }

  return <ProjectWorkspaceLoaded />;
}
