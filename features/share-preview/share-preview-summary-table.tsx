"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow
} from "@/components/primitives";

type SharePreviewSummaryTableProps = {
  createdBy: string;
  sharePath: string;
  targetKind: string;
  targetLabel: string;
};

export function SharePreviewSummaryTable({
  createdBy,
  sharePath,
  targetKind,
  targetLabel
}: SharePreviewSummaryTableProps) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Target</TableHeaderCell>
          <TableHeaderCell>Kind</TableHeaderCell>
          <TableHeaderCell>Created by</TableHeaderCell>
          <TableHeaderCell>URL</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        <TableRow>
          <TableCell className="font-medium">{targetLabel}</TableCell>
          <TableCell>{targetKind}</TableCell>
          <TableCell>{createdBy}</TableCell>
          <TableCell>{sharePath}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
