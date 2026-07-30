"use client";

import { Smartphone } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow
} from "@/components/primitives";
import type { SharingLinkPreviewAggregate } from "@/data/repositories/project-repository";

type SharePreviewDeviceProps = {
  target: Extract<SharingLinkPreviewAggregate["target"], { kind: "project" }>;
};

export function SharePreviewDevice({ target }: SharePreviewDeviceProps) {
  return (
    <div className="grid gap-3">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <Smartphone className="size-4 text-gray-500" />
        Device Targets
      </h2>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Device</TableHeaderCell>
            <TableHeaderCell>Platform</TableHeaderCell>
            <TableHeaderCell>Collections</TableHeaderCell>
            <TableHeaderCell>Events</TableHeaderCell>
            <TableHeaderCell>Playback/export</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {target.devices.map((summary) => (
            <TableRow key={summary.device.id}>
              <TableCell className="font-medium">{summary.device.name}</TableCell>
              <TableCell>{summary.platform.name}</TableCell>
              <TableCell>{summary.collectionCount}</TableCell>
              <TableCell>{summary.eventCount}</TableCell>
              <TableCell>{summary.device.isEnabled ? "Included" : "Disabled device excluded"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
