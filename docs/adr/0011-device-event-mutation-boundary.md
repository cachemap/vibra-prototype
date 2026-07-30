# 0011 Device Event Mutation Boundary

## Context

Phase 3.3 needs editable collections, events, event interactions, and trigger playbacks before the Device/Event UI slice can be implemented. These writes cross device, collection, event, asset, and imported-library records, so React screens should not own the integrity checks.

## Decision

Keep collection, event, event-trigger, and trigger-playback mutations in `data/repositories/project-repository.ts`. The repository validates command input, confirms parent records exist, enforces unique event-trigger bindings, checks non-negative playback offsets, and verifies playback assets belong to the project default library or an imported library before writing.

Deleting an event interaction also deletes its trigger playbacks in a Dexie transaction so scheduled feedback rows cannot be orphaned.

## Consequences

- Later UI components can call query hooks without duplicating domain traversal or asset eligibility rules.
- The repository remains the aggregate boundary for the project/device workspace until dedicated feature repositories become necessary.
- Mutation invalidation is broad for event/playback writes for now; later UI slices can narrow it once screens expose exact selected device context.
