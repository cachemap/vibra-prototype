# Share Route Shell Boundary

## Changed

- Moved `WorkspaceShell` out of the root `app/layout.tsx`.
- Added route layouts for `/projects` and `/libraries` so authoring routes keep workspace navigation and `Reset demo`.
- Left `/share/[shareToken]` shell-free so unauthenticated/mobile-preview viewers do not see app nav or reset controls.
- Added a Playwright assertion to the share-link smoke path covering absence of workspace nav and reset controls.

## Verification

- `pnpm typecheck` passed.
- `pnpm lint` passed with the existing warnings in `.codex-verify/verify-event-timeline.mjs` and `components/layout/workspace-shell.tsx`.
- `pnpm test` passed: 116 tests.
- `pnpm exec playwright test tests/e2e/projects.spec.ts -g "generates and opens share links"` passed: 1 test.

## Notes

- ADR `0047-share-route-shell-boundary.md` records the route-shell decision.
- Existing untracked `.claude/` files were left untouched.

## Recommended Next Group

- Continue the component-decomposition follow-up list with mutation invalidation cleanup: every mutation currently invalidates `projectQueryKeys.all`, making targeted invalidations largely redundant.
