# 0038 Assets And Events Tab Decomposition

## Context

Component Decomposition Stage 9 needed the project workspace Assets and Events tab bodies removed from the route file without changing copy, test ids, ARIA, or visual structure.

## Decision

Extract project Assets tab markup into `features/project-workspace/assets-tab.tsx`, with separate asset-library rail and table components. Extract Events tab markup into table/card components backed by a shared `EventRowModel` that computes trigger and playback counts once. Keep query ownership, mutations, dialog state, delete orchestration, and route navigation in the project page for this slice.

Shared asset tree and metadata helpers now live under `features/assets/`, while the generic recursion stays in `lib/tree.ts`.

## Consequences

- The `project-asset-libraries` test id moved with the Assets tab root.
- Desktop and mobile Events views share one count derivation, reducing duplicate computation.
- The project page is smaller, but still owns dialog form state and delete confirmation until Stage 10.
- Libraries and project Assets share low-level asset cells/helpers without forcing one generic asset browser abstraction.
