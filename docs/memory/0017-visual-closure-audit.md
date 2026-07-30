# Visual Closure Audit

## Changed

- Completed Visual Audit Checklist group 7: Phase 10.2 Closure.
- Updated the main implementation checklist viewport/layout closure items for desktop, tablet, mobile, button text, table overlap, dialog fit, and hover/focus/loading layout stability.

## Verification

- Custom Playwright audit passed against the existing `http://localhost:3000` dev server.
- The audit reset seeded demo data, loaded `/projects`, project Events/Assets/Matrix tabs, `/libraries` list/tile views, and seeded project/event/matrix share previews at 1600x1000, 900x900, and 390x844.
- The audit opened representative project, library, and share dialogs and checked for horizontal page overflow, clipped button text, dialog overflow, and console errors.

## Notes

- Existing uncommitted `.gitignore` and `playwright.config.ts` edits still predate this chunk and should remain outside this commit.
- No ADR was added because this was verification/checklist closure, not a new architectural or UX decision.

## Recommended Next Group

Continue with the remaining Phase 10.2 visual items in `docs/plan/IMPLEMENTATION_CHECKLIST.md`: empty project workspace matching and overlay/picker screenshot matching, or move to Phase 10.3 demo reliability if those are accepted as good enough.

## Follow-up Chunk

Changed:

- Matched the empty project workspace closer to `empty-project-viewer.png` by replacing the generic no-device state with an empty event table shape, centered "Select a system to begin" CTA, disabled Add event affordance, and empty sidebar system/collection messaging.
- Extended the create-project Playwright smoke path to open the newly created project and assert the empty workspace headers plus Add system action.
- Marked the main implementation checklist item "Match empty project workspace to `empty-project-viewer.png`" complete.

Verification:

- `pnpm typecheck` passed.
- `pnpm lint` passed.
- `pnpm test:e2e -- tests/e2e/projects.spec.ts -g "creates a project in an empty leaf folder"` passed. The current npm script/config still ran all eight tests in `tests/e2e/projects.spec.ts`; all passed.

Notes:

- Existing uncommitted `.gitignore` and `playwright.config.ts` edits still predate this chunk and were not changed.
- No ADR was added because this chunk implemented an existing visual-audit target without a new architecture or domain decision.

Recommended next group:

- Finish the remaining Phase 10.2 item: match dialogs/popovers/pickers to the overlay screenshots.

## Overlay Dialog Follow-up

Changed:

- Added a shared `DialogOverlay` primitive and exported it from `components/primitives`.
- Moved `/projects`, `/libraries`, and project workspace dialogs onto the shared overlay treatment.
- Removed fixed positioning from individual project workspace dialog surfaces while preserving right-aligned workflow placement.
- Marked "Match dialogs/popovers/pickers to overlay screenshots" complete in the main implementation checklist.

Verification:

- `pnpm typecheck` passed.
- `pnpm lint` passed.
- `pnpm test:e2e -- tests/e2e/projects.spec.ts` passed: 8 tests.

Notes:

- Existing uncommitted `.gitignore` and `playwright.config.ts` edits still predate this chunk and were not changed.
- Added ADR `0029-overlay-dialog-boundary.md` because this establishes the reusable overlay boundary.

Recommended next group:

- Move to Phase 10.3 Demo Reliability: add the visible demo reset/reseed control coverage and stakeholder demo script.
