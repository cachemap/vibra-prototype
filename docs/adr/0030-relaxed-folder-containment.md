# 0030 Relaxed Folder Containment

## Context

The Workspace CRUD plan requires creating folders and projects anywhere in the Projects hierarchy and uploading assets into any asset-library folder. The original model treated project folders with projects, and asset folders with assets, as leaves.

## Decision

Relax project and asset folder containment to filesystem-style mixed contents. A ProjectFolder may contain both child ProjectFolders and Projects. An AssetLibraryFolder may contain both child AssetLibraryFolders and Assets. Domain rules now check that the parent exists and that sibling names do not conflict, instead of blocking mixed containment.

Projects may also be modeled without a containing ProjectFolder so a later create-anywhere slice can add root-level projects.

## Consequences

- The UI can expose create/upload actions without leaf-state gating in later CRUD chunks.
- Repository creation flows keep a domain boundary for parent existence and sibling-name conflicts.
- Existing seeded "empty leaf" language can stay as an empty-folder state, but it is no longer a containment rule.
