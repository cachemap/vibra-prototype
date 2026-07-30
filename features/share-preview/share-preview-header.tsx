"use client";

import { Copy } from "lucide-react";

import { Badge, Breadcrumbs, Button } from "@/components/primitives";
import type { SharingLinkPreviewAggregate } from "@/data/repositories/project-repository";
import { pluralSuffix } from "@/lib/plural";

type SharePreviewHeaderProps = {
  onCopyLink: () => void;
  preview: SharingLinkPreviewAggregate;
};

export function targetLabelFor(target: SharingLinkPreviewAggregate["target"]): string {
  return target.kind === "project"
    ? target.project.name
    : target.kind === "event"
      ? target.event.name
      : `${target.playingEvent.name} x ${target.incomingEvent.name}`;
}

export function targetKindFor(target: SharingLinkPreviewAggregate["target"]): string {
  return target.kind === "collisionMatrixEntry" ? "Collision Matrix Entry" : target.kind === "project" ? "Project" : "Event";
}

function sourceContextFor(target: SharingLinkPreviewAggregate["target"]): string {
  return target.kind === "project"
    ? `${target.devices.length} device target${pluralSuffix(target.devices.length)} configured`
    : target.kind === "event"
      ? `${target.project.name} / ${target.device.name} / ${target.collection.name}`
      : `${target.project.name} / ${target.device.name} / Collision Matrix`;
}

export function SharePreviewHeader({ onCopyLink, preview }: SharePreviewHeaderProps) {
  const target = preview.target;
  const targetLabel = targetLabelFor(target);
  const targetKind = targetKindFor(target);
  const sourceContext = sourceContextFor(target);

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="grid gap-2">
        <Breadcrumbs
          items={[
            { href: "/projects", label: "Projects" },
            { label: "Share preview" }
          ]}
        />
        <div className="grid gap-2 border-y border-gray-300 bg-gray-50 px-3 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="text-xs font-semibold text-gray-700" variant="outline">
              {targetKind}
            </Badge>
            <span className="text-xs font-medium text-gray-500">Source: {sourceContext}</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-700">{targetLabel}</h1>
            <p className="text-sm text-gray-500">Created by {preview.createdByUser.preferredName}.</p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button leftIcon={<Copy className="size-4" />} onClick={onCopyLink}>
          Copy link
        </Button>
      </div>
    </div>
  );
}
