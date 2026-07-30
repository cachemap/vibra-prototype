"use client";

import { BookOpen, Plus, Trash2 } from "lucide-react";
import { Badge, IconButton, RowActionsMenu, TextInput } from "@/components/primitives";
import type { AssetLibraryId } from "@/domain";
import type { AssetLibrarySummary } from "@/data/repositories/project-repository";

type LibraryRailProps = {
  libraries: readonly AssetLibrarySummary[];
  librarySearchTerm: string;
  onCreateLibrary: () => void;
  onDeleteLibrary: (summary: AssetLibrarySummary) => void;
  onLibrarySearchTermChange: (term: string) => void;
  onSelectLibrary: (libraryId: AssetLibraryId) => void;
  selectedLibraryId: AssetLibraryId | null;
};

export function LibraryRail({
  libraries,
  librarySearchTerm,
  onCreateLibrary,
  onDeleteLibrary,
  onLibrarySearchTermChange,
  onSelectLibrary,
  selectedLibraryId
}: LibraryRailProps) {
  const hasSearch = librarySearchTerm.trim().length > 0;

  return (
    <aside className="border-b border-gray-300 bg-gray-50 px-4 py-5 md:border-b-0 md:border-r">
      <div className="grid gap-4">
        <div>
          <h1 className="text-md font-semibold text-gray-700">Asset Libraries</h1>
          <p className="mt-1 text-xs text-gray-500">Reusable audio and haptic source material.</p>
        </div>
        <TextInput
          id="library-search"
          placeholder="Search"
          aria-label="Search asset libraries"
          className="pl-9"
          onChange={(event) => onLibrarySearchTermChange(event.currentTarget.value)}
          type="search"
          value={librarySearchTerm}
        />
        <div className="flex items-center justify-between text-sm font-semibold text-gray-700">
          <span>Libraries</span>
          <IconButton icon={Plus} label="Create library" onClick={onCreateLibrary} size="compact" />
        </div>
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-1">
          {libraries.length === 0 ? (
            <p className="rounded-lg border border-dashed border-gray-300 px-3 py-3 text-sm text-gray-500">
              {hasSearch ? "No libraries match this search." : "No libraries yet."}
            </p>
          ) : null}
          {libraries.map((summary) => {
            const selected = summary.library.id === selectedLibraryId;

            return (
              <div
                className={`grid grid-cols-[1fr_auto] items-start gap-2 rounded-xl border px-3 py-3 text-left transition-colors ${
                  selected ? "border-gray-200 bg-gray-200" : "border-gray-300 bg-gray-25 hover:bg-gray-100"
                }`}
                key={summary.library.id}
              >
                <button className="min-w-0 text-left" onClick={() => onSelectLibrary(summary.library.id)} type="button">
                  <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <BookOpen className="size-4 shrink-0 text-gray-600" strokeWidth={1.8} />
                    <span className="truncate">{summary.library.name}</span>
                  </span>
                  <span className="mt-1 block text-xs text-gray-500">
                    {summary.assetCount} assets, {summary.folderCount} folders
                  </span>
                  <span className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-medium text-gray-600">
                    {summary.defaultForProject ? <Badge>Default</Badge> : null}
                    {summary.importedByProjectCount > 0 ? <Badge>Imported</Badge> : null}
                  </span>
                </button>
                {summary.defaultForProject ? null : (
                  <span className="inline-flex justify-end">
                    <RowActionsMenu
                      items={[
                        {
                          destructive: true,
                          icon: <Trash2 className="size-4" />,
                          label: "Delete library",
                          onSelect: () => onDeleteLibrary(summary)
                        }
                      ]}
                      label={`Open actions for ${summary.library.name}`}
                      size="compact"
                    />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
