# Visual Audit Checklist

Source plan: `docs/plan/VISUAL_AUDIT_IMPLEMENTATION_PLAN.md`

## Status Legend

- `[ ]` Not started
- `[~]` In progress
- `[x]` Complete
- `[!]` Blocked

## 1. Responsive Workspace Shell

- [x] Give the top bar useful workspace context without adding duplicate titles.
- [x] Move view-level actions out of the global header when they belong to a panel.
- [x] Collapse the project left rail into a mobile drawer or compact selector below tablet width.
- [x] Keep project Events content visible within the first mobile viewport after one compact selector.
- [x] Reserve stable space for feedback/status messages.
- [x] Recapture project Events desktop and mobile screenshots.

## 2. Projects Explorer Polish

- [x] Remove or hide unused list/tile toggles until both views exist.
- [x] Make create folder/project actions contextual to selected folder state.
- [x] Match desktop row density to the 40px table row token.
- [x] Replace mobile table columns with a compact responsive row pattern.
- [x] Prevent mobile folder names, member pills, and dates from clipping or overlapping.
- [x] Recapture `/projects` desktop and mobile screenshots.

## 3. Event List And Timeline Polish

- [x] Strengthen persistent selected-event state in the event list.
- [x] Clarify the relationship between event rows and the event details/editor panel.
- [x] Build a reusable timeline lane primitive with ruler, lanes, and offset-positioned playback blocks.
- [x] Render audio and haptic playbacks as distinct grayscale lane blocks.
- [x] Keep disabled interactions visible but visually secondary.
- [x] Recapture project Events desktop and mobile screenshots.

## 4. Asset Library Polish

- [x] Reuse the stronger `/libraries` selector pattern in the project Assets tab.
- [x] Add clearer current-library/current-folder breadcrumbs near content.
- [x] Tighten tile dimensions and add kind/source/preview metadata.
- [x] Reduce repeated default/imported labels across list, content header, and rows.
- [x] Make upload/import buttons active only when the current folder/library allows them.
- [x] Recapture project Assets and `/libraries` list/tile screenshots.

## 5. Collision Matrix Polish

- [x] Make matrix axes read as rails with visible `Playing` and `Incoming` labels.
- [x] Add intentional horizontal scrolling and sticky row context for narrow viewports.
- [x] Compact matrix cells toward the documented cell-size tokens.
- [x] Standardize behavior glyph plus label treatments for all behavior names.
- [x] Summarize selected playing/incoming events in the resolution editor.
- [x] Recapture project Matrix desktop and mobile screenshots.

## 6. Share Preview Polish

- [x] Add a compact preview header with target kind and source context.
- [x] Reuse the timeline lane primitive in event share previews.
- [x] Add a concise two-event matrix summary for matrix-entry share previews.
- [x] Keep disabled device/interaction explanation as a stable footer/help row.
- [x] Recapture project, event, and matrix share preview screenshots.

## 7. Phase 10.2 Closure

- [x] Check desktop viewport.
- [x] Check tablet viewport.
- [x] Check mobile viewport.
- [x] Confirm button text does not overflow.
- [x] Confirm table text does not overlap.
- [x] Confirm dialogs fit their content.
- [x] Confirm hover/focus/loading states do not shift layout.
- [x] Update `docs/plan/IMPLEMENTATION_CHECKLIST.md` Phase 10.2 completion state.
