# 0002 App Scaffold

## Changed

- Added a pnpm-managed Next.js App Router scaffold with strict TypeScript, Tailwind, PostCSS, and a minimal `/` workspace entry.
- Installed the planned prototype dependencies: TanStack Query, Dexie, neverthrow, Valibot, lucide-react, Vitest, and Playwright.
- Configured ESLint with the native Next 16 flat config exports and added scripts for `dev`, `build`, `typecheck`, `lint`, `test`, and `test:e2e`.
- Added a tiny Vitest scaffold test so the unit test harness has a passing baseline.
- Marked Phase 1.1 complete in the implementation checklist.

## Verification

- `pnpm typecheck` passed.
- `pnpm lint` passed.
- `pnpm test` passed.
- `pnpm build` passed.
- `pnpm dev --port 3001` started successfully and reached ready state.

## Notes

- The app currently has only the minimal root route; the core workspace routes and primitive library are still pending.
- `pnpm install` reports ignored build scripts for `sharp`; no app behavior depends on approving those scripts for this scaffold pass.

## Recommended Next Group

Start Phase 1.2 Component Primitive Foundation, then use those primitives while completing Phase 1.3 route placeholders.

---

# Phase 1.2 Primitive Foundation

## Changed

- Added `components/primitives/` with Button, IconButton, TextInput, Select, Tabs, Dialog, dense Table pieces, Breadcrumbs, and Empty/Error/Loading states.
- Refactored the root scaffold route to render a compact Vibra workspace mock using primitives instead of one-off Tailwind-heavy markup.
- Added ADR `0002-primitive-styling-boundary.md` to capture the rule that repeated visual/styling decisions live in primitives before feature screens.
- Marked Phase 1.2 complete in the implementation checklist.

## Verification

- `pnpm typecheck` passed.
- `pnpm lint` passed.
- `pnpm test` passed.

## Notes

- The primitives are intentionally presentational for now. Dialog/menu behavior and data-backed form states should be added when the route shells and vertical slices need them.
- Vitest still reports the existing Vite CJS deprecation warning, but tests pass.

## Recommended Next Group

Start Phase 1.3 Route Shell: add `/projects`, `/projects/[projectId]`, `/libraries`, and `/share/[shareToken]` placeholders, plus the compact top bar, left rail, and TanStack Query provider wiring.

---

# Phase 1.3 Route Shell

## Changed

- Added a client `app/providers.tsx` with a shared TanStack Query client and wired it through `app/layout.tsx`.
- Added `components/layout/workspace-shell.tsx` with the compact top bar, workspace left rail, and demo-status placeholder.
- Changed `/` to redirect into `/projects`.
- Added domain-shaped placeholder routes for `/projects`, `/projects/[projectId]`, `/libraries`, and `/share/[shareToken]`.
- Added loading, empty, and error placeholders across the route shell.
- Added ADR `0003-route-shell-and-query-provider.md` for the shared shell and query-provider boundary.
- Marked Phase 1.3 and the Phase 1 route-shell gates complete in the checklist.

## Verification

- `pnpm typecheck` passed.
- `pnpm lint` passed.
- `pnpm test` passed.
- `pnpm build` passed.
- `pnpm dev --port 3001` reached ready state in a bounded start check, then was stopped.

## Notes

- Route placeholders intentionally use static demo rows until the domain and IndexedDB slices exist.
- The shared shell and current placeholder routes are client components so lucide icon elements can be composed through client primitives cleanly.
- Share previews currently inherit the workspace shell. Revisit if Phase 8 needs a more mobile-preview-specific public layout.
- Vitest still reports the existing Vite CJS deprecation warning, but tests pass.

## Recommended Next Group

Start Phase 2.1 Types And Vocabularies so repositories and seeded data can depend on typed domain concepts.
