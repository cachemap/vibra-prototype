# 0032 Project Creation Aggregate Transaction

## Context

The rebuilt New Project dialog can create a project with selected device presets and optional starter events. Creating only the Project row first would leave the UI dependent on follow-up mutations before the workspace is useful.

## Decision

Treat project creation as one aggregate transaction across the Project, default AssetLibrary, root AssetLibraryFolder, selected Devices, CollisionMatrices, default Collections, and starter Events. The command accepts optional `devices` and `starterEventTypes`; omitted arrays preserve the previous empty-project path.

## Consequences

- A created project can route directly to its first selected device with a ready collection and event table.
- Zero-device project creation still lands in the existing empty workspace state.
- Starter events are intentionally lightweight rows named by event type inside a `Core interactions` collection; richer starter templates can be added later without changing the transaction boundary.
