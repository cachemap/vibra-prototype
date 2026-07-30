# 0005 Domain Command And Error Boundary

## Context

Phase 2.2 needs the future repository and UI layers to share command validation, typed failures, and user-facing error copy without importing React or Dexie into `domain/`.

## Decision

Keep command-input and route-param Valibot schemas beside persisted entity schemas in `domain/schemas.ts`. Add typed `AppError` subclasses in `domain/errors.ts`, a centralized user-facing error message mapper, and neverthrow aliases plus TanStack Query unwrap helpers in `domain/results.ts`.

## Consequences

- Create/update flows can validate payloads before service logic runs.
- Repository and query code can return `AppResult` values while UI query functions unwrap them consistently.
- User-facing copy has one mapping point, while constraint errors can still preserve specific domain rule language.
