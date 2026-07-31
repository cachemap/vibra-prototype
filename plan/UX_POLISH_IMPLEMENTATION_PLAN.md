# Vibra UX Polish Implementation Plan

## Objective

Implement the requested navigation, layout, theme, matrix, and collection-viewer improvements as one coherent UI pass:

1. Widen the project and library sidebars.
2. Give Projects, Libraries, Project Workspace, and Event Detail the same header geometry.
3. Add responsive, reduced-motion-safe hover feedback to Collision Matrix cells.
4. Replace the collection overflow menu with a visible delete button.
5. Persist and expose drag-and-drop ordering for events in a collection.
6. Clearly mark Projects or Libraries as active in the global toolbar.
7. Add Light, System, and Dark theme controls without requiring per-component dark-mode classes.
8. Move Reset demo beside the Vibra logo.
9. Redesign collision-resolution authoring as an adaptive, focused editor with a two-sound timing and playback preview launched by a prominent `Tap` button.

The work should preserve existing behavior, accessibility, responsive layouts, query invalidation, and IndexedDB demo reset semantics.

## Current-State Findings

| Concern | Current implementation | Consequence |
|---|---|---|
| Main rails | Both `WorkspaceLayout` and the Libraries page use `268px` desktop columns | Longer device, collection, and library names truncate early |
| Page header placement | Project, workspace, and library headers wrap `PageHeader` in `px-4 py-5`; Event Detail uses the primitive defaults (`px-4 py-3`) | Breadcrumbs, actions, title, and content shift vertically between routes |
| Content gutters | Workspace uses `px-4`; Libraries changes to `md:px-6` | First content/tool rows do not share a stable left edge |
| Global navigation | `WorkspaceShell` renders identical neutral links and Reset demo on the right | Active section is not visible; Reset is separated from the logo |
| Theme | Tailwind gray and purple values are hard-coded hex colors | A conventional dark mode would require hundreds of scattered `dark:` overrides |
| Collection actions | `EventsTab` puts the only destructive collection action in a three-dot `RowActionsMenu` | A one-item menu adds an unnecessary interaction |
| Event ordering | `Event` has no position field and `loadDeviceWorkspace` sorts events by name | Dragging cannot be persisted without a schema/domain change |
| Matrix feedback | Matrix cells change only through selection/highlight state | Pointer movement across the grid has little affordance |
| Resolution authoring | `MatrixResolutionPanel` is a compact form rendered above the full matrix; it exposes only behavior and an always-present target select | It does not match the stronger visual hierarchy in the reference, cannot adapt fields to the selected behavior, and leaves too little room to understand or audition a playing/incoming pair |
| Collision preview | Event Detail can schedule a group of audio assets through `AudioPreviewProvider`, but matrix rules have no pair preview | Authors cannot position playing and incoming sounds relative to one another or hear the intended collision before saving |

There are existing unstaged edits in several layout files. Implementation must preserve them and integrate with the working-tree versions rather than replacing whole files.

## Architecture Decisions

### 1. Centralize shell geometry as layout tokens

Add authored CSS custom properties in `app/globals.css`:

```css
:root {
  --shell-header-height: 64px;
  --workspace-sidebar-width: 320px;
  --page-gutter-x: 16px;
  --page-gutter-y: 20px;
}
```

Use the properties from shared shell/header structures and Tailwind arbitrary values. `320px` is the new desktop width for both top-level rails. Keep the existing mobile breakpoint behavior: the project sidebar remains hidden below `md`, while the library rail remains stacked above content.

Do not independently hard-code new widths in `WorkspaceLayout` and the Libraries page. One token should control both.

The nested project asset-library rail is a secondary rail, not a top-level navigation sidebar. Leave it at `268px` unless visual verification shows the same truncation problem; if widened, give it a separate `--nested-sidebar-width` token so it cannot silently change top-level layout.

### 2. Make `PageHeader` the only owner of page-header spacing

Normalize `PageHeader` to the canonical `16px` horizontal and `20px` vertical gutter. Remove outer padding wrappers and `className="px-0 py-0"` overrides from full-page callers.

The canonical header has:

- Row 1: breadcrumbs left, page actions right, fixed `34px` control height.
- Row 2: title and optional subtitle.
- Stable gap and padding whether actions or subtitle are absent.
- One explicit border policy, selected by the caller without changing geometry.

Adopt it consistently in:

- `features/projects-list/projects-content.tsx` / `projects-header.tsx`
- `features/project-workspace/workspace-header.tsx`
- `features/libraries/library-toolbar.tsx`
- `features/events/event-header.tsx`
- `components/primitives/page-state.tsx`
- Event loading/not-found branches in `event-detail-content.tsx`

Move page body spacing outside header spacing:

- Projects: header spans the page; search toolbar and list use a shared body container.
- Libraries and Project Workspace: header spans the page above the sidebar/content grid.
- Event Detail: header spans the page above its body.
- Standardize main content to `var(--page-gutter-x)` rather than switching Libraries to `md:px-6`.

This keeps breadcrumbs, titles, and action rows at the same viewport coordinates when navigating between top-level pages and detail pages.

### 3. Theme the authored palette, not individual components

Use CSS variables as the backing values for the existing Tailwind `gray-*` and `purple-*` palette:

```ts
gray: {
  25: "rgb(var(--gray-25) / <alpha-value>)",
  // ...
},
purple: {
  500: "rgb(var(--purple-500) / <alpha-value>)",
  // ...
}
```

Define complete light and dark palettes in `app/globals.css` under `:root` and `[data-theme="dark"]`. The dark palette should reverse the luminance roles already encoded by existing utilities:

- `gray-25` remains the canvas/elevated control surface.
- `gray-50` and `gray-100` remain progressively emphasized surfaces.
- `gray-200` and `gray-300` remain dividers and control borders.
- `gray-500` through `gray-700` remain muted-to-primary foregrounds.
- Purple retains accessible accent/focus/primary-control contrast.

This makes existing utilities such as `bg-gray-25`, `text-gray-700`, `border-gray-300`, and opacity forms such as `ring-purple-500/40` theme-aware automatically. New UI should continue using the authored palette; it should not add local `dark:` variants unless an element truly needs mode-specific behavior.

Use `next-themes` for preference persistence, system-color tracking, and pre-hydration theme application:

- Add `next-themes`.
- Wrap the application in a theme provider in `app/providers.tsx`.
- Configure `attribute="data-theme"`, `defaultTheme="system"`, and `enableSystem`.
- Add `suppressHydrationWarning` to `<html>`.
- Set `color-scheme: light` / `dark` in the corresponding CSS scopes so native inputs and scrollbars agree.
- Use `disableTransitionOnChange` so a theme switch does not animate every color on the page.

Create a small `ThemeModeToggle` primitive or shell component with three equal icon buttons:

- Light (`Sun`)
- System (`Monitor`)
- Dark (`Moon`)

Expose it as an accessible labeled group. Each button needs a text-equivalent label and `aria-pressed`; the selected preference is the stored mode (`theme`), not the currently resolved system theme. Delay interactive theme-dependent rendering until mounted to avoid hydration mismatch, while preserving a fixed-size placeholder so the toolbar does not shift.

Audit the handful of hard-coded shadow colors (for example matrix sticky dividers) and move those to CSS variables or palette-derived values. Raw white/black values are acceptable only when they are intentionally mode-invariant and meet contrast requirements.

### 4. Keep global toolbar state route-derived

Update `WorkspaceShell` to use `usePathname()`:

- `/projects`, `/projects/[projectId]`, and event detail routes select Projects.
- `/libraries` and its query-string states select Libraries.
- Each selected link receives `aria-current="page"` and a persistent active visual treatment.
- Hover and focus states remain distinguishable from selected state.

Restructure the header into two groups:

```text
[Vibra logo] [Reset demo]                     [Projects] [Libraries] [Light|System|Dark]
```

Reset demo stays immediately to the right of the logo at all widths. Preserve the current compact behavior by hiding only its text at narrow widths, not the button itself or its accessible name.

At small widths, allow section labels and theme text to collapse to icons while keeping minimum touch targets and accessible labels. Verify the whole toolbar fits at `375px`; if needed, use compact icon-only theme controls before reducing the global header height.

### 5. Treat event order as domain data

Add a persisted non-negative integer `sortOrder` to `Event`.

Update:

- `domain/entities.ts`
- `domain/schemas.ts`
- event create/reorder command schemas
- `data/seed.ts`
- repository input/output types and record factories
- tests and fixtures that construct `Event`

#### IndexedDB migration

Increment `VIBRA_DATABASE_VERSION` from `2` to `3`. Add a version-3 event index that supports collection ordering:

```ts
events: "id, collectionId, eventType, name, [collectionId+sortOrder]"
```

In the version upgrade:

1. Read events by collection.
2. Reproduce the current visible order (`name.localeCompare`, with ID as a stable tie-breaker).
3. Assign contiguous `sortOrder` values beginning at `0`.
4. Normalize legacy `CollisionMatrixEntry.resolutionBehavior` objects using the behavior-compatible defaults defined in section 8.
5. Write both migrated record sets within the Dexie upgrade transaction.

The migration preserves what users currently see instead of unexpectedly reshuffling existing data.

#### Repository behavior

- `loadDeviceWorkspace` sorts events by `sortOrder`, then name/ID only as a corruption-safe tie-breaker.
- `createEvent` calculates `max(sortOrder) + 1` in the same transaction that inserts the event.
- Add `reorderCollectionEvents({ collectionId, orderedEventIds })`.
- The command must validate that the IDs are unique and are an exact permutation of all events currently in the collection.
- Reject missing, duplicate, or cross-collection IDs with an existing typed constraint/conflict error.
- Persist contiguous positions with one `bulkPut` inside a read/write transaction.
- Deleting an event may leave a gap; the next successful reorder compacts positions. This avoids rewriting every sibling on delete.

Expose the repository operation through `features/projects/workspace-mutations.ts` and `features/projects/queries.ts`. Invalidate the selected device workspace and any aggregate that displays event order. Prefer an optimistic cache update with rollback so the row does not jump back while IndexedDB completes.

#### Drag-and-drop UI

Use `@dnd-kit/core`, `@dnd-kit/sortable`, and `@dnd-kit/utilities`; do not hand-roll pointer coordinates. The library provides pointer, touch, and keyboard behavior without coupling persistence to the DOM.

Refactor `EventsTable` so each row is a sortable row with:

- A narrow first column containing a `GripVertical` handle.
- The listener only on the handle so links, Open, and delete controls still click normally.
- Pointer activation distance (about 6px) to prevent accidental drags.
- Keyboard sensor using `sortableKeyboardCoordinates`.
- `aria-label="Reorder <event name>"` on the handle.
- A lifted shadow/opacity state while dragging.
- Transform-only movement to avoid table reflow.
- `motion-reduce` handling.

On drag end:

1. Ignore cancellation or a drop onto the same item.
2. Compute the new ID order with `arrayMove`.
3. Optimistically render it.
4. Call the reorder mutation once.
5. Roll back and surface feedback if persistence fails.

The mobile cards must render in persisted `sortOrder`. Desktop drag-and-drop is the required row-reordering interaction. If mobile reordering is added, implement it as a separate sortable context with left-edge handles; do not mount duplicate sortable IDs in one context.

### 6. Replace the single-item collection menu

In `features/project-workspace/events-tab.tsx`:

- Remove the collection `RowActionsMenu` and `MoreVertical` import.
- Render a normal secondary `Button` with `Trash2` and visible text `Delete`.
- Keep it disabled when no collection is selected.
- Call the existing `onDeleteCollection` confirmation flow directly.
- Retain Rename, Collection, and Add event in their current order unless responsive verification shows wrapping; Delete should sit beside Rename.

This changes only the affordance. It does not bypass the existing delete confirmation or cascade summary.

### 7. Add Collision Matrix hover motion at the cell boundary

Apply hover behavior only to interactive matrix data cells in `matrix-grid.tsx`; axis headers retain their existing selection behavior.

Use transform and shadow so layout dimensions do not change:

- `motion-safe` transition for transform, background, border/shadow, about `120–160ms`.
- Hover lift of roughly `1px` and a very small scale (`1.01`–`1.02`).
- Subtle theme-aware inset/ring or shadow.
- Slight behavior-pill emphasis through a `group-hover` transform/contrast change.
- Preserve selected cell styling as stronger than hover.
- Keep row/column cross-highlighting visible while another cell is hovered.
- Add `relative` and hover z-index only if necessary to prevent adjacent borders clipping the lift.
- Under `prefers-reduced-motion: reduce`, preserve the color/ring affordance and remove transforms.

No hover effect should alter the accessible name or trigger selection. Verify behavior on empty and configured cells and in both themes.

### 8. Make resolution authoring a focused, adaptive editor

Treat the supplied desktop and narrow references as layout direction, not a literal field list. The editor should adapt to Vibra's five resolution kinds and the actual selected playing/incoming events.

Selecting a Collision Matrix cell should enter a focused editor view inside the Matrix tab rather than keeping a small form above the entire grid. Preserve the project workspace shell and Matrix tab context; do not add a new top-level page solely for this interaction. The editor begins with a `Back to Matrix` control and returns to the same scroll/selection context.

Refactor `matrix-resolution-panel.tsx` into a composition such as:

- `MatrixResolutionEditor` — owns the draft, save/clear actions, and focused layout.
- `CollisionPlaybackPreview` — the prominent Tap stage, pair labels, timeline, playback state, and errors.
- `ResolutionBehaviorFields` — schema-driven controls whose visibility and validation depend on the behavior.
- `CollisionPreviewTimeline` — an editable two-lane ruler for the Playing and Incoming sounds.

The intended visual order is:

```text
[Back to Matrix]

                         [ Tap ]

                 Playing event × Incoming event

[Playing]  [chosen sound────────────]
[Incoming]       [chosen sound────────────]
            0ms ........ shared ruler ........

[Interruption behavior] [Target when applicable]
[Post-interruption recovery when applicable]
[System-interruption recovery when applicable]
                                      [Clear] [Save rule]
```

On wide screens, the preview stage and timeline span the editor width, followed by a compact configuration grid similar to the desktop reference. On narrow screens, controls stack into a single column like the mobile reference:

- Full-width labeled behavior select.
- Two-option segmented target control (`Playing` / `Incoming`) instead of a select.
- Recovery controls rendered as two-option segmented controls (`Resume` / `Stay stopped`).
- Help icons with tooltips/popovers and programmatic descriptions.
- A horizontally scrollable timeline with a fixed/minimum canvas width; do not compress timing labels or sound blocks until they become unreadable.
- The `Tap` control remains prominent, reachable, and at least `44px` high.

Use one behavior-definition map as the source of truth for field visibility, labels, defaults, explanatory copy, and validation. Do not scatter `behavior === ...` conditionals across the editor. The behavior semantics should be:

| Behavior | Target | Post-interruption recovery | System-interruption recovery | Preview behavior |
|---|---|---|---|---|
| Preempt | Required; identifies the event being interrupted | Required | Required | Stop the target when the other sound arrives; resume from the interrupted position only when `Resume` is selected |
| Queue | Required; identifies the event that waits | Not applicable | Required | Delay the target until the other sound completes |
| Co-play | Not applicable | Not applicable | Required | Play both sounds at their authored relative offsets |
| Suppress | Required; identifies the event that does not start | Not applicable | Required | Omit the target sound while allowing the other sound to continue |
| Not possible | Not applicable | Not applicable | Not applicable | Disable Tap and explain that the pair cannot be previewed concurrently |

For migrated rules, preserve current meaning with these defaults:

- Preempt targets Playing and uses `Stay stopped`.
- Queue targets Incoming.
- Suppress keeps its existing target, falling back to Incoming only for malformed legacy data.
- System interruption defaults to `Stay stopped`.
- Co-play and Not possible clear fields that are not applicable.

Persist the rule configuration, but keep sound choice and relative preview offsets as editor-local audition state. Moving a preview block must never rewrite an event's authored `TriggerPlayback.startOffset`, and saving a matrix rule must not silently change either event.

Extend `ResolutionBehavior` with explicit recovery values, using a small domain vocabulary such as:

```ts
type InterruptionRecovery = "Resume" | "Stay stopped";

interface ResolutionBehavior {
  behaviorName: ResolutionBehaviorName;
  targetEventId: EventId | null;
  postInterruptionRecovery: InterruptionRecovery | null;
  systemInterruptionRecovery: InterruptionRecovery | null;
}
```

Update `domain/enums.ts`, `domain/entities.ts`, `domain/schemas.ts`, `domain/rules/matrix.ts`, repository command types, seed data, share-preview copy, tests, and fixtures. Validation must reject missing required fields and non-null inapplicable fields so stale hidden form values cannot leak into persisted rules.

Coordinate this schema work with the event-order IndexedDB migration. If both changes ship together, the version-3 upgrade should add `sortOrder` and normalize legacy resolution objects in the same transaction. If either migration has already shipped by implementation time, allocate the next database version instead of editing a released upgrade.

### 9. Add an accurate two-sound collision playback preview

Each lane represents one selected matrix event and previews exactly one enabled audio playback:

- Default to the earliest enabled, previewable audio playback for the event.
- When an event has multiple audio playbacks, expose an accessible lane-level sound selector using asset names.
- Preserve the event names as the primary Playing/Incoming labels; sound filenames or asset names are secondary.
- Haptic-only events remain visible but cannot satisfy the two-sound preview requirement until haptic playback is supported. Disable Tap with a useful explanation if either side lacks a previewable audio asset.

Give the Playing and Incoming blocks independent non-negative start offsets on one shared ruler. Default Playing to `0ms` and Incoming to a small visible offset such as `150ms`. Authors can:

- Drag either block horizontally.
- Use keyboard arrow keys from a focused block/handle.
- Enter or nudge an exact millisecond value as a non-drag fallback.
- Snap to `10ms` increments by default, while still allowing an exact numeric value.
- Reset the audition timing without changing the saved rule.

Use `@dnd-kit` already introduced for event row ordering for pointer and keyboard movement, but keep the collision timeline in its own DnD context. Clamp offsets to the preview range and extend the ruler when necessary instead of allowing blocks outside the canvas.

The large primary button at the top must have the visible label `Tap`. Its accessible name should explain the action, for example `Tap to preview collision`. Activating it starts or restarts the preview from time zero using the current unsaved rule draft and offsets; it must never autoplay. Show a synchronized playhead and a non-shifting playing state. Provide a compact Stop control near the timeline if the selected sounds can be long, while keeping `Tap` as the persistent primary label.

The existing `AudioPreviewProvider` schedules independent `HTMLAudioElement` instances with timers, which is adequate for simple event previews but not for sample-accurate alignment, queue duration, interruption, and resume behavior. Extract a preview scheduling interface and add a collision scheduler backed by one lazily created `AudioContext`:

- Fetch/decode and cache audio buffers by playback URL.
- Schedule both buffers against the same audio clock.
- Use buffer duration to implement Queue.
- Stop the targeted source at the collision point for Preempt.
- Recreate the source at the correct buffer offset for Preempt + Resume because `AudioBufferSourceNode` cannot be restarted.
- Omit Suppress targets and reject Not possible.
- Cancel sources, animation frames, and pending work on Tap restart, Back to Matrix, pair change, unmount, reset, or asset deletion.
- Keep one preview active across the app by routing collision playback through the existing provider/actions boundary.
- Surface fetch/decode/autoplay failures through the existing inline preview error and feedback patterns.

Do not persist decoded audio, object URLs, sound selections, or audition offsets. Cache only for the lifetime of the provider and release references when it unmounts. Continue honoring disabled devices, disabled event triggers, missing assets, and uploaded-asset object URL lifecycle.

Keep save state independent from playback state: authors can audition an unsaved draft, Tap never saves, Save rule does not start playback, and leaving with a dirty draft should use the app's existing lightweight confirmation pattern if one exists. Clear rule remains destructive and continues through the existing confirmation flow.

## Implementation Sequence

### Phase 1 — Baseline and guardrails

1. Capture current screenshots for Projects, Libraries, Project Events, Event Detail, and Matrix at desktop and `375px`.
2. Run the existing unit, type, lint, and focused E2E suites.
3. Record the current unstaged diff and avoid broad formatting rewrites.

### Phase 2 — Layout tokens and header alignment

1. Add shared shell/sidebar/gutter variables.
2. Make `PageHeader` own full-page geometry.
3. Remove route-specific wrapper padding.
4. Widen both top-level sidebars with the shared token.
5. Standardize content gutters.
6. Update `docs/plan/DESIGN_SYSTEM.md` layout constants and add a short ADR if the header ownership rule is materially different from ADR 0002.

### Phase 3 — Theme system and global toolbar

1. Add `next-themes` and CSS-variable-backed palettes.
2. Add provider and three-way toggle.
3. Derive active navigation state from the pathname.
4. Move Reset demo beside the logo.
5. Audit hard-coded colors and verify hydration.

### Phase 4 — Collection toolbar and matrix feedback

1. Replace the collection overflow menu with a direct Delete button.
2. Add matrix cell hover animation and reduced-motion fallback.
3. Update E2E selectors affected by the collection action.

### Phase 5 — Resolution editor and collision preview

1. Add the recovery vocabulary, behavior-definition map, validation, and a tested legacy-normalization function; land the database version bump with Phase 6.
2. Split the compact resolution panel into a focused adaptive editor.
3. Add responsive behavior/target/recovery controls.
4. Derive previewable sounds for the selected Playing and Incoming events.
5. Add the editable two-lane collision timeline and local audition offsets.
6. Add the prominent `Tap` action, accurate scheduler, playhead, cancellation, and error handling.
7. Update collision share-preview copy for the expanded persisted rule.

### Phase 6 — Persisted event ordering

1. Add `sortOrder` to domain and seed data.
2. Implement and test the coordinated v3 migration for event order and legacy resolution rules.
3. Add repository reorder semantics.
4. Add query mutation/invalidation and optimistic behavior.
5. Add sortable table rows and handle styling.
6. Confirm all other event consumers use repository order.

### Phase 7 — Integrated verification

1. Run all automated checks.
2. Verify layout positions, themes, motion, resolution rules, collision playback, and keyboard interactions manually.
3. Repeat the screenshot set and compare against baseline.
4. Confirm reset restores seeded order and does not reset the user’s theme preference.

## Test Plan

### Unit and repository tests

- Theme preference helper/toggle maps exactly to `light`, `system`, and `dark`.
- Active-section helper handles project list, project detail, event detail, and libraries paths.
- Event schema rejects negative/non-integer `sortOrder`.
- Seed data gives each collection unique contiguous order values.
- Database v2-to-v3 migration reproduces current alphabetical display order.
- New events append after existing siblings.
- Reorder persists an exact permutation and survives a fresh query.
- Reorder rejects duplicates, omitted IDs, unknown IDs, and IDs from another collection.
- Reset restores deterministic seeded order.
- The behavior-definition map exposes the correct required controls and defaults for every resolution kind.
- Resolution validation rejects missing required target/recovery values and rejects stale values for inapplicable fields.
- Legacy collision rules migrate to behavior-compatible defaults without changing their effective Preempt, Queue, Suppress, Co-play, or Not possible meaning.
- Collision preview derivation chooses the earliest enabled audio by default and excludes disabled, missing, and haptic-only assets.
- Preview offsets clamp, snap, and normalize predictably without changing persisted `TriggerPlayback.startOffset` values.
- The collision scheduler produces the expected starts/stops/resume offset for all previewable behaviors and fully cancels replaced schedules.

### Component tests

- `ThemeModeToggle` exposes an accessible group and one pressed preference.
- Projects/Libraries links set `aria-current` only for the active section.
- Collection Delete is a button and the obsolete one-item action menu is absent.
- Event reorder handles have event-specific accessible labels.
- Reordering does not cause Open/Delete row controls to fire.
- Selecting a matrix cell opens the focused resolution editor and Back to Matrix restores the matrix.
- Behavior changes show only applicable target and recovery controls and clear hidden stale values.
- Target and recovery segmented controls expose group labels, selected state, help text, and keyboard operation.
- `Tap` remains visibly labeled, is disabled with a reason when two audio sources are unavailable, and never saves the rule.
- Dragging or keyboard-nudging a preview block updates only local audition timing.
- The preview playhead, Stop behavior, errors, and cleanup do not cause toolbar or timeline layout shift.

### Playwright coverage

- Navigate Projects → Libraries → Project → Event and compare breadcrumb/title/action-row coordinates within a small tolerance.
- Verify each desktop sidebar resolves to `320px`.
- Verify active global nav state across all project and library routes.
- Verify Reset demo appears immediately after the logo in DOM and visual order.
- Select Light/System/Dark, reload, and confirm stored preference and resolved `data-theme`.
- Emulate a system-theme change while System is selected.
- Drag the first event below another event, reload the page, and verify order persists.
- Keyboard-reorder an event from the handle and verify persistence.
- Open a matrix cell and compare the wide and narrow editor compositions against the supplied references.
- Change behaviors and verify the Target, Post interruption, and System interruption controls adapt correctly.
- Choose one audio source per event, position their starts, press `Tap`, and verify both begin at the configured relative times.
- Verify Preempt, Queue, Co-play, and Suppress produce their defined preview behavior; verify Not possible disables Tap.
- Navigate Back to Matrix during playback and verify all audio and the playhead stop.
- Hover unset/configured Matrix cells in both themes.
- Emulate reduced motion and verify no transform animation is applied.

### Manual visual matrix

| Surface | Light | Dark | 375px | 768px | 1440px |
|---|---:|---:|---:|---:|---:|
| Projects | ✓ | ✓ | ✓ | ✓ | ✓ |
| Libraries | ✓ | ✓ | ✓ | ✓ | ✓ |
| Project Events | ✓ | ✓ | ✓ | ✓ | ✓ |
| Project Assets | ✓ | ✓ | ✓ | ✓ | ✓ |
| Collision Matrix | ✓ | ✓ | ✓ | ✓ | ✓ |
| Resolution Editor | ✓ | ✓ | ✓ | ✓ | ✓ |
| Event Detail | ✓ | ✓ | ✓ | ✓ | ✓ |

Check contrast, clipping, focus rings, toolbar wrapping, sticky matrix borders, drag overlays, preview timeline overflow, the fixed `Tap` label, and long seeded names.

## Definition of Done

- Top-level sidebars are `320px` from one shared token and visibly fit more label text.
- Breadcrumbs, action rows, titles, and body gutters do not shift between the primary routes.
- Matrix cells give clear, subtle hover feedback without layout movement or mandatory motion.
- Collection deletion is a visible button using the existing confirmation flow.
- Event order is persisted domain data, survives navigation/reload, and is keyboard accessible.
- Projects/Libraries active state is visually and semantically exposed.
- Light/System/Dark preference works without flash, persists, and follows OS changes in System mode.
- Existing components do not accumulate route-local dark-mode variants.
- Reset demo sits directly after the logo and still resets only demo data.
- A selected Matrix cell opens a focused responsive editor with behavior-appropriate Target, Post interruption, and System interruption controls.
- Authors can choose, align, keyboard-adjust, and audition one Playing and one Incoming sound from a prominent `Tap` action without mutating either event's authored playback schedule.
- Collision preview accurately demonstrates Preempt, Queue, Co-play, and Suppress; Not possible and missing-audio cases explain why preview is unavailable.
- Preview audio and playhead state always stop on restart, Back, navigation, reset, pair change, and unmount.
- `pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm test:e2e` pass.

## Out of Scope

- Reordering collections or devices.
- User-configurable sidebar resizing.
- A density setting.
- Redesigning the share-preview shell; only its resolution copy/data rendering changes.
- Persisting collision audition sound choices or relative preview offsets.
- Browser haptic playback; haptic-only events receive a clear unavailable preview state.
- Syncing theme preference to IndexedDB or a server account; local browser preference is sufficient.
