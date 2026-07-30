"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import {
  Boxes,
  Bell,
  Folder,
  FolderPlus,
  Plus,
  Square,
  Trash2,
  ToggleRight
} from "lucide-react";
import {
  ActionMenu,
  Button,
  CardGrid,
  Checkbox,
  ConfirmDialog,
  DeviceGlyph,
  Dialog,
  DialogOverlay,
  EmptyState,
  ErrorState,
  LoadingState,
  MenuGroup,
  MenuItem,
  PageHeader,
  SelectableCard,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TextInput
} from "@/components/primitives";
import { DEMO_USER_ID } from "@/data/seed";
import {
  useCreateProjectFolderMutation,
  useCreateProjectMutation,
  useDeleteProjectFolderMutation,
  useDeleteProjectMutation,
  useProjectTreeQuery
} from "@/features/projects/queries";
import {
  AppError,
  asEntityId,
  eventTypes,
  groupDevicePresetsByFormFactor,
  toUserFacingErrorMessage,
  type DevicePreset,
  type EventType,
  type PlatformId,
  type ProjectFolderId,
  type ProjectId
} from "@/domain";
import type { CreatedProjectAggregate, ProjectFolderNode } from "@/data/repositories/project-repository";

type Row =
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

type FolderDeleteTarget = Extract<Row, { kind: "Folder" }>;
type ProjectDeleteTarget = Extract<Row, { kind: "Project" }>;
type DeleteTarget =
  | Pick<FolderDeleteTarget, "id" | "kind" | "name" | "parentFolderId" | "stat">
  | Pick<ProjectDeleteTarget, "id" | "kind" | "name" | "stat">;

const findNode = (
  nodes: readonly ProjectFolderNode[],
  folderId: ProjectFolderId
): ProjectFolderNode | null => {
  for (const node of nodes) {
    if (node.folder.id === folderId) {
      return node;
    }

    const child = findNode(node.childFolders, folderId);

    if (child) {
      return child;
    }
  }

  return null;
};

const findPath = (
  nodes: readonly ProjectFolderNode[],
  folderId: ProjectFolderId,
  path: ProjectFolderNode[] = []
): ProjectFolderNode[] | null => {
  for (const node of nodes) {
    const nextPath = [...path, node];

    if (node.folder.id === folderId) {
      return nextPath;
    }

    const childPath = findPath(node.childFolders, folderId, nextPath);

    if (childPath) {
      return childPath;
    }
  }

  return null;
};

const countProjects = (node: ProjectFolderNode): number =>
  node.projects.length + node.childFolders.reduce((total, child) => total + countProjects(child), 0);

const formatDate = (value: string): string =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(value));

const messageForError = (error: unknown): string => {
  if (error instanceof AppError) {
    return `${toUserFacingErrorMessage(error)} ${error.message}`;
  }

  return "The local demo data could not be updated.";
};

const memberInitials = ["D", "P", "A"];

const starterEventGroups = [
  { label: "Notifications", eventTypes: ["Toast", "Banner"] },
  { label: "Key interactions", eventTypes: ["Button", "Toggle"] }
] as const satisfies readonly { label: string; eventTypes: readonly EventType[] }[];

const eventTypeIcon = {
  Banner: Bell,
  Button: Square,
  Toast: Bell,
  Toggle: ToggleRight
} satisfies Record<EventType, typeof Bell>;

const normalizedIncludes = (value: string, query: string) =>
  value.toLowerCase().includes(query.trim().toLowerCase());

function MemberStack() {
  return (
    <span className="inline-flex max-w-full items-center">
      <span className="flex shrink-0 items-center">
        {memberInitials.map((initial, index) => (
          <span
            className="-ml-1 flex size-5 items-center justify-center rounded-full border border-gray-25 bg-gray-200 text-[10px] font-semibold text-gray-700 first:ml-0"
            key={initial}
            style={{ zIndex: memberInitials.length - index }}
          >
            {initial}
          </span>
        ))}
      </span>
      <span className="ml-2 whitespace-nowrap text-xs text-gray-500">+2</span>
    </span>
  );
}

export default function ProjectsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedFolderParam = searchParams.get("folder");
  const selectedFolderId = selectedFolderParam
    ? asEntityId<ProjectFolderId>(selectedFolderParam)
    : null;
  const [dialog, setDialog] = useState<"folder" | "project" | null>(null);
  const [folderName, setFolderName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [selectedPresetIds, setSelectedPresetIds] = useState<string[]>([]);
  const [selectedStarterEventTypes, setSelectedStarterEventTypes] = useState<EventType[]>([]);
  const [starterEventSearch, setStarterEventSearch] = useState("");
  const [feedback, setFeedback] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const persisted = window.sessionStorage.getItem("vibra.projects.feedback");
    window.sessionStorage.removeItem("vibra.projects.feedback");
    return persisted;
  });
  const [openActionRowId, setOpenActionRowId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const treeQuery = useProjectTreeQuery(DEMO_USER_ID);
  const createFolder = useCreateProjectFolderMutation();
  const createProject = useCreateProjectMutation();
  const deleteFolder = useDeleteProjectFolderMutation();
  const deleteProject = useDeleteProjectMutation();

  const currentFolder = useMemo(() => {
    if (!treeQuery.data || !selectedFolderId) {
      return null;
    }

    return findNode(treeQuery.data.roots, selectedFolderId);
  }, [selectedFolderId, treeQuery.data]);

  const folderPath = useMemo(() => {
    if (!treeQuery.data || !selectedFolderId) {
      return [];
    }

    return findPath(treeQuery.data.roots, selectedFolderId) ?? [];
  }, [selectedFolderId, treeQuery.data]);

  const rows: Row[] = useMemo(() => {
    if (!treeQuery.data) {
      return [];
    }

    if (!currentFolder) {
      return [
        ...treeQuery.data.roots.map((node) => ({
          createdAt: node.folder.createdAt,
          href: `/projects?folder=${node.folder.id}`,
          icon: Folder,
          id: node.folder.id,
          kind: "Folder" as const,
          name: node.folder.name,
          parentFolderId: node.folder.parentFolderId,
          stat: `${countProjects(node)} projects`
        })),
        ...treeQuery.data.rootProjects.map((project) => ({
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
      ...currentFolder.childFolders.map((node) => ({
        createdAt: node.folder.createdAt,
        href: `/projects?folder=${node.folder.id}`,
        icon: Folder,
        id: node.folder.id,
        kind: "Folder" as const,
        name: node.folder.name,
        parentFolderId: node.folder.parentFolderId,
        stat: node.isEmptyLeaf ? "Empty leaf" : `${countProjects(node)} projects`
      })),
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
  }, [currentFolder, treeQuery.data]);

  const platformIdByName = useMemo(
    () => new Map((treeQuery.data?.platforms ?? []).map((platform) => [platform.name, platform.id])),
    [treeQuery.data?.platforms]
  );
  const selectedPresets = useMemo(
    () => groupDevicePresetsByFormFactor().flatMap((group) =>
      group.presets.filter((preset) => selectedPresetIds.includes(preset.presetId))
    ),
    [selectedPresetIds]
  );
  const folderHrefFor = (folderId: ProjectFolderId | null) =>
    folderId ? `/projects?folder=${folderId}` : "/projects";

  const openProjectDialog = () => {
    setProjectName("");
    setSelectedPresetIds([]);
    setSelectedStarterEventTypes([]);
    setStarterEventSearch("");
    setFeedback(null);
    setDialog("project");
  };

  const togglePreset = (preset: DevicePreset) => {
    setSelectedPresetIds((current) =>
      current.includes(preset.presetId)
        ? current.filter((presetId) => presetId !== preset.presetId)
        : [...current, preset.presetId]
    );
  };

  const toggleStarterEventType = (eventType: EventType) => {
    setSelectedStarterEventTypes((current) =>
      current.includes(eventType)
        ? current.filter((selectedEventType) => selectedEventType !== eventType)
        : [...current, eventType]
    );
  };

  const handleCreateFolder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setFeedback(null);

    try {
      const folder = await createFolder.mutateAsync({
        parentFolderId: currentFolder?.folder.id ?? null,
        createdByUserId: currentFolder ? undefined : DEMO_USER_ID,
        name: folderName
      });

      setFolderName("");
      setDialog(null);
      setFeedback(`Created folder ${folder.name}.`);
      router.push(`/projects?folder=${folder.id}`);
    } catch (error) {
      setFeedback(messageForError(error));
    }
  };

  const handleCreateProject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setFeedback(null);

    try {
      const created: CreatedProjectAggregate = await createProject.mutateAsync({
        folderId: currentFolder?.folder.id ?? null,
        name: projectName,
        devices: selectedPresets.map((preset) => ({
          platformId: asEntityId<PlatformId>(platformIdByName.get(preset.platformName) ?? ""),
          name: preset.deviceName
        })),
        starterEventTypes: selectedStarterEventTypes
      });

      setProjectName("");
      setSelectedPresetIds([]);
      setSelectedStarterEventTypes([]);
      setStarterEventSearch("");
      setDialog(null);
      setFeedback(
        `Created ${created.project.name} with ${created.defaultAssetLibrary.name} asset library.`
      );
      router.push(
        created.devices[0]
          ? `/projects/${created.project.id}?device=${created.devices[0].device.id}`
          : `/projects/${created.project.id}`
      );
    } catch (error) {
      setFeedback(messageForError(error));
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    setFeedback(null);

    try {
      if (deleteTarget.kind === "Folder") {
        await deleteFolder.mutateAsync(deleteTarget.id as ProjectFolderId);
        router.push(folderHrefFor(deleteTarget.parentFolderId));
      } else {
        await deleteProject.mutateAsync(deleteTarget.id as ProjectId);
      }

      setFeedback(`Deleted ${deleteTarget.kind.toLowerCase()} ${deleteTarget.name}.`);
      setDeleteTarget(null);
      setOpenActionRowId(null);
    } catch (error) {
      setFeedback(messageForError(error));
    }
  };

  const deleteIsPending = deleteFolder.isPending || deleteProject.isPending;
  const currentFolderDeleteTarget: DeleteTarget | null = currentFolder
    ? {
        id: currentFolder.folder.id,
        kind: "Folder",
        name: currentFolder.folder.name,
        parentFolderId: currentFolder.folder.parentFolderId,
        stat: currentFolder.isEmptyLeaf ? "Empty leaf" : `${countProjects(currentFolder)} projects`
      }
    : null;

  const renderRowActions = (row: Row) => {
    const open = openActionRowId === row.id;

    return (
      <div className="flex justify-end">
        <ActionMenu
          label={`Open actions for ${row.name}`}
          onOpenChange={(next) => setOpenActionRowId(next ? row.id : null)}
          open={open}
          size="compact"
        >
          <MenuGroup>
            <MenuItem
              destructive
              icon={<Trash2 aria-hidden="true" size={16} />}
              onClick={() => {
                setDeleteTarget(row);
                setOpenActionRowId(null);
              }}
            >
              Delete {row.kind.toLowerCase()}
            </MenuItem>
          </MenuGroup>
        </ActionMenu>
      </div>
    );
  };

  if (treeQuery.isLoading) {
    return (
      <section className="grid gap-4 px-4 py-5">
        <PageHeader
          breadcrumbs={[{ href: "/projects", label: "Projects" }]}
          border={false}
          className="px-0 py-0"
        />
        <LoadingState title="Loading project folders" description="Restoring the local demo workspace." />
      </section>
    );
  }

  if (treeQuery.isError) {
    return (
      <section className="grid gap-4 px-4 py-5">
        <PageHeader
          breadcrumbs={[{ href: "/projects", label: "Projects" }]}
          border={false}
          className="px-0 py-0"
        />
        <ErrorState
          action={<Button onClick={() => void treeQuery.refetch()}>Retry</Button>}
          title="Project tree could not load"
          description={messageForError(treeQuery.error)}
        />
      </section>
    );
  }

  const title = currentFolder?.folder.name ?? "Projects";
  const rowCountLabel = rows.length === 1 ? "1 row" : `${rows.length} rows`;
  const breadcrumbs = [
    { href: "/projects", label: "Projects" },
    ...folderPath.map((node) => ({
      href: `/projects?folder=${node.folder.id}`,
      label: node.folder.name
    }))
  ];

  return (
    <section className="grid gap-4 px-4 py-5">
      <PageHeader
        actions={
          <>
            {currentFolderDeleteTarget ? (
              <ActionMenu
                label={`Open actions for ${currentFolderDeleteTarget.name}`}
                onOpenChange={(next) =>
                  setOpenActionRowId(next ? currentFolderDeleteTarget.id : null)
                }
                open={openActionRowId === currentFolderDeleteTarget.id}
              >
                <MenuGroup>
                  <MenuItem
                    destructive
                    icon={<Trash2 aria-hidden="true" size={16} />}
                    onClick={() => {
                      setDeleteTarget(currentFolderDeleteTarget);
                      setOpenActionRowId(null);
                    }}
                  >
                    Delete folder
                  </MenuItem>
                </MenuGroup>
              </ActionMenu>
            ) : null}
            <Button
              leftIcon={<FolderPlus className="size-4" />}
              onClick={() => setDialog("folder")}
            >
              New folder
            </Button>
            <Button
              leftIcon={<Plus className="size-4" />}
              onClick={openProjectDialog}
              variant="primary"
            >
              New
            </Button>
          </>
        }
        breadcrumbs={breadcrumbs}
        border={false}
        className="px-0 py-0"
        subtitle={
          currentFolder
            ? `${rowCountLabel} in this folder`
            : "Accessible shared folders for the prototype user"
        }
        title={title}
      />

      <div className="flex flex-wrap items-end justify-end gap-3 border-b border-gray-300 pb-3">
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-end">
          <TextInput
            className="w-full sm:w-[220px]"
            disabled
            id="project-search"
            label="Search"
            placeholder="Search arrives in a later slice"
          />
        </div>
      </div>

      {feedback ? (
        <p className="min-h-10 border-y border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700" role="status">
          {feedback}
        </p>
      ) : null}

      {dialog === "folder" ? (
        <DialogOverlay>
          <Dialog
            actions={
              <>
                <Button onClick={() => setDialog(null)}>Cancel</Button>
                <Button form="create-folder-form" type="submit" variant="primary">
                  Create folder
                </Button>
              </>
            }
            className="max-w-md"
            title="Create folder"
          >
            <form className="grid gap-4" id="create-folder-form" onSubmit={handleCreateFolder}>
              <TextInput
                autoFocus
                id="folder-name"
                label="Folder name"
                onChange={(event) => setFolderName(event.target.value)}
                placeholder="Empty Explorations"
                value={folderName}
              />
            </form>
          </Dialog>
        </DialogOverlay>
      ) : null}

      {dialog === "project" ? (
        <DialogOverlay>
          <Dialog
            actions={
              <>
                <Button onClick={() => setDialog(null)}>Cancel</Button>
                <Button
                  disabled={!projectName.trim() || createProject.isPending}
                  form="create-project-form"
                  type="submit"
                  variant="primary"
                >
                  Create project
                </Button>
              </>
            }
            size="wide"
            title="New Project"
          >
            <form className="grid gap-4 md:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]" id="create-project-form" onSubmit={handleCreateProject}>
              <section className="grid content-start gap-4">
                <div className="grid gap-1">
                  <h3 className="text-sm font-semibold text-gray-700">Select the systems for your project</h3>
                  <p className="text-xs text-gray-500">
                    {selectedPresetIds.length
                      ? `${selectedPresetIds.length} selected`
                      : "Optional. Start empty when the target systems are not final."}
                  </p>
                </div>
                <div className="grid max-h-[54vh] gap-5 overflow-auto pr-1">
                  {groupDevicePresetsByFormFactor().map((group) => (
                    <section className="grid gap-2" key={group.formFactor}>
                      <h4 className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">
                        {group.formFactor}
                      </h4>
                      <CardGrid className="xl:grid-cols-2">
                        {group.presets.map((preset) => {
                          const checked = selectedPresetIds.includes(preset.presetId);

                          return (
                            <SelectableCard
                              checked={checked}
                              description={preset.platformName}
                              icon={<DeviceGlyph formFactor={preset.formFactor} />}
                              id={`project-device-${preset.presetId}`}
                              key={preset.presetId}
                              label={preset.deviceName}
                              onChange={() => togglePreset(preset)}
                            />
                          );
                        })}
                      </CardGrid>
                    </section>
                  ))}
                </div>
              </section>

              <section className="grid content-start gap-4 border-t border-gray-200 pt-4 md:border-l md:border-t-0 md:pl-4 md:pt-0">
                <TextInput
                  autoFocus
                  id="project-name"
                  label="Project name"
                  onChange={(event) => setProjectName(event.target.value)}
                  placeholder="Settings Feedback"
                  required
                  value={projectName}
                />
                <div className="grid gap-2">
                  <TextInput
                    id="starter-event-search"
                    label="Starter events"
                    onChange={(event) => setStarterEventSearch(event.target.value)}
                    placeholder="Search Button, Toast..."
                    value={starterEventSearch}
                  />
                  <div className="grid gap-4 border-y border-gray-200 bg-gray-50 p-3">
                    {starterEventGroups.map((group) => {
                      const visibleEventTypes = group.eventTypes.filter((eventType) =>
                        normalizedIncludes(eventType, starterEventSearch)
                      );

                      if (!visibleEventTypes.length) {
                        return null;
                      }

                      return (
                        <section className="grid gap-2" key={group.label}>
                          <h4 className="text-xs font-semibold text-gray-500">{group.label}</h4>
                          <div className="grid gap-2">
                            {visibleEventTypes.map((eventType) => {
                              const Icon = eventTypeIcon[eventType];

                              return (
                                <Checkbox
                                  checked={selectedStarterEventTypes.includes(eventType)}
                                  id={`starter-event-${eventType}`}
                                  key={eventType}
                                  label={
                                    <span className="flex min-w-0 items-center gap-2">
                                      <Icon aria-hidden="true" className="size-4 shrink-0 text-gray-500" strokeWidth={1.8} />
                                      <span>{eventType}</span>
                                    </span>
                                  }
                                  onChange={() => toggleStarterEventType(eventType)}
                                />
                              );
                            })}
                          </div>
                        </section>
                      );
                    })}
                    {eventTypes.every((eventType) => !normalizedIncludes(eventType, starterEventSearch)) ? (
                      <p className="text-sm text-gray-500">No starter events match this search.</p>
                    ) : null}
                  </div>
                </div>
              </section>
            </form>
          </Dialog>
        </DialogOverlay>
      ) : null}

      {deleteTarget ? (
        <ConfirmDialog
          confirmLabel={`Delete ${deleteTarget.kind.toLowerCase()}`}
          disabled={deleteIsPending}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => void handleConfirmDelete()}
          title={`Delete ${deleteTarget.kind.toLowerCase()}?`}
          cascadeSummary={
            deleteTarget.kind === "Folder"
              ? "Child folders, projects, devices, events, assets, matrix rules, and share links in this folder tree."
              : "Devices, collections, events, the default asset library, imported-library links, matrix rules, assets, and share links for this project."
          }
        >
          This removes {deleteTarget.name} and its demo workspace records from IndexedDB.
        </ConfirmDialog>
      ) : null}

      {rows.length > 0 ? (
        <>
          <div className="hidden md:block">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Name</TableHeaderCell>
                  <TableHeaderCell>Type</TableHeaderCell>
                  <TableHeaderCell>Contents</TableHeaderCell>
                  <TableHeaderCell>Created</TableHeaderCell>
                  <TableHeaderCell>Members</TableHeaderCell>
                  <TableHeaderCell className="w-10" />
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">
                      <Link className="flex min-w-0 items-center gap-2 hover:text-purple-700" href={row.href}>
                        <row.icon aria-hidden="true" className="size-4 shrink-0 text-gray-500" strokeWidth={1.8} />
                        <span className="truncate">{row.name}</span>
                      </Link>
                    </TableCell>
                    <TableCell>{row.kind}</TableCell>
                    <TableCell>{row.stat}</TableCell>
                    <TableCell>{formatDate(row.createdAt)}</TableCell>
                    <TableCell>
                      <MemberStack />
                    </TableCell>
                    <TableCell>
                      {renderRowActions(row)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="grid border-y border-gray-300 md:hidden">
            {rows.map((row) => (
              <div className="grid gap-2 border-b border-gray-200 bg-gray-25 px-3 py-3 last:border-b-0" key={row.id}>
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <Link
                    className="flex min-w-0 items-start gap-2 font-medium text-gray-700 hover:text-purple-700"
                    href={row.href}
                  >
                    <row.icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-gray-500" strokeWidth={1.8} />
                    <span className="line-clamp-2 break-words">{row.name}</span>
                  </Link>
                  <div className="shrink-0">{renderRowActions(row)}</div>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-gray-500">
                  <span className="min-w-0">
                    <span className="font-medium text-gray-700">{row.kind}</span>
                  </span>
                  <span className="min-w-0 text-right">{formatDate(row.createdAt)}</span>
                  <span className="min-w-0 truncate">{row.stat}</span>
                  <span className="flex min-w-0 justify-end">
                    <MemberStack />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button leftIcon={<FolderPlus className="size-4" />} onClick={() => setDialog("folder")}>
                Create folder
              </Button>
              <Button leftIcon={<Plus className="size-4" />} onClick={openProjectDialog} variant="primary">
                Create project
              </Button>
            </div>
          }
          title={currentFolder ? "Empty folder" : "No projects yet"}
          description={
            currentFolder
              ? "This folder is ready for folders or projects."
              : "Create a root folder or project to start the workspace."
          }
        />
      ) : null}
    </section>
  );
}
