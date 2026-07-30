# Event Detail Decomposition

## Changed

- Completed Component Decomposition Stage 11.
- Reduced `app/projects/[projectId]/events/[eventId]/page.tsx` from 888 lines to 88 lines.
- Added `features/events/event-derivations.ts` for pure event location, timeline playback sorting, max seconds, and preview grouping.
- Added `tests/event-derivations.test.ts` with 3 focused derivation cases.
- Extracted event detail loaded orchestration, workspace view, header, timeline, dialog overlay, dialog forms, and delete confirms into `features/events/`.
- Memoized event timeline lane construction in `EventTimeline`.
- Collapsed event deletion, interaction deletion, and playback deletion into one `EventDeleteTarget` confirm path.
- Added ADR `0040-event-detail-decomposition.md`.

## Verification

- `pnpm typecheck` passed.
- `pnpm lint` passed with existing warnings in `.codex-verify/verify-event-timeline.mjs` and `components/layout/workspace-shell.tsx`.
- `pnpm test` passed: 109 tests.
- `pnpm test:e2e` passed: 17 tests.
- `grep -rn 'data-testid' app components features | sort` still yields exactly 6 results.
- ARIA/role grep keeps the same surfaces; the event status line moved to `features/events/event-workspace-view.tsx`.
- OpenClaw browser control was disabled, so manual browser verification used Playwright CLI instead:
  `pnpm exec playwright screenshot --wait-for-timeout=2000 'http://localhost:3000/projects/project_checkout-system/events/event_ios-pay-now?device=device_checkout-ios-16-pro' /tmp/vibra-event-detail-stage11.png`.
- Screenshot inspection showed the event timeline rendered nonblank with expected controls and scheduled blocks.

## Notes

- Existing untracked `.claude/` files were left untouched.
- The event route is now below the ~120-line target, and every new `features/events/` file is at or below 255 lines.

## Recommended Next Group

- Stage 12: decompose the libraries page plus shared `features/assets/*`, keeping it separate from the project assets tab as planned.
