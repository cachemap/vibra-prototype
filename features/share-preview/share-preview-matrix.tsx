"use client";

import { Grid2X2 } from "lucide-react";

import type { SharingLinkPreviewAggregate } from "@/data/repositories/project-repository";
import { shareBehaviorCopy } from "@/features/matrix/behavior";

type SharePreviewMatrixProps = {
  target: Extract<SharingLinkPreviewAggregate["target"], { kind: "collisionMatrixEntry" }>;
};

export function SharePreviewMatrix({ target }: SharePreviewMatrixProps) {
  const resolution = target.entry.resolutionBehavior;
  const targetName =
    resolution.targetEventId === target.playingEvent.id
      ? target.playingEvent.name
      : resolution.targetEventId === target.incomingEvent.id
        ? target.incomingEvent.name
        : null;

  return (
    <div className="grid gap-3 border-y border-gray-300 bg-gray-50 px-3 py-3">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <Grid2X2 className="size-4 text-gray-500" />
        Matrix Resolution
      </h2>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <div className="border-y border-gray-200 bg-gray-25 px-3 py-2">
          <p className="text-xs font-medium text-gray-500">Playing</p>
          <p className="truncate text-sm font-semibold text-gray-700">{target.playingEvent.name}</p>
          <p className="text-xs text-gray-500">{target.device.name} / {target.platform.name}</p>
        </div>
        <div className="flex min-h-14 items-center justify-center text-xs font-semibold text-gray-500">
          overlaps
        </div>
        <div className="border-y border-gray-200 bg-gray-25 px-3 py-2">
          <p className="text-xs font-medium text-gray-500">Incoming</p>
          <p className="truncate text-sm font-semibold text-gray-700">{target.incomingEvent.name}</p>
          <p className="text-xs text-gray-500">{target.device.name} / {target.platform.name}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-y border-gray-300 bg-gray-25 px-3 py-2">
        <span className="rounded-lg border border-gray-300 bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
        {resolution.behaviorName}
        </span>
        <span className="text-sm text-gray-600">
          {shareBehaviorCopy[resolution.behaviorName]}
        </span>
      </div>
      <p className="text-sm text-gray-600">
        {targetName
          ? `Resolution targets ${targetName}.`
          : "No target event is required for this behavior."}
      </p>
      {resolution.postInterruptionRecovery ? (
        <p className="text-sm text-gray-600">
          Post interruption: {resolution.postInterruptionRecovery}.
        </p>
      ) : null}
      {resolution.systemInterruptionRecovery ? (
        <p className="text-sm text-gray-600">
          System interruption: {resolution.systemInterruptionRecovery}.
        </p>
      ) : null}
    </div>
  );
}
