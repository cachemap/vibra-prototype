import { describe, expect, it } from "vitest";

import { getActiveWorkspaceSection } from "../components/layout/workspace-shell";

describe("getActiveWorkspaceSection", () => {
  it("keeps Projects active for project and event-detail routes", () => {
    expect(getActiveWorkspaceSection("/projects")).toBe("projects");
    expect(getActiveWorkspaceSection("/projects/project-1")).toBe("projects");
    expect(getActiveWorkspaceSection("/projects/project-1/events/event-1")).toBe("projects");
  });

  it("keeps Libraries active for library routes", () => {
    expect(getActiveWorkspaceSection("/libraries")).toBe("libraries");
    expect(getActiveWorkspaceSection("/libraries/library-1")).toBe("libraries");
  });

  it("does not select a workspace section outside the workspace", () => {
    expect(getActiveWorkspaceSection("/share/demo-token")).toBeNull();
  });
});
