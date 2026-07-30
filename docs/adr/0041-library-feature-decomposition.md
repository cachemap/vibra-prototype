# 0041 Library Feature Decomposition

## Context

Component Decomposition Stage 12 needed the libraries route split without unifying it with the project asset tab. The two surfaces share asset cells and folder-tree helpers, but they have different navigation ownership, columns, tile layout, action placement, and selection mechanics.

## Decision

Create a dedicated `features/libraries/` module for the standalone libraries workspace. `useLibrarySelection` owns URL-backed `library`, `folder`, and `view` state and resolves the selected library, folder path, and visible items through existing TanStack Query hooks. The route keeps the existing Suspense/provider shell and delegates chrome, content, list/table rendering, dialogs, delete confirmation, and mutation orchestration to library-specific modules.

## Consequences

- `app/libraries/page.tsx` is now a thin 101-line composer.
- Shared asset presentation remains limited to `features/assets/asset-cells.tsx`; no generic table/list abstraction was introduced.
- The standalone libraries page can continue to differ from the project assets tab without adding read-only or surface-mode props.
