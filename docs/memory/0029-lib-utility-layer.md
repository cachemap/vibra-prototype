# Lib Utility Layer

## Changed

- Completed Component Decomposition Stage 1.
- Added additive-only helpers under `lib/`:
  - `errors.ts`
  - `format.ts`
  - `plural.ts`
  - `tree.ts`
  - `search-params.ts`
  - `flash-message.ts`
- Added focused tests:
  - `tests/lib-errors.test.ts`
  - `tests/lib-format.test.ts`
  - `tests/lib-tree.test.ts`
- No page call sites were changed in this stage.
- Added ADR `0034-pure-utility-layer-boundary.md`.

## Verification

- `pnpm typecheck` passed.
- `pnpm lint` passed with the existing warnings in `.codex-verify/verify-event-timeline.mjs` and `components/layout/workspace-shell.tsx`.
- `pnpm test` passed: 98 tests.
- `pnpm test:e2e` passed: 17 tests.
- `grep -rn 'data-testid' app components features | sort` still yields exactly the six Stage 0 entries.
- `grep -rno 'aria-label\|role="status"\|role="tab"\|aria-selected\|aria-checked' app features | sort` matches the Stage 0 baseline.
- Browser surface check is not separately applicable because this stage changed no page files or call sites; Playwright still exercised the demo surfaces.

## Notes

- `workspaceErrorFallback` and `eventWorkspaceErrorFallback` intentionally share identical copy: `The local demo workspace could not be updated.`
- `lib/errors.ts` uses a relative domain import so Vitest resolves it without additional alias config.
- Existing untracked `.claude/` files were left untouched.

## Recommended Next Group

- Start Component Decomposition Stage 2: adopt the new `lib/` helpers across the existing pages, preserving every fallback string, date format, flash-message channel, and URL output.
