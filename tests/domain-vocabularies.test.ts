import { describe, expect, it } from "vitest";
import * as v from "valibot";

import {
  eventTypeSchema,
  eventTypes,
  mediaKindSchema,
  mediaKinds,
  platformNameSchema,
  platformNames,
  resolutionBehaviorNameSchema,
  resolutionBehaviorNames,
  shareTargetSchema,
  triggerNameSchema,
  triggerNames
} from "../domain";

describe("domain vocabularies", () => {
  it("accepts every platform name in the model", () => {
    expect(platformNames.map((name) => v.parse(platformNameSchema, name))).toEqual([
      "iOS",
      "Windows",
      "Mac",
      "Linux",
      "Android"
    ]);
  });

  it("accepts every interaction phase trigger name in the model", () => {
    expect(triggerNames.map((name) => v.parse(triggerNameSchema, name))).toEqual([
      "onHover",
      "onPress",
      "onRelease",
      "onHold"
    ]);
  });

  it("accepts every event type in the model", () => {
    expect(eventTypes.map((eventType) => v.parse(eventTypeSchema, eventType))).toEqual([
      "Button",
      "Toggle",
      "Banner",
      "Toast"
    ]);
  });

  it("accepts every collision resolution behavior in the model", () => {
    expect(
      resolutionBehaviorNames.map((behavior) => v.parse(resolutionBehaviorNameSchema, behavior))
    ).toEqual(["Preempt", "Queue", "Co-play", "Suppress", "Not possible"]);
  });

  it("accepts every media kind in the model", () => {
    expect(mediaKinds.map((mediaKind) => v.parse(mediaKindSchema, mediaKind))).toEqual([
      "audio",
      "haptic"
    ]);
  });

  it("rejects deprecated or drifted vocabulary", () => {
    expect(v.safeParse(resolutionBehaviorNameSchema, "Supress").success).toBe(false);
    expect(v.safeParse(resolutionBehaviorNameSchema, "Coplay").success).toBe(false);
    expect(v.safeParse(resolutionBehaviorNameSchema, "Duck").success).toBe(false);
    expect(v.safeParse(platformNameSchema, "iPadOS").success).toBe(false);
  });

  it("represents share targets as an exclusive discriminated union", () => {
    expect(v.safeParse(shareTargetSchema, { kind: "project", projectId: "project_1" }).success).toBe(
      true
    );

    expect(
      v.safeParse(shareTargetSchema, {
        kind: "project",
        projectId: "project_1",
        eventId: "event_1"
      }).success
    ).toBe(false);
  });
});
