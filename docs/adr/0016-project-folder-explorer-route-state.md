# 0016 Project Folder Explorer Route State

## Context

Phase 4 turns `/projects` from a placeholder into a demoable folder explorer. The prototype needs nested folder browsing, refreshable smoke-test paths, and a simple way to reset seeded data during stakeholder walkthroughs without adding backend routes.

## Decision

Represent the selected project folder with the `/projects?folder=<folderId>` search parameter. The top-level `/projects` view shows folders explicitly shared with the prototype user, and nested folder contents are derived from the seeded IndexedDB tree. Project-folder creation is limited to an existing parent folder and reuses the domain leaf rule that prevents adding child folders beneath folders that already contain projects.

## Consequences

- Folder navigation is bookmarkable and easy for Playwright to assert.
- The project slice stays client-first and uses the existing IndexedDB aggregate instead of adding server routing.
- Creating new top-level shared folders remains deferred until the product models ownership or explicit sharing setup for newly created root folders.
