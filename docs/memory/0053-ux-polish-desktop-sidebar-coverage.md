# UX Polish: desktop sidebar coverage

## Changed

- Completed the desktop sidebar-width assertion in UX Polish group 9.
- Added a toolbar E2E helper that checks both the Libraries rail and Project Workspace rail render at the shared 320px desktop width and that each adjacent content area begins directly after its rail.

## Verification

- `pnpm exec playwright test tests/e2e/toolbar.spec.ts --grep 'shared 320px desktop sidebar width'` passed (1 test).
- `pnpm typecheck` passed.
- `pnpm lint` passed with the two existing warnings in `.codex-verify/verify-event-timeline.mjs` and `components/layout/workspace-shell.tsx`.

## Next

- Completed reduced-motion Collision Matrix coverage. A new browser test emulates `prefers-reduced-motion: reduce`, hovers a configured cell, and verifies the transform and transform transition are removed while the non-motion shadow feedback remains.
- Fixed the compiled-CSS ordering issue the test exposed by making the Matrix cell and behavior-pill reduced-motion transform resets important.
- Verification: `pnpm exec vitest run tests/matrix-grid.test.tsx` (2 tests), `pnpm exec playwright test tests/e2e/projects.spec.ts --grep 'reduced motion is preferred'` (1 test), and `pnpm typecheck` passed. `pnpm lint` passed with the pre-existing warnings in `.codex-verify/verify-event-timeline.mjs` and `components/layout/workspace-shell.tsx`.
- Next UX Polish checklist item: add wide and 375px visual snapshots for the focused resolution editor.
