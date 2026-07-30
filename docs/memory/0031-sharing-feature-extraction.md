# Component Decomposition Sharing Extraction

## Changed

- Completed Component Decomposition Stage 5.
- Added `features/sharing/share-token.ts` with the shared `shareTokenFor(link)` helper.
- Added `features/sharing/use-share-link.ts` to own share-link state and the generate/copy/delete handlers for both workspace and event pages.
- Added `features/sharing/share-link-dialog.tsx` with `ShareLinkDialog` and `ShareLinkDeleteConfirm`.
- Replaced the duplicated share-link state, mutations, handlers, and dialog JSX in:
  - `app/projects/[projectId]/page.tsx`
  - `app/projects/[projectId]/events/[eventId]/page.tsx`
- Success copy matched between the two pages. Error fallback copy remains page-specific through the hook option.

## Verification

- `pnpm typecheck` passed.
- `pnpm lint` passed with the existing warnings in `.codex-verify/verify-event-timeline.mjs` and `components/layout/workspace-shell.tsx`.
- `pnpm test` passed: 98 tests.
- `pnpm test:e2e` passed: 17 tests.
- `grep -rn 'data-testid' app components features | sort` still yields exactly the six Stage 0 entries.
- `grep -rno 'aria-label\|role="status"\|role="tab"\|aria-selected\|aria-checked' app features | sort` still has the same surfaces as Stage 0; line numbers shifted from the refactor.
- Focused Playwright browser probe against the existing local server verified project and event share flows: generate, copy to clipboard, open preview, and delete.

## Notes

- Stage 5 originally referenced `useFeedbackActions`, but the feedback context is a Stage 6 deliverable. `useShareLink` currently receives the page-scoped feedback setter so this stage remains a pure refactor; Stage 6 should swap that dependency to `useFeedbackActions`.
- Existing share-link delete behavior closes the share dialog before opening the delete confirm. This was preserved rather than changed.
- Existing untracked `.claude/` files were left untouched.
- No ADR was added; this stage extracted planned shared feature code without changing architecture.

## Recommended Next Group

- Start Component Decomposition Stage 6: add the feedback and audio-preview contexts, then replace the page-scoped sharing feedback setter with `useFeedbackActions`.
