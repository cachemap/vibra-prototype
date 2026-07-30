import type { ReactNode } from "react";
import type { CollectionId, ProjectId } from "@/domain";
import type { DeviceSummary } from "@/data/repositories/project-repository";
import type { ShareLinkController } from "@/features/sharing/use-share-link";
import { WorkspaceHeader } from "./workspace-header";
import { WorkspaceMobileControls } from "./workspace-mobile-controls";
import { WorkspaceSidebar } from "./workspace-sidebar";

type WorkspaceLayoutProps = {
  children: ReactNode;
  dialogLayer: ReactNode;
  onAddCollection: () => void;
  onAddDevice: () => void;
  projectId: ProjectId;
  selectedCollectionId: CollectionId | null;
  selectedDevice: DeviceSummary | null;
  shareController: ShareLinkController;
};

export function WorkspaceLayout({
  children,
  dialogLayer,
  onAddCollection,
  onAddDevice,
  projectId,
  selectedCollectionId,
  selectedDevice,
  shareController
}: WorkspaceLayoutProps) {
  return (
    <section className="grid min-h-[calc(100vh-64px)] grid-rows-[auto_1fr] bg-gray-25">
      <WorkspaceHeader projectId={projectId} shareController={shareController} />

      <div className="grid min-h-0 md:grid-cols-[268px_1fr]">
        <WorkspaceSidebar
          onAddCollection={onAddCollection}
          onAddDevice={onAddDevice}
          projectId={projectId}
          selectedCollectionId={selectedCollectionId}
          selectedDevice={selectedDevice}
        />

        <main className="grid min-w-0 content-start gap-4 px-4 py-3 md:py-4">
          <WorkspaceMobileControls
            projectId={projectId}
            selectedCollectionId={selectedCollectionId}
            selectedDevice={selectedDevice}
          />
          {children}
        </main>
      </div>

      {dialogLayer}
    </section>
  );
}

