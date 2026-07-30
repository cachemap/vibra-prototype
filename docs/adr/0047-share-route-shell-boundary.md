# 0047 Share Route Shell Boundary

## Context

Share preview URLs are stakeholder and mobile-preview artifacts. They can be opened by viewers who are not authoring the workspace, but the root app layout previously wrapped every route in `WorkspaceShell`, showing project navigation and the `Reset demo` control on `/share/[shareToken]`.

## Decision

Keep global providers and typography in the root layout, but move `WorkspaceShell` into route-specific layouts for `/projects` and `/libraries`. Leave `/share/[shareToken]` outside the authenticated workspace shell.

## Consequences

- Share previews focus on the shared target without authoring navigation or reset controls.
- Workspace routes keep the same top bar and demo reset affordance.
- New authenticated workspace route trees should opt into `WorkspaceShell` with their own route layout.
