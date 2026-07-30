import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow
} from "@/components/primitives";
import { formatProjectDate } from "@/lib/format";
import { MemberStack } from "./member-stack";
import type { ProjectListDeleteTarget, ProjectListRow } from "./project-row-model";
import { ProjectsRowActions } from "./projects-row-actions";

type ProjectsTableProps = {
  onDelete: (target: ProjectListDeleteTarget) => void;
  rows: readonly ProjectListRow[];
};

export function ProjectsTable({ onDelete, rows }: ProjectsTableProps) {
  return (
    <div className="hidden md:block">
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Name</TableHeaderCell>
            <TableHeaderCell>Type</TableHeaderCell>
            <TableHeaderCell>Contents</TableHeaderCell>
            <TableHeaderCell>Created</TableHeaderCell>
            <TableHeaderCell>Members</TableHeaderCell>
            <TableHeaderCell className="w-10" />
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">
                <Link className="flex min-w-0 items-center gap-2 hover:text-purple-700" href={row.href}>
                  <row.icon aria-hidden="true" className="size-4 shrink-0 text-gray-500" strokeWidth={1.8} />
                  <span className="truncate">{row.name}</span>
                </Link>
              </TableCell>
              <TableCell>{row.kind}</TableCell>
              <TableCell>{row.stat}</TableCell>
              <TableCell>{formatProjectDate(row.createdAt)}</TableCell>
              <TableCell>
                <MemberStack />
              </TableCell>
              <TableCell>
                <ProjectsRowActions onDelete={onDelete} row={row} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
