import { describe, expect, it, vi } from "vitest";
import {
  CollisionPreviewScheduler,
  collisionPreviewPlan
} from "@/features/projects/collision-preview-scheduler";

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

describe("CollisionPreviewScheduler lifecycle", () => {
  it("aborts stale buffer work and never starts sources after cancellation", async () => {
    const pendingRequests: Array<{
      resolve: (response: { arrayBuffer: () => Promise<ArrayBuffer> }) => void;
      signal: AbortSignal | undefined;
    }> = [];
    const source = {
      buffer: null,
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn()
    };
    const decodeAudioData = vi.fn().mockResolvedValue({ duration: 1 });
    const onProgress = vi.fn();
    const scheduler = new CollisionPreviewScheduler({
      createAudioContext: () => ({
        createBufferSource: () => source,
        currentTime: 0,
        decodeAudioData,
        destination: {} as AudioNode,
        resume: vi.fn().mockResolvedValue(undefined)
      }),
      fetchAudio: (_url, options) =>
        new Promise((resolve) => {
          pendingRequests.push({ resolve, signal: options?.signal });
        }),
      onError: vi.fn(),
      onProgress
    });

    const play = scheduler.play({
      behavior: "Co-play",
      lanes,
      postInterruptionRecovery: null,
      scheduleKey: "collision-preview:test",
      targetLane: null
    });

    await Promise.resolve();
    await Promise.resolve();
    expect(pendingRequests).toHaveLength(2);

    scheduler.stop();

    expect(pendingRequests.map((request) => request.signal?.aborted)).toEqual([true, true]);
    expect(onProgress).toHaveBeenLastCalledWith("collision-preview:test", null);

    pendingRequests.forEach((request) =>
      request.resolve({ arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) })
    );
    await play;

    expect(decodeAudioData).not.toHaveBeenCalled();
    expect(source.start).not.toHaveBeenCalled();
  });
});
