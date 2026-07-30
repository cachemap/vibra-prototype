# Date Format Alignment

## Changed

- Completed the follow-up where `formatAssetDate` and `formatProjectDate` formatted persisted timestamps differently.
- Added one shared UTC display date formatter in `lib/format.ts` while keeping both named helper APIs for feature call-site clarity.
- Asset and project dates now both render as `MMM D, YYYY`, avoiding local-timezone drift and keeping library/project tables consistent.
- Updated `tests/lib-format.test.ts` to assert the shared output and parity between the two helpers.

## Verification

- `pnpm vitest run tests/lib-format.test.ts` passed: 8 tests.
- `pnpm typecheck` passed.
- `pnpm lint` passed with the existing warnings in `.codex-verify/verify-event-timeline.mjs` and `components/layout/workspace-shell.tsx`.
- `pnpm test` passed: 112 tests.

## Notes

- No ADR was added; this was a small display-format follow-up, not a new architecture, persistence, route, seed-data, or domain decision.
- Existing untracked `.claude/` files were left untouched.

## Recommended Next Group

- Choose another explicit follow-up from `docs/plan/COMPONENT_DECOMPOSITION_CHECKLIST.md`, likely unifying the two page-level feedback banner markups or making a decision on rendered-but-nonfunctional search inputs.
