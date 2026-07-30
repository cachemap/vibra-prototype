# 0033 Delete Cascade Contract

## Context

Workspace CRUD needs destructive actions for every user-visible entity. IndexedDB does not enforce foreign keys, and demo-critical screens load aggregate records that can fail or misrepresent state if rows are left dangling.

## Decision

Implement each delete command as one repository transaction that removes the requested entity and all dependent rows listed in the domain model's cascade contract. Use the cascade order in `data/repositories/delete-cascade.ts` as the shared implementation convention: start with leaf entities, then containers, then project-folder recursion.

Asset deletion must remove its `assetBlobs` row, revoke any cached object URL, and delete referencing `TriggerPlayback` rows in the same transaction. Matrix axis and cell deletion must remove dependent matrix entries and their share links.

All destructive UI entry points use `Menu`/`MenuItem` affordances and confirm through `ConfirmDialog`, whose confirm action uses the grayscale destructive button variant.

## Consequences

- Aggregate loaders can assume there are no dangling references after a delete succeeds.
- Delete mutations can invalidate the same query aggregates that create/update mutations already use.
- Large container deletes are intentionally coarse prototype transactions; if production scale requires progress reporting later, the cascade contract remains the source of truth.
