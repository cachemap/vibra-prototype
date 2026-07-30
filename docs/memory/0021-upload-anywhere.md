# Upload Anywhere

## Changed

- Completed Workspace CRUD group 6 and marked main Phase 11.4 complete.
- Extracted the asset folder and asset upload dialogs into `features/assets/asset-authoring-dialogs.tsx`, including shared file-kind inference, display-name derivation, asset-id derivation, and upload hints.
- Reused those dialogs from `/libraries` and the project workspace Assets tab.
- Removed the old `/libraries` asset-folder mixed-content gating so selected folders can accept both child folders and uploaded assets.
- Added project Assets tab actions for creating folders, uploading assets, and importing libraries from the same toolbar.
- Added a Playwright smoke test that uploads an audio file into the project default library root, creates a folder in that mixed root, then uploads a haptic asset in the created folder.

## Verification

- `pnpm typecheck` passed.
- `pnpm lint` passed with only pre-existing warnings in `.codex-verify/verify-event-timeline.mjs` and `components/layout/workspace-shell.tsx`.
- `pnpm test -- tests/project-repository.test.ts tests/seed-reset.test.ts` passed; Vitest ran the configured related suite, 77 tests total.
- `pnpm exec playwright test tests/e2e/projects.spec.ts -g "uploads assets from the project workspace default library"` passed.

## Notes

- The project Assets tab intentionally keeps React-state navigation for selected library/folder rather than moving to URL params, matching the Workspace CRUD plan divergence.
- Existing uncommitted `playwright.config.ts`, `.claude/`, and unrelated workspace-shell/logo changes predate this chunk and were left untouched.
- No ADR was added because this chunk applies the already-recorded relaxed folder-containment and existing upload architecture.

## Recommended Next Group

- Workspace CRUD group 7: Delete Foundations, starting with `ConfirmDialog`, menu adoption, cascade helper conventions, and the delete cascade ADR.
