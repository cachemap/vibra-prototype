# Workspace Scope Context

## Changed

- Started Component Decomposition Stage 8.
- Added `features/project-workspace/workspace-scope-context.tsx` with split selection/actions contexts.
- Moved active tab, workspace search, asset library/folder selection, dialog request, delete target, and the six matrix selection fields into the workspace scope provider.
- Extracted project workspace header, sidebar, mobile controls, tab bar, empty state, shared device meta helper, and an additive layout wrapper under `features/project-workspace/`.
- Replaced the inline project-page header/sidebar/mobile controls with the extracted chrome components while preserving `data-testid` locations.
- Added ADR `0037-project-workspace-scope-context.md`.
- Completed Stage 8 by mounting `WorkspaceLayout` in the project workspace page and marking the Stage 8 checklist items complete.

## Verification

- `pnpm typecheck` passed.
- `pnpm lint` passed with the existing warnings in `.codex-verify/verify-event-timeline.mjs` and `components/layout/workspace-shell.tsx`.
- `pnpm test` passed: 98 tests.
- `pnpm test:e2e` passed: 17 tests.
- Structural grep for `data-testid` still yields exactly 6 results.
- ARIA/role grep still has the same surfaces with tab-bar lines moved into `features/project-workspace/workspace-tab-bar.tsx`.
- Focused Playwright script against the running dev server passed: reset demo, searched the sidebar, switched Events/Matrix tabs, selected a matrix cell, and confirmed selection survived tab remount. Screenshot written to `.codex-verify/stage-8-workspace-layout-smoke.png`.

## Notes

- OpenClaw browser control was disabled, so browser verification used a local Playwright script.
- `workspace-layout.tsx` is additive in this slice; the page still owns the dialog layer to avoid mixing dialog extraction into the chrome/context move.
- The page still owns dialog form state and delete-confirm rendering; Stage 10 should extract those into `workspace-dialogs.tsx` and `workspace-delete-confirm.tsx`.
- Existing untracked `.claude/` files were left untouched.

## Recommended Next Group

- Stage 9: extract the assets and events tabs plus shared row models. Stage 10 can then move the remaining workspace dialogs/delete confirm and bring the project page down near the target size.

---

# Assets And Events Tabs

## Changed

- Completed Component Decomposition Stage 9.
- Added shared asset tree helpers in `features/assets/asset-folder-tree.ts` over `lib/tree.ts`.
- Added shared asset metadata/cell helpers in `features/assets/asset-metadata.ts` and `features/assets/asset-cells.tsx`.
- Replaced duplicated library/project asset helper functions in `/libraries` and the project workspace.
- Extracted the project Assets tab into `features/project-workspace/assets-tab.tsx`, `asset-library-rail.tsx`, and `project-asset-table.tsx`.
- Extracted the project Events tab into `events-tab.tsx`, `events-table.tsx`, and `events-cards.tsx`.
- Added `event-row-model.ts` so trigger/playback counts are computed once for desktop and mobile views.
- Added ADR `0038-assets-events-tab-decomposition.md`.

## Verification

- `pnpm typecheck` passed.
- `pnpm lint` passed with the existing warnings in `.codex-verify/verify-event-timeline.mjs` and `components/layout/workspace-shell.tsx`.
- `pnpm test` passed: 98 tests.
- `pnpm test:e2e` passed: 17 tests.
- `grep -rn 'data-testid' app components features | sort` still yields exactly 6 results.
- ARIA/role grep remains on the same surfaces, with moved lines in extracted project-workspace files.
- Browser smoke against existing `http://localhost:3000`: opened `/projects/project_checkout-system`, switched to Assets, confirmed `project-asset-libraries`, switched to Events, and opened event controls with no console errors.
- Screenshots captured to `.codex-verify/stage9-project-assets-{desktop,mobile}.png` and `.codex-verify/stage9-project-events-{desktop,mobile}.png`.

## Notes

- Existing dev server PID 31636 was already running on port 3000; a new `pnpm dev` attempt exited because Next detected it.
- Existing untracked `.claude/` files were left untouched.

## Recommended Next Group

- Stage 10: move project workspace delete-target copy, dialog layer, dialog form state, and delete confirmation out of `app/projects/[projectId]/page.tsx`.
