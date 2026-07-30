import type { ReactNode } from "react";
import { cx } from "./class-names";

export interface TimelineBlock {
  controls?: ReactNode;
  durationSeconds?: number;
  id: string;
  isDisabled?: boolean;
  kind: "audio" | "haptic";
  label: string;
  meta?: string;
  offsetSeconds: number;
}

export interface TimelineLane {
  blocks: TimelineBlock[];
  controls?: ReactNode;
  emptyAction?: ReactNode;
  id: string;
  isDisabled?: boolean;
  label: string;
  meta?: ReactNode;
  playheadLabel?: string;
  playheadSeconds?: number | null;
  title?: string;
  trailingAction?: ReactNode;
}

interface TimelineProps {
  lanes: TimelineLane[];
  maxSeconds?: number;
}

const majorMarks = Array.from({ length: 11 }, (_, index) => index);
const minorMarksPerMajor = 4;
const labelColumnWidth = 232;
const rulerHeight = 34;
const blockHeight = 26;
const blockGap = 4;
const lanePadding = 10;
const minimumLaneHeight = 68;

const blockClassByKind: Record<TimelineBlock["kind"], string> = {
  audio: "border-purple-500/60 bg-purple-500/10 text-gray-700",
  haptic: "border-purple-500/40 bg-purple-500/20 text-gray-700"
};

const formatMark = (seconds: number, maxSeconds: number) => {
  if (maxSeconds <= 1) {
    return `${Math.round(seconds * 1000)}ms`;
  }

  return `${seconds.toFixed(seconds % 1 === 0 ? 0 : 2)}s`;
};

const laneHeightFor = (lane: TimelineLane) =>
  Math.max(minimumLaneHeight, lanePadding * 2 + lane.blocks.length * (blockHeight + blockGap) - blockGap);

const percentOf = (seconds: number, maxSeconds: number) =>
  Math.min(100, Math.max(0, (seconds / maxSeconds) * 100));

export function Timeline({ lanes, maxSeconds = 1 }: TimelineProps) {
  const resolvedMaxSeconds = Math.max(maxSeconds, 0.1);
  const defaultBlockDuration = resolvedMaxSeconds * 0.14;

  return (
    <div className="overflow-x-auto border-y border-gray-300 bg-gray-25">
      <div className="flex min-w-[680px]">
        <div className="shrink-0 border-r border-gray-200" style={{ width: labelColumnWidth }}>
          <div
            className="flex items-center px-3 text-xs font-medium text-gray-500"
            style={{ height: rulerHeight }}
          >
            Interaction
          </div>
          {lanes.map((lane) => (
            <div
              className={cx(
                "flex items-center gap-2 border-t border-gray-200 px-3",
                lane.isDisabled ? "bg-gray-100 text-gray-500" : "text-gray-700"
              )}
              key={lane.id}
              style={{ height: laneHeightFor(lane) }}
            >
              <span className="grid min-w-0 gap-1">
                <span className="flex min-w-0 items-center gap-2">
                  {lane.controls ? <span className="shrink-0">{lane.controls}</span> : null}
                  <span className="truncate text-sm font-medium" title={lane.title ?? lane.label}>
                    {lane.label}
                  </span>
                </span>
                {lane.meta ? <span className="min-w-0 text-xs text-gray-500">{lane.meta}</span> : null}
              </span>
            </div>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          <div className="relative border-b border-gray-200" style={{ height: rulerHeight }}>
            {majorMarks.map((mark) => {
              const seconds = (resolvedMaxSeconds * mark) / 10;

              return (
                <div className="absolute inset-y-0" key={mark} style={{ left: `${mark * 10}%` }}>
                  <span className="absolute bottom-1 left-1 whitespace-nowrap text-[11px] tabular-nums text-gray-500">
                    {formatMark(seconds, resolvedMaxSeconds)}
                  </span>
                </div>
              );
            })}
            {majorMarks.slice(0, -1).flatMap((mark) =>
              Array.from({ length: minorMarksPerMajor }, (_, minorIndex) => {
                const left = mark * 10 + ((minorIndex + 1) * 10) / (minorMarksPerMajor + 1);

                return (
                  <span
                    className="absolute bottom-2 size-[2px] rounded-full bg-gray-300"
                    key={`${mark}-${minorIndex}`}
                    style={{ left: `${left}%` }}
                  />
                );
              })
            )}
          </div>

          {lanes.map((lane) => {
            const hasPlayhead = lane.playheadSeconds !== null && lane.playheadSeconds !== undefined;

            return (
              <div
                className={cx(
                  "relative border-t border-gray-200",
                  lane.isDisabled ? "bg-gray-100" : undefined
                )}
                key={lane.id}
                style={{ height: laneHeightFor(lane) }}
              >
                {lane.blocks.length === 0 && lane.emptyAction ? (
                  <div className="flex h-full items-center px-2">{lane.emptyAction}</div>
                ) : null}
                {lane.blocks.map((block, blockIndex) => {
                  const left = percentOf(block.offsetSeconds, resolvedMaxSeconds);
                  const width = Math.min(
                    100 - left,
                    Math.max(
                      12,
                      percentOf(block.durationSeconds ?? defaultBlockDuration, resolvedMaxSeconds)
                    )
                  );

                  return (
                    <div
                      className={cx(
                        "absolute grid grid-cols-[1fr_auto] items-center gap-2 overflow-hidden rounded-md border px-2 text-left",
                        blockClassByKind[block.kind],
                        lane.isDisabled || block.isDisabled ? "opacity-55" : undefined
                      )}
                      key={block.id}
                      style={{
                        height: blockHeight,
                        left: `${left}%`,
                        minWidth: 140,
                        top: lanePadding + blockIndex * (blockHeight + blockGap),
                        width: `${width}%`
                      }}
                    >
                      <span className="flex min-w-0 items-baseline gap-2">
                        <span className="truncate text-xs font-medium">{block.label}</span>
                        <span className="shrink-0 text-[11px] tabular-nums text-gray-500">
                          {block.meta ?? `${block.offsetSeconds.toFixed(2)}s`}
                        </span>
                      </span>
                      {block.controls ? <span className="shrink-0">{block.controls}</span> : null}
                    </div>
                  );
                })}
                {lane.blocks.length && lane.trailingAction ? (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">{lane.trailingAction}</div>
                ) : null}
                {hasPlayhead ? (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 z-10 w-px bg-purple-500"
                    data-testid="timeline-playhead"
                    style={{ left: `${percentOf(lane.playheadSeconds ?? 0, resolvedMaxSeconds)}%` }}
                  >
                    <span className="absolute -left-[9px] -top-[9px] grid size-[18px] place-items-center rounded-full border-2 border-gray-700 bg-purple-600 text-[10px] font-semibold text-gray-25 shadow-sm">
                      {lane.playheadLabel ?? "A"}
                    </span>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
