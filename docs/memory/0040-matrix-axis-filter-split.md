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

## Follow-up Chunk: Stage 15 Completion

## Changed

- Finished Component Decomposition Stage 15 cleanup.
- Split workspace scope types and consumer hooks out of `workspace-scope-context.tsx`, reducing it to 246 lines.
- Split `features/projects/queries.ts` into query keys, read hooks, project/asset mutations, workspace mutations, and matrix/share mutations while preserving the public `features/projects/queries.ts` re-export facade.
- Split audio preview controls out of `audio-preview.tsx`, reducing it to 204 lines.
- Confirmed no `features/` source file exceeds the approximate 260-line target; largest is now `features/assets/asset-authoring-dialogs.tsx` at 258 lines.
- Marked Stage 15 and Phase 12 cleanup gates complete.

## Verification

- `pnpm typecheck` passed.
- `pnpm lint` passed with the existing warnings in `.codex-verify/verify-event-timeline.mjs` and `components/layout/workspace-shell.tsx`.
- `pnpm test` passed: 109 tests.
- `pnpm test:e2e` passed: 17 tests.
- `grep -rn 'data-testid' app components features | sort` still yields exactly 6 results.
- ARIA/role grep remains on the same baseline surfaces.
- A dedicated Playwright walkthrough followed `docs/plan/STAKEHOLDER_DEMO_SCRIPT.md` after reset, touched Projects, Devices, Events, Assets, Matrix, generated share links, opened all three seeded share previews, and reset the demo again.
- Fresh visual screenshot diffs were not rerun; this chunk did not intentionally change DOM structure, class strings, copy, ARIA, or test ids.

## Recommended Next Group

- Component decomposition is complete. Next work should come from the out-of-scope follow-up list or a new product slice, not more Stage 12 refactor cleanup.
