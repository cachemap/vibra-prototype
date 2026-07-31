# 0060 Collision Preview Lifecycle Cancellation

## Context

The collision preview loads audio asynchronously inside route-scoped providers, while Reset demo and cascading asset deletes can occur from outside the focused editor. A stopped preview must not leave a source, animation frame, or stale decode request alive against reset or deleted data.

## Decision

Use a shell-dispatched browser event to stop every mounted preview provider before Reset demo. Stop all previews before any workspace or library delete that may cascade to an asset. The collision scheduler owns one abort controller per pending playback URL; stopping aborts pending fetches, removes their cache entries, and ignores obsolete request versions. Provider disposal also closes the in-memory audio context when supported.

## Consequences

- Reset and delete operations silence preview immediately without coupling the global shell to a route provider.
- A cancelled URL is fetched afresh if preview restarts, while successfully decoded buffers remain provider-lifetime cached.
- No preview state is persisted, and stale asynchronous work cannot start sources after cancellation.
