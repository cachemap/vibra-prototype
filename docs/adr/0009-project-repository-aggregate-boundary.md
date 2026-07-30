# 0009 Project Repository Aggregate Boundary

## Context

Phase 3.3 begins repository and query-hook work. Project browsing and project creation are the next demo-critical flows because `/projects` needs a shared folder tree before the vertical UI slice can become real.

## Decision

Add a project repository that returns `AppResult` values from async methods, validates records read from IndexedDB before building aggregates, and translates unknown persistence failures into `PersistenceError`. Keep the first aggregate focused on the accessible project tree for a user, with nested folders, sorted projects, and explicit empty-leaf folder state.

Project creation writes the project, default asset library, and root asset-library folder in one Dexie transaction after running the domain folder and default-library creation rules. TanStack Query hooks live in `features/projects/queries.ts` and unwrap repository results for React Query consumers while invalidating the project key family after creation.

## Consequences

- Feature screens can consume a shaped project tree without importing Dexie.
- The dependent project/default-library/root-folder creation flow is now covered by repository tests.
- Remaining Phase 3.3 repositories should follow the same result, validation, and query-key pattern.
