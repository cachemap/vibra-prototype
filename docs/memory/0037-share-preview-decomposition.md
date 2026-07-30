# Share Preview Decomposition

## Changed

- Completed Component Decomposition Stage 14.
- Reduced `app/share/[shareToken]/page.tsx` from 340 lines to 63 lines.
- Added `features/share-preview/` modules for the read-only share header, summary table, project device target table, event playback preview, matrix resolution summary, and content composer.
- Kept the route's stripped loading/error branches instead of adopting `PageStateScaffold`.
- Mounted `AudioPreviewProvider` in the share preview content and kept `AudioPreviewIconButton` inside the event lane blocks.
- Added ADR `0043-share-preview-read-only-components.md`.

## Verification

- `pnpm typecheck` passed.
- `pnpm lint` passed with existing warnings in `.codex-verify/verify-event-timeline.mjs` and `components/layout/workspace-shell.tsx`.
- `pnpm test` passed: 109 tests.
- `pnpm test:e2e` passed: 17 tests.
- `grep -rn 'data-testid' app components features | sort` still yields exactly 6 results.
- ARIA/role grep keeps the same surfaces; no share-preview ARIA/test-id surface changed.
- Captured and inspected share previews for project, event, and matrix targets:
  - `/tmp/vibra-share-stage14-project.png`
  - `/tmp/vibra-share-stage14-event.png`
  - `/tmp/vibra-share-stage14-matrix.png`
- Confirmed seeded share links render for all three target kinds, the copy-link control is present, and the event playback preview control is visible/clickable.

## Notes

- OpenClaw browser control was disabled, so browser checks used Playwright directly against the existing Next dev server on port 3000.
- Existing untracked `.claude/` files were left untouched.
- Every `features/share-preview/` file is below 260 lines.

## Recommended Next Group

- Stage 15: cleanup dead query hooks (`useCollisionMatrixQuery`, `useSharingLinkQuery`) and confirm final line-count/file-size targets.
