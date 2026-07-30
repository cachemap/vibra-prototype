# Phase 3.3 Project And Device Workspace Slice

## Changed

- Extended `data/repositories/project-repository.ts` with project workspace loading, device creation, and device workspace loading.
- Device creation now validates the project/platform, enforces unique project/platform/name, and creates the required collision matrix in the same transaction.
- Added project/device workspace query keys and hooks plus a create-device mutation in `features/projects/queries.ts`.
- Added repository tests for project workspace aggregates, device creation, duplicate device rejection, and nested device workspace loading.
- Added ADR `0010-project-device-workspace-aggregates.md`.
- Marked the project workspace, device creation, and device workspace Phase 3.3 checklist items complete.

## Verification

- `pnpm test -- tests/project-repository.test.ts` passed. Vitest still runs the full suite for targeted commands.
- `pnpm typecheck` passed.
- `pnpm lint` passed.

## Notes

- Workspace loading validates records before returning domain objects and still routes unknown failures through `PersistenceError`.
- Device workspace loading includes matrix rows, columns, and entries but does not yet implement matrix updates.

## Recommended Next Group

Continue Phase 3.3 with collection and event create/update, then event trigger and playback create/update/delete. That will make the seeded device workspace editable before the UI vertical slice.

---

# Phase 3.3 Device Event Mutation Slice

## Changed

- Added project repository mutations for collection/event create and update.
- Added event interaction create/update/delete plus trigger playback create/update/delete.
- Playback writes now validate parent event/project traversal and enforce project default/imported-library asset eligibility.
- Deleting an event interaction cascades its trigger playbacks in a Dexie transaction.
- Added matching TanStack Query mutation hooks in `features/projects/queries.ts`.
- Added repository tests for collection/event writes, event interaction/playback writes, duplicate trigger rejection, playback offset validation, ineligible assets, and cascade deletes.
- Added ADR `0011-device-event-mutation-boundary.md`.
- Marked the collection/event and event trigger/playback Phase 3.3 checklist items complete.

## Verification

- `pnpm test -- tests/project-repository.test.ts` passed. Vitest still runs the full suite for targeted commands.
- `pnpm typecheck` passed.
- `pnpm lint` passed.

## Recommended Next Group

Continue Phase 3.3 with asset library tree loading, asset library folder/asset create flows, and library import flow. That will unblock the asset picker and imported-asset workflows for the event editor.

---

# Phase 3.3 Asset Library Repository Slice

## Changed

- Added asset library tree loading with sorted nested folders and assets.
- Added standalone asset library creation, which also creates the required root folder.
- Added asset folder and mock asset create flows with leaf-folder constraint enforcement.
- Added project library import flow with own-default-library and duplicate-import rejection.
- Added TanStack Query key/hook coverage for asset library trees and asset mutations.
- Added ADR `0012-asset-library-repository-boundary.md`.
- Marked the asset library tree, folder/asset create, and import Phase 3.3 checklist items complete.

## Verification

- `pnpm test -- tests/project-repository.test.ts` passed. Vitest still runs the full suite for targeted commands.
- `pnpm typecheck` passed.
- `pnpm lint` passed.

## Recommended Next Group

Continue Phase 3.3 with collision matrix loading and entry updates, then share link generation and lookup. That will finish the remaining repository/query hooks before UI vertical slices.
