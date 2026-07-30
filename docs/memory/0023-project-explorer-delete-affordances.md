# Project Explorer Delete Affordances

## Changed

- Completed the first Workspace CRUD group 9 item.
- Added `/projects` row action menus for ProjectFolder and Project rows using `IconButton`, `Popover`, `Menu`, `MenuItem`, and `ConfirmDialog`.
- Wired the existing `deleteProjectFolder` and `deleteProject` mutations into those menus.
- Added destructive confirmation copy that summarizes cascaded records before deleting.
- Reports successful deletes through the existing `role="status"` feedback pattern.
- Added an e2e smoke test that creates a root folder and root project, deletes both from explorer row menus, and confirms the rows disappear.
- Updated the seeded folder browsing e2e assertion from the old relaxed-containment copy, `Empty leaf folder`, to the current `Empty folder`.

## Verification

- `pnpm typecheck` passed.
- `pnpm test -- tests/selectable-card-primitive.test.tsx` passed; Vitest ran the configured related suite, 83 tests total.
- `pnpm test:e2e --grep "deletes projects and folders"` passed.
- `pnpm test:e2e --grep "browses seeded project folders"` passed.
- `pnpm lint` passed with the two pre-existing warnings in `.codex-verify/verify-event-timeline.mjs` and `components/layout/workspace-shell.tsx`.

## Notes

- An accidental full `pnpm test:e2e -- --grep ...` run executed the whole suite; the new delete test passed, but the run failed on the now-fixed stale folder-copy assertion and a pre-existing timeout in `imports a library and selects its asset for playback` under the current slow Playwright config.
- Existing uncommitted `playwright.config.ts` and `.claude/` changes predate this chunk and were left untouched.

## Recommended Next Group

- Continue Workspace CRUD group 9 with project delete from the project workspace header menu, then device delete in the systems rail.

## Follow-up Chunk

- Completed Workspace CRUD group 9 project delete from the project workspace header menu and device delete in the systems rail.
- Added a project header overflow menu beside Share project, with cascade confirmation and a session-storage handoff so `/projects` reports the delete result through its existing `role="status"` region after navigation.
- Added per-device overflow menus in the Systems rail, with cascade confirmation and fallback selection to the next remaining device when the active device is deleted.
- Added Playwright coverage for deleting the active seeded device, confirming fallback to Pixel 9, then deleting the project and confirming the explorer no longer lists it.
- Verification: `pnpm typecheck` passed; `pnpm lint` passed with the two pre-existing warnings in `.codex-verify/verify-event-timeline.mjs` and `components/layout/workspace-shell.tsx`; `pnpm test:e2e --grep "deletes a device and project from the workspace"` passed.
- Existing uncommitted `playwright.config.ts` and `.claude/` changes predate this chunk and were left untouched.

## Recommended Next Group

- Continue Workspace CRUD group 9 with collection delete in the collection header, then event delete in the event row and event detail header.

## Follow-up Chunk 2

- Completed Workspace CRUD group 9 collection delete in the collection header and event delete from both the event table row and event detail header.
- Added collection and event delete targets to the project workspace confirmation flow, with cascade copy tailored to collection/event dependencies.
- Added per-event row overflow menus on desktop and compact delete actions on mobile event rows.
- Added an event detail header overflow menu that confirms deletion and routes back to the owning project workspace with status feedback.
- Added Playwright coverage that creates/deletes a collection, deletes an event from the table row menu, and deletes another event from the detail header.
- Verification: `pnpm typecheck` passed; `pnpm lint` passed with the two pre-existing warnings in `.codex-verify/verify-event-timeline.mjs` and `components/layout/workspace-shell.tsx`; `pnpm test:e2e --grep "deletes collections and events from the workspace"` passed.
- Existing uncommitted `playwright.config.ts` and `.claude/` changes predate this chunk and were left untouched.

## Recommended Next Group

- Continue Workspace CRUD group 9 with trigger and playback delete in event detail and the timeline.
