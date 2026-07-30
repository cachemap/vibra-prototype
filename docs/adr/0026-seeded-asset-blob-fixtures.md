# 0026 Seeded Asset Blob Fixtures

## Context

Phase 9 needs reset/reseed to restore browser-playable demo audio, not just metadata URLs. Uploaded assets already use a companion `assetBlobs` IndexedDB store, but canonical seed assets still pointed at static prototype URLs.

## Decision

Seed every canonical demo asset with a small companion blob fixture. Audio assets use a tiny WAV blob so repository aggregate loads can create browser object URLs; haptic assets use a tiny AHAP-shaped JSON blob and remain visual-only in browser previews.

## Consequences

- Demo reset/reseed restores the same blob-backed playback path used by uploads.
- Seeded haptic assets persist after reload and remain selectable without pretending the browser can play native haptics.
- Repository tests inject object URL factories so Node verification does not depend on browser URL APIs.
