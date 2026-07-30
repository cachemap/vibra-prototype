# Component Decomposition New Primitives

## Changed

- Completed Component Decomposition Stage 3.
- Added additive primitives with no page call-site changes:
  - `Badge`
  - `FormDialog`
  - `PageStateScaffold`
  - `RowActionsMenu`
- Exported the new primitives from `components/primitives/index.ts`.
- Inspected `MenuGroup`; it adds a wrapper `div`, `role="group"`, border, and padding classes, so `RowActionsMenu` keeps the `grouped?` prop for later DOM-preserving adoption.
- No ADR was added; this stage implemented the previously planned primitive API without a new architecture decision.

## Verification

- `pnpm typecheck` passed.
- `pnpm lint` passed with the existing warnings in `.codex-verify/verify-event-timeline.mjs` and `components/layout/workspace-shell.tsx`.
- `pnpm test` passed: 98 tests.
- `pnpm test:e2e` passed: 17 tests.
- `grep -rn 'data-testid' app components features | sort` still yields exactly the six Stage 0 entries.
- `grep -rno 'aria-label\|role="status"\|role="tab"\|aria-selected\|aria-checked' app features | sort` still matches the Stage 0 baseline.

## Notes

- `FormDialog` renders a bare `Dialog` and does not own a `DialogOverlay`.
- Only `RowActionsMenu` has `"use client"` because it owns local `open` state.
- Existing untracked `.claude/` files were left untouched.

## Recommended Next Group

- Start Component Decomposition Stage 4: adopt `RowActionsMenu`, `FormDialog`, `Badge`, and `PageStateScaffold` at existing call sites, preserving DOM/classes/ARIA/test ids and deleting the seven hoisted menu-open state slots.
