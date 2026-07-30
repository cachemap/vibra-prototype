# 0021 Project Collision Matrix Workspace

## Context

The collision matrix needs to be demoable inside the project workspace without splitting designers away from the selected device context. Rows, columns, entries, and candidate events already load through the device workspace aggregate.

## Decision

Render the matrix as a project-workspace tab backed by the selected device workspace aggregate. Use explicit playing-row and incoming-column selectors that call repository selection commands, then edit the selected cell through one bottom behavior panel. Keep sharing as an entry-point button only until the dedicated sharing slice generates links.

## Consequences

- Matrix candidates stay constrained to events on the selected device.
- The grid makes unset cells visible while preserving the existing repository validation for row membership, column membership, duplicate pairs, and `Suppress` targets.
- The first share affordance is present, but actual matrix-entry link generation remains in Phase 8.
