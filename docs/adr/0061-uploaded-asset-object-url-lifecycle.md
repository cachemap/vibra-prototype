# 0061 Uploaded Asset Object URL Lifecycle

## Context

Uploaded blobs need a browser playback URL after an IndexedDB read. Separate feature modules construct repositories over the same database, and Reset demo clears data outside those repositories' normal asset-delete cascades.

## Decision

Maintain ephemeral uploaded object URLs in a database-scoped registry shared by repository instances. Persist only the asset's stable source URL and Blob record. Revoke a registry entry on asset deletion and release every entry immediately before Reset demo clears IndexedDB.

## Consequences

- Every aggregate receives the same live object URL for an uploaded asset during a browser session.
- Reset and deletion release browser resources without persisting `blob:` URLs or leaving stale playback references.
- A later read after reset creates a fresh URL from the newly seeded or uploaded Blob.
