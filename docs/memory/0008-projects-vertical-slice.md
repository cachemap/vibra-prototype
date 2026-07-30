# Phase 4 Projects Vertical Slice

## Changed

- Replaced the `/projects` placeholder with the seeded project folder explorer.
- Added breadcrumb route state with `/projects?folder=<folderId>` for nested browsing.
- Rendered shared top-level folders, child folders, project rows, and intentional empty leaf-folder states.
- Added create-folder and create-project dialogs with disabled invalid actions and typed repository error messaging.
- Added visible demo reset/reseed from the Projects view.
- Added project-folder repository creation plus TanStack mutation invalidation.
- Updated Playwright config to use `localhost` because Next 16 blocks `127.0.0.1` dev resources by default.
- Added Playwright smoke coverage for folder browsing and project creation.
- Added ADR `0016-project-folder-explorer-route-state.md`.

## Verification

- `pnpm typecheck` passed.
- `pnpm lint` passed.
- `pnpm test -- tests/project-repository.test.ts` passed; Vitest ran 7 files and 56 tests.
- `pnpm test:e2e -- tests/e2e/projects.spec.ts` passed.

## Recommended Next Group

Start Phase 5 with the Device/Event vertical slice for `/projects/[projectId]`: device switching, collection/event lists, event interaction bindings, scheduled playback rows, and the first timeline preview.

---

# Phase 5.1 Device And Collection Workspace

## Changed

- Replaced `/projects/[projectId]` placeholder data with project workspace and selected device aggregates.
- Added `?device=` and `?collection=` route state for refreshable workspace selection.
- Added project header, device left-rail selector, collection sidebar, create-device dialog, create/rename collection dialog, and disabled-device playback/export messaging.
- Added `Switch` primitive and repository-backed `updateDevice` mutation for enabled-state changes.
- Extended project workspace aggregate with the platform catalog for create-device flows.
- Added ADR `0017-project-workspace-device-route-state.md`.

## Verification

- `pnpm typecheck` passed.
- `pnpm lint` passed.
- `pnpm test -- tests/project-repository.test.ts` passed; Vitest ran 7 files and 57 tests.
- `pnpm test:e2e -- tests/e2e/projects.spec.ts` passed; Playwright ran 3 project smoke tests.

## Recommended Next Group

Continue Phase 5.2 with event creation/editing, trigger binding controls, playback schedule rows, asset picker entry point, and the deterministic timeline preview.

---

# Phase 5.2 Events And Trigger Scheduling

## Changed

- Made the `/projects/[projectId]` event table single-select and added a right-side event details editor panel.
- Added create/edit event dialogs with event type selection.
- Added interaction binding creation with trigger selection, optional label, and enabled/disabled preview switch.
- Added playback creation/editing with eligible asset selection, start offset input, media-kind display, and repository-backed validation.
- Added deterministic timeline preview sorted by `startOffset`, including disabled-interaction copy.
- Extended the device workspace aggregate with trigger catalog rows and project-eligible playback assets.
- Added ADR `0018-event-scheduling-workspace-aggregate.md`.
- Added Playwright smoke coverage for creating an event, binding `onPress`, adding a playback, and editing its offset.

## Verification

- `pnpm typecheck` passed.
- `pnpm lint` passed.
- `pnpm test -- tests/project-repository.test.ts` passed; Vitest ran 7 files and 57 tests.
- `pnpm test:e2e -- tests/e2e/projects.spec.ts` passed; Playwright ran 4 project smoke tests.

## Recommended Next Group

Start Phase 6 with the asset libraries vertical slice: `/libraries`, project library panel, default/imported indicators, library browsing, and the richer asset picker integration.
