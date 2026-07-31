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

- Implement checklist group 3: compose `ThemeModeToggle` into `WorkspaceShell`, derive active Projects/Libraries state from `usePathname`, and move Reset demo beside the Vibra logo.
