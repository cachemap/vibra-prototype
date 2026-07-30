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

## Stage 2 Completed

## Changed

- Completed Component Decomposition Stage 2.
- Removed duplicated page-local `messageForError`, `formatDate`, `formatSeconds`, `searchParamsFor`, `folderHrefFor`, `hrefWithFeedback`, direct project flash `sessionStorage`, and lazy project flash read helpers.
- Adopted `lib/errors.ts`, `lib/format.ts`, `lib/plural.ts`, `lib/search-params.ts`, and `lib/flash-message.ts` across the five route pages.
- Preserved the distinct asset/project date formats and the separate workspace/projects/libraries/share fallback strings.
- No ADR was added; this was the planned mechanical adoption of ADR 0034's utility boundary.

## Verification

- `pnpm typecheck` passed.
- `pnpm lint` passed with the existing warnings in `.codex-verify/verify-event-timeline.mjs` and `components/layout/workspace-shell.tsx`.
- `pnpm test` passed: 98 tests.
- `pnpm test:e2e` passed: 17 tests.
- `grep -rn 'data-testid' app components features | sort` still yields exactly the six Stage 0 entries.
- `grep -rno 'aria-label\|role="status"\|role="tab"\|aria-selected\|aria-checked' app features | sort` still yields the same entries; line numbers shifted because local helper blocks were removed.
- Browser check against `http://localhost:3000` verified both flash-message channels: event detail delete via `?feedback=` and project delete via session storage. Demo data was reset afterward.

## Notes

- Port 3000 already had a dev server running; no new server was left running by this chunk.
- Existing untracked `.claude/` files were left untouched.

## Recommended Next Group

- Start Component Decomposition Stage 3: add `Badge`, `FormDialog`, `PageStateScaffold`, and `RowActionsMenu` primitives with no call sites changed.
