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

---

# Component Decomposition Primitive Adoption

## Changed

- Completed Component Decomposition Stage 4.
- Adopted `RowActionsMenu` across the project workspace, libraries page, projects list, and event detail page.
- Deleted the seven hoisted menu-open state slots: `openProjectActions`, `openDeviceActions`, `openCollectionActions`, `openEventActions`, `openProjectAssetActions`, `openActionsKey`, and `openActionRowId`.
- Adopted `FormDialog` for the regular create/edit forms while keeping the multi-action share dialogs raw.
- Adopted `Badge` and `PageStateScaffold` at the planned call sites.
- Extended `FormDialog` with separate dialog and form class hooks so existing dialog widths and grid form layouts can be preserved.
- Added lightweight `RowActionsMenu` coordination so opening one row menu closes any other open row menu without restoring page-level menu state.

## Verification

- `pnpm typecheck` passed.
- `pnpm build` passed.
- `pnpm lint` passed with the existing warnings in `.codex-verify/verify-event-timeline.mjs` and `components/layout/workspace-shell.tsx`.
- `pnpm test` passed: 98 tests.
- `pnpm test:e2e` passed: 17 tests.
- `grep -rn 'data-testid' app components features | sort` still yields exactly the six Stage 0 entries.
- `grep -rno 'aria-label\|role="status"\|role="tab"\|aria-selected\|aria-checked' app features | sort` still has the same attributes/surfaces as Stage 0; line numbers shifted from the refactor.
- Focused Playwright probe against a fresh production server verified: open menu A, click menu B trigger, A closes and B opens; Escape closes; outside click closes.

## Notes

- OpenClaw browser control was disabled, so browser verification used Playwright instead.
- A dense adjacent-row geometry issue remains out of scope: a portalled action menu can physically cover the next row's trigger. The coordination fix handles the non-overlapped one-click switching behavior; a positioning pass should address adjacent-row overlap later.
- Existing untracked `.claude/` files were left untouched.
- No ADR was added; this stage adopted planned primitives and fixed the primitive coordination detail without changing architecture.

## Recommended Next Group

- Start Component Decomposition Stage 5: extract `features/sharing/` from the duplicated project and event share-link flows.
