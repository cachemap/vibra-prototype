# 0043 Share Preview Read-Only Components

## Context

Component Decomposition Stage 14 needed the share preview route split without turning authenticated workspace components into dual-purpose read-only views. Share previews load a `SharingLinkPreviewAggregate`, whose event timeline shape inlines trigger and asset records differently from the project event editor.

## Decision

Create `features/share-preview/` with dedicated read-only components for the header, target summary table, project device target table, event playback preview, and collision matrix entry summary. Keep the route responsible only for the share query plus its stripped loading and error branches. Mount `AudioPreviewProvider` inside the share preview content and keep `AudioPreviewIconButton` in the event lane blocks.

## Consequences

- `app/share/[shareToken]/page.tsx` is now a thin 63-line route wrapper.
- Authenticated workspace components do not gain `readOnly` flags or share-route conditionals.
- The share event timeline keeps its own lane builder while reusing shared formatting, behavior copy, and audio-preview primitives.
- Future share-only UX can evolve without risking the project workspace editor surfaces.
