# Stage 15 Workspace Content Split

## Changed

- Continued Component Decomposition Stage 15 cleanup.
- Split non-rendering logic out of `features/project-workspace/workspace-content.tsx`.
- Added `workspace-asset-model.ts` for project asset tab derivation: import candidate count, selected folder/path, visible items, library lookup, and filtered project libraries.
- Added `workspace-delete-requests.ts` for delete target adapters used by collection, event, matrix entry, asset folder, and asset actions.
- Added `workspace-device-status.tsx` for the selected device enable switch and disabled-device status banner.
- Reduced `workspace-content.tsx` from 367 lines to 246 lines, bringing it below the approximate 260-line target.
- Marked the Stage 15 feature-file size checklist item as `[~]` because other feature files still exceed the target.

## Verification

- `pnpm typecheck` passed.
- `pnpm lint` passed with existing warnings in `.codex-verify/verify-event-timeline.mjs` and `components/layout/workspace-shell.tsx`.
- `pnpm test` passed: 109 tests.
- `pnpm test:e2e` passed: 17 tests.
- `grep -rn 'data-testid' app components features | sort` still yields exactly 6 results.
- ARIA/role grep still shows the same surfaces; the disabled-device status role moved from `workspace-content.tsx` into `workspace-device-status.tsx`.

## Notes

- Existing untracked `.claude/` files were left untouched.
- Remaining feature files above the approximate 260-line target:
  - `features/projects/queries.ts`
  - `features/matrix/matrix-tab.tsx`
  - `features/project-workspace/workspace-scope-context.tsx`
  - `features/matrix/matrix-axis-filter.tsx`
  - `features/projects/audio-preview.tsx`

## Recommended Next Group

- Continue Stage 15 by splitting `matrix-tab.tsx` or `workspace-scope-context.tsx` before taking on the larger `features/projects/queries.ts` split.

## Follow-up Chunk: Matrix Tab Split

## Changed

- Continued Stage 15 feature-file cleanup.
- Split `features/matrix/matrix-tab.tsx` into:
  - `matrix-tab-model.ts` for derived matrix events, row/column sets, entry lookup, coverage, and selected-entry label.
  - `matrix-tab-types.ts` for the public `MatrixTabProps` shape.
- Reduced `matrix-tab.tsx` from 317 lines to 250 lines.
- Left the Stage 15 "no file in `features/` exceeds ~260 lines" checklist item as `[~]` because other feature files still exceed the target.

## Verification

- `pnpm typecheck` passed.
- `pnpm lint` passed with existing warnings in `.codex-verify/verify-event-timeline.mjs` and `components/layout/workspace-shell.tsx`.
- `pnpm test` passed: 109 tests.
- `pnpm test:e2e` passed: 17 tests.
- `grep -rn 'data-testid' app components features | sort` still yields exactly 6 results.
- ARIA/role grep is unchanged for the touched matrix surface.
- Remaining feature files above the approximate 260-line target:
  - `features/projects/queries.ts`
  - `features/project-workspace/workspace-scope-context.tsx`
  - `features/matrix/matrix-axis-filter.tsx`
  - `features/projects/audio-preview.tsx`

## Recommended Next Group

- Continue Stage 15 by splitting `workspace-scope-context.tsx` or `matrix-axis-filter.tsx`; leave the broader `features/projects/queries.ts` split for a separate chunk.
