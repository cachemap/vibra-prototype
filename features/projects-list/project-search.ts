import type { ProjectListRow } from "./project-row-model";

export function filterProjectRows(rows: readonly ProjectListRow[], searchTerm: string): ProjectListRow[] {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  if (!normalizedSearch) {
    return [...rows];
  }

  return rows.filter((row) =>
    [row.name, row.kind, row.stat].some((value) => value.toLowerCase().includes(normalizedSearch))
  );
}
