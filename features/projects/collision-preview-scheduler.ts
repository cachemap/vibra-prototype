import type { InterruptionRecovery, ResolutionBehaviorName } from "@/domain";

export type CollisionPreviewLaneName = "playing" | "incoming";

export type CollisionPreviewScheduleInput = {
  behavior: ResolutionBehaviorName;
  lanes: Readonly<Record<CollisionPreviewLaneName, { offsetMilliseconds: number; playbackUrl: string }>>;
  postInterruptionRecovery: InterruptionRecovery | null;
  targetLane: CollisionPreviewLaneName | null;
};

export type CollisionPreviewSourcePlan = {
  durationSeconds: number | undefined;
  lane: CollisionPreviewLaneName;
  offsetSeconds: number;
  startSeconds: number;
};

export type CollisionPreviewPlan = {
  durationSeconds: number;
  sources: readonly CollisionPreviewSourcePlan[];
};

const millisecondsToSeconds = (milliseconds: number) => Math.max(0, milliseconds) / 1000;

/**
 * Produces source starts from one audio clock. Keeping this calculation separate from Web Audio
 * makes behavior semantics testable and keeps UI timing local to the resolution editor.
 */
export function collisionPreviewPlan(
  input: CollisionPreviewScheduleInput,
  durations: Readonly<Record<CollisionPreviewLaneName, number>>
): CollisionPreviewPlan {
  if (input.behavior === "Not possible") {
    throw new Error("This collision behavior cannot be previewed.");
  }

  const starts = {
    incoming: millisecondsToSeconds(input.lanes.incoming.offsetMilliseconds),
    playing: millisecondsToSeconds(input.lanes.playing.offsetMilliseconds)
  };
  const targetLane = input.targetLane;
  const otherLane: CollisionPreviewLaneName | null =
    targetLane === "playing" ? "incoming" : targetLane === "incoming" ? "playing" : null;
  const normalSource = (lane: CollisionPreviewLaneName): CollisionPreviewSourcePlan => ({
    durationSeconds: undefined,
    lane,
    offsetSeconds: 0,
    startSeconds: starts[lane]
  });

  let sources: CollisionPreviewSourcePlan[] = [normalSource("playing"), normalSource("incoming")];

  if (input.behavior === "Suppress" && targetLane) {
    sources = sources.filter((source) => source.lane !== targetLane);
  }

  if (input.behavior === "Queue" && targetLane && otherLane) {
    sources = sources.map((source) =>
      source.lane === targetLane
        ? { ...source, startSeconds: Math.max(source.startSeconds, starts[otherLane] + durations[otherLane]) }
        : source
    );
  }

  if (input.behavior === "Preempt" && targetLane && otherLane) {
    const collisionSeconds = starts[otherLane];
    const targetStart = starts[targetLane];
    const interruptionDuration = collisionSeconds - targetStart;

    if (interruptionDuration <= 0) {
      sources = sources.filter((source) => source.lane !== targetLane);
    } else {
      sources = sources.map((source) =>
        source.lane === targetLane
          ? { ...source, durationSeconds: Math.min(interruptionDuration, durations[targetLane]) }
          : source
      );

      if (
        input.postInterruptionRecovery === "Resume" &&
        interruptionDuration < durations[targetLane]
      ) {
        sources.push({
          durationSeconds: undefined,
          lane: targetLane,
          offsetSeconds: interruptionDuration,
          startSeconds: collisionSeconds + durations[otherLane]
        });
      }
    }
  }

  const durationSeconds = sources.reduce(
    (latest, source) =>
      Math.max(
        latest,
        source.startSeconds + (source.durationSeconds ?? durations[source.lane] - source.offsetSeconds)
      ),
    0
  );

  return { durationSeconds, sources };
}

type AudioBufferLike = { duration: number };
type AudioBufferSourceLike = {
  buffer: AudioBufferLike | null;
  connect: (destination: AudioNode) => unknown;
  start: (when: number, offset?: number, duration?: number) => void;
  stop: () => void;
};
type AudioContextLike = {
  close?: () => Promise<void>;
  currentTime: number;
  destination: AudioNode;
  createBufferSource: () => AudioBufferSourceLike;
  decodeAudioData: (data: ArrayBuffer) => Promise<AudioBufferLike>;
  resume: () => Promise<void>;
};

export type CollisionPreviewRequest = CollisionPreviewScheduleInput & { scheduleKey: string };

type CollisionPreviewSchedulerOptions = {
  createAudioContext?: () => AudioContextLike;
  fetchAudio?: (
    url: string,
    options?: { signal?: AbortSignal }
  ) => Promise<{ arrayBuffer: () => Promise<ArrayBuffer> }>;
  onError: (message: string) => void;
  onProgress: (scheduleKey: string, seconds: number | null) => void;
};

const previewError =
  "Collision preview could not play. The file may be missing, unsupported, or blocked by the browser.";

/** Owns short-lived Web Audio sources and an in-memory decoded-buffer cache for one provider. */
export class CollisionPreviewScheduler {
  private activeSources = new Set<AudioBufferSourceLike>();
  private audioContext: AudioContextLike | null = null;
  private buffers = new Map<string, Promise<AudioBufferLike>>();
  private frameId: number | null = null;
  private pendingBufferAbortControllers = new Map<string, AbortController>();
  private requestVersion = 0;
  private scheduleKey: string | null = null;

  constructor(private readonly options: CollisionPreviewSchedulerOptions) {}

  async play(request: CollisionPreviewRequest) {
    this.stop();
    const version = ++this.requestVersion;
    this.scheduleKey = request.scheduleKey;
    this.options.onProgress(request.scheduleKey, 0);

    try {
      const context = this.context();
      await context.resume();
      const [playing, incoming] = await Promise.all([
        this.bufferFor(request.lanes.playing.playbackUrl, version),
        this.bufferFor(request.lanes.incoming.playbackUrl, version)
      ]);

      if (version !== this.requestVersion) {
        return;
      }

      const buffers = { incoming, playing };
      const plan = collisionPreviewPlan(request, {
        incoming: incoming.duration,
        playing: playing.duration
      });
      const startedAt = context.currentTime + 0.03;

      plan.sources.forEach((sourcePlan) => {
        const source = context.createBufferSource();
        source.buffer = buffers[sourcePlan.lane];
        source.connect(context.destination);
        source.start(
          startedAt + sourcePlan.startSeconds,
          sourcePlan.offsetSeconds,
          sourcePlan.durationSeconds
        );
        this.activeSources.add(source);
      });

      this.updatePlayhead(request.scheduleKey, startedAt, plan.durationSeconds, version);
    } catch {
      if (version === this.requestVersion) {
        this.options.onError(previewError);
        this.stop();
      }
    }
  }

  stop() {
    this.requestVersion += 1;
    this.pendingBufferAbortControllers.forEach((controller, playbackUrl) => {
      controller.abort();
      this.buffers.delete(playbackUrl);
    });
    this.pendingBufferAbortControllers.clear();

    this.activeSources.forEach((source) => {
      try {
        source.stop();
      } catch {
        // A source may already have finished; it does not need further cleanup.
      }
    });
    this.activeSources.clear();

    if (this.frameId !== null) {
      window.cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }

    if (this.scheduleKey) {
      this.options.onProgress(this.scheduleKey, null);
      this.scheduleKey = null;
    }
  }

  stopSchedule(scheduleKey: string) {
    if (this.scheduleKey === scheduleKey) {
      this.stop();
    }
  }

  dispose() {
    this.stop();
    this.buffers.clear();
    void this.audioContext?.close?.().catch(() => {
      // Browser cleanup is best-effort; a closed context has no preview state to recover.
    });
    this.audioContext = null;
  }

  private bufferFor(playbackUrl: string, requestVersion: number) {
    const cached = this.buffers.get(playbackUrl);

    if (cached) {
      return cached;
    }

    const controller = new AbortController();
    const response = this.options.fetchAudio
      ? this.options.fetchAudio(playbackUrl, { signal: controller.signal })
      : fetch(playbackUrl, { signal: controller.signal }).then((result) => {
          if (!result.ok) {
            throw new Error("Audio request failed.");
          }
          return result;
        });
    const buffer = response
      .then((response) => response.arrayBuffer())
      .then((data) => {
        if (requestVersion !== this.requestVersion) {
          throw new Error("Collision preview request was cancelled.");
        }
        return this.context().decodeAudioData(data);
      });

    this.buffers.set(playbackUrl, buffer);
    this.pendingBufferAbortControllers.set(playbackUrl, controller);
    void buffer.then(
      () => {
        if (this.pendingBufferAbortControllers.get(playbackUrl) === controller) {
          this.pendingBufferAbortControllers.delete(playbackUrl);
        }
      },
      () => {
        if (this.pendingBufferAbortControllers.get(playbackUrl) === controller) {
          this.pendingBufferAbortControllers.delete(playbackUrl);
        }
        if (this.buffers.get(playbackUrl) === buffer) {
          this.buffers.delete(playbackUrl);
        }
      }
    );
    return buffer;
  }

  private context(): AudioContextLike {
    if (!this.audioContext) {
      if (this.options.createAudioContext) {
        this.audioContext = this.options.createAudioContext();
        return this.audioContext;
      }

      const AudioContextConstructor =
        window.AudioContext ??
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

      if (!AudioContextConstructor) {
        throw new Error("Web Audio is unavailable.");
      }
      this.audioContext = new AudioContextConstructor();
    }

    return this.audioContext;
  }

  private updatePlayhead(scheduleKey: string, startedAt: number, durationSeconds: number, version: number) {
    const step = () => {
      if (version !== this.requestVersion || !this.audioContext) {
        return;
      }

      const elapsed = Math.max(0, this.audioContext.currentTime - startedAt);

      if (elapsed >= durationSeconds) {
        this.stop();
        return;
      }

      this.options.onProgress(scheduleKey, elapsed);
      this.frameId = window.requestAnimationFrame(step);
    };

    this.frameId = window.requestAnimationFrame(step);
  }
}
