# 0007 IndexedDB Schema Versioning

## Context

Phase 3 starts persistence for the client-first prototype. The domain entities and rule functions already exist, and repositories need a stable Dexie table boundary before seed data and aggregate loading are implemented.

## Decision

Add `data/db.ts` with a typed `VibraDatabase` class, one versioned schema (`VIBRA_DATABASE_VERSION = 1`), and Dexie stores that mirror the implementation plan's IndexedDB shape. Use compound primary keys for join tables and compound indexes for uniqueness-sensitive flows such as device identity, event-trigger bindings, project-library imports, and collision matrix entries.

Keep this first schema version additive-only until repositories and seed data land. Any future destructive migration should be captured in a new ADR and paired with reset/reseed behavior for the demo.

## Consequences

- Repositories can depend on typed Dexie tables without leaking Dexie into the domain layer.
- The schema now encodes the lookup paths needed by creation rules and demo aggregate loading.
- Sharing links keep the domain `target` union and add nested indexes for each target ID shape, avoiding derived duplicate target columns in the persisted record.
