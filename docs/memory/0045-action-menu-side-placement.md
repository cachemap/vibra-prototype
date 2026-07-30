# Action Menu Side Placement

## Changed

- Completed the final component-decomposition follow-up for dense row action-menu placement.
- Added side placement to `ActionMenu` and factored its coordinate calculation into `positionActionMenu`.
- Updated compact `RowActionsMenu` instances to open beside the trigger column, preserving default dropdown placement for non-compact menus.
- Added `tests/action-menu-primitive.test.ts` for side placement and dropdown fallback.
- Recorded ADR `0049-action-menu-side-placement.md`.

## Verification

- `pnpm test tests/action-menu-primitive.test.ts` passed: 2 tests.
- `pnpm typecheck` passed.
- `pnpm lint` passed with the existing warnings in `.codex-verify/verify-event-timeline.mjs` and `components/layout/workspace-shell.tsx`.
- `pnpm test` passed: 119 tests.
- `pnpm test:e2e` passed: 17 tests.

## Notes

- Existing untracked `.claude/` files were left untouched.

## Recommended Next Group

- No unchecked items remain in `docs/plan/COMPONENT_DECOMPOSITION_CHECKLIST.md`. Pick the next product hardening or stakeholder-demo follow-up from new user direction.
