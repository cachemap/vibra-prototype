# 0019 Asset Library Browser Aggregate

## Context

Phase 6 starts the reusable asset-library workspace at `/libraries`. The screen needs library-level default/imported indicators, counts, a folder tree, and create flows without coupling React to Dexie table reads.

## Decision

Add `loadAssetLibraries` to the project repository as a summary aggregate for the library rail, and keep `loadAssetLibraryTree` as the selected-library folder/detail aggregate. Mock asset creation stores metadata plus a stable `https://vibra.local/assets/...` playback URL; file Blob persistence remains deferred.

## Consequences

- The `/libraries` route can render seeded and user-created libraries through query hooks and invalidate the same repository boundary used by projects.
- Default and imported indicators are computed from persisted project/default/import rows instead of hardcoded UI state.
- Prototype asset rows are immediately usable as metadata, while real upload/blob handling can be added behind the repository later.
