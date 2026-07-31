# 0053 Route-derived global toolbar

## Context

The global shell needed a clear selected workspace section without duplicating state that can drift from navigation. Reset demo also needed to remain available beside the Vibra mark while theme controls live with section navigation.

## Decision

Derive the active Projects or Libraries section from `usePathname()` in `WorkspaceShell`. Keep the Vibra logo and Reset demo in the left toolbar group; keep section links and the shared `ThemeModeToggle` in the right group. At narrow widths, only button labels collapse, preserving accessible names and controls.

## Consequences

- Active navigation follows direct links, nested project routes, and browser navigation automatically.
- Reset retains its existing data/query behavior without participating in visual section state.
- Theme preference remains owned by `next-themes`, independent of reset and route changes.
