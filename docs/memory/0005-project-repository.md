# Phase 3.3 Project Repository Slice

## Changed

- Added `data/repositories/project-repository.ts` with project tree loading for a user's accessible shared folders.
- Added project creation that creates the project, its default asset library, and the library root folder in one Dexie transaction.
- Added `features/projects/queries.ts` with project query keys, `useProjectTreeQuery`, and `useCreateProjectMutation`.
- Added repository tests for seeded tree loading, empty-leaf project creation, and invalid project creation in a folder with child folders.
- Added ADR `0009-project-repository-aggregate-boundary.md`.
- Marked the first two Phase 3.3 checklist items complete.

## Verification

- `pnpm test -- tests/project-repository.test.ts` passed. Vitest currently still runs the full suite for targeted test commands because of the existing include behavior.
- `pnpm typecheck` passed.
- `pnpm lint` passed.

## Notes

- The broader Phase 3.3 checklist items for all aggregate query keys, all mutation invalidation, and all IndexedDB read-validation coverage remain open because only the project repository exists so far.
- Project repository methods return `Promise<AppResult<T>>`, while React Query hooks unwrap those results at the feature boundary.

## Recommended Next Group

Continue Phase 3.3 with project workspace loading and device creation/loading. That will unblock the `/projects/[projectId]` workspace route before collection and event editing begins.
