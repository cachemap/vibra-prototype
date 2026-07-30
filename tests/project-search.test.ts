import { describe, expect, it } from "vitest";
import { Boxes, Folder } from "lucide-react";
import { asEntityId, type ProjectFolderId, type ProjectId } from "../domain";
import { filterProjectRows } from "../features/projects-list/project-search";
import type { ProjectListRow } from "../features/projects-list/project-row-model";

const rows: ProjectListRow[] = [
  {
    createdAt: "2026-01-01T00:00:00.000Z",
    href: "/projects?folder=folder-settings",
    icon: Folder,
    id: asEntityId<ProjectFolderId>("folder-settings"),
    kind: "Folder",
    name: "Settings",
    parentFolderId: null,
    stat: "2 projects"
  },
  {
    createdAt: "2026-01-02T00:00:00.000Z",
    href: "/projects/project-checkout",
    icon: Boxes,
    id: asEntityId<ProjectId>("project-checkout"),
    kind: "Project",
    name: "Checkout Feedback",
    stat: "Default library ready"
  }
];

describe("filterProjectRows", () => {
  it("returns all rows for blank searches", () => {
    expect(filterProjectRows(rows, " ")).toEqual(rows);
  });

  it("matches names, kinds, and stats case-insensitively", () => {
    expect(filterProjectRows(rows, "checkout")).toEqual([rows[1]]);
    expect(filterProjectRows(rows, "folder")).toEqual([rows[0]]);
    expect(filterProjectRows(rows, "default")).toEqual([rows[1]]);
  });
});
