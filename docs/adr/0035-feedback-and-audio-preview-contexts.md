# 0035 Feedback And Audio Preview Contexts

## Context

Component decomposition needs cross-cutting feedback and audio-preview behavior outside the large page components. Feedback state was page-local with repeated try/catch blocks, while audio-preview playhead updates were owned by page components that will be split into feature modules.

## Decision

Add page-scoped `FeedbackProvider` and `AudioPreviewProvider` layers. Split both into volatile value contexts and stable actions contexts. Keep providers receiving opaque `children` subtrees so provider state changes only re-render actual context consumers. Feedback keeps page-specific error fallbacks, and audio preview wraps the existing player hook while exposing a context-backed `AudioPreviewButton`.

## Consequences

- Future extracted feature modules can report feedback and control previews without prop drilling.
- `runWithFeedback` centralizes error mapping while preserving success copy at call sites.
- Timeline playhead state is available through a volatile context for later narrow subscribers.
- The share preview page keeps its existing props-based audio button until its dedicated decomposition stage.
