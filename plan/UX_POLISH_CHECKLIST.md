# Vibra UX Polish Checklist

Use this checklist with `UX_POLISH_IMPLEMENTATION_PLAN.md`. Keep commits phase-scoped so the database migration, theme system, and visual polish can be reviewed independently.

## 0. Baseline [x]

- [x] Review `git status` and preserve all pre-existing unstaged work.
- [x] Capture desktop and mobile screenshots of Projects, Libraries, Project Events, Event Detail, and Collision Matrix.
- [x] Capture the current selected-cell resolution panel and audio-preview behavior for comparison.
- [x] Run `pnpm typecheck`.
- [x] Run `pnpm lint`.
- [x] Run `pnpm test`.
- [x] Run the existing focused project E2E suite.

## 1. Shared geometry and wider sidebars [x]

- [x] Add `--shell-header-height`, `--workspace-sidebar-width: 320px`, `--page-gutter-x`, and `--page-gutter-y` to `app/globals.css`.
- [x] Replace `calc(100vh-64px)` uses in app shells with the header-height token where practical.
- [x] Update `features/project-workspace/workspace-layout.tsx` to use the shared sidebar width.
- [x] Update `app/libraries/page.tsx` to use the same shared sidebar width.
- [x] Confirm both top-level sidebars remain responsive below `md`.
- [x] Decide from screenshots whether the nested project asset rail needs its own width token; do not reuse the top-level token blindly.
- [x] Make `PageHeader` the single owner of full-page horizontal and vertical padding.
- [x] Remove redundant padding wrappers from `workspace-header.tsx`.
- [x] Remove redundant padding wrappers from `library-toolbar.tsx`.
- [x] Update Projects header/body composition so the header aligns with the other pages.
- [x] Update Event Detail loading, empty, and loaded headers to use identical geometry.
- [x] Update `PageStateScaffold` to follow the canonical header geometry.
- [x] Standardize main content gutters, including removal of the Libraries-only `md:px-6`.
- [x] Verify breadcrumb row, title row, and action row coordinates across navigation.
- [x] Update the layout constants in `docs/plan/DESIGN_SYSTEM.md`.
- [x] Add or update an ADR for the shared header/layout ownership decision if needed.

## 2. Theme foundation [x]

- [x] Add `next-themes`.
- [x] Convert Tailwind `gray-*` and `purple-*` values to alpha-capable CSS-variable colors.
- [x] Define the complete light palette in `:root`.
- [x] Define the complete dark palette in `[data-theme="dark"]`.
- [x] Set the corresponding native `color-scheme`.
- [x] Preserve sufficient contrast for primary buttons, body text, muted text, dividers, controls, and focus rings.
- [x] Wrap the app with `ThemeProvider` in `app/providers.tsx`.
- [x] Configure `attribute="data-theme"`, `defaultTheme="system"`, `enableSystem`, and transition suppression.
- [x] Add `suppressHydrationWarning` to the root `<html>`.
- [x] Create an accessible Light/System/Dark segmented toggle.
- [x] Give each option an accessible label and pressed state.
- [x] Prevent a hydration mismatch and toolbar layout shift before mount.
- [x] Audit hard-coded white, black, hex, RGB, and shadow values under `app/`, `components/`, and `features/`.
- [x] Replace mode-sensitive raw shadow/divider colors with theme variables.
- [x] Verify native inputs, menus, dialogs, scrollbars, and audio controls in both themes.
- [x] Verify system-mode changes apply without reload.
- [x] Verify an explicit Light or Dark choice ignores later system changes.
- [x] Verify the preference survives reload.

## 3. Global toolbar [x]

- [x] Read the active route with `usePathname()` in `WorkspaceShell`.
- [x] Mark all `/projects...` routes as Projects.
- [x] Mark `/libraries` as Libraries.
- [x] Add a persistent selected style to the active link.
- [x] Add `aria-current="page"` only to the active link.
- [x] Keep selected, hover, and focus-visible treatments distinguishable.
- [x] Group the logo and Reset demo on the left.
- [x] Place Reset demo immediately after the logo.
- [x] Keep Projects, Libraries, and the theme toggle on the right.
- [x] Preserve Reset demo’s accessible name when its visible text collapses.
- [x] Verify the toolbar at 375px without horizontal overflow.
- [x] Verify Reset still invalidates queries and routes to `/projects`.
- [x] Verify Reset does not overwrite the theme preference.

## 4. Collection viewer actions [x]

- [x] Remove the collection-level `RowActionsMenu` from `events-tab.tsx`.
- [x] Remove the unused `MoreVertical` import.
- [x] Add a visible secondary Delete button with a `Trash2` icon.
- [x] Disable Delete when no collection is selected.
- [x] Route Delete through the existing collection confirmation callback.
- [x] Keep Rename, Delete, Collection, and Add event readable when wrapping.
- [x] Update E2E selectors that previously opened the collection action menu.
- [x] Verify the cascade confirmation copy and cancellation behavior are unchanged.

# SIDE QUEST
- [x] Fix playback on the Assets tab for uploaded sounds.

## 5. Persistent event order [x]

### Domain and schema [x]

- [x] Add `sortOrder: number` to `Event`.
- [x] Add a non-negative integer validator to `eventSchema`.
- [x] Add a reorder command/input type with `collectionId` and `orderedEventIds`.
- [x] Update every Event fixture/factory to include `sortOrder`.
- [x] Give seed events unique contiguous positions within each collection.

### IndexedDB [x]

- [x] Increment `VIBRA_DATABASE_VERSION` to `3`.
- [x] Add `[collectionId+sortOrder]` to the events store indexes.
- [x] Add a v3 upgrade that groups legacy events by collection.
- [x] Sort legacy siblings by name and then ID.
- [x] Write contiguous positions beginning at `0`.
- [x] Normalize legacy collision-resolution objects in the same upgrade transaction.
- [x] Add a migration test starting from a version-2 database.
- [x] Verify v1/v2 databases still open successfully through all upgrades.
- [x] Verify a fresh database uses the v3 schema.

### Repository [x]

- [x] Sort loaded collection events by `sortOrder`, with stable tie-breakers.
- [x] Append newly created events after the current maximum order.
- [x] Implement `reorderCollectionEvents`.
- [x] Validate that ordered IDs are unique.
- [x] Validate that ordered IDs exactly match the collection’s current events.
- [x] Reject cross-collection and unknown IDs with a typed error.
- [x] Persist all changed positions in one Dexie transaction.
- [x] Normalize positions to contiguous integers.
- [x] Add repository tests for successful reorder and reload.
- [x] Add repository tests for duplicates, omissions, unknown IDs, and cross-collection IDs.
- [x] Verify event delete and reset behavior with ordered events.
- [x] Check Matrix filters and event lookups for accidental name sorting.

### Query layer [x]

- [x] Add and export `useReorderCollectionEventsMutation`.
- [x] Optimistically reorder the affected device-workspace cache.
- [x] Snapshot and roll back the cache on error.
- [x] Invalidate the device workspace after settle/success.
- [x] Invalidate any project/matrix aggregates that expose event order.
- [x] Surface persistence errors through the existing feedback context.

## 6. Drag-and-drop rows [x]

- [x] Add `@dnd-kit/core`.
- [x] Add `@dnd-kit/sortable`.
- [x] Add `@dnd-kit/utilities`.
- [x] Add a drag-handle header column to `EventsTable`.
- [x] Add a `GripVertical` button at the left edge of every event row.
- [x] Give each handle an event-specific accessible label.
- [x] Restrict drag listeners to the handle.
- [x] Add pointer/touch activation distance to prevent accidental drags.
- [x] Add a keyboard sensor with sortable keyboard coordinates.
- [x] Use vertical-list sorting.
- [x] Apply transform-only row movement.
- [x] Add a lifted/dragging visual state that works in both themes.
- [x] Remove transform motion under reduced-motion preference.
- [x] Ignore cancelled and same-position drops.
- [x] Call the reorder mutation only once per completed reorder.
- [x] Disable or serialize overlapping reorder writes.
- [x] Verify Open, Delete, and row links remain independently clickable.
- [x] Verify mobile cards display the persisted order.
- [x] If mobile reordering is included, use a separate sortable context and left-edge handles.
- [x] Add component/E2E coverage for pointer reorder.
- [x] Add component/E2E coverage for keyboard reorder.
- [x] Reload after a reorder and confirm persistence.

## 7. Collision Matrix hover UX [x]

- [x] Add `group`/relative positioning to interactive data cells as needed.
- [x] Add a 120–160ms motion-safe transform and shadow/ring transition.
- [x] Add a subtle hover lift and scale without changing cell dimensions.
- [x] Add a small hover response to configured behavior pills.
- [x] Keep selected styling stronger than hover styling.
- [x] Preserve row/column cross-highlighting during hover.
- [x] Keep empty-cell and configured-cell accessible names unchanged.
- [x] Add a no-transform reduced-motion path with visible color/ring feedback.
- [x] Verify sticky headers and borders do not clip hovering cells.
- [x] Verify the effect in Light, System-light, System-dark, and Dark.
- [x] Verify touch interaction does not leave a misleading stuck hover state.

## 8. Resolution behavior editor and collision preview

### Focused editor layout [x]

- [x] Make selecting a matrix cell open a focused resolution editor within the Matrix tab.
- [x] Add `Back to Matrix` and restore the prior matrix selection/scroll context on return.
- [x] Split `matrix-resolution-panel.tsx` into editor, adaptive fields, playback preview, and timeline responsibilities.
- [x] Put the prominent primary `Tap` button at the top of the preview stage.
- [x] Keep `Tap` as the persistent visible label while exposing a more descriptive accessible name.
- [x] Show Playing event × Incoming event identity between the Tap stage and timeline.
- [x] Render a shared-ruler two-lane timeline for Playing and Incoming.
- [x] Put rule controls and Clear/Save actions below the preview.
- [x] Match the desktop reference hierarchy without copying irrelevant device-preview chrome.
- [x] Match the narrow reference with full-width stacked controls and readable section spacing.
- [x] Keep the timeline horizontally scrollable at narrow widths instead of crushing labels/blocks.
- [x] Keep all touch targets at least 44px and avoid horizontal page overflow at 375px.
- [x] Verify Back, Clear, Save, Tap, and Stop have distinct accessible names and focus states.

### Adaptive rule data and controls [x]

- [x] Add an `InterruptionRecovery` vocabulary with `Resume` and `Stay stopped`.
- [x] Add nullable post-interruption and system-interruption recovery fields to `ResolutionBehavior`.
- [x] Create one behavior-definition map for applicable fields, defaults, labels, help copy, and validation.
- [x] Require a target for Preempt, Queue, and Suppress.
- [x] Clear/forbid the target for Co-play and Not possible.
- [x] Require post-interruption recovery only for Preempt.
- [x] Require system-interruption recovery for every previewable behavior.
- [x] Clear/forbid all recovery values for Not possible.
- [x] Render Target as a Playing/Incoming segmented control only when applicable.
- [x] Render Post interruption as a Resume/Stay stopped segmented control only when applicable.
- [x] Render System interruption as a Resume/Stay stopped segmented control only when applicable.
- [x] Add accessible help buttons and programmatic descriptions for unfamiliar terms.
- [x] Clear stale draft values immediately when switching to a behavior where a field is inapplicable.
- [x] Keep Save disabled until the visible behavior-specific draft is valid.
- [x] Update seed rules and every resolution fixture/factory.
- [x] Update repository command/input types and `canUseResolutionBehavior`.
- [x] Update matrix cell/share-preview copy to describe target and recovery semantics accurately.
- [x] Normalize legacy resolution objects during the coordinated IndexedDB migration.
- [x] Default legacy Preempt to Playing + Stay stopped.
- [x] Default legacy Queue to Incoming.
- [x] Preserve a valid legacy Suppress target and repair malformed missing targets to Incoming.
- [x] Default applicable system recovery to Stay stopped.
- [x] If database version 3 has already shipped, create a new migration version instead of mutating it.

### Sound selection and audition timing [x]

- [x] Locate the selected event aggregates and their enabled playback rows from `DeviceWorkspaceAggregate`.
- [x] Derive previewable audio independently for Playing and Incoming.
- [x] Default each lane to its earliest enabled audio playback.
- [x] Add a lane-level sound selector when an event has more than one previewable audio choice.
- [x] Keep event names primary and asset names secondary in each lane.
- [x] Explain and disable Tap when either side has no enabled previewable audio.
- [x] Treat haptic-only assets as visible but not audio-previewable.
- [x] Store sound selection and collision offsets only in editor-local audition state.
- [x] Default Playing to `0ms` and Incoming to a visibly separated offset such as `150ms`.
- [x] Allow each sound block to move horizontally with a handle.
- [x] Use a separate horizontal DnD context from sortable event rows.
- [x] Add keyboard arrow movement for each focused sound block/handle.
- [x] Add an exact millisecond input/nudge fallback.
- [x] Snap pointer/keyboard movement to 10ms and clamp offsets to non-negative values.
- [x] Extend the ruler when needed rather than placing a block outside the preview canvas.
- [x] Add a Reset timing action that does not change the matrix rule.
- [x] Confirm moving preview blocks never mutates `TriggerPlayback.startOffset`.
- [x] Confirm saving a rule does not persist selected sounds or audition offsets.

### Playback engine and behavior [x]

- [x] Extract a collision-preview scheduling boundary from the existing audio-preview provider.
- [x] Lazily create one shared `AudioContext` after a user gesture.
- [x] Fetch/decode and cache audio buffers by playback URL for the provider lifetime.
- [x] Schedule both sources against the same audio clock.
- [x] Implement Co-play using the authored preview offsets.
- [x] Implement Suppress by omitting the selected target.
- [x] Implement Queue by starting the queued target after the other buffer completes.
- [x] Implement Preempt by stopping the target at the collision point.
- [x] Implement Preempt + Resume by creating a new source at the interrupted buffer position.
- [x] Disable preview for Not possible and explain why.
- [x] Make Tap start or restart from time zero without autoplay or implicit save.
- [x] Add a synchronized playhead.
- [x] Add a compact Stop control for long playback while keeping Tap visibly labeled.
- [x] Route collision preview through the provider so only one app preview is active at a time.
- [x] Stop and clean up preview on restart, Stop, Back, pair change, unmount, reset, and asset deletion.
- [x] Cancel all source nodes, animation frames, decoded-buffer work, and stale state updates.
- [x] Surface fetch, decode, unsupported file, and autoplay errors without shifting the editor layout.
- [x] Honor disabled devices and disabled event triggers.
- [x] Verify uploaded blob URLs remain valid for playback and are not leaked or persisted.
- [x] Verify Tap and timeline motion respect reduced-motion settings.

## 9. Automated verification [~]

- [x] Add active-route helper/component tests.
- [x] Add theme-toggle accessibility/state tests.
- [x] Add event schema and migration tests.
- [x] Add repository reorder tests.
- [x] Add resolution behavior-definition and validation tests for every behavior.
- [x] Add legacy resolution migration tests.
- [x] Add preview-source and offset derivation tests.
- [x] Add collision scheduler tests for Preempt, Resume, Queue, Co-play, Suppress, cancellation, and errors.
- [x] Add responsive resolution-editor component coverage.
- [x] Add Tap disabled/enabled, restart, Stop, and cleanup coverage.
- [x] Add pointer and keyboard collision-timeline alignment coverage.
- [x] Add collection direct-delete-button coverage.
- [ ] Add drag pointer and keyboard E2E coverage.
- [ ] Add theme persistence and system-change E2E coverage.
- [ ] Add coordinate-alignment assertions for page headers.
- [ ] Add sidebar width assertions at desktop.
- [ ] Add reduced-motion Matrix coverage.
- [ ] Add wide and 375px visual snapshots for the focused resolution editor.
- [ ] Add E2E coverage proving audition offsets do not mutate event playback offsets.
- [ ] Add E2E coverage proving Back to Matrix stops active collision audio.
- [ ] Run `pnpm typecheck`.
- [ ] Run `pnpm lint`.
- [ ] Run `pnpm test`.
- [ ] Run `pnpm test:e2e`.

## 10. Manual acceptance

- [ ] Projects → Libraries navigation does not move the breadcrumb/title baseline.
- [ ] Project list → Project Workspace navigation does not move the header gutter.
- [ ] Project Events → Event Detail navigation does not move the header gutter.
- [ ] Both main sidebars visibly fit more text and remain usable at 768px.
- [ ] Global toolbar fits at 375px.
- [ ] Active section is obvious without relying only on color.
- [ ] Theme toggle is keyboard accessible and has an obvious selected state.
- [ ] No light flash occurs on a dark-mode reload.
- [ ] Dialogs, tables, cards, menus, focus rings, and empty states remain legible in dark mode.
- [ ] Dragging is smooth and does not select text or trigger row actions.
- [ ] Keyboard users can reorder events from the handle.
- [ ] Reordered events remain ordered after navigation, reload, and a new query.
- [ ] Reset demo restores the canonical event order.
- [ ] Matrix hover feels responsive but restrained.
- [ ] Matrix hover animation disappears under reduced-motion preference.
- [ ] Selecting a matrix cell enters a focused editor that clearly resembles the supplied desktop reference.
- [ ] At 375px, the editor follows the supplied stacked mobile form without clipped labels or controls.
- [ ] Target and recovery controls appear only when meaningful for the selected behavior.
- [ ] The Playing and Incoming sounds are easy to identify and align on one ruler.
- [ ] Pointer and keyboard users can set precise relative sound starts.
- [ ] `Tap` is prominent at the top, always visibly labeled, and starts/restarts the current audition.
- [ ] Preempt, Queue, Co-play, and Suppress sound distinct and match their written semantics.
- [ ] Not possible and missing-audio pairs explain why Tap is disabled.
- [ ] Back, Stop, navigation, and reset never leave audio playing.
- [ ] Auditioning an unsaved draft never saves it or changes either event's authored playback schedule.
- [ ] Resolution controls, timeline blocks, playhead, errors, and help remain legible in both themes.
- [ ] No unrelated existing working-tree changes were lost.

## Completion

- [ ] Update screenshots and compare with the baseline set.
- [ ] Update documentation/ADR references.
- [ ] Confirm all Definition of Done items in the implementation plan.
- [ ] Record any intentionally deferred mobile reordering, nested-sidebar, or haptic-preview work.
