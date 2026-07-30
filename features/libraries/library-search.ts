import type { AssetLibrarySummary } from "@/data/repositories/project-repository";

export function filterAssetLibraries(
  libraries: readonly AssetLibrarySummary[],
  searchTerm: string
): AssetLibrarySummary[] {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  if (!normalizedSearch) {
    return [...libraries];
  }

  return libraries.filter((summary) =>
    [
      summary.library.name,
      summary.defaultForProject?.name ?? "",
      summary.importedByProjectCount > 0 ? "imported" : "",
      summary.defaultForProject ? "default" : ""
    ].some((value) => value.toLowerCase().includes(normalizedSearch))
  );
}
