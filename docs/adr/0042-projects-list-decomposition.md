# 0042 Projects List Decomposition

## Context

Component Decomposition Stage 13 needed the projects list route split without changing its table/card layouts, disabled search affordance, create flows, delete confirmation copy, or feedback flash behavior.

## Decision

Create `features/projects-list/` with a route-level controller, pure project folder tree helpers over `lib/tree.ts`, a shared row model, table/card renderers, toolbar, header, create dialogs, and delete confirmation. Keep the route as a Suspense plus `FeedbackProvider` shell that passes `readAndClearFlashMessage()` into the provider.

## Consequences

- `app/projects/page.tsx` is now a 26-line wrapper.
- Root and nested folder rows are derived through one row-model path before rendering desktop table and mobile cards.
- The bulky project creator is isolated from the route while preserving its local selection/search state in the controller.
- The projects-list feature follows the same feature-module pattern as libraries without introducing a generic record-list abstraction.
