# 0004 Domain Rules

## Changed

- Completed Phase 2.3 by adding `domain/rules/` modules for folders, projects/assets, devices, events, collision matrix behavior, and sharing.
- Exported rules through `domain/index.ts`.
- Added `tests/domain-rules.test.ts` covering folder leaf behavior, empty leaf folders, project default library/root creation, library import eligibility, device/matrix creation, device uniqueness, flat collections, event-trigger uniqueness, disabled trigger preview behavior, playback offsets, asset eligibility, asset-folder leaf behavior, matrix membership/entry uniqueness, resolution target constraints, and share target exclusivity.
- Added ADR `0006-domain-rule-functions.md`.
- Marked Phase 2.3 and the remaining Phase 2 gates complete in the checklist.

## Verification

- `pnpm test -- tests/domain-rules.test.ts` passed. Vitest still runs all current tests and prints the existing Vite CJS deprecation warning.
- `pnpm typecheck` passed.
- `pnpm lint` passed.

## Notes

- Rule functions return `AppResult<void>` with `ConflictError` or `ConstraintError` so repositories and UI command handlers can surface consistent failures.
- The flat Collection rule is currently structural because `Collection` has no parent/child field; `collectionHasNoChildCollections()` exists so repository creation flows can still call a named rule boundary.
- The next implementation slice can start Phase 3.1 Dexie Schema, then use these rule functions when building repository write flows.

## Recommended Next Group

Start Phase 3.1 Dexie Schema: add `data/db.ts`, define the IndexedDB stores from the plan, and document schema versioning/migration notes.

---

# Phase 3.1 Dexie Schema

## Changed

- Added `data/db.ts` with a typed `VibraDatabase` class, `VIBRA_DATABASE_VERSION = 1`, the planned Dexie store definitions, and a singleton `db` export plus a test-friendly factory.
- Added all Phase 3.1 stores: users, folders, folder access, projects, platforms, devices, collision matrices, rows, columns, entries, collections, events, triggers, event triggers, trigger playbacks, asset libraries, imports, folders, assets, and sharing links.
- Added `tests/db-schema.test.ts` to lock the store list and important compound indexes.
- Added ADR `0007-indexeddb-schema-versioning.md`.
- Marked Phase 3.1 complete in the implementation checklist.

## Verification

- `pnpm test -- tests/db-schema.test.ts` passed; Vitest still ran all current tests and printed the existing Vite CJS deprecation warning.
- `pnpm typecheck` passed.
- `pnpm lint` passed.
- `pnpm test` passed.

## Notes

- `data/db.ts` uses relative imports because earlier Vitest runs did not reliably resolve the app `@/` alias.
- Sharing links keep the current domain `target` discriminated union and add nested indexes for each target ID shape.

## Recommended Next Group

Start Phase 3.2 Seed And Reset. Begin with deterministic IDs and seed builders for the prototype user, platform/trigger catalogs, shared folder tree, projects, default libraries/root folders, and reset/reseed utility.

---

# Phase 3.2 Seed And Reset

## Changed

- Added deterministic canonical demo data in `data/seed.ts`: one prototype user, platform and trigger catalogs, two accessible top-level folder trees, nested and empty leaf folders, two projects, default and imported asset libraries, nested asset folders, audio/haptic assets, iOS/Android plus disabled device targets, collections, all four event types, enabled/disabled event triggers, scheduled playbacks, matrix rows/columns/entries for every behavior type, and project/event/matrix share links.
- Added `data/reset.ts` with a full clear-and-reseed utility.
- Wired `app/providers.tsx` to seed fresh IndexedDB databases on startup.
- Added `tests/seed-reset.test.ts` with `fake-indexeddb` coverage for seed validity, seed-if-empty behavior, and reset restoration.
- Added ADR `0008-deterministic-demo-seed-data.md`.
- Marked Phase 3.2 complete in the implementation checklist.

## Verification

- `pnpm test -- tests/seed-reset.test.ts` passed; Vitest also ran the current full suite because of the existing include behavior.
- `pnpm typecheck` passed.
- `pnpm lint` passed.
- `pnpm test` passed.

## Notes

- Seeding currently treats a non-empty `users` table as the signal that the browser database is already initialized.
- The reset utility clears every Dexie table before rewriting the deterministic seed story.
- Seed IDs are stable so upcoming repository and UI tests can assert against known records.

## Recommended Next Group

Start Phase 3.3 Repositories And Query Hooks. The first coherent slice should implement project tree loading plus project creation with default asset library/root folder creation, backed by repository tests against the seeded baseline.
