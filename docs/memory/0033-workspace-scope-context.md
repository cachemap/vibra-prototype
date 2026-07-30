# Workspace Scope Context

## Changed

- Started Component Decomposition Stage 8.
- Added `features/project-workspace/workspace-scope-context.tsx` with split selection/actions contexts.
- Moved active tab, workspace search, asset library/folder selection, dialog request, delete target, and the six matrix selection fields into the workspace scope provider.
- Extracted project workspace header, sidebar, mobile controls, tab bar, empty state, shared device meta helper, and an additive layout wrapper under `features/project-workspace/`.
- Replaced the inline project-page header/sidebar/mobile controls with the extracted chrome components while preserving `data-testid` locations.
- Added ADR `0037-project-workspace-scope-context.md`.

## Verification

- `pnpm typecheck` passed.
- `pnpm lint` passed with the existing warnings in `.codex-verify/verify-event-timeline.mjs` and `components/layout/workspace-shell.tsx`.
- `pnpm test` passed: 98 tests.
- `pnpm test:e2e` passed: 17 tests before the final additive layout wrapper; typecheck/lint/unit tests passed afterward.
- Structural grep for `data-testid` still yields exactly 6 results.
- ARIA/role grep still has the same surfaces with tab-bar lines moved into `features/project-workspace/workspace-tab-bar.tsx`.
- Focused Playwright browser check passed on `http://localhost:3000`: sidebar search filters devices, tab switching works, and matrix selection persists after switching to Events and back.

## Notes

- OpenClaw browser control was disabled, so browser verification used a local Playwright script.
- `workspace-layout.tsx` is additive in this slice; the page still owns the dialog layer to avoid mixing dialog extraction into the chrome/context move.
- Existing untracked `.claude/` files were left untouched.

## Recommended Next Group

- Continue Stage 8 or fold directly into Stage 10: mount `workspace-layout.tsx` around the remaining page body and move dialog/delete orchestration into `workspace-dialogs.tsx` / `workspace-delete-confirm.tsx`.

