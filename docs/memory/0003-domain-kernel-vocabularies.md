# 0003 Domain Kernel Vocabularies

## Changed

- Completed Phase 2.1 with typed domain IDs, fixed vocabulary constants, persisted entity interfaces, ISO timestamp aliases, and discriminated share targets.
- Added `domain/schemas.ts` with Valibot schemas for fixed vocabularies and persisted entities.
- Added `domain/index.ts` as the public domain export surface.
- Added focused vocabulary tests covering accepted model terms, rejected drift terms, and exclusive share target validation.
- Added ADR `0004-domain-kernel-validation-boundary.md`.
- Marked Phase 2.1, the first two Phase 2.2 schema tasks, and the fixed-vocabulary unit-test gate complete in the checklist.

## Verification

- `pnpm typecheck` passed.
- `pnpm lint` passed.
- `pnpm test` passed after switching the new test to a relative domain import because Vitest does not currently resolve the app `@/` path alias.

## Notes

- Persisted schemas use `strictObject` so unexpected IndexedDB record fields fail validation.
- The domain layer has no React or Dexie imports.
- The existing Vite CJS deprecation warning still appears during Vitest runs, but tests pass.

## Recommended Next Group

Continue Phase 2.2 Validation And Errors: add command-input schemas, share route param schema, domain error types, neverthrow result aliases, query unwrap helpers, and user-facing error message mapping.

---

# Phase 2.2 Validation And Errors

## Changed

- Completed Phase 2.2 with Valibot command-input schemas for planned create/update flows and `shareRouteParamsSchema`.
- Added `domain/errors.ts` with typed `AppError` subclasses and a centralized user-facing error message mapper.
- Added `domain/results.ts` with `AppResult`, `AppResultAsync`, persistence error wrapping, and TanStack Query unwrap helpers.
- Added tests for strict command validation, share-route params, error classes, user-facing copy, and query unwrapping.
- Added ADR `0005-domain-command-and-error-boundary.md`.
- Marked Phase 2.2 checklist items complete.

## Verification

- `pnpm typecheck` passed.
- `pnpm lint` passed.
- `pnpm test` passed. Vitest still prints the existing Vite CJS deprecation warning.

## Notes

- The domain layer remains React-free and Dexie-free.
- Constraint errors intentionally preserve specific domain rule messages for user-facing copy.

## Recommended Next Group

Start Phase 2.3 Rule Functions. Begin with folder leaf rules, project default-library/root-folder creation constraints, trigger uniqueness, and playback offset rules so Phase 3 repositories can call into domain rules.
