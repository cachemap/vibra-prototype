# Workspace Dialog Delete Extraction

## Changed

- Completed Component Decomposition Stage 10.
- Added `features/project-workspace/delete-target.ts` with switch-based delete action labels, cascade summaries, and body copy.
- Added `tests/delete-target-copy.test.ts` to lock byte-identical delete confirmation copy, including singular and plural asset-folder counts.
- Extracted project workspace delete handling into `WorkspaceDeleteConfirm`.
- Extracted the single workspace dialog overlay into `WorkspaceDialogs`, with local form state inside the active dialog components.
- Moved loaded project workspace rendering into `features/project-workspace/workspace-content.tsx`.
- Reduced `app/projects/[projectId]/page.tsx` to 70 lines: provider stack, query-state early returns, and the loaded workspace handoff.
- Added ADR `0039-workspace-dialog-delete-extraction.md`.

## Verification

- `pnpm typecheck` passed.
- `pnpm lint` passed with the existing warnings in `.codex-verify/verify-event-timeline.mjs` and `components/layout/workspace-shell.tsx`.
- `pnpm test` passed: 106 tests.
- `pnpm test:e2e` passed: 17 tests.
- `grep -rn 'data-testid' app components features | sort` still yields exactly 6 results.
- ARIA/role grep remains on the same surfaces with the project workspace status lines now in `features/project-workspace/workspace-content.tsx`.

## Notes

- A dev server was started on port 3001 because the existing port 3000 process was still running; stop the 3001 session after committing.
- Existing untracked `.claude/` files were left untouched.
- `workspace-content.tsx` and `workspace-dialogs.tsx` are intentionally not final-size modules yet; the later decomposition stages and cleanup pass should continue splitting feature files toward the ~260-line target.

## Recommended Next Group

- Stage 11: decompose the event detail page and memoize `timelineLanes`. It is independent now that project workspace dialogs/delete orchestration are out of the route.
