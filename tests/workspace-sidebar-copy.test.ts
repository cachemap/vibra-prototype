import { describe, expect, it } from "vitest";

import { workspaceSidebarCopy } from "../features/project-workspace/workspace-sidebar-copy";

describe("workspace sidebar copy", () => {
  it("uses canonical device vocabulary", () => {
    expect(workspaceSidebarCopy.deviceHeading).toBe("Devices");
    expect(workspaceSidebarCopy.noDevices).toBe("No devices yet.");
    expect(workspaceSidebarCopy.noMatchingDevices).toBe("No matching devices.");
    expect(workspaceSidebarCopy.collectionRequiresDevice).toBe("Select a device before adding collections.");
  });
});
