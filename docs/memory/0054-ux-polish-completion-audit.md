# UX Polish completion audit

## Completed

- Closed the UX Polish completion checklist. Refreshed the committed focused
  Matrix-editor Playwright snapshots at 1440px and 375px, then compared them to
  the baseline compact resolution-panel capture. The delivered editor provides
  the dedicated Tap/audition stage, two-lane timeline, adaptive controls, and
  narrow stacked layout while preserving Matrix context.
- Added the completion record to `plan/UX_POLISH_IMPLEMENTATION_PLAN.md` with
  links to ADRs 0051–0062 and an explicit Definition of Done audit.
- Recorded the intentional scope boundaries: no mobile drag reordering, nested
  project asset rail stays 268px, and browser haptic audition remains visual-only.

## Verification

- `pnpm exec playwright test tests/e2e/projects.spec.ts --grep 'focused resolution editor at wide and narrow' --update-snapshots` passed (1 test).
- The immediately preceding full UX Polish verification remains green: `pnpm
  test` (28 files, 160 tests), `pnpm test:e2e` (27 tests), `pnpm typecheck`, and
  `pnpm lint` (with the existing warnings in `.codex-verify/verify-event-timeline.mjs`
  and `components/layout/workspace-shell.tsx`).

## Next

- UX Polish is complete. Choose a new implementation-plan/checklist stream for
  subsequent work; do not reopen this checklist for the documented scope
  boundaries alone.

## Collision Matrix maintenance follow-up

- Fixed the focused editor's target control so it tracks the semantic Playing or
  Incoming side and never highlights both options for a diagonal same-event cell.
- Replaced the dynamically growing audition ruler with a fixed 30-second,
  horizontally scrollable canvas. Offset fields stay pinned on the left; pointer,
  keyboard, and exact-input timing remain editor-local and capped so the preview
  block fits inside the horizon.
- Added a ruler/lane playhead, made Tap toggle to Stop, removed the separate Stop
  action, and removed the live millisecond status text that shifted the layout.
- Added ADR 0063 and refreshed the focused 1440px/375px snapshots and tests.

### Follow-up verification

- `pnpm typecheck` passed.
- `pnpm lint` passed with the two existing unrelated warnings.
- `pnpm test` passed (28 files, 161 tests).
- Focused Chromium Matrix coverage passed for rule configuration, responsive
  snapshots, scroll/drag offsets, preview lifecycle/playhead, and reduced motion
  (5 tests). After removing the progress text, the focused lifecycle test passed.

### Recommended next group

- Start a new implementation-plan/checklist stream for the next requested product
  change; no unchecked group remains in the main implementation checklist.
