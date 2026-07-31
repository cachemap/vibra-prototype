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

## Focused-editor visual regression coverage

- Added committed Playwright snapshots of the focused Collision Matrix resolution editor at 1440px and 375px. The test opens the seeded Suppress pair so the timeline, adaptive Target field, recovery control, and rule actions are all represented.
- The test hides the Next.js development portal before capture so the dev-only indicator cannot contaminate product snapshots.
- Verification: `pnpm exec playwright test tests/e2e/projects.spec.ts --grep 'focused resolution editor at wide and narrow' --update-snapshots` passed (1 test).
- Next UX Polish checklist item: add E2E coverage proving audition offsets do not mutate event playback offsets.

## Follow-up

- Completed the E2E guard that moves both Collision Matrix audition lanes, saves the rule, and verifies the authored Pay Now and Card Declined trigger-playback offsets remain `0` in IndexedDB before and after reload.
- Verification: `pnpm exec playwright test tests/e2e/projects.spec.ts --grep 'keeps collision audition offsets out of authored event playback schedules'` passed (1 test); `pnpm typecheck` passed; `pnpm lint` passed with the two pre-existing warnings in `.codex-verify/verify-event-timeline.mjs` and `components/layout/workspace-shell.tsx`.
- Next UX Polish checklist item: add E2E coverage proving Back to Matrix stops active collision audio.

## Back-to-Matrix collision preview cleanup

- Added a focused Playwright test that replaces Web Audio with a long-lived instrumented source, starts the seeded Suppress audition, returns to the Matrix, and confirms the scheduled source is stopped.
- Verification: `pnpm exec playwright test tests/e2e/projects.spec.ts --grep 'stops active collision audio when returning to Matrix'` passed (1 test); `pnpm typecheck` passed; `pnpm lint` passed with the two pre-existing warnings in `.codex-verify/verify-event-timeline.mjs` and `components/layout/workspace-shell.tsx`.
- Next UX Polish checklist group: complete the remaining full `pnpm test` and `pnpm test:e2e` verification, then perform the manual acceptance and completion audit.

## Full verification

- Completed UX Polish automated verification and removed Playwright's one-second per-action slowdown so focused-editor and workspace flows run within their default test timeout.
- Updated E2E selectors for DnD's live-region status, focused editor accessible names, exact nested-dialog names, and post-navigation route state. Matrix save/clear tests now explicitly return to the grid before asserting grid state.
- Verification: `pnpm test` passed (28 files, 160 tests); `pnpm test:e2e` passed (27 tests); `pnpm typecheck` passed; `pnpm lint` passed with the two existing warnings in `.codex-verify/verify-event-timeline.mjs` and `components/layout/workspace-shell.tsx`.
- Next UX Polish checklist group: perform manual acceptance and completion documentation/screenshots audit.
