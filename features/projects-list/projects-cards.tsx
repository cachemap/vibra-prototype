import Link from "next/link";
import { formatProjectDate } from "@/lib/format";
import { MemberStack } from "./member-stack";
import type { ProjectListDeleteTarget, ProjectListRow } from "./project-row-model";
import { ProjectsRowActions } from "./projects-row-actions";

type ProjectsCardsProps = {
  onDelete: (target: ProjectListDeleteTarget) => void;
  rows: readonly ProjectListRow[];
};

export function ProjectsCards({ onDelete, rows }: ProjectsCardsProps) {
  return (
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
            <div className="shrink-0">
              <ProjectsRowActions onDelete={onDelete} row={row} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-gray-500">
            <span className="min-w-0">
              <span className="font-medium text-gray-700">{row.kind}</span>
            </span>
            <span className="min-w-0 text-right">{formatProjectDate(row.createdAt)}</span>
            <span className="min-w-0 truncate">{row.stat}</span>
            <span className="flex min-w-0 justify-end">
              <MemberStack />
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
