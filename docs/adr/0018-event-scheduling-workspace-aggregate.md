# 0018 Event Scheduling Workspace Aggregate

## Context

Phase 5.2 adds event interaction and playback scheduling inside `/projects/[projectId]`. The route needs trigger names and eligible playback assets without reaching around the repository or loading every asset library tree from React.

## Decision

Extend the device workspace aggregate with the trigger catalog and project-eligible playback assets. Eligible assets are computed from the project's default library plus imported libraries, matching the domain rule enforced by playback mutations.

## Consequences

- The event editor can render trigger labels, asset picker options, media kinds, and timeline rows from one device workspace query.
- React remains free of Dexie-specific reads for scheduling UI.
- A later asset-library vertical slice can still replace the picker with a richer tree view while keeping the same eligibility boundary.
