# 0010 Project And Device Workspace Aggregates

## Context

Phase 3.3 needs the project workspace route to load enough data for device selection before collection, event, asset, and matrix editing flows are implemented. Device creation also needs to preserve the domain rule that each new Device owns exactly one CollisionMatrix.

## Decision

Extend the project repository with `loadProjectWorkspace`, `createDevice`, and `loadDeviceWorkspace`. Project workspace loading returns the project, containing folder, default and imported libraries, and device summaries with platform, collision matrix, collection count, and event count. Device workspace loading returns nested collections, events, event interactions, trigger playbacks, and collision matrix rows, columns, and entries.

Device creation validates command input, confirms the project and platform exist, enforces unique project/platform/name identity, and writes the Device plus CollisionMatrix in one Dexie transaction.

## Consequences

- The project workspace route can consume one aggregate instead of manually joining IndexedDB tables in React.
- Later collection, event, playback, and matrix mutations can build on the same repository boundary.
- The aggregate is intentionally read-heavy for demo clarity; future slices can optimize if the prototype data grows.
