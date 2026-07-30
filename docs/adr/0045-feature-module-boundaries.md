# 0045 Feature Module Boundaries

## Context

The decomposition split repeated helpers, primitives, and route bodies into smaller modules. Without explicit boundaries, shared code could drift into a second data layer or primitives could start owning feature behavior.

## Decision

Keep `lib/` pure and mostly domain-agnostic. Keep `components/primitives/` presentation-only with no data hooks. Put feature-specific derivations, controllers, and components in `features/<domain>/`, where calling TanStack Query hooks and mutation hooks is allowed. Route files remain thin composers for providers, params, and top-level loading/error branches.

## Consequences

- Shared helpers are testable without React, Dexie, or route context.
- Primitives stay reusable and visual-system focused.
- Feature modules can be split by data dependency without creating generic table or list frameworks.
- Future behavior changes have an obvious owner: domain rules in `domain/`, persistence in `data/`, UI behavior in `features/`.
