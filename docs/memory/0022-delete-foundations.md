# Delete Foundations

## Changed

- Completed Workspace CRUD group 7.
- Added `ConfirmDialog`, built on `DialogOverlay`, `Dialog`, and the existing grayscale destructive `Button` variant.
- Exported `ConfirmDialog` from `components/primitives/`.
- Added `data/repositories/delete-cascade.ts` with the shared delete cascade order and transaction table conventions for upcoming repository commands.
- Added ADR `0033-delete-cascade-contract.md` documenting transaction boundaries, asset blob/object URL cleanup, matrix cleanup, and destructive UI conventions.
- Added primitive test coverage for the confirm dialog's destructive action and cascade summary.

## Verification

- `pnpm typecheck` passed.
- `pnpm test -- tests/selectable-card-primitive.test.tsx` passed; Vitest ran the configured related suite, 78 tests total.

## Notes

- This chunk intentionally did not implement actual delete repository commands or UI affordances; it only establishes the foundation they should use.
- Existing uncommitted `playwright.config.ts` and `.claude/` changes predate this chunk and were left untouched.

## Recommended Next Group

- Workspace CRUD group 8: implement delete commands and repository functions in cascade-safety order, starting with TriggerPlayback, EventTrigger, Asset, and AssetLibraryFolder.

---

# Delete Commands

## Changed

- Completed Workspace CRUD group 8.
- Added repository delete commands for assets, asset folders, asset libraries, events, collections, devices, projects, project folders, matrix axes, matrix entries, and sharing links.
- Centralized cascade helpers inside the repository factory so asset deletion can revoke cached object URLs and remove `assetBlobs` plus referencing `TriggerPlayback` rows in one transaction.
- Added React Query mutation wrappers for all new delete commands, following the existing invalidate-all project aggregate pattern.
- Added repository coverage for asset/object URL cleanup, event timeline/matrix/share cleanup, asset-library protection, matrix entry/axis clearing, direct collection deletion, device deletion, project deletion, project-folder recursion, and loadability after deleting referenced assets.

## Verification

- `pnpm typecheck` passed.
- `pnpm test -- tests/project-repository.test.ts` passed; Vitest ran the configured related suite, 10 files / 83 tests.
- `pnpm lint` passed with the same two pre-existing warnings in `.codex-verify/verify-event-timeline.mjs` and `components/layout/workspace-shell.tsx`.

## Notes

- Delete commands are now available through repository methods and query mutations, but route-level menus/confirmation flows are intentionally left for the next group.
- Existing uncommitted `playwright.config.ts` and `.claude/` changes predate this chunk and were left untouched.

## Recommended Next Group

- Workspace CRUD group 9: wire reachable destructive affordances with `Menu` and `ConfirmDialog`, including selection fallback after deleting active devices, folders, and asset folders.
