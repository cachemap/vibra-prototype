# Phase 7 Collision Matrix Workspace

## Changed

- Added a Matrix tab in `/projects/[projectId]` for the selected device.
- Added playing-row and incoming-column selectors sourced from that device's events.
- Added a scan-friendly matrix grid with unset cells, selected cell state, behavior pills, and `Not possible` grayscale/N/A treatment.
- Added a bottom resolution editor with behavior selection, `Suppress` target selection, repository-backed persistence, and a staged matrix-entry share action.
- Exposed project workspace feedback as `role="status"` for smoke tests and assistive technology.
- Added ADR `0021-project-collision-matrix-workspace.md`.
- Added Playwright smoke coverage for selecting row/column candidates, saving a matrix entry, and verifying persistence after reload.

## Verification

- `pnpm typecheck` passed.
- `pnpm lint` passed.
- `pnpm test -- tests/project-repository.test.ts` passed; Vitest ran 7 files and 57 tests.
- `pnpm test:e2e -- tests/e2e/projects.spec.ts --grep "configures a collision matrix entry"` passed; Playwright still ran the full projects spec and all 7 tests passed.

## Recommended Next Group

Start Phase 8: implement share link generation dialogs for project, event, and collision matrix entry targets, then make `/share/[shareToken]` resolve useful target summaries.

---

# Phase 8 Sharing And Mobile Preview

## Changed

- Added share actions for projects, selected events, and selected collision matrix entries in `/projects/[projectId]`.
- Added a generated share-link dialog with copy and open-preview actions.
- Added repository-backed `loadSharingLinkPreview` aggregate for `/share/[shareToken]`.
- Replaced the share-route placeholder with invalid-link handling plus project, event, and matrix-entry summaries.
- Event share previews show scheduled playback rows and mark disabled interactions; project summaries mark disabled devices as excluded.
- Added ADR `0022-share-preview-aggregate.md`.
- Added Playwright smoke coverage for generating all three share link types, opening an event share page, and handling an invalid token.

## Verification

- `pnpm typecheck` passed.
- `pnpm lint` passed.
- `pnpm test -- tests/project-repository.test.ts` passed; Vitest ran 7 files and 57 tests.
- `pnpm exec playwright test tests/e2e/projects.spec.ts --grep "generates and opens share links"` passed.
- `pnpm exec playwright test tests/e2e/projects.spec.ts` passed; Playwright ran 8 project smoke tests.

## Recommended Next Group

Start Phase 9.1 Asset Binary Persistence: add blob-backed uploaded asset storage before replacing mock asset creation controls.

---

# Phase 9.1 Asset Binary Persistence

## Changed

- Added an `assetBlobs` IndexedDB store in Dexie schema version 2, keyed by `assetId`.
- Extended asset creation so callers can pass either a stable `playbackUrl` or uploaded `Blob` file data.
- Kept seeded demo asset URLs unchanged, while uploaded assets persist metadata with a stable placeholder URL and resolve to browser object URLs in repository aggregates.
- Added repository object URL create/revoke hooks so repeat aggregate reads replace prior generated URLs instead of accumulating stale object URLs.
- Added ADR `0023-asset-blob-persistence.md`.
- Added tests for uploaded blob persistence after a fresh repository read and missing blob-row error handling.

## Verification

- `pnpm test -- tests/db-schema.test.ts tests/project-repository.test.ts` passed; Vitest ran 7 files and 59 tests.
- `pnpm typecheck` passed.
- `pnpm lint` passed.

## Recommended Next Group

Start Phase 9.2 Real Upload Flow: replace the mock create-asset controls in `/libraries` with file upload controls, validate media kind from MIME/extension, and wire uploads into the blob-backed repository path.
