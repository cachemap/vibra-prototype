# 0037 Project Workspace Scope Context

## Context

Component Decomposition Stage 8 needs matrix selection, workspace navigation, active tabs, asset-library selection, dialog requests, and delete targets to survive tab-body unmounts without keeping them in the project page.

## Decision

Add `features/project-workspace/workspace-scope-context.tsx` with separate selection and actions contexts. The provider resolves identifiers through TanStack Query hooks, but does not expose aggregate data through context. Header, sidebar, mobile controls, tab bar, and empty workspace chrome now live in `features/project-workspace/`.

## Consequences

- Matrix selection persists from a workspace-scope provider instead of page-local state.
- Header/sidebar/mobile chrome can re-call query hooks and use cached data instead of receiving large aggregates.
- Dialog form state and tab bodies still remain on the page until the next decomposition stages.
- Navigation actions are stable callbacks backed by an effect-refreshed navigation ref to avoid prop drilling.

