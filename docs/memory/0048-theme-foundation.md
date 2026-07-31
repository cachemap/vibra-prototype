# Theme foundation

## Changed

- Completed UX Polish checklist group 2.
- Added `next-themes` configured for `data-theme`, system preference tracking, persisted explicit selection, and transition suppression.
- Backed every authored Tailwind gray and purple utility with alpha-capable CSS variables, including light and dark palettes plus native `color-scheme`.
- Added the accessible Light/System/Dark `ThemeModeToggle` primitive with a fixed pre-hydration placeholder.
- Replaced the remaining mode-sensitive raw shadow, divider, and partial-selection colors in application components with theme variables.

## Verification

- `pnpm typecheck` passed.
- `pnpm lint` passed with the existing warnings in `.codex-verify/verify-event-timeline.mjs` and `components/layout/workspace-shell.tsx`.
- `pnpm test` passed: 123 tests.
- `pnpm build` passed.

## Next

- UX Polish checklist group 3 is complete.
- `WorkspaceShell` now derives the active Projects/Libraries link from `usePathname`, including nested project and event-detail routes. The selected link uses an explicit persistent surface treatment and the sole `aria-current="page"`.
- Reset demo now sits beside the Vibra logo and retains its existing reset/query invalidation/redirect path. It is icon-only at narrow widths while retaining its accessible name.
- The shared Light/System/Dark `ThemeModeToggle` is on the right with workspace navigation; reset does not touch theme state.
- Added route-selection unit coverage in `tests/workspace-shell.test.ts`.

## Verification

- `pnpm typecheck` passed.
- `pnpm test -- tests/workspace-shell.test.ts tests/theme-mode-toggle.test.tsx` passed: 126 tests.
- `pnpm exec playwright test tests/e2e/toolbar.spec.ts` passed: active-route, 375px toolbar, reset redirect, and theme-preference coverage.
- `pnpm lint` passed with existing warnings in `.codex-verify/verify-event-timeline.mjs` and `components/layout/workspace-shell.tsx`.

## Next

- Implement checklist group 4: replace the collection overflow menu with a direct Delete button while retaining the existing confirmation flow.

## Collection viewer actions

- Completed UX Polish checklist group 4. The Events collection toolbar now exposes a visible secondary Delete button with a `Trash2` icon, disabled when no collection is selected; it calls the unchanged confirmation callback.
- Updated the workspace E2E path to use the direct control and verify the existing collection cascade copy plus cancellation before confirming deletion.

## Verification

- `pnpm exec playwright test tests/e2e/projects.spec.ts --grep 'deletes collections and events from the workspace'` passed.
- `pnpm typecheck` passed.
- `pnpm lint` passed with the existing warnings in `.codex-verify/verify-event-timeline.mjs` and `components/layout/workspace-shell.tsx`.

## Next

- Implement UX Polish checklist group 5: persisted event ordering (domain field, v3 IndexedDB migration, repository/query mutation, then drag-and-drop UI in group 6).
