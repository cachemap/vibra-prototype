# Workspace Dialog Split

## Changed

- Continued Component Decomposition Stage 15 cleanup.
- Split `features/project-workspace/workspace-dialogs.tsx` from 573 lines into a 57-line orchestrator plus focused files for device, collection, event, import, and asset dialogs.
- Preserved the single `DialogOverlay align="end"` layer and kept `ShareLinkDeleteConfirm` as the sibling confirm outside the overlay.
- Kept dialog copy, form IDs, mutation calls, feedback copy, and route-facing imports behavior-equivalent.

## Verification

- `pnpm typecheck` passed.
- `pnpm lint` passed with existing warnings in `.codex-verify/verify-event-timeline.mjs` and `components/layout/workspace-shell.tsx`.
- `pnpm test` passed: 109 tests.
- `pnpm test:e2e` passed: 17 tests.
- `grep -rn 'data-testid' app components features | sort` still yields exactly 6 results.
- ARIA/role grep still shows the same surfaces.
- Captured and inspected the extracted Create Device dialog:
  - `/tmp/vibra-workspace-dialogs-device-split.png`

## Notes

- Existing untracked `.claude/` files were left untouched.
- Remaining feature files above the approximate 260-line target:
  - `features/projects/queries.ts`
  - `features/project-workspace/workspace-content.tsx`
  - `features/matrix/matrix-tab.tsx`
  - `features/project-workspace/workspace-scope-context.tsx`
  - `features/matrix/matrix-axis-filter.tsx`
  - `features/projects/audio-preview.tsx`

## Recommended Next Group

- Continue Stage 15 by splitting the remaining oversized feature files, starting with `workspace-content.tsx` or `matrix-tab.tsx` before the larger `features/projects/queries.ts` split.
