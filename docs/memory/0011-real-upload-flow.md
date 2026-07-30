# Phase 9.2 Real Upload Flow

## Changed

- Replaced the `/libraries` mock asset creation dialog with a real file upload flow.
- Inferred audio vs haptic media kind from MIME type and filename extension.
- Rejected unsupported uploads with `UnsupportedMediaError` before repository persistence.
- Sent uploaded files through the existing blob-backed `createAsset` repository path.
- Updated list and tile views to distinguish uploaded audio/haptic assets from seeded demo assets.
- Added tiny Playwright fixtures for audio and AHAP uploads.
- Added ADR `0024-real-asset-upload-flow.md`.

## Verification

- `pnpm typecheck` passed.
- `pnpm lint` passed.
- `pnpm test -- tests/project-repository.test.ts` passed; Vitest ran 7 files and 59 tests.
- `pnpm exec playwright test tests/e2e/projects.spec.ts --grep "browses and mutates asset libraries|imports a library"` passed; Playwright ran 2 tests.

## Notes

- Existing uncommitted `package.json` and `test-results/` changes were present before this chunk and were left uncommitted.
- Browser audio preview controls are still not implemented.

## Recommended Next Group

Start Phase 9.3 Browser Audio Preview: add user-initiated play/stop controls for uploaded audio assets, scheduled event previews, and event share previews.

---

# Phase 9.3 Browser Audio Preview

## Changed

- Added a reusable client-only audio preview helper for single assets and scheduled timeline previews.
- Added play/stop controls for audio assets in `/libraries` list and tile views.
- Added scheduled audio preview controls in the project event timeline, skipping disabled event interactions and disabled devices.
- Added the same preview controls to event share pages, with haptics kept visual-only.
- Surfaced a shared playback error when browser audio cannot decode/load/play.
- Added ADR `0025-browser-audio-preview-controls.md`.

## Verification

- `pnpm typecheck` passed.
- `pnpm lint` passed.
- `pnpm exec playwright test tests/e2e/projects.spec.ts --grep "imports a library and selects its asset for playback|generates and opens share links"` passed.

## Notes

- Existing uncommitted `package.json` and `test-results/` changes were present before this chunk and were left uncommitted.
- The Phase 9 gate still has unchecked persistence/reset items from earlier upload work; review those before closing the whole phase.

## Recommended Next Group

Start Phase 10.1 Primitive Visual System, or first audit the remaining Phase 9 gate items if the phase needs to be fully closed.
