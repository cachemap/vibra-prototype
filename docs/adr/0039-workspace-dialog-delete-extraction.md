# 0039 Workspace Dialog Delete Extraction

## Context

Component Decomposition Stage 10 needed project workspace dialog form state and delete-confirm orchestration removed from the route file while preserving the single right-aligned dialog overlay and share-delete stacking behavior.

## Decision

Move delete target copy into a pure `delete-target.ts` module with switch-based body and cascade copy. Move project delete confirmation into `WorkspaceDeleteConfirm`, and move the project workspace dialog layer into `WorkspaceDialogs`. Dialog forms own their local form state and call their own mutations while reusing the workspace scope context for identifiers and navigation.

The route now stays as a provider/query-state shell and delegates loaded workspace rendering to `ProjectWorkspaceLoaded`.

## Consequences

- Delete copy is unit-tested independently of the UI.
- Share-link deletion remains a sibling confirm outside the overlay so it can stack over an open share dialog.
- The project page is 70 lines, below the Stage 10 route target.
- `workspace-content.tsx` and `workspace-dialogs.tsx` remain larger than the final Phase 12 feature-file target; later stages should split them by surface without changing behavior.
