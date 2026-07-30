# 0013 Collision Matrix Repository Boundary

## Context

Phase 3.3 needs collision matrix reads and writes before the matrix UI can expose row/column selection and behavior editing. These writes must stay scoped to events that belong to the selected device and must preserve row, column, duplicate-entry, and resolution-target constraints.

## Decision

Keep collision matrix loading, row selection, column selection, and entry upsert behavior in `data/repositories/project-repository.ts`. The repository loads matrix candidates from the owning device's collections, validates event membership before persisting rows or columns, validates row/column membership before creating entries, and updates existing playing/incoming pairs in place.

## Consequences

- The future matrix screen can load one aggregate and call focused mutations without duplicating device traversal.
- Upserting an existing pair is useful for editor flows while still preventing duplicate records.
- The project repository remains broad, but it continues to act as the prototype's aggregate boundary until UI slices reveal a stronger split.
