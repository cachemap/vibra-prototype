# 0054 Persisted event order

## Context

UX Polish group 5 needs drag-and-drop event rows to survive navigation, reload, and demo reset. The previous workspace loader sorted events by name, so there was no domain-owned position to persist or migrate.

## Decision

Add `Event.sortOrder` as a non-negative integer and make IndexedDB version 3 index events by `[collectionId+sortOrder]`. The v3 upgrade assigns legacy siblings contiguous positions using the old visible order, `name` then `id`, and normalizes legacy collision-resolution target defaults in the same transaction. Repository creation appends at `max(sortOrder) + 1`, while `reorderCollectionEvents` accepts only exact in-collection permutations and writes contiguous positions in one transaction.

## Consequences

- Existing local data keeps the order users already saw before row ordering became explicit.
- Drag-and-drop UI can call a single repository/query mutation without inventing ordering state in React.
- Future resolution-editor work should extend the v3-normalized behavior records rather than changing this shipped migration in place.
