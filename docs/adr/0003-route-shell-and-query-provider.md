# 0003 Route Shell And Query Provider

## Context

The walking skeleton needs every demo-spine route to render before domain repositories and IndexedDB data exist. The route shell also needs TanStack Query available early so future feature slices can add hooks without rewiring the app layout.

## Decision

Wrap the App Router body with a client `Providers` component that owns one shared `QueryClient`, then render all routes inside a reusable client `WorkspaceShell` with the compact top bar and left rail. Keep route placeholders domain-shaped and client-rendered for now: project folders, device/event workspace, asset libraries, and share preview surfaces render with icon-bearing primitives, empty states, loading states, and error states.

## Consequences

- Future data hooks can assume a query provider is present.
- Vertical slices can replace placeholder rows in place instead of rebuilding route structure.
- The shell is shared by all current routes, including share previews; a later mobile-preview slice may decide whether public share pages need a more focused layout.
