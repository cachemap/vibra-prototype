# Matrix Axis Filter Split

## Changed

- Continued Component Decomposition Stage 15 cleanup.
- Split matrix filter model code out of `features/matrix/matrix-axis-filter.tsx`.
- Added `matrix-axis-filter-model.ts` for axis types, collection/event row shapes, axis labels, noun copy, and selection-state derivation.
- Kept the ARIA-bearing selection bubble in `matrix-axis-filter.tsx` so the structural ARIA grep stays aligned with the Stage 0 baseline.
- Reduced `matrix-axis-filter.tsx` from 277 lines to 241 lines.
- Left the Stage 15 "no file in `features/` exceeds ~260 lines" checklist item as `[~]` because other feature files still exceed the target.

## Verification

- `pnpm typecheck` passed.
- `pnpm lint` passed with existing warnings in `.codex-verify/verify-event-timeline.mjs` and `components/layout/workspace-shell.tsx`.
- `pnpm test` passed: 109 tests.
- `pnpm test:e2e` passed: 17 tests.
- `grep -rn 'data-testid' app components features | sort` still yields exactly 6 results.
- ARIA/role grep keeps the matrix filter checkbox markup in `matrix-axis-filter.tsx`.

## Notes

- Existing untracked `.claude/` files were left untouched.
- Remaining feature files above the approximate 260-line target:
  - `features/projects/queries.ts`
  - `features/project-workspace/workspace-scope-context.tsx`
  - `features/projects/audio-preview.tsx`

## Recommended Next Group

- Continue Stage 15 by splitting `workspace-scope-context.tsx` or `audio-preview.tsx`; leave the broader `features/projects/queries.ts` cleanup for a separate, careful chunk.
