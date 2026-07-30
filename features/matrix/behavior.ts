import {
  ArrowRight,
  CornerDownLeft,
  Move,
  Pause,
  Timer,
  type LucideIcon
} from "lucide-react";
import type { CollisionMatrixEntry, ResolutionBehaviorName } from "@/domain";

export const behaviorCopy: Record<ResolutionBehaviorName, string> = {
  Preempt: "Incoming stops the playing one and takes over.",
  Suppress: "Incoming does not play. The playing one continues.",
  Queue: "Incoming waits and plays when the current one finishes.",
  "Co-play": "Both play at full level.",
  "Not possible": "These two cannot occur at the same time."
};

export const shareBehaviorCopy: Record<ResolutionBehaviorName, string> = {
  Preempt: "Incoming stops the playing event and takes over.",
  Queue: "Incoming waits until the playing event finishes.",
  "Co-play": "Both events play together at full level.",
  Suppress: "One event is suppressed while the other continues.",
  "Not possible": "These two events cannot occur at the same time."
};

export const behaviorIconFor = (behavior: ResolutionBehaviorName): LucideIcon => {
  if (behavior === "Preempt") {
    return CornerDownLeft;
  }

  if (behavior === "Suppress") {
    return ArrowRight;
  }

  if (behavior === "Queue") {
    return Timer;
  }

  if (behavior === "Co-play") {
    return Move;
  }

  return Pause;
};

export const behaviorCellClass = (
  entry: CollisionMatrixEntry | undefined,
  selected: boolean
) => {
  if (selected) {
    return "bg-gray-200 text-gray-700";
  }

  if (!entry) {
    return "text-gray-500";
  }

  return "text-gray-700";
};

export const behaviorBubbleClass = (
  entry: CollisionMatrixEntry | undefined,
  selected: boolean
) =>
  selected
    ? "border-gray-300 bg-gray-25 text-gray-700"
    : entry?.resolutionBehavior.behaviorName === "Not possible"
      ? "border-gray-200 bg-gray-100 text-gray-500"
      : "border-gray-200 bg-gray-25 text-gray-700";
