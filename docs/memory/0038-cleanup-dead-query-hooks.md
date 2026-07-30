# Cleanup Dead Query Hooks

## Changed

- Started Component Decomposition Stage 15 cleanup.
- Removed the dead UI-facing exports `useCollisionMatrixQuery` and `useSharingLinkQuery` from `features/projects/queries.ts`.
- Kept the `projectQueryKeys.collisionMatrix` and `projectQueryKeys.shareLink` key factories because mutation invalidation and the share-preview query still use them.
- Added ADRs:
  - `0044-context-boundary-policy.md`
  - `0045-feature-module-boundaries.md`
  - `0046-row-models-over-generic-lists.md`
- Confirmed final route line counts meet the plan targets:
  - project workspace route: 70
  - event detail route: 88
  - libraries route: 101
  - projects list route: 26
  - share preview route: 63
- Confirmed no `.snap` or `.snapshot` files exist outside ignored build/dependency directories.

## Verification

- `rg "useCollisionMatrixQuery|useSharingLinkQuery" -n app components features data domain tests` returned no matches.
- `grep -rn 'data-testid' app components features | sort` still yields exactly 6 results.
- ARIA/role grep output is unchanged by this cleanup.
- `pnpm typecheck` passed.
- `pnpm lint` passed with the existing warnings in `.codex-verify/verify-event-timeline.mjs` and `components/layout/workspace-shell.tsx`.
- `pnpm test` passed: 109 tests.
- `pnpm test:e2e` passed: 17 tests.

## Unresolved

- Stage 15 is not complete because several existing `features/` files still exceed the approximate 260-line target:
  - `features/project-workspace/workspace-dialogs.tsx`: 573
  - `features/projects/queries.ts`: 544
  - `features/project-workspace/workspace-content.tsx`: 367
  - `features/matrix/matrix-tab.tsx`: 317
  - `features/project-workspace/workspace-scope-context.tsx`: 310
  - `features/matrix/matrix-axis-filter.tsx`: 277
  - `features/projects/audio-preview.tsx`: 275

## Recommended Next Group

- Continue Stage 15 by splitting the oversized feature files, starting with `workspace-dialogs.tsx` into one file per dialog plus a small orchestrator.
