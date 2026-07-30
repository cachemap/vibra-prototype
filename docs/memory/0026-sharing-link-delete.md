# Sharing Link Delete

## Changed

- Completed Workspace CRUD group 9 sharing link delete in the share panel.
- Added a destructive Delete link action to the project workspace share dialog for project and matrix-entry share links.
- Added the same Delete link action to the event detail share dialog.
- Reused the existing `deleteSharingLink` repository mutation and `ConfirmDialog` primitive.
- Share-link delete closes the share dialog, confirms the destructive action, clears local generated-link state, and reports through the existing `role="status"` feedback pattern.
- Extended the share-link Playwright smoke test to generate a project link, delete it from the share panel, and confirm the deleted URL resolves to the invalid share-link state.

## Verification

- `pnpm typecheck` passed.
- `pnpm lint` passed with the two pre-existing warnings in `.codex-verify/verify-event-timeline.mjs` and `components/layout/workspace-shell.tsx`.
- `pnpm test:e2e --grep "generates and opens share links"` passed.

## Notes

- Existing uncommitted `playwright.config.ts` and `.claude/` changes predate this chunk and were left untouched.
- No new ADR was needed because ADR 0033 already records sharing links as leaf deletes in the cascade contract.

## Recommended Next Group

- Continue Workspace CRUD group 9 with selection fallback after deleting the active folder or asset folder, then route the current folder to its parent after deleting it.

## Follow-up Chunk: Delete Selection Fallback

## Changed

- Completed Workspace CRUD group 9 selection fallback after active folder and asset-folder deletes.
- Added a current-folder actions menu in `/projects` so the folder being viewed can be deleted directly.
- Deleting the current project folder now routes to its parent folder, or `/projects` for a top-level folder.
- Added a selected asset-folder actions menu in `/libraries` for non-root folders.
- Deleting the selected asset folder now clears the stale `folder` query and falls back to the selected library root.
- Extended Playwright coverage for deleting the currently viewed project folder and currently selected asset folder.

## Verification

- `pnpm typecheck` passed.
- `pnpm lint` passed with the two pre-existing warnings in `.codex-verify/verify-event-timeline.mjs` and `components/layout/workspace-shell.tsx`.
- `pnpm test:e2e --grep "deletes projects and folders|browses and mutates asset libraries"` passed.

## Notes

- Existing uncommitted `playwright.config.ts` and `.claude/` changes predate this chunk and were left untouched.
- No new ADR was needed; ADR 0033 still covers the delete cascade boundary.

## Recommended Next Group

- Continue Workspace CRUD group 9 by auditing delete status reporting, then add the dedicated e2e case for deleting a project and confirming the explorer reloads cleanly if the existing coverage is not considered sufficient.
