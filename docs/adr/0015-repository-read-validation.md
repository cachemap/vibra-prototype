# 0015 Repository Read Validation

## Context

Phase 3.3 repository aggregates read directly from IndexedDB. The prototype needs to treat local demo data as untrusted after browser storage, reseeds, and future migrations so corrupted rows do not reach UI query hooks as valid domain objects.

## Decision

Validate IndexedDB records with the domain Valibot schemas before returning repository aggregates. Validation failures from persisted rows are normalized to `PersistenceError`, while command input validation remains `ValidationError` and missing referenced rows remain `NotFoundError`.

## Consequences

- Feature query hooks receive typed domain aggregates or a consistent app error.
- Corrupted local storage is surfaced as a reset/reseed-style persistence problem.
- Repository tests now pin the difference between invalid commands, missing entities, and invalid persisted rows.
