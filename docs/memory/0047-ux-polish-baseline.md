# UX Polish Baseline

## Changed

- Completed the baseline gate in `plan/UX_POLISH_CHECKLIST.md` without touching the pre-existing untracked `.claude/`, `docs/architecture/`, or other `plan/` files.
- Captured desktop (1440px) and mobile (375px) reference images for Projects, Libraries, Project Events, Event Detail, and Collision Matrix under `.codex-verify/ux-polish-baseline/`.
- Captured the selected matrix-resolution panel and an event audio-preview state for later visual comparison.

## Verification

- `pnpm typecheck` passed.
- `pnpm lint` passed with two existing warnings: unused `timeline` in `.codex-verify/verify-event-timeline.mjs` and Next's `no-img-element` warning in `components/layout/workspace-shell.tsx`.
- `pnpm test` passed: 120 tests.
- `pnpm test:e2e -- tests/e2e/projects.spec.ts` passed: 18 tests.

## Notes

- The active server on port 3000 was used for the baseline captures; an attempted second dev server chose port 3001 and was not used.
- No ADR was needed because this chunk records baseline evidence only.

## Shared Geometry Follow-up

- Completed checklist group 1. `PageHeader` now owns a 16px horizontal / 20px vertical canonical gutter, and Projects, Libraries, project workspace, Event Detail, and loading/error scaffolds compose their body spacing outside it.
- Added `--shell-header-height` and `--workspace-sidebar-width: 320px`; both top-level rails keep their existing `md` responsive behavior. The nested project asset-library rail stays at 268px because the baseline did not show comparable truncation.
- Added ADR 0051 and a focused `PageHeader` gutter test.
- `pnpm typecheck` and `pnpm test` passed (121 tests). `pnpm lint` passed with the two existing warnings in `.codex-verify/verify-event-timeline.mjs` and `components/layout/workspace-shell.tsx`. The focused seeded-shell Playwright smoke test passed.
- Captures in `.codex-verify/ux-polish-geometry-*.png` confirm the 320px library rail and mobile project workspace fit without horizontal overflow.

## Recommended Next Group

- Start `2. Theme foundation`: introduce the variable-backed Tailwind palette and `next-themes` provider before adding the toolbar toggle in group 3.
