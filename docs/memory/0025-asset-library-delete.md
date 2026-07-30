# Asset Library Delete

## Changed

- Completed Workspace CRUD group 9 asset library delete in the `/libraries` sidebar list.
- Added standalone library overflow actions using the existing `Menu`, `Popover`, and `ConfirmDialog` primitives.
- Protected project default libraries by omitting the delete action for default library summaries; repository protection still enforces this.
- Delete confirmation summarizes folders, assets, and project imports that cascade through the existing repository command.
- Deleting the currently selected standalone library falls back to the next available library and reports through the existing `role="status"` feedback pattern.
- Extended the asset library Playwright smoke test to delete a created standalone library after asset/folder delete assertions.

## Verification

- `pnpm typecheck` passed.
- `pnpm lint` passed with the two pre-existing warnings in `.codex-verify/verify-event-timeline.mjs` and `components/layout/workspace-shell.tsx`.
- `pnpm test:e2e --grep "browses and mutates asset libraries"` passed.

## Notes

- Existing uncommitted `playwright.config.ts` and `.claude/` changes predate this chunk and were left untouched.
- No new ADR was needed because ADR 0033 already records the delete cascade contract.

## Recommended Next Group

- Continue Workspace CRUD group 9 with matrix row, column, and entry clear actions in the project workspace.

## Follow-up Chunk: Matrix Clear Actions

## Changed

- Completed Workspace CRUD group 9 matrix row, column, and entry clear actions.
- Added confirmed clear controls for included playing rows and incoming columns in the Collision Matrix selectors.
- Added a destructive Clear rule action in the matrix resolution panel for the selected entry.
- Wired `useDeselectCollisionMatrixRowMutation`, `useDeselectCollisionMatrixColumnMutation`, and `useDeleteCollisionMatrixEntryMutation` into the project workspace.
- Matrix clear confirmations now use human labels and report through the existing `role="status"` feedback pattern.
- Tightened the existing matrix configuration e2e selectors after row/column clear buttons introduced overlapping event names.
- Added Playwright coverage for clearing a matrix entry, clearing a playing row, clearing an incoming column, and confirming those axis clears survive reload.

## Verification

- `pnpm typecheck` passed.
- `pnpm lint` passed with the two pre-existing warnings in `.codex-verify/verify-event-timeline.mjs` and `components/layout/workspace-shell.tsx`.
- `pnpm test:e2e --grep "collision matrix"` passed.

## Notes

- Existing uncommitted `playwright.config.ts` and `.claude/` changes predate this chunk and were left untouched.
- No new ADR was needed because ADR 0033 already records the delete cascade contract.

## Recommended Next Group

- Continue Workspace CRUD group 9 with sharing link delete in the share panel.
