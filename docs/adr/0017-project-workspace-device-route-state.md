# 0017 Project Workspace Device Route State

## Context

Phase 5.1 makes `/projects/[projectId]` data-backed. The workspace needs refreshable selection for the active device and collection while keeping Dexie/repository code as the only persistence boundary.

## Decision

Represent the selected device and collection with `?device=<deviceId>&collection=<collectionId>` search parameters. The page derives the default selection from the project workspace when params are absent, then loads the selected device aggregate through the existing repository/query layer. Device enabled-state changes use a repository `updateDevice` command rather than direct Dexie writes from React.

## Consequences

- Stakeholder demo URLs can open directly to a project device context.
- Device and collection creation can immediately navigate to the created record without adding server routes.
- The UI still needs the later event editor slice before the `Add event` action becomes functional.
