# 0056 Focused Matrix resolution editor

## Context

The compact resolution form competed with the Collision Matrix for space and gave no stable place to understand a selected event pair before the collision-preview engine exists.

## Decision

Selecting a Matrix cell opens an in-tab focused editor. The mounted Matrix grid is hidden while editing so its selected cell and native scroll position survive `Back to Matrix`. The editor owns the pair header, prominent Tap stage, horizontally scrollable two-lane ruler, and adaptive rule fields; audition data and playback remain a later editor-local slice.

## Consequences

- The Matrix remains the only navigation surface; no top-level route or duplicate selection state is introduced.
- The preview layout is stable before sound selection, timing controls, and scheduling are added.
- Returning to the grid retains the user's visual and selection context.
