export const platformNames = ["iOS", "Windows", "Mac", "Linux", "Android"] as const;
export type PlatformName = (typeof platformNames)[number];

export const triggerNames = ["onHover", "onPress", "onRelease", "onHold"] as const;
export type TriggerName = (typeof triggerNames)[number];

export const eventTypes = ["Button", "Toggle", "Banner", "Toast"] as const;
export type EventType = (typeof eventTypes)[number];

export const resolutionBehaviorNames = [
  "Preempt",
  "Queue",
  "Co-play",
  "Suppress",
  "Not possible"
] as const;
export type ResolutionBehaviorName = (typeof resolutionBehaviorNames)[number];

export const mediaKinds = ["audio", "haptic"] as const;
export type MediaKind = (typeof mediaKinds)[number];

export const shareTargetKinds = ["project", "event", "collisionMatrixEntry"] as const;
export type ShareTargetKind = (typeof shareTargetKinds)[number];
