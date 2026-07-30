import { describe, expect, it } from "vitest";
import { asEntityId, asISODateString, type AssetLibraryFolderId, type AssetLibraryId, type ProjectId } from "../domain";
import { filterAssetLibraries } from "../features/libraries/library-search";
import type { AssetLibrarySummary } from "../data/repositories/project-repository";

const summaries: AssetLibrarySummary[] = [
  {
    assetCount: 3,
    defaultForProject: {
      createdAt: asISODateString("2026-01-01T00:00:00.000Z"),
      defaultAssetLibraryId: asEntityId<AssetLibraryId>("library-checkout"),
      folderId: null,
      id: asEntityId<ProjectId>("project-checkout"),
      name: "Checkout"
    },
    folderCount: 2,
    importedByProjectCount: 0,
    library: {
      defaultForProjectId: asEntityId<ProjectId>("project-checkout"),
      id: asEntityId<AssetLibraryId>("library-checkout"),
      name: "Checkout Defaults"
    },
    rootFolder: {
      icon: "folder",
      id: asEntityId<AssetLibraryFolderId>("folder-checkout-root"),
      libraryId: asEntityId<AssetLibraryId>("library-checkout"),
      name: "Root",
      parentFolderId: null
    }
  },
  {
    assetCount: 5,
    defaultForProject: null,
    folderCount: 4,
    importedByProjectCount: 2,
    library: {
      defaultForProjectId: null,
      id: asEntityId<AssetLibraryId>("library-material"),
      name: "Material Motion"
    },
    rootFolder: {
      icon: "folder",
      id: asEntityId<AssetLibraryFolderId>("folder-material-root"),
      libraryId: asEntityId<AssetLibraryId>("library-material"),
      name: "Root",
      parentFolderId: null
    }
  }
];

describe("filterAssetLibraries", () => {
  it("returns all summaries for blank searches", () => {
    expect(filterAssetLibraries(summaries, "")).toEqual(summaries);
  });

  it("matches library names, owning project names, and badges case-insensitively", () => {
    expect(filterAssetLibraries(summaries, "motion")).toEqual([summaries[1]]);
    expect(filterAssetLibraries(summaries, "checkout")).toEqual([summaries[0]]);
    expect(filterAssetLibraries(summaries, "imported")).toEqual([summaries[1]]);
    expect(filterAssetLibraries(summaries, "default")).toEqual([summaries[0]]);
  });
});
