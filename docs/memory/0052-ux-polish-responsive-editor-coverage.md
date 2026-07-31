# UX Polish: responsive resolution-editor coverage

## Changed

- Completed the responsive resolution-editor component coverage item in UX Polish group 9.
- Added a focused component test that asserts the behavior/rule controls retain their desktop two-column breakpoint while naturally stacking below it, the target control remains a two-option segmented control, and the fixed-width timeline stays inside an overflow-x scroller for narrow viewports.
- The test also protects the 44px Tap target and compact behavior selector height.

## Verification

- `pnpm exec vitest run tests/matrix-resolution-panel.test.tsx` passed: 7 tests.
- `pnpm typecheck` passed.
- `pnpm lint` passed with the two existing warnings in `.codex-verify/verify-event-timeline.mjs` and `components/layout/workspace-shell.tsx`.

## Next

- Add pointer and keyboard collision-timeline alignment coverage.

## Follow-up

- Completed Tap disabled/enabled, restart, Stop, and cleanup coverage in the focused resolution-editor test.
- Added a missing-audio assertion and Web Audio spies that verify Tap starts, restarts by stopping prior sources, Stop clears the active preview, and provider unmount stops remaining sources.
- Verification: `pnpm exec vitest run tests/matrix-resolution-panel.test.tsx` (9 tests), `pnpm typecheck`, and `pnpm lint` passed. Lint retains the two pre-existing warnings in `.codex-verify/verify-event-timeline.mjs` and `components/layout/workspace-shell.tsx`.

## Follow-up

- Completed pointer and keyboard collision-timeline alignment coverage. Pointer movement now goes through the exported, snapped drag-offset calculation used by the DnD handler; keyboard movement remains verified through the incoming sound handle and shared ruler label.
- Verification: `pnpm exec vitest run tests/matrix-resolution-panel.test.tsx` (10 tests), `pnpm typecheck`, and `pnpm lint` passed. Lint retains the two pre-existing warnings in `.codex-verify/verify-event-timeline.mjs` and `components/layout/workspace-shell.tsx`.
- Next UX Polish checklist item: add direct collection-delete-button coverage.

## Follow-up

- Completed direct collection-delete-button E2E coverage. The workspace deletion flow now explicitly verifies the visible `Delete` button and the absence of a collection overflow action before exercising the confirmation and cascade.
- Tightened its feedback assertions to target the visible feedback text rather than the generic `status` role, which is also used by dnd-kit's live announcement region.
- Verification: `pnpm exec playwright test tests/e2e/projects.spec.ts --grep 'deletes collections and events from the workspace'` passed (1 test); `pnpm typecheck` passed; `pnpm lint` passed with the two existing warnings in `.codex-verify/verify-event-timeline.mjs` and `components/layout/workspace-shell.tsx`.
- Next UX Polish checklist item: add drag pointer and keyboard E2E coverage.

## Follow-up

- Verified the existing drag-reorder E2E covers pointer dragging, keyboard reordering, and reload persistence for both changes.
- Verification: `pnpm exec playwright test tests/e2e/projects.spec.ts --grep 'reorders collection events with pointer and keyboard controls'` passed (1 test).
- Next UX Polish checklist item: add theme persistence and system-change E2E coverage.

## Follow-up

- Completed theme persistence and system-change E2E coverage. The browser test verifies the stored Dark preference survives reload, then verifies System follows light-to-dark and dark-to-light `prefers-color-scheme` changes while retaining the selected system preference.
- Verification: `pnpm exec playwright test tests/e2e/projects.spec.ts --grep 'persists theme preferences and follows system changes'` passed (1 test).
- Next UX Polish checklist item: add coordinate-alignment assertions for page headers.

## Follow-up

- Completed page-header coordinate coverage across Projects, Libraries, Project Workspace, and Event Detail. The E2E test measures the breadcrumb and title positions from the same `PageHeader` instance, so secondary page headings cannot mask a geometry regression.
- Verification: `pnpm exec playwright test tests/e2e/toolbar.spec.ts --grep 'keeps breadcrumbs and titles aligned'` passed (1 test); `pnpm typecheck` passed; `pnpm lint` passed with the two existing warnings in `.codex-verify/verify-event-timeline.mjs` and `components/layout/workspace-shell.tsx`.
- Next UX Polish checklist item: add sidebar width assertions at desktop.
