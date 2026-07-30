# 0036 Matrix Feature Extraction

## Context

Component Decomposition Stage 7 extracts the collision matrix from the large project workspace page. Matrix selection state still must survive tab-body unmounts until the workspace scope context lands.

## Decision

Move matrix rendering, behavior display helpers, axis filtering, row/column mutations, and matrix-entry upsert logic into `features/matrix/`. Keep the six matrix selection fields hoisted on the project page and pass them as props. Preserve the existing confirmed clear-entry flow by letting the matrix feature request the page-owned delete confirm.

## Consequences

- The project page no longer owns matrix grid rendering or row/column mutation logic.
- The share page reuses matrix behavior copy without importing project workspace UI.
- Matrix selection still survives tab switches, ready to move into the workspace scope context in Stage 8.
- Clear-entry deletion remains behavior-identical until the dialog/delete orchestration extraction.
