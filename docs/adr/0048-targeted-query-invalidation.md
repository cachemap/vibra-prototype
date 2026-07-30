# 0048 Targeted Query Invalidation

## Context

The component-decomposition follow-up list called out that every mutation invalidated `projectQueryKeys.all`, which made targeted invalidations redundant and refetched unrelated aggregates after each write. The prototype still uses TanStack Query over IndexedDB aggregates, with no optimistic writes.

## Decision

Keep invalidation non-optimistic, but replace blanket project-cache invalidation with named aggregate invalidation helpers in `features/projects/invalidation.ts`. Query keys now expose prefix groups for project trees, workspaces, asset library trees, device workspaces, collision matrices, and share links. Mutations invalidate the narrowest aggregate family that can be known from the mutation result or input; cascade deletes use aggregate-family prefixes when the deleted record no longer returns parent IDs.

## Consequences

- Mutations no longer invalidate `projectQueryKeys.all`.
- Targeted invalidations are the cache policy instead of dead weight beside a broader invalidation.
- Cascade deletes still refresh affected aggregate families conservatively.
- No optimistic cache writes were introduced, so repository behavior remains the source of truth after each mutation.
