import { describe, expect, it } from "vitest";
import { collisionPreviewPlan } from "@/features/projects/collision-preview-scheduler";

const lanes = {
  incoming: { offsetMilliseconds: 150, playbackUrl: "/incoming.wav" },
  playing: { offsetMilliseconds: 0, playbackUrl: "/playing.wav" }
} as const;

const durations = { incoming: 1, playing: 2 };

describe("collisionPreviewPlan", () => {
  it("aligns Co-play sources to the shared editor offsets", () => {
    expect(
      collisionPreviewPlan(
        { behavior: "Co-play", lanes, postInterruptionRecovery: null, targetLane: null },
        durations
      ).sources
    ).toEqual([
      { durationSeconds: undefined, lane: "playing", offsetSeconds: 0, startSeconds: 0 },
      { durationSeconds: undefined, lane: "incoming", offsetSeconds: 0, startSeconds: 0.15 }
    ]);
  });

  it("omits a suppressed target and queues a waiting target after the other buffer", () => {
    const suppressed = collisionPreviewPlan(
      { behavior: "Suppress", lanes, postInterruptionRecovery: null, targetLane: "incoming" },
      durations
    );
    const queued = collisionPreviewPlan(
      { behavior: "Queue", lanes, postInterruptionRecovery: null, targetLane: "incoming" },
      durations
    );

    expect(suppressed.sources).toEqual([
      { durationSeconds: undefined, lane: "playing", offsetSeconds: 0, startSeconds: 0 }
    ]);
    expect(queued.sources).toContainEqual({
      durationSeconds: undefined,
      lane: "incoming",
      offsetSeconds: 0,
      startSeconds: 2
    });
  });

  it("stops Preempt at the collision and creates a resumed source only when requested", () => {
    const plan = collisionPreviewPlan(
      {
        behavior: "Preempt",
        lanes,
        postInterruptionRecovery: "Resume",
        targetLane: "playing"
      },
      durations
    );

    expect(plan.sources).toContainEqual({
      durationSeconds: 0.15,
      lane: "playing",
      offsetSeconds: 0,
      startSeconds: 0
    });
    expect(plan.sources).toContainEqual({
      durationSeconds: undefined,
      lane: "playing",
      offsetSeconds: 0.15,
      startSeconds: 1.15
    });
  });

  it("rejects Not possible before it can schedule audio", () => {
    expect(() =>
      collisionPreviewPlan(
        { behavior: "Not possible", lanes, postInterruptionRecovery: null, targetLane: null },
        durations
      )
    ).toThrow("cannot be previewed");
  });
});
