# 0023 Asset Blob Persistence

## Context

Phase 9 replaces metadata-only asset creation with uploaded audio and haptic files that must survive reloads in the IndexedDB prototype. Persisting object URLs is not reliable because they are browser-session resources, while seeded demo assets should keep their stable prototype URLs.

## Decision

Store uploaded file data in a companion `assetBlobs` Dexie store keyed by `assetId`, while leaving `assets` as the metadata and eligibility record. Uploaded assets receive a stable placeholder `playbackUrl` in metadata; repository aggregates resolve an available blob into a fresh object URL at read time and revoke the previous generated URL for that asset before replacing it.

## Consequences

- Seeded demo assets keep their existing stable URLs and do not need blob fixtures yet.
- Upload UI can call the existing asset creation flow with a `Blob` and get browser-usable playback URLs from the same library, device, and share-preview aggregates.
- Missing blob rows for uploaded assets surface as persistence failures instead of silently rendering an unusable placeholder URL.
