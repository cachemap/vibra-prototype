# Vibra Component Decomposition Checklist

Source plan: `docs/plan/COMPONENT_DECOMPOSITION_PLAN.md`
Design system: `docs/plan/DESIGN_SYSTEM.md`

## How To Work This Checklist

- Complete stages top to bottom. Stages 11-14 are independent of each other and of 7-10, so they may run in parallel once Stage 6 lands.
- One commit per stage. Leave the app runnable and all four gates green after every stage.
- **This is a pure refactor.** No copy, DOM structure, class string, ARIA attribute, or test id changes. Anything that looks worth fixing goes to the follow-up list at the bottom, not into the commit.
- Verify at the end of each stage and fix what you find before committing.
- Update `docs/adr/` for each architecture decision listed in the plan.
- Update `docs/memory/` after each stage with what changed, the verification run, and the next stage.

## Status Legend

- `[ ]` Not started
- `[~]` In progress
- `[x]` Complete
- `[!]` Blocked

## Stage Gate

Run all four at the end of every stage. No exceptions.

- [x] `pnpm typecheck`
- [x] `pnpm lint`
- [x] `pnpm test`
- [x] `pnpm test:e2e`
- [x] `grep -rn 'data-testid' app components features | sort` yields exactly 6, unchanged
- [x] `grep -rno 'aria-label\|role="status"\|role="tab"\|aria-selected\|aria-checked' app features | sort` matches the Stage 0 baseline
- [ ] Browser check on `http://localhost:3000` for the surfaces this stage touched; fix any drift before committing

---

## Stage 0: Baselines

Goal: make regressions detectable before anything moves.

- [x] Record the sorted `data-testid` list from `main` into `docs/memory/`. Expect exactly: `matrix-axis-filter`, `timeline-playhead`, `project-asset-libraries`, `device-list`, `collection-list`, `collision-matrix-grid`.
- [x] Record the sorted ARIA/role grep output from `main` into `docs/memory/` as the diff baseline for every later stage.
- [x] Record current page line counts (2757 / 1042 / 948 / 813 / 354).
- [x] Capture `projects-list` baselines at desktop, tablet, and mobile into `docs/plan/visual-audit-captures/`.
- [x] Capture `share-preview` baselines for all three target kinds (project, event, collisionMatrixEntry) at desktop and mobile.
- [x] Confirm `pnpm test` and `pnpm test:e2e` are green on `main` before starting.

Stage gate:

- [x] Baselines committed; every later stage has something to diff against.

---

## Stage 1: `lib/` Pure Utilities

Goal: add the shared utility layer without touching a single call site. Additive only — cannot break anything.

### 1.1 Files

- [x] `lib/errors.ts` — `messageForError(error, fallback)` with `fallback` as a **required** second parameter, plus named constants `workspaceErrorFallback`, `libraryErrorFallback`, `projectsErrorFallback`, `shareErrorFallback`.
- [x] Transcribe all five current fallback strings character-for-character from `app/libraries/page.tsx:74-80`, `app/projects/page.tsx:141-147`, `app/share/[shareToken]/page.tsx:31-37`, `app/projects/[projectId]/page.tsx:130-136`, `app/projects/[projectId]/events/[eventId]/page.tsx:73-79`. Note which are already identical.
- [x] `lib/format.ts` — `formatSeconds`, `formatAssetDate` (`{ day, month }`), `formatProjectDate` (`{ day, month, year, timeZone: "UTC" }`). Two named functions, **not** a variant parameter. Comment each with its current call site.
- [x] `lib/plural.ts` — `pluralSuffix(count)`, `countLabel(count, singular, plural?)`. No `<Pluralize>` component.
- [x] `lib/tree.ts` — `TreeShape<TNode>`, `flattenTree`, `findTreeNode`, `pathToTreeNode`. Generic, no `@/domain` import.
- [x] `lib/search-params.ts` — `hrefWithParams(basePath, current, updates)` where a `null` value deletes the key.
- [x] `lib/flash-message.ts` — `"use client"`; `hrefWithFlashMessage`, `readAndClearFlashMessage`, `writeFlashMessage` over `"vibra.projects.feedback"`. Keep the `typeof window === "undefined"` guard.
- [x] Confirm `lib/` has no `@/domain` imports except `errors.ts`.

### 1.2 Tests

- [x] `tests/lib-tree.test.ts` — flatten, find, path, and the missing-id case.
- [x] `tests/lib-format.test.ts` — assert `formatAssetDate` and `formatProjectDate` produce the strings the current pages produce.
- [x] `tests/lib-errors.test.ts` — `AppError` path and fallback path.
- [x] Add a test asserting `hrefWithParams` output is byte-identical to the current `searchParamsFor` and `folderHrefFor` for the null and non-null cases.

Stage gate:

- [x] Four gates green. No page file changed in this stage.

---

## Stage 2: Adopt `lib/` Across Pages

Goal: delete the duplicated helpers. Mechanical, but every string needs eyes.

- [x] Replace all 5 `messageForError` copies; pass the matching named fallback at each call site.
- [x] Replace both `formatDate` copies with `formatAssetDate` / `formatProjectDate` — do not converge them.
- [x] Replace both `formatSeconds` copies (`share:39`, `events:81`).
- [x] Replace all 12 inline `x === 1 ? "" : "s"` with `pluralSuffix`.
- [x] Replace `searchParamsFor` (project detail 138-162), `searchParamsFor` (libraries 154-186), and `folderHrefFor` (projects 301-302) with `hrefWithParams`.
- [x] Replace `hrefWithFeedback` (events 87-94), the `sessionStorage` write (project detail 1031-1032), and the lazy read initializer (projects 206-214) with the `lib/flash-message.ts` helpers.
- [x] Diff-review every error fallback and both date option sets against Stage 1's transcription.

Stage gate:

- [x] Four gates green.
- [x] Cross-page flash message verified in the browser through **both** channels: delete an event from the event page (`?feedback=`), delete a project (`sessionStorage`).

---

## Stage 3: New Primitives

Goal: add four primitives with no call sites changed. Additive only.

- [x] `components/primitives/badge.tsx` — `{ children, className?, variant?: "outline" | "solid" }`. `solid` = `rounded-lg bg-gray-100 px-2 py-1`; `outline` = the share-page variant.
- [x] `components/primitives/row-actions-menu.tsx` — owns its own `open` state; `{ align?, disabled?, grouped?, icon?, items, label, size? }`. No wrapper element of its own.
- [x] Inspect `components/primitives/menu.tsx` first: does `MenuGroup` add a DOM node or class? If yes, keep `grouped?`; if no, drop it.
- [x] `components/primitives/form-dialog.tsx` — renders a bare `Dialog`, **never** its own `DialogOverlay`.
- [x] `components/primitives/page-state.tsx` — `PageStateScaffold({ breadcrumbs, children })`.
- [x] Export all four from `components/primitives/index.ts` in alphabetical position.
- [x] Add `"use client"` only to files that use hooks.

Stage gate:

- [x] Four gates green. No call site changed in this stage.

---

## Stage 4: Adopt New Primitives

Goal: first DOM-touching stage. Bisect lands here cleanly if something breaks.

### 4.1 `RowActionsMenu` — 16 call sites

- [x] Project detail: 1355, 1468, 1966, 2147, 2209, 2268.
- [x] Libraries: the 5 `renderActionsMenu` calls (629, 703, 745, 785, 815) plus the hand-expanded `PageHeader` copy (516-531).
- [x] Projects list: the 2 `renderRowActions` calls (754, 773) plus the hand-expanded `PageHeader` copy (491-512).
- [x] Events page: the `openEventActions` menu.
- [x] Delete `renderActionsMenu` (libraries 407-425) and `renderRowActions` (projects 418-444).
- [x] Delete all 7 menu-open state slots: `openProjectActions`, `openDeviceActions`, `openCollectionActions`, `openEventActions`, `openProjectAssetActions`, `openActionsKey`, `openActionRowId`.
- [x] Leave the existing outer wrapper span/div at each call site, including the `stopPropagation` folder-row variant.

### 4.2 Other primitives

- [x] `FormDialog` at 9 sites: libraries 860-884; projects 557-583; project detail 2557, 2626, 2657, 2697; events 879, 921, 965. Audit all nine first and leave any outlier on a raw `Dialog`.
- [x] `Badge` at 6 sites: libraries 620, 623, 793, 811; project detail 2049; share 197.
- [x] `PageStateScaffold` at 5 branches: project detail 1263-1273, 1276-1291, 1293-1304; libraries 482-506; projects 446-474.

Stage gate:

- [x] Four gates green.
- [x] **Two action menus**: open row A's menu, click row B's trigger — A closes and B opens in one click.
- [x] Escape closes an open menu; outside click closes it.
- [x] Re-capture and diff `libraries-{list,tile}-{desktop,mobile}`, `project-{assets,events,matrix}-{desktop,mobile}`, `projects-*`, and `overlay-popups-1.png`.

---

## Stage 5: `features/sharing/`

Goal: kill the largest verbatim duplication in the repo.

- [x] `features/sharing/share-token.ts` — `shareTokenFor(link)`; replaces project detail 167 and events 83.
- [x] **Before merging the handlers, diff the success and error copy between the two pages.** If any string differs, take it as a hook option rather than converging it.
- [x] `features/sharing/use-share-link.ts` — `useShareLink(): ShareLinkController` owning `shareLink`, `shareLinkPendingDelete`, and `shareLabel`, and calling `useGenerateSharingLinkMutation` and `useDeleteSharingLinkMutation` itself. It receives the current page feedback setter until Stage 6 adds `useFeedbackActions`.
- [x] `features/sharing/share-link-dialog.tsx` — two exports: `ShareLinkDialog` (4-button `Dialog`) and `ShareLinkDeleteConfirm` (`ConfirmDialog`), so a page can place the dialog inside its `DialogOverlay` and the confirm outside it.
- [x] Delete project detail 380-383, 757-818, 2492-2503, 2505-2555.
- [x] Delete events 133-136, 420-481, 814-825, 827-877.

Stage gate:

- [x] Four gates green.
- [x] Generate a share link from the project page and from the event page; copy it; open the preview; delete it. Confirm the `ConfirmDialog` follows the pre-existing share-dialog handoff behavior.

---

## Stage 6: Feedback And Audio-Preview Contexts

Goal: land the cross-cutting layer that stages 7-14 consume. Highest discipline requirement.

### 6.1 `features/feedback/feedback-context.tsx`

- [x] Two contexts: `useFeedbackMessage()` (volatile) and `useFeedbackActions()` (stable, `useMemo([])`).
- [x] `FeedbackProvider({ children, errorFallback, initialMessage? })` — receives its subtree via `children`, never renders it inline. Comment the bailout rule in the file.
- [x] `FeedbackText({ className? })` renders exactly `{message ? <p className="text-sm text-gray-600">{message}</p> : null}`.
- [x] Mount a `FeedbackProvider` per page with the matching `errorFallback` constant.
- [x] Replace the 4 in-dialog feedback `<p>` copies with `FeedbackText`.
- [x] Leave the two **page-level** banners' markup untouched (libraries 645, projects 551-555); read `useFeedbackMessage()` in place.
- [x] Replace ~25 `try/catch` blocks with `runWithFeedback`, keeping success copy verbatim at each call site via `onSuccess`.
- [x] Wire `initialMessage` from `readAndClearFlashMessage()` and the `?feedback=` param.

### 6.2 `features/projects/audio-preview-context.tsx`

- [x] Two contexts: `useAudioPreviewState()` (includes `playheadByScheduleKey`) and `useAudioPreviewActions()` (stable).
- [x] `AudioPreviewProvider` wraps the existing `useAudioPreviewPlayer()` unchanged and receives its subtree via `children`.
- [x] Verify `playItem`'s `useCallback` deps are stable. If not, ref-latch inside the provider — do **not** edit `audio-preview.tsx`.
- [x] Back `isSchedulePlaying` and `playheadFor` with a ref-latched read so they can live in the stable-actions context.
- [x] `AudioPreviewButton({ item })` — a context-reading wrapper rendering DOM byte-identical to `AudioPreviewIconButton`.
- [x] Keep `AudioPreviewIconButton` exported and props-based; it stays the testable unit and the share page's lanes keep using it.
- [x] Replace the 7 drilled call sites with `<AudioPreviewButton item={...} />`.

Stage gate:

- [ ] Four gates green.
- [ ] **Playback animation**: play a lane — the playhead animates smoothly and `timeline-playhead` is present. While playing, type in a dialog: no stutter. Stutter means the `children` bailout rule was violated.
- [ ] Cross-page flash message still works through both channels.
- [ ] Preview a single asset from the libraries table, the libraries tiles, and the project asset table.

---

## Stage 7: `features/matrix/`

Goal: deepest JSX in the repo. Two test ids ride along. **Keep the 6 matrix state fields on the page** and thread them as props — they move into the context in Stage 8.

- [x] `features/matrix/behavior.ts` — `behaviorCopy`, `behaviorIconFor`, `behaviorCellClass`, `behaviorBubbleClass`. Replaces project detail 171-226 and the share-page `behaviorCopy` duplicate (41-47). Return the icon component reference so the file stays `.ts`.
- [x] Move `features/projects/matrix-axis-filter.tsx` to `features/matrix/`; update the one import site. `data-testid="matrix-axis-filter"` unchanged.
- [x] `MatrixAxisFilterAnchor` replaces the `renderMatrixAxisFilter` render function (1122-1140), used at all three anchors (1701, 1815, 1827).
- [x] `features/matrix/matrix-tab.tsx` — orchestrator replacing 1658-1951; calls `useDeviceWorkspaceQuery(deviceId)` itself.
- [x] `features/matrix/matrix-toolbar.tsx` — header row, coverage stat, toolbar anchor.
- [x] `features/matrix/matrix-grid.tsx` — **`data-testid="collision-matrix-grid"` stays on the same element** (1800). Calls the 6 matrix mutations itself.
- [x] Replace the per-cell `.find` with a precomputed `Map` keyed `` `${playingEventId}:${incomingEventId}` ``; the same lookup exists at 565-569, 1220-1223, and 1874-1878.
- [x] `features/matrix/matrix-resolution-panel.tsx` — selected-cell detail and behavior picker; calls the upsert and delete entry mutations.

Stage gate:

- [ ] Four gates green.
- [ ] **Matrix selection persistence**: select a cell, switch to Events, switch back — selection, behavior picker, and filter anchor all preserved.
- [ ] Select and deselect rows and columns; set each of the 5 behaviors; set a `Suppress` target; clear an entry.
- [ ] Re-capture and diff `project-matrix-{desktop,mobile}` and `collision-matrix.png`.

---

## Stage 8: Workspace Scope Context And Chrome

Goal: the scope-not-data context, plus the header, sidebar, tab bar, and mobile controls.

- [x] `features/project-workspace/workspace-scope-context.tsx` — two contexts plus the narrow `useProjectDialogRequest()`.
- [x] The provider calls `useProjectWorkspaceQuery` and `useAssetLibraryTreeQuery` **only to resolve identifiers**, never to expose data.
- [x] `goTo*` stability via a write-only-latest `navRef` latched during render. Comment why it is safe.
- [x] Actions object `useMemo(..., [])`; selection object `useMemo` over its scalar fields.
- [x] **Move the 6 matrix state fields from the page into the value context** — they must survive the tab body unmounting.
- [x] Fold `openDialog` and `requestDelete` into the actions context, replacing the 7 `openDelete*` (673-755) and 6 `open*Dialog` (618-671) functions. `requestDelete` calls `clearFeedback()` internally.
- [x] The provider owns `dialog` and `deleteTarget` state and computes each request's seed values.
- [x] Keep `useSearchParams` inside a Suspense boundary — `pnpm lint` enforces this.
- [x] `workspace-header.tsx` — calls `useProjectWorkspaceQuery` itself; takes `shareController` as a prop.
- [x] `workspace-sidebar.tsx` (replaces 1386-1538) — **`data-testid="device-list"` (1444) and `data-testid="collection-list"` (1515) stay on the same `div`s**. Keep the "Systems" and "Collections" headings verbatim. Owns the search input and its filtering (today 1309-1320).
- [x] `workspace-mobile-controls.tsx` — the two mobile `<select>` blocks (1579-1613).
- [x] `workspace-tab-bar.tsx` — reproduces the **existing** markup exactly, used at both desktop (1387-1421) and mobile (1542-1576). Do **not** switch to the `Tabs` primitive.
- [x] `workspace-empty-state.tsx` — today's `EmptyProjectWorkspace` (239-278), lifted verbatim.
- [x] `workspace-layout.tsx` — the `<section>` grid, header, sidebar, main, tab switch, and dialog layer, mounted as a sibling **under** the providers.

Stage gate:

- [ ] Four gates green.
- [ ] Matrix selection persistence re-verified after the hoist into context.
- [ ] Device and collection switching updates the URL and the body; the sidebar search filters both lists.
- [ ] Re-capture and diff `project-{assets,events,matrix}-{desktop,mobile}` and `empty-project-viewer.png`.

---

## Stage 9: Assets And Events Tabs

Goal: the two remaining tab bodies, plus the row models that kill the double-compute.

- [x] `features/assets/asset-folder-tree.ts` — **one** implementation over `lib/tree.ts` replacing both identical sets (libraries 93-152, project detail 288-339).
- [x] `features/assets/asset-metadata.ts` — `assetExtensionFor`, `assetSourceLabelFor`; replaces both copies.
- [x] `features/assets/asset-cells.tsx` — `AssetNameCell`, `AssetPreviewCell({ asset, fallbackLabel, previewKeyPrefix })`. `fallbackLabel` carries the "Visual only" vs "Visual" divergence.
- [x] `features/project-workspace/assets-tab.tsx` — **`data-testid="project-asset-libraries"` stays on the same element** (1953).
- [x] `features/project-workspace/asset-library-rail.tsx` and `project-asset-table.tsx`.
- [x] `features/project-workspace/event-row-model.ts` — `EventRowModel` with `playbackCount` and `triggerCount` computed **once**, replacing the reduce that currently runs in both branches.
- [x] `features/project-workspace/events-tab.tsx`, `events-table.tsx` (2313-2371), `events-cards.tsx` (2381-2424) — two branches, one row model.

Stage gate:

- [x] Four gates green.
- [x] Event counts match between the desktop table and the mobile cards at the same breakpoint boundary.
- [x] Navigate into an asset folder, back up via breadcrumb, switch libraries, preview an asset, open an event.
- [x] Re-capture and diff `project-{assets,events}-{desktop,mobile}`, `event-list.png`, `asset-library-explorer-{list,tile}-view.png`.

---

## Stage 10: Workspace Dialogs And Delete Confirm

Goal: bring the project page to ~110 lines.

- [x] `features/project-workspace/delete-target.ts` — the `DeleteTarget` union, `deleteActionLabelFor` (227-238), and `cascadeSummaryFor` / `deleteBodyCopyFor` as **`switch` statements**, replacing the 18-line nested ternary chain (2467-2485) and the `startsWith("matrix")` sniff (2487).
- [x] `tests/delete-target-copy.test.ts` — table test **transcribed from the current source**, asserting byte-identical strings for all 8 discriminants. Write this **before** deleting the ternary chain.
- [x] `features/project-workspace/workspace-dialogs.tsx` — the **single** `<DialogOverlay align="end" open={request !== null}>` containing `ShareLinkDialog` plus six `FormDialog`s. One overlay node, not eight.
- [x] Move each dialog's form state (360-367) into its own small component inside this file, matching the `asset-authoring-dialogs.tsx` convention; each calls its own mutation.
- [x] `features/project-workspace/workspace-delete-confirm.tsx` — replaces 2450-2489 using `delete-target.ts` and the 9 `isPending` flags.
- [x] Reduce `app/projects/[projectId]/page.tsx` to the provider stack plus three early returns. Target ~110 lines.

Stage gate:

- [ ] Four gates green.
- [ ] Open all 8 dialogs; confirm only one overlay node exists in the DOM at a time.
- [ ] **Dialog stacking**: open the share dialog, click the delete link — the `ConfirmDialog` appears over the `DialogOverlay`.
- [ ] Delete each of the 7 target kinds; confirm cascade copy and the selection fallback after each.
- [ ] Re-capture and diff `overlay-popups-1.png` and `workspace-crud-project-creator-*`.

---

## Stage 11: Event Detail Page

Goal: memoize the 120-line inline lane builder and split the page.

- [x] `features/events/event-derivations.ts` (pure) — `locateEventInCollections`, `previewItemsByEventTriggerId`, `timelineMaxSecondsFor`, `timelinePlaybacksFor`, exported `timelineTailSeconds = 0.45`. Replaces 166-236.
- [x] `tests/event-derivations.test.ts` — 3-4 cases.
- [x] `features/events/event-timeline.tsx` — the lane builder (236-359) inside a `useMemo`. Wrap every `on*` in `useCallback` at the caller and include them in the deps.
- [x] This component is the sole `useAudioPreviewState()` subscriber, so the per-frame re-render collapses to one subtree.
- [x] `features/events/event-header.tsx`, `event-dialogs.tsx` (single `DialogOverlay` plus `ShareLinkDialog` plus 4 `FormDialog`s), `event-delete-confirms.tsx`.
- [x] Collapse the two parallel confirm mechanisms (`deleteEventIsOpen` boolean and `deleteTarget` union) into one.
- [x] Reduce the page to ~120 lines.

Stage gate:

- [x] Four gates green.
- [x] **Memo staleness**: add a playback, edit its offset, toggle a trigger, delete a lane — the timeline updates immediately each time.
- [x] Play a schedule; the playhead animates and `timeline-playhead` is present.
- [x] Re-capture and diff `project-events-{desktop,mobile}` and `event-playback-timeline.png`.

---

## Stage 12: Libraries Page

Goal: decompose without unifying with the project assets tab.

- [x] `features/libraries/use-library-selection.ts` — owns `?library=`, `?folder=`, `?view=` plus `goToFolder`, `goToLibrary`, `setView` over `lib/search-params.ts`; resolves `folderPath`, `selectedFolder`, `selectedLibrary`, `visibleItems` by calling the queries itself. Returns a plain object — **no context** (depth 2).
- [x] `library-rail.tsx`, `library-toolbar.tsx` — preserve the non-functional search input verbatim (no `value`, no `onChange`).
- [x] `library-asset-table.tsx` (669-757) and `library-asset-tiles.tsx` (759-848) — two branches sharing `asset-cells.tsx`, keeping all 6 columns and the tile layout as-is.
- [x] `library-dialogs.tsx` (860-884 via `FormDialog`), `library-delete-confirm.tsx` (906-945, nested ternaries becoming a local `switch`).
- [x] Keep the existing `LibrariesPage` Suspense wrapper. Reduce the page to ~100 lines.

Stage gate:

- [x] Four gates green.
- [x] Toggle list and tile views; create a library, a folder, and an asset; delete each of the 3 target kinds; confirm cascade copy.
- [x] Re-capture and diff `libraries-{list,tile}-{desktop,mobile}` and `asset-library-explorer-{list,tile}-view.png`.

---

## Stage 13: Projects List Page

Goal: flattest page; row-model extraction plus the create dialog.

- [x] `features/projects-list/project-folder-tree.ts` over `lib/tree.ts`.
- [x] `features/projects-list/project-row-model.ts` — replaces the near-identical root (245-265) and in-folder (268-288) mapping blocks with one derivation, killing the double-compute.
- [x] `projects-table.tsx` (726-760) and `projects-cards.tsx` (762-787) over one row model. Keep `MemberStack` and its hardcoded initials as-is.
- [x] `projects-toolbar.tsx` — preserve the `disabled` search input and its "Search arrives in a later slice" placeholder verbatim.
- [x] `create-project-dialog.tsx` — the preset picker, starter-event picker, and its own search state; calls `useCreateProjectMutation` itself.
- [x] `create-folder-dialog.tsx`, `projects-delete-confirm.tsx`.
- [x] Flash read via `readAndClearFlashMessage()` passed as `FeedbackProvider initialMessage`.
- [x] Keep the Suspense wrapper. Reduce the page to ~95 lines.

Stage gate:

- [x] Four gates green.
- [x] Create a folder and a project at root and inside a folder; delete both kinds; verify the flash message after a project delete.
- [x] Re-capture and diff `projects-{desktop,tablet,mobile}` and `workspace-crud-project-creator-{desktop,tablet}`.

---

## Stage 14: Share Preview Page

Goal: decompose into separate read-only components. **No `readOnly` prop on authenticated components.**

- [x] `share-preview-header.tsx` — reproduces the current hand-built header DOM (190-207). Do **not** convert to `PageHeader`.
- [x] `share-preview-device.tsx` (244-265).
- [x] `share-preview-event.tsx` (269-306), absorbing the 56-131 derivation chain into its own `useMemo`. Reuses `formatSeconds`, `timelineTailSeconds`, and the sort comparator, but keeps its own lane builder — the aggregate shapes and `meta` output genuinely differ.
- [x] `share-preview-matrix.tsx` (308-347), using `features/matrix/behavior.ts` for `behaviorCopy`.
- [x] Mount `AudioPreviewProvider`; keep using `AudioPreviewIconButton` in lane blocks.
- [x] Keep the page's stripped loading and error branches as-is — they intentionally differ from `PageStateScaffold`.
- [x] Reduce the page to ~85 lines.

Stage gate:

- [x] Four gates green.
- [x] Open a share link for each of the 3 target kinds; copy the link; play a lane on the event preview.
- [x] Diff against the Stage 0 share baselines.

---

## Stage 15: Cleanup

- [x] Delete `useCollisionMatrixQuery` and `useSharingLinkQuery` from `features/projects/queries.ts` — both are dead from the UI's perspective.
- [x] Confirm final page line counts against the plan's targets (~110 / ~120 / ~100 / ~95 / ~85).
- [x] Confirm no file in `features/` exceeds ~260 lines.
- [x] Confirm no snapshot tests of extracted components were added.

Stage gate:

- [x] Four gates green.
- [x] Full demo spine walked end to end per `docs/plan/STAKEHOLDER_DEMO_SCRIPT.md` after a demo reset.

---

## ADRs To Write

- [x] Context boundary policy: scope and UI state in context, server data via re-called query hooks; the `children` bailout rule and the split volatile-value / stable-actions shape.
- [x] Feature module layout: `lib/` is pure with no `@/domain`; `components/primitives/` has no data hooks; `features/<domain>/` may call query and mutation hooks.
- [x] Why the share preview keeps separate read-only components instead of a `readOnly` prop.
- [x] Why no generic table or record-list abstraction, and the row-model pattern adopted instead.

## Follow-Ups Deliberately Out Of Scope

Real issues found during analysis. Each is a behavior or visual change and must not ride inside a pure refactor.

- [ ] Sidebar heading says "Systems" where the canonical vocabulary is Device.
- [ ] `formatAssetDate` and `formatProjectDate` format the same kind of timestamp differently.
- [ ] The two page-level feedback banners use divergent markup for the same concept.
- [ ] The libraries search input is rendered but non-functional; the projects search input is rendered `disabled` with a placeholder promising a later slice.
- [ ] `LoadingState` ignores its `description` prop, so every page passes copy that never renders.
- [ ] The share page's "Open mobile preview" opens the identical route in a new tab; its summary table restates four values already in the header.
- [ ] The share route renders inside `WorkspaceShell`, so an unauthenticated viewer sees the app nav and the "Reset demo" button.
- [ ] Every mutation invalidates `projectQueryKeys.all`, making the preceding targeted invalidations dead weight; no mutation is optimistic.
- [ ] Convert the workspace tab bar to the existing unused `Tabs` primitive.
- [ ] Action menu placement can physically cover the next dense row's trigger; a positioning pass should keep one-click switching possible for adjacent rows too.
