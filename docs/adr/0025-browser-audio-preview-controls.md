# 0025 Browser Audio Preview Controls

## Context

Phase 9.3 needs browser audio playback without pretending that web previews can play native haptics. Preview controls appear in asset libraries, project event timelines, and share previews.

## Decision

Use a client-only audio preview helper that creates `Audio` instances after a user action, schedules enabled audio rows by `startOffset`, and stops any active or pending preview before starting another. Disabled devices and disabled event interactions are visible but skipped. Haptic rows remain visual-only.

## Consequences

- Uploaded audio can be demonstrated in the browser from the same blob-backed URLs used by library and workspace aggregates.
- The preview model stays honest about haptic limitations.
- Seeded demo URLs that are not browser-playable surface the shared playback error instead of failing silently.
