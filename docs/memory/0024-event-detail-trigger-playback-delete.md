# Event Detail Trigger And Playback Delete

## Changed

- Completed Workspace CRUD group 9 trigger/playback delete in event detail and timeline.
- Added confirmed delete controls for event interactions in the timeline lane header.
- Added confirmed delete controls for individual timeline playback blocks.
- Wired the existing `deleteEventTrigger` and `deleteTriggerPlayback` React Query mutations into event detail.
- Event detail feedback now uses `role="status"` so delete results follow the shared feedback pattern.
- Extended the event/playback Playwright smoke test to delete a playback, then delete its owning interaction, and confirm the event reloads with no interactions.

## Verification

- `pnpm typecheck` passed.
- `pnpm lint` passed with the two pre-existing warnings in `.codex-verify/verify-event-timeline.mjs` and `components/layout/workspace-shell.tsx`.
- `pnpm test:e2e --grep "creates an event with an interaction playback"` passed.

## Notes

- The first targeted e2e run exposed the missing `role="status"` on event detail feedback; that is fixed.
- The second targeted e2e run exposed an older ambiguous `Open` locator because `Open actions` also matched; the locator is now exact.
- Existing uncommitted `playwright.config.ts` and `.claude/` changes predate this chunk and were left untouched.

## Recommended Next Group

- Continue Workspace CRUD group 9 with asset and asset folder delete in `/libraries` list and tile views, then asset library delete in the library list.

## Follow-up Chunk: Libraries Asset/Folder Delete

## Changed

- Added confirmed asset and asset-folder delete actions to `/libraries` list view and tile view.
- Reused the existing `Menu`, `Popover`, and `ConfirmDialog` primitives for asset/folder overflow actions.
- Wired `useDeleteAssetMutation` and `useDeleteAssetLibraryFolderMutation` into the library page.
- Asset delete stops active audio preview before cascading stored file data and playback references.
- Library page feedback now uses `role="status"` for create/delete results.
- Extended the existing asset-library Playwright smoke test to delete an uploaded asset from list view and delete a folder from tile view.

## Verification

- `pnpm typecheck` passed.
- `pnpm lint` passed with the two pre-existing warnings in `.codex-verify/verify-event-timeline.mjs` and `components/layout/workspace-shell.tsx`.
- `pnpm test:e2e --grep "browses and mutates asset libraries"` passed.

## Notes

- Existing uncommitted `playwright.config.ts` and `.claude/` changes still predate this chunk and were left untouched.
- No new ADR was needed because ADR 0033 already records the delete cascade contract.

## Recommended Next Group

- Continue Workspace CRUD group 9 with asset library delete in the `/libraries` library list, then matrix row/column/entry clear actions.
