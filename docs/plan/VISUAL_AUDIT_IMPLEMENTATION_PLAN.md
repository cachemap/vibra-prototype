# Visual Audit Implementation Plan

Source checklist: `docs/plan/IMPLEMENTATION_CHECKLIST.md` Phase 10.2  
Reference screenshots: `design-screenshots/`  
Audit captures: `docs/plan/visual-audit-captures/`

## Capture Set

Captured against the live app at `http://localhost:3000` with Playwright screenshots after the OpenClaw browser tool was blocked by policy.

- `/projects`: desktop and mobile.
- `/projects/project_checkout-system`: Events, Assets, and Matrix tabs on desktop and mobile.
- `/libraries`: list and tile views on desktop and mobile.
- `/share/project-checkout`, `/share/event-pay-now`, `/share/matrix-pay-now-card-declined`: desktop.

## Findings

### Global Shell And Navigation

The shell is stable and quiet, but the top bar currently contributes only a menu icon. On project screens, the breadcrumb, share button, truncated project title, tab row, search, systems, collections, and content all repeat hierarchy in a way that makes the screen feel assembled rather than designed. Mobile keeps the desktop sidebar inline above the workspace, so the project screen becomes a long stack before the user reaches the selected event or matrix.

Fix direction:

- Keep the 64px top bar, but give it useful context: product/workspace affordance, compact current location, and view-level actions where they belong.
- Collapse the project left rail into a mobile drawer or compact switcher below tablet width.
- Avoid repeated project naming across breadcrumb, sidebar title, and content header; keep one strong project title and one compact path.
- Make status/readout areas reserve stable height so reset, save, and playback feedback does not shift surrounding controls.

Acceptance:

- On mobile, project Events content begins within the first viewport after the header and one compact selector.
- On desktop, project and library screens have one clear title hierarchy and no duplicate primary label.
- Header controls shown on each view are actionable for that view.

### Projects Explorer

The desktop `/projects` view has the right table-first shape but is too loose vertically and has unused view toggle controls. The disabled `New folder` and `New` buttons appear before the user has selected a folder, which reads like broken tooling. Mobile renders a desktop table into a 390px viewport: names wrap into tall cells, the Members column clips, and the table requires horizontal information that is not made available through a deliberate mobile pattern.

Fix direction:

- Match `project-folder-explorer.png` with denser top controls, a stronger table rail, and only relevant actions for the current folder.
- Replace mobile table rendering with compact row cards or a two-line list primitive that preserves Name, Type, Contents, and Created without clipped columns.
- Hide table view toggles until list/tile behavior exists for this screen.
- Move unavailable create actions into contextual disabled affordances or explanatory empty states.

Acceptance:

- Desktop row height stays near the 40px design token.
- Mobile rows do not wrap a folder name into more than two lines and no columns clip.
- Invalid create actions are not prominent in the top toolbar.

### Project Events And Timeline

The event workspace has the strongest demo value but the layout uses a dense sidebar plus table plus details panel in ways that crowd desktop and overrun mobile. The event table and details panel are visually similar, making selection and ownership less clear. The timeline preview is correct but reads as another table/list; it does not yet communicate distinct waveform lanes or temporal offsets like `event-playback-timeline.png`.

Fix direction:

- Make event rows the primary selection surface with persistent selected state and clearer event type/interactions/playback counts.
- Convert the details panel into a canonical right preview/editor panel on desktop and a section below the event list on mobile.
- Replace timeline rows with stable lanes using a time ruler and offset-positioned audio/haptic blocks.
- Keep disabled interactions visible but visually secondary, with no purple used as governance state.

Acceptance:

- Timeline playbacks at `0s` and `0.30s` visibly occupy different horizontal positions.
- The selected event is obvious in the event list and details panel.
- Mobile event details avoid overlapping floating controls and all action buttons fit.

### Asset Libraries

The `/libraries` route is close to the reference shape, especially the left library selector. The project asset panel is more cramped and repeats imported/default labels in several places. Tile view uses large centered folder icons with a lot of white space, so it feels less like an asset management surface and more like a placeholder. Folder navigation is visible, but deeper folder context should be stronger when users enter an asset folder.

Fix direction:

- Reuse the stronger `/libraries` selector pattern inside the project Assets tab.
- Add folder breadcrumbs and current folder metadata near the content table/tile area.
- Tighten tile view dimensions and show useful metadata on each tile: kind, source, last modified, and preview state.
- Make upload/import buttons view-aware and avoid disabled primary-looking controls.

Acceptance:

- In list and tile views, users can tell which library and folder they are in without reading repeated headings.
- Tiles have stable dimensions and do not leave large empty vertical gaps.
- Imported/default indicators are visible once per library item, not repeated across the content header.

### Collision Matrix

The matrix desktop view has the right data and core grid but needs to move closer to `collision-matrix.png`: axis labels should read as rails, matrix cells should be more compact, and behavior labels need stronger icon-label treatment. On mobile, the grid clips horizontally without an explicit scroller or pinned context, and the candidate lists consume a full viewport before the actual grid. The resolution editor is useful but not visually tied to the selected cell.

Fix direction:

- Make the matrix grid a horizontally scrollable governance surface with explicit axis rails and sticky row labels.
- Compact cells toward the 96-119px width token and use consistent behavior glyphs.
- Put candidate row/column controls into compact side panels or collapsible selectors on mobile.
- Attach the bottom resolution panel to the selected cell with selected row/column summary.

Acceptance:

- The `Playing` and `Incoming` axes remain visible while scanning the grid.
- Mobile matrix has an intentional horizontal scroll region and does not clip silently.
- Selected cell state is visible in the grid and summarized in the editor.

### Share Preview

Share pages are useful but plain. They should feel like mobile-preview artifacts, not just records. Event share preview needs a stronger playback lane display, and project/matrix previews need concise target summaries with the same canonical terms as the workspace.

Fix direction:

- Use a compact preview header with target kind, source device/project, and copy/open actions.
- Reuse the timeline lane primitive from event workspace on event share pages.
- Give matrix share pages a small two-event collision summary with the selected behavior and target.
- Keep the disabled-device/interaction note as a stable footer/help row.

Acceptance:

- A stakeholder can identify the target kind and source context in the first viewport.
- Event share preview visually matches the workspace timeline.
- Matrix share preview clearly names playing, incoming, behavior, and target.

## Implementation Order

1. Responsive workspace shell and project rail behavior.
2. `/projects` explorer polish and mobile row pattern.
3. Event list/details polish and reusable timeline lane primitive.
4. Asset library selector/content polish for `/libraries` and project Assets.
5. Collision matrix grid/axis/mobile scroll polish.
6. Share preview polish using the same timeline and matrix summary patterns.
7. Final responsive pass across desktop, tablet, and mobile with focused screenshot recapture.

## Verification Plan

- Run `pnpm typecheck` and `pnpm lint` after each implementation chunk.
- Run targeted Playwright smoke tests for the screen being changed.
- Recapture the relevant screenshots into `docs/plan/visual-audit-captures/` after each polish chunk.
- Before closing Phase 10.2, verify desktop, tablet, and mobile viewports for button overflow, table overlap, dialog sizing, and layout shifts.
