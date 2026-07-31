# 0059 Collision Preview Web Audio Scheduler

## Context

Collision rules need sample-aligned playback, duration-aware queueing, and interrupt/resume behavior. The existing preview provider uses independent `HTMLAudioElement` timers, which cannot provide those semantics.

## Decision

Keep the provider as Vibra's one-preview-at-a-time boundary, but add a provider-lifetime collision scheduler behind it. The scheduler lazily creates one `AudioContext`, caches decoded buffers by playback URL only in memory, and derives Web Audio source starts from a pure collision-plan function. Sound choices and offsets remain local editor state.

## Consequences

- Co-play, Suppress, Queue, and Preempt/Resume use a shared audio clock without changing authored trigger offsets or saved rules.
- Tap restart, Stop, pair/source changes, and editor unmount cancel active sources and playhead animation.
- Browser fetch/decode/autoplay errors report through the existing provider error surface.
- The remaining lifecycle audit must cover reset and asset-deletion cancellation, plus real-browser scheduler tests.
