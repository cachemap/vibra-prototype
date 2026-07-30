# 0022 Share Preview Aggregate

## Context

Phase 8 needs generated project, event, and collision-matrix-entry links to resolve into useful stakeholder previews at `/share/[shareToken]`. A raw `SharingLink` only identifies the target and creator, so React would otherwise need to chase Dexie relationships directly.

## Decision

Add a repository-backed `loadSharingLinkPreview` aggregate that resolves the link, creator, and target-specific summary. Project previews include device summaries, event previews include interaction playbacks and assets, and matrix-entry previews include the playing/incoming events plus behavior.

## Consequences

- Share pages stay behind the same validation and persistence boundary as the workspace.
- The preview route can show invalid links, disabled device/interaction behavior, and mobile-style summaries without duplicating Dexie reads.
- Future richer mobile previews can extend the aggregate without changing the generated link model.
