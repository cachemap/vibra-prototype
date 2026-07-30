# 0028 Responsive Project Workspace Shell

## Context

The Phase 10.2 visual audit found that project workspaces repeated hierarchy across the top bar, project header, sidebar, and content areas. On mobile, the desktop left rail appeared inline before the event workspace, pushing demo-critical content below the first viewport.

## Decision

Keep the global shell focused on product-level workspace navigation. Keep the full device and collection rail on desktop, but replace it below tablet width with a compact project view selector plus device and collection selects. The project page owns project-level actions like sharing, while screen-level creation and editing actions stay in the active panel.

## Consequences

- Mobile project Events content appears after one compact selector instead of a full sidebar.
- Desktop keeps the dense rail pattern expected by the design system.
- Future Assets and Matrix polish can reuse the same responsive shell without re-solving navigation.
