# Matrix Feature Extraction

## Changed

- Completed Component Decomposition Stage 7.
- Added `features/matrix/` with shared behavior helpers, the moved axis filter, axis filter anchors, toolbar, resolution panel, grid, and `MatrixTab` orchestrator.
- Replaced the inline project-page matrix branch with `MatrixTab` while keeping the six matrix state fields hoisted on `app/projects/[projectId]/page.tsx`.
- Moved row/column matrix mutations and matrix-entry upsert into the matrix feature.
- Preserved the existing confirmed clear-entry flow by passing selected matrix entries back to the page delete confirm.
- Replaced the share preview page's local matrix behavior copy with `shareBehaviorCopy`.
- Added ADR `0036-matrix-feature-extraction.md`.

## Verification

- `pnpm typecheck` passed.
- `pnpm lint` passed with the existing warnings in `.codex-verify/verify-event-timeline.mjs` and `components/layout/workspace-shell.tsx`.
- `pnpm test` passed: 98 tests.
- Targeted Playwright matrix run passed: 2 tests.
- `pnpm test:e2e` passed: 17 tests.
- Structural grep for `data-testid` still yields exactly 6 results.
- ARIA/role grep still has the same surfaces; matrix entries moved from `features/projects/matrix-axis-filter.tsx` to `features/matrix/matrix-axis-filter.tsx`, and line numbers shifted.

## Notes

- OpenClaw browser control was disabled, so the browser check used Playwright Chromium instead of the OpenClaw browser tool.
- The moved `matrix-axis-filter.tsx` was diffed against `HEAD` and restored byte-identical after an initial accessible-label drift.
- Existing untracked `.claude/` files were left untouched.

## Recommended Next Group

- Start Component Decomposition Stage 8: add the workspace scope context, extract the workspace chrome, and move the six matrix state fields from page props into context.
