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

---

# Stage 6 Verification Cleanup

## Changed

- Completed the stale Stage 6 verification gate in `docs/plan/COMPONENT_DECOMPOSITION_CHECKLIST.md`.
- Fixed event timeline playback playhead rendering by reading `playheadByScheduleKey` directly from `useAudioPreviewState()` when building lanes.
- Added `tests/event-timeline.test.tsx` to cover schedule playhead rendering under `AudioPreviewProvider`.
- Added the `@` alias to `vitest.config.ts` so feature-level component tests can import app modules through the same path mapping as Next/TypeScript.

## Verification

- `pnpm test tests/event-timeline.test.tsx` passed: 1 test.
- `pnpm typecheck` passed.
- `pnpm lint` passed with the existing warnings in `.codex-verify/verify-event-timeline.mjs` and `components/layout/workspace-shell.tsx`.
- `pnpm test` passed: 120 tests.
- `pnpm test:e2e` passed: 17 tests.
- Targeted Playwright browser script passed for Stage 6 behavior: timeline playhead while typing in a dialog, both flash-message channels, and asset preview controls in library table, library tile, and project asset table contexts.

## Notes

- Existing untracked `.claude/` files were left untouched.

## Recommended Next Group

- Continue with the first remaining unchecked verification gate in `docs/plan/COMPONENT_DECOMPOSITION_CHECKLIST.md`: Stage 7 matrix verification.
