# 0004 Domain Kernel Validation Boundary

## Context

Phase 2 starts the domain kernel that persistence, seed data, and UI commands will depend on. The app needs fixed vocabularies and persisted entity shapes that match the model before Dexie repositories begin reading and writing records.

## Decision

Add a React-free and Dexie-free `domain/` boundary with branded string IDs, ISO timestamp aliases, fixed vocabulary constants, persisted entity interfaces, and Valibot schemas. Use strict Valibot object schemas for persisted records and share targets so repository validation rejects drifted fields instead of silently accepting them.

## Consequences

- Repository code can validate IndexedDB records before returning domain objects.
- Fixed vocabulary drift such as `Supress`, `Coplay`, or unsupported platforms is caught at the schema layer.
- Command-input schemas and richer domain errors are still pending in Phase 2.2.
