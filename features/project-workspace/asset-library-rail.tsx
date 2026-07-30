import { BookOpen } from "lucide-react";
import { Badge } from "@/components/primitives";
import type { AssetLibrary, AssetLibraryId } from "@/domain";
import type { AssetLibrarySummary } from "@/data/repositories/project-repository";

type ProjectAssetLibrary = {
  library: AssetLibrary;
  status: string;
};

type AssetLibraryRailProps = {
  libraries: readonly ProjectAssetLibrary[];
  librarySummaryById: ReadonlyMap<AssetLibraryId, AssetLibrarySummary>;
  onSelectLibrary: (libraryId: AssetLibraryId) => void;
  selectedLibraryId: AssetLibraryId | null;
};

export function AssetLibraryRail({
  libraries,
  librarySummaryById,
  onSelectLibrary,
  selectedLibraryId
}: AssetLibraryRailProps) {
  return (
    <aside className="grid content-start gap-2 border-y border-gray-300 bg-gray-50 px-3 py-3">
      {libraries.map(({ library, status }) => {
        const summary = librarySummaryById.get(library.id);
        const selected = selectedLibraryId === library.id;

        return (
          <button
            className={`grid rounded-xl border px-3 py-3 text-left transition-colors ${
              selected
                ? "border-gray-200 bg-gray-200 text-gray-700"
                : "border-gray-300 bg-gray-25 text-gray-600 hover:bg-gray-100"
            }`}
            key={library.id}
            onClick={() => onSelectLibrary(library.id)}
            type="button"
          >
            <span className="flex min-w-0 items-start justify-between gap-3">
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-gray-700">{library.name}</span>
                <span className="mt-1 block text-xs text-gray-500">
                  {summary?.assetCount ?? 0} assets, {summary?.folderCount ?? 0} folders
                </span>
              </span>
              <BookOpen className="size-4 shrink-0 text-gray-600" strokeWidth={1.8} />
            </span>
            <span className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-medium text-gray-600">
              <Badge>{status}</Badge>
            </span>
          </button>
        );
      })}
    </aside>
  );
}
