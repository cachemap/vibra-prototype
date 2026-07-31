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

type SourceSpy = {
  buffer: { duration: number } | null;
  connect: ReturnType<typeof vi.fn>;
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
};

function schedulerWithDecodedBuffers() {
  const sources: SourceSpy[] = [];
  const onError = vi.fn();
  const onProgress = vi.fn();
  const decodeAudioData = vi.fn(async (data: ArrayBuffer) => ({
    duration: new Uint8Array(data)[0]
  }));
  const scheduler = new CollisionPreviewScheduler({
    createAudioContext: () => ({
      createBufferSource: () => {
        const source: SourceSpy = {
          buffer: null,
          connect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn()
        };
        sources.push(source);
        return source;
      },
      currentTime: 10,
      decodeAudioData,
      destination: {} as AudioNode,
      resume: vi.fn().mockResolvedValue(undefined)
    }),
    fetchAudio: vi.fn(async (url: string) => ({
      arrayBuffer: async () => new Uint8Array([url === lanes.playing.playbackUrl ? 2 : 1]).buffer
    })),
    onError,
    onProgress
  });

  return { onError, onProgress, scheduler, sources };
}

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
  it("schedules Co-play lanes at their authored offsets on one audio clock", async () => {
    const { scheduler, sources } = schedulerWithDecodedBuffers();

    await scheduler.play({
      behavior: "Co-play",
      lanes,
      postInterruptionRecovery: null,
      scheduleKey: "collision-preview:co-play",
      targetLane: null
    });

    expect(sources).toHaveLength(2);
    expect(sources[0].start).toHaveBeenCalledWith(10.03, 0, undefined);
    expect(sources[1].start).toHaveBeenCalledWith(10.18, 0, undefined);
  });

  it("omits the suppressed target from scheduled sources", async () => {
    const { scheduler, sources } = schedulerWithDecodedBuffers();

    await scheduler.play({
      behavior: "Suppress",
      lanes,
      postInterruptionRecovery: null,
      scheduleKey: "collision-preview:suppress",
      targetLane: "incoming"
    });

    expect(sources).toHaveLength(1);
    expect(sources[0].buffer).toEqual({ duration: 2 });
    expect(sources[0].start).toHaveBeenCalledWith(10.03, 0, undefined);
  });

  it("queues the target after the other lane completes", async () => {
    const { scheduler, sources } = schedulerWithDecodedBuffers();

    await scheduler.play({
      behavior: "Queue",
      lanes,
      postInterruptionRecovery: null,
      scheduleKey: "collision-preview:queue",
      targetLane: "incoming"
    });

    expect(sources).toHaveLength(2);
    expect(sources[0].start).toHaveBeenCalledWith(10.03, 0, undefined);
    expect(sources[1].start).toHaveBeenCalledWith(12.03, 0, undefined);
  });

  it("preempts the target and resumes its remaining audio after the interrupting lane", async () => {
    const { scheduler, sources } = schedulerWithDecodedBuffers();

    await scheduler.play({
      behavior: "Preempt",
      lanes,
      postInterruptionRecovery: "Resume",
      scheduleKey: "collision-preview:preempt-resume",
      targetLane: "playing"
    });

    expect(sources).toHaveLength(3);
    expect(sources[0].start).toHaveBeenCalledWith(10.03, 0, 0.15);
    expect(sources[1].start).toHaveBeenCalledWith(10.18, 0, undefined);
    expect(sources[2].start).toHaveBeenCalledWith(11.18, 0.15, undefined);
  });

  it("reports decode and fetch failures without leaving a scheduled preview active", async () => {
    const onError = vi.fn();
    const onProgress = vi.fn();
    const scheduler = new CollisionPreviewScheduler({
      createAudioContext: () => ({
        createBufferSource: vi.fn(),
        currentTime: 0,
        decodeAudioData: vi.fn(),
        destination: {} as AudioNode,
        resume: vi.fn().mockResolvedValue(undefined)
      }),
      fetchAudio: vi.fn().mockRejectedValue(new Error("Audio request failed.")),
      onError,
      onProgress
    });

    await scheduler.play({
      behavior: "Co-play",
      lanes,
      postInterruptionRecovery: null,
      scheduleKey: "collision-preview:error",
      targetLane: null
    });

    expect(onError).toHaveBeenCalledWith(
      "Collision preview could not play. The file may be missing, unsupported, or blocked by the browser."
    );
    expect(onProgress).toHaveBeenLastCalledWith("collision-preview:error", null);
  });

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

  it("keeps collision audio functional while suppressing animated playhead updates for reduced motion", async () => {
    vi.useFakeTimers();
    const source = {
      buffer: null,
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn()
    };
    const onProgress = vi.fn();
    const requestAnimationFrame = vi.spyOn(window, "requestAnimationFrame");
    const scheduler = new CollisionPreviewScheduler({
      createAudioContext: () => ({
        createBufferSource: () => source,
        currentTime: 0,
        decodeAudioData: vi.fn().mockResolvedValue({ duration: 1 }),
        destination: {} as AudioNode,
        resume: vi.fn().mockResolvedValue(undefined)
      }),
      fetchAudio: vi.fn().mockResolvedValue({ arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) }),
      onError: vi.fn(),
      onProgress
    });

    await scheduler.play({
      behavior: "Co-play",
      lanes,
      postInterruptionRecovery: null,
      reduceMotion: true,
      scheduleKey: "collision-preview:reduced-motion",
      targetLane: null
    });

    expect(source.start).toHaveBeenCalledTimes(2);
    expect(requestAnimationFrame).not.toHaveBeenCalled();
    expect(onProgress).toHaveBeenCalledWith("collision-preview:reduced-motion", 0);

    await vi.advanceTimersByTimeAsync(1200);
    expect(onProgress).toHaveBeenLastCalledWith("collision-preview:reduced-motion", null);

    scheduler.dispose();
    requestAnimationFrame.mockRestore();
    vi.useRealTimers();
  });
});
