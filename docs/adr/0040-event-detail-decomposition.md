# 0040 Event Detail Decomposition

## Context

Component Decomposition Stage 11 needed the event detail route split without changing copy, DOM semantics, ARIA surfaces, or timeline behavior. The inline timeline lane builder also subscribed the whole route to audio-preview playhead updates.

## Decision

Move event detail presentation into `features/events/` modules: route query shell, loaded content orchestration, workspace view, header, dialog overlay, delete confirms, and timeline. Keep the dialog layer as one `DialogOverlay`, but split each form body into its own file. Move timeline sorting, max-duration, event-location, and preview-item grouping into pure derivation helpers with unit tests.

`EventTimeline` is now the only event-detail component that reads `useAudioPreviewState()`, and it memoizes `TimelineLane` construction around stable callbacks from the loaded content component.

## Consequences

- `app/projects/[projectId]/events/[eventId]/page.tsx` is 88 lines and only handles providers, route params, the project workspace query, and query-state branches.
- Event timeline derivations are unit-tested independently of React.
- Timeline playhead updates re-render the timeline subtree instead of the whole route.
- Event dialog form files stay under the feature-file size target while preserving the single overlay behavior.
