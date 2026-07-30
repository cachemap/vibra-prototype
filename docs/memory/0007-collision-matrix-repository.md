# Phase 3.3 Collision Matrix Repository Slice

## Changed

- Added collision matrix aggregate loading with device-scoped collections, candidate events, rows, columns, and entries.
- Added repository mutations for selecting playing rows and incoming columns with device-event membership validation.
- Added matrix entry upsert behavior with row/column membership checks, duplicate-pair updates, and resolution target validation.
- Added TanStack Query keys/hooks for collision matrix loading and mutations.
- Added repository tests for matrix loading, row/column persistence, entry create/update, off-device event rejection, missing row/column rejection, and invalid Suppress targets.
- Added ADR `0013-collision-matrix-repository-boundary.md`.
- Marked the collision matrix loading and entry updates Phase 3.3 checklist item complete.

## Verification

- `pnpm test -- tests/project-repository.test.ts` passed. Vitest still ran the full configured suite.
- `pnpm typecheck` passed.
- `pnpm lint` passed.

## Recommended Next Group

Continue Phase 3.3 with share link generation and lookup, then finish the remaining query-hook/read-validation cleanup before moving into `/projects` UI.

---

# Phase 3.3 Share Link Repository Slice

## Changed

- Added repository methods to generate and look up sharing links for projects, events, and collision matrix entries.
- Added creator and target existence checks before persisting generated links.
- Added share link query/mutation hooks and query keys.
- Added repository tests for seeded token lookup, generated project/event/matrix-entry links, generated link reload lookup, and invalid creator/target/token handling.
- Added ADR `0014-sharing-link-repository-boundary.md`.
- Marked the share link generation and lookup Phase 3.3 checklist item complete.

## Verification

- `pnpm test -- tests/project-repository.test.ts` passed. Vitest still ran the full configured suite.
- `pnpm typecheck` passed.
- `pnpm lint` passed.

## Recommended Next Group

Continue Phase 3.3 with read validation cleanup and persistence error normalization, then finish the query-key/mutation-invalidation checklist audit.

---

# Phase 3.3 Repository Cleanup Slice

## Changed

- Added repository tests proving malformed persisted IndexedDB rows are validated before aggregate reads return.
- Added repository tests proving unknown Dexie/local persistence failures are normalized to `PersistenceError`.
- Audited TanStack query keys and mutation invalidations; the aggregate hooks already cover project tree, project workspace, device workspace, asset library trees, collision matrices, and share links.
- Added ADR `0015-repository-read-validation.md`.
- Completed the remaining Phase 3.3 checklist and phase gate.

## Verification

- `pnpm test -- tests/project-repository.test.ts` passed. Vitest ran the configured suite: 7 files, 54 tests.
- `pnpm typecheck` passed.
- `pnpm lint` passed.

## Recommended Next Group

Start Phase 4 with the `/projects` folder explorer: breadcrumbs, folder/project table, nested browsing, and intentional empty leaf-folder rendering.
