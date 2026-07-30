# Projects Explorer Polish

## Changed

- Removed unused `/projects` list/tile toggle icon buttons until the explorer has real alternate views.
- Made create folder/project actions contextual to the selected folder rules instead of showing disabled toolbar controls at the root.
- Kept desktop `/projects` on the primitive 40px table row pattern and added truncation for long names.
- Added a mobile-only compact row layout that preserves name, type, contents, created date, members, and row actions without clipped table columns.
- Recaptured `projects-desktop.png` and `projects-mobile.png`.
- Marked Visual Audit Checklist group 2 complete and checked the Phase 10.2 `/projects` match item.

## Verification

- `pnpm typecheck` passed.
- `pnpm lint` passed.
- `pnpm test:e2e --grep "browses seeded project folders|creates a project in an empty leaf folder"` passed.
- Playwright screenshot recapture passed against the existing `http://localhost:3000` dev server.

## Notes

- Existing uncommitted `.gitignore` and `playwright.config.ts` edits still predate this chunk and were left out of the commit.
- No ADR was added because this was visual/demo polish, not a new architecture, persistence, domain, or UX policy decision.

## Recommended Next Group

Continue with `docs/plan/VISUAL_AUDIT_CHECKLIST.md` group 3: Event List And Timeline Polish.

---

# Event List And Timeline Polish

## Changed

- Added a reusable `Timeline` primitive with a ruler, interaction lanes, and offset-positioned audio/haptic blocks.
- Replaced the project event timeline list with lane rendering so `0s` and `0.30s` playbacks read as distinct temporal positions.
- Strengthened selected event state in the desktop table and added a mobile event row pattern to avoid clipped table columns.
- Kept disabled interactions and disabled-device playbacks visible with secondary grayscale treatment.
- Recaptured `project-events-desktop.png` and `project-events-mobile.png`.
- Marked Visual Audit Checklist group 3 complete and checked the main Phase 10.2 event list/timeline items.

## Verification

- `pnpm typecheck` passed.
- `pnpm lint` passed.
- `pnpm test:e2e --grep "creates an event with an interaction playback"` passed.
- Playwright screenshot recapture passed against the existing `http://localhost:3000` dev server.

## Notes

- Existing uncommitted `.gitignore` and `playwright.config.ts` edits still predate this chunk and were left out of the commit.
- No ADR was added because this chunk follows the existing primitive visual-system decision.

## Recommended Next Group

Continue with `docs/plan/VISUAL_AUDIT_CHECKLIST.md` group 4: Asset Library Polish.
