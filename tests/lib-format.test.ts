import { describe, expect, it } from "vitest";

import { formatAssetDate, formatProjectDate, formatSeconds } from "../lib/format";
import { hrefWithFlashMessage } from "../lib/flash-message";
import { hrefWithParams } from "../lib/search-params";

describe("lib format", () => {
  it("formats asset dates with the current asset-library date options", () => {
    expect(formatAssetDate("2026-07-29T18:42:00.000Z")).toBe("Jul 29");
  });

  it("formats project dates with the current project-list date options", () => {
    expect(formatProjectDate("2026-07-29T18:42:00.000Z")).toBe("Jul 29, 2026");
  });

  it("formats timeline seconds like current preview helpers", () => {
    expect(formatSeconds(0)).toBe("0s");
    expect(formatSeconds(1)).toBe("1s");
    expect(formatSeconds(0.25)).toBe("0.25s");
    expect(formatSeconds(1.2)).toBe("1.20s");
  });
});

describe("lib search params", () => {
  it("matches the project-detail helper for null and non-null values", () => {
    const current = new URLSearchParams("device=device_1&collection=collection_1");

    expect(hrefWithParams("", current, { device: "device_2" })).toBe(
      "?device=device_2&collection=collection_1"
    );
    expect(hrefWithParams("", current, { collection: null })).toBe("?device=device_1");
  });

  it("matches the libraries helper for null and non-null values", () => {
    const current = new URLSearchParams("library=library_1&folder=folder_1&view=list");

    expect(hrefWithParams("/libraries", current, { folder: "folder_2", view: "tiles" })).toBe(
      "/libraries?library=library_1&folder=folder_2&view=tiles"
    );
    expect(hrefWithParams("/libraries", current, { library: null, folder: null })).toBe(
      "/libraries?view=list"
    );
  });

  it("matches the projects folder href helper while preserving existing params when provided", () => {
    expect(hrefWithParams("/projects", new URLSearchParams(), { folder: "folder_1" })).toBe(
      "/projects?folder=folder_1"
    );
    expect(hrefWithParams("/projects", new URLSearchParams("folder=folder_1"), { folder: null })).toBe(
      "/projects"
    );
  });
});

describe("lib flash messages", () => {
  it("adds feedback to hrefs like the current event-detail helper", () => {
    expect(hrefWithFlashMessage("/projects/project_1?device=device_1", "Deleted event")).toBe(
      "/projects/project_1?device=device_1&feedback=Deleted+event"
    );
  });
});
