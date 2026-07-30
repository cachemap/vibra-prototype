import { Button, ErrorState, LoadingState, PageStateScaffold } from "@/components/primitives";
import { messageForError, projectsErrorFallback } from "@/lib/errors";

const projectsBreadcrumbs = [{ href: "/projects", label: "Projects" }];

export function ProjectsLoadingState() {
  return (
    <PageStateScaffold breadcrumbs={projectsBreadcrumbs}>
      <LoadingState title="Loading project folders" description="Restoring the local demo workspace." />
    </PageStateScaffold>
  );
}

type ProjectsErrorStateProps = {
  error: unknown;
  onRetry: () => void;
};

export function ProjectsErrorState({ error, onRetry }: ProjectsErrorStateProps) {
  return (
    <PageStateScaffold breadcrumbs={projectsBreadcrumbs}>
      <ErrorState
        action={<Button onClick={onRetry}>Retry</Button>}
        title="Project tree could not load"
        description={messageForError(error, projectsErrorFallback)}
      />
    </PageStateScaffold>
  );
}
