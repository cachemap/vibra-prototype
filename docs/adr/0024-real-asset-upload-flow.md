# 0024 Real Asset Upload Flow

## Context

Phase 9.2 replaces metadata-only asset creation with browser file uploads. The repository already stores uploaded file blobs separately from asset metadata, so the UI needs to send real `Blob` data while preserving seed/demo assets.

## Decision

Use a single upload control in `/libraries` and infer the asset media kind from MIME type first, then filename extension. Audio files are accepted for browser playback; `.ahap` and `.haptic` files are accepted as haptic assets for storage, picking, and visual timelines. Unsupported files raise `UnsupportedMediaError` before persistence.

## Consequences

- Designers no longer manually choose a media kind that can disagree with the file.
- Uploaded assets use blob-backed playback URLs from the repository aggregates, while seeded assets remain stable demo assets.
- Browser haptic playback remains visual-only until a native/device preview path exists.
