import { Link2, MoreVertical, Trash2 } from "lucide-react";
import { Button, PageHeader, RowActionsMenu } from "@/components/primitives";
import type { ProjectId } from "@/domain";
import { useProjectWorkspaceQuery } from "@/features/projects/queries";
import type { ShareLinkController } from "@/features/sharing/use-share-link";
import { useProjectWorkspaceActions } from "./workspace-scope-context";

type WorkspaceHeaderProps = {
  projectId: ProjectId;
  shareController: ShareLinkController;
};

export function WorkspaceHeader({ projectId, shareController }: WorkspaceHeaderProps) {
  const workspaceQuery = useProjectWorkspaceQuery(projectId);
  const { requestDelete } = useProjectWorkspaceActions();
  const workspace = workspaceQuery.data;

  if (!workspace) {
    return null;
  }

  return (
    <PageHeader
      actions={
        <div className="flex items-center gap-2">
          <Button
            leftIcon={<Link2 className="size-4" />}
            onClick={() =>
              void shareController.openShareDialog(
                { kind: "project", projectId: workspace.project.id },
                workspace.project.name
              )
            }
          >
            Share project
          </Button>
          <RowActionsMenu
            grouped
            icon={MoreVertical}
            items={[
              {
                destructive: true,
                icon: <Trash2 aria-hidden="true" className="size-4" />,
                label: "Delete project",
                onSelect: () =>
                  requestDelete({
                    kind: "project",
                    id: workspace.project.id,
                    name: workspace.project.name
                  })
              }
            ]}
            label={`Open actions for ${workspace.project.name}`}
          />
        </div>
      }
      breadcrumbs={[
        { href: "/projects", label: "Projects" },
        ...(workspace.folder
          ? [{ href: `/projects?folder=${workspace.folder.id}`, label: workspace.folder.name }]
          : [])
      ]}
      border={false}
      title={workspace.project.name}
    />
  );
}
