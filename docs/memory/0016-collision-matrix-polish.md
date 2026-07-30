# Collision Matrix Polish

## Changed

- Reworked the project Matrix tab grid with explicit `Incoming` and `Playing` rails, a single intentional horizontal scroll surface, sticky playing-row context, and compact 119px cells.
- Standardized matrix cell behavior pills with lucide glyphs, stable grayscale treatments, `N/A` display for `Not possible`, and accessible per-cell labels that include the playing/incoming event pair.
- Added selected playing/incoming summary blocks to the resolution editor so the saved rule is visually tied to the active cell.
- Recaptured `project-matrix-desktop.png` and `project-matrix-mobile.png`.
- Marked Visual Audit Checklist group 5 complete and checked the main Phase 10.2 matrix match item.

## Verification

- `pnpm typecheck` passed.
- `pnpm lint` passed.
- `pnpm test:e2e --grep "configures a collision matrix entry"` passed.
- Playwright screenshot recapture passed against the existing `http://localhost:3000` dev server.

## Notes

- Existing uncommitted `.gitignore` and `playwright.config.ts` edits still predate this chunk and should remain outside this commit.
- No ADR was added because this was screenshot-driven UI polish within the existing responsive shell and visual-system decisions.

## Recommended Next Group

Continue with `docs/plan/VISUAL_AUDIT_CHECKLIST.md` group 6: Share Preview Polish.

---

# Share Preview Polish

## Changed

- Added compact share preview headers with target kind chips and source context for project, event, and matrix targets.
- Reused the shared `Timeline` primitive for event share previews, preserving disabled interaction/device copy in stable lane metadata.
- Reworked matrix-entry share previews into a two-event overlap summary with behavior copy and target explanation.
- Recaptured `share-project-checkout-desktop.png`, `share-event-pay-now-desktop.png`, and `share-matrix-pay-now-card-declined-desktop`.
- Marked Visual Audit Checklist group 6 complete.

## Verification

- `pnpm typecheck` passed.
- `pnpm lint` passed.
- `pnpm test:e2e --grep "generates and opens share links"` passed.
- Playwright screenshot recapture passed against the existing `http://localhost:3000` dev server.

## Notes

- Existing uncommitted `.gitignore` and `playwright.config.ts` edits still predate this chunk and should remain outside this commit.
- No ADR was added because this was screenshot-driven UI polish within the existing share-preview aggregate and primitive visual-system decisions.

## Recommended Next Group

Continue with `docs/plan/VISUAL_AUDIT_CHECKLIST.md` group 7: Phase 10.2 Closure.
