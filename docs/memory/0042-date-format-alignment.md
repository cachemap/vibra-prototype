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

- Choose another explicit follow-up from `docs/plan/COMPONENT_DECOMPOSITION_CHECKLIST.md`, likely making a decision on rendered-but-nonfunctional search inputs.

---

# Feedback Banner Alignment

## Changed

- Completed the follow-up where the `/projects` and `/libraries` page-level feedback banners used divergent markup.
- Added `FeedbackBanner` to `features/feedback/feedback-context.tsx` as the shared page-level status renderer.
- Replaced the local banner markup in `features/projects-list/projects-content.tsx` and `features/libraries/library-content.tsx`.
- Marked the feedback-banner follow-up complete in `docs/plan/COMPONENT_DECOMPOSITION_CHECKLIST.md`.

## Verification

- `pnpm typecheck` passed.
- `pnpm lint` passed with the existing warnings in `.codex-verify/verify-event-timeline.mjs` and `components/layout/workspace-shell.tsx`.
- `pnpm test` passed: 112 tests.
- `pnpm test:e2e -- tests/e2e/projects.spec.ts` passed: 17 tests.

## Notes

- No ADR was added; this was a small UI consistency follow-up, not a new architecture, persistence, route, seed-data, or domain decision.
- Existing untracked `.claude/` files were left untouched.

## Recommended Next Group

- Choose another explicit follow-up from `docs/plan/COMPONENT_DECOMPOSITION_CHECKLIST.md`, likely making a decision on rendered-but-nonfunctional search inputs.
