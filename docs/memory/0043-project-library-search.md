# Project And Library Search

## Changed

- Completed the component-decomposition follow-up for rendered-but-nonfunctional search controls.
- `/projects` search is now enabled and filters the current folder/root row model by project or folder name, row kind, and status text.
- `/projects` now distinguishes a real empty folder from a search with no matching rows.
- `/libraries` asset-library rail search is now controlled and filters library summaries by library name, owning default project name, and default/imported badge terms.
- Added focused pure helper tests for project-row filtering and asset-library filtering.

## Verification

- `pnpm vitest run tests/project-search.test.ts tests/library-search.test.ts` passed: 4 tests.
- `pnpm typecheck` passed.
- `pnpm lint` passed with the existing warnings in `.codex-verify/verify-event-timeline.mjs` and `components/layout/workspace-shell.tsx`.
- `pnpm test` passed: 116 tests.
- `pnpm test:e2e -- tests/e2e/projects.spec.ts` passed: 17 tests.

## Notes

- No ADR was added; this was a small UI behavior follow-up, not a new architecture, persistence, route, seed-data, or domain decision.
- Existing untracked `.claude/` files were left untouched.

## Recommended Next Group

- Continue the follow-up list in `docs/plan/COMPONENT_DECOMPOSITION_CHECKLIST.md`, likely the share preview simplification or unauthenticated share-shell cleanup.

## Follow-Up Chunk: Share Preview Simplification

## Changed

- Removed the share preview's `Open mobile preview` action because it opened the same route in a new tab.
- Removed the duplicate share summary table; target kind, target label, source context, creator, and copy-link affordance now live in the header only.
- Added a Playwright assertion so the same-route button and old URL summary table do not return.

## Verification

- `pnpm typecheck` passed.
- `pnpm lint` passed with the existing warnings in `.codex-verify/verify-event-timeline.mjs` and `components/layout/workspace-shell.tsx`.
- `pnpm test` passed: 116 tests.
- `pnpm test:e2e -- tests/e2e/projects.spec.ts -g "generates and opens share links"` unexpectedly ran the whole projects spec and passed: 17 tests.
- `pnpm exec playwright test tests/e2e/projects.spec.ts -g "generates and opens share links"` passed: 1 test.

## Recommended Next Group

- Continue the follow-up list with the share route shell cleanup: the share route still renders inside `WorkspaceShell`, so unauthenticated viewers see the app nav and `Reset demo` button.
