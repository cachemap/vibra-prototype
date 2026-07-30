# 0044 Context Boundary Policy

## Context

Component decomposition needed to move page-local UI state out of dense routes without replacing TanStack Query's cache or causing broad rerenders during feedback updates and audio-preview animation.

## Decision

Use React context only for scope and UI state: workspace selection, dialog/delete orchestration, page feedback, and audio-preview state. Keep server data in TanStack Query hooks, and let extracted components re-call query hooks by ID to receive cached data. Split contexts into volatile value contexts and stable action contexts. Providers receive their subtree through `children` so provider state updates can bail out of non-consuming subtrees.

## Consequences

- Feature components can own their data dependency without prop drilling whole aggregates.
- Audio playhead updates and feedback messages re-render only subscribing leaves.
- Query invalidation remains centralized in `features/projects/queries.ts`.
- Contexts stay page-scoped instead of becoming an app-global data store.
