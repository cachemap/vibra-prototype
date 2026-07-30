# Vibra Prototype Implementation Checklist

Source plan: `docs/plan/IMPLEMENTATION_PLAN.md`  
Source model: `docs/domain-model/MODEL.md`  
Design system: `docs/plan/DESIGN_SYSTEM.md`

## How To Work This Checklist

- Complete tasks top to bottom unless a later task is explicitly unblocked by existing work.
- Prefer one bounded checklist group per implementation pass.
- Leave the app runnable after each pass.
- Update `docs/adr/` when making an important architecture, domain, data, or UX decision.
- Update `docs/memory/` after each implementation pass with what changed, verification run, and next recommended tasks.
- Commit each completed pass.

## Status Legend

- `[ ]` Not started
- `[~]` In progress
- `[x]` Complete
- `[!]` Blocked

## Phase 0: Planning And Agent Harness

Goal: make future implementation work repeatable and safe.

- [x] Create `docs/adr/` if missing.
- [x] Create `docs/memory/` if missing.
- [x] Add `docs/adr/0001-prototype-architecture.md` covering client-first Next.js, IndexedDB/Dexie, seed-first demo data, and deferred backend concerns.
- [x] Add `docs/memory/0001-initial-planning.md` summarizing the plan, current repo state, and next implementation step.
- [x] Add `docs/plan/AI_HARNESS_SYSTEM_PROMPT.md`.
- [x] Add `docs/plan/DESIGN_SYSTEM.md`.
- [x] Confirm `docs/plan/IMPLEMENTATION_PLAN.md` points to `docs/domain-model/MODEL.md`.
- [x] Confirm `docs/plan/IMPLEMENTATION_PLAN.md` points to `docs/plan/DESIGN_SYSTEM.md`.
- [x] Confirm this checklist is organized into bounded implementation chunks.

Phase gate:

- [x] Planning docs exist and agree on the prototype direction.
- [x] ADR and memory conventions are documented.

## Phase 1: Walking Skeleton

Goal: create a runnable app with the routes and shell needed for vertical slices.

### 1.1 App Scaffold

- [x] Use pnpm as the package manager.
- [x] Add `packageManager` metadata for pnpm in `package.json`.
- [x] Scaffold or configure Next.js App Router.
- [x] Enable TypeScript strict mode.
- [x] Configure Tailwind CSS.
- [x] Install `@tanstack/react-query`.
- [x] Install `dexie`.
- [x] Install `neverthrow`.
- [x] Install `valibot`.
- [x] Install `lucide-react`.
- [x] Install/configure Vitest.
- [x] Install/configure Playwright.
- [x] Add scripts for `dev`, `build`, `typecheck`, `lint`, `test`, and `test:e2e`.

### 1.2 Component Primitive Foundation

- [x] Create `components/primitives/`.
- [x] Define a primitive styling approach that keeps most Tailwind utility stacks out of feature screens.
- [x] Build initial `Button` primitive.
- [x] Build initial `IconButton` primitive using lucide icons.
- [x] Build initial `TextInput` primitive.
- [x] Build initial `Select` primitive.
- [x] Build initial `Tabs` primitive.
- [x] Build initial `Dialog` or `Popover` primitive.
- [x] Build initial `Table` primitives for dense rows/cells.
- [x] Build `Breadcrumbs`.
- [x] Build `EmptyState`, `ErrorState`, and `LoadingState`.
- [x] Use primitives in route placeholders instead of one-off Tailwind-heavy markup.

### 1.3 Route Shell

- [x] Create `app/layout.tsx`.
- [x] Create `app/page.tsx` that redirects or links directly into `/projects`.
- [x] Create `app/projects/page.tsx`.
- [x] Create `app/projects/[projectId]/page.tsx`.
- [x] Create `app/libraries/page.tsx`.
- [x] Create `app/share/[shareToken]/page.tsx`.
- [x] Add a compact top bar.
- [x] Add a workspace left rail placeholder for project screens.
- [x] Add loading, empty, and error state placeholders.
- [x] Add TanStack Query provider wiring.

Phase gate:

- [x] `pnpm dev` starts.
- [x] Core routes render without crashing.
- [x] Core primitives render in the route shell.
- [x] `pnpm typecheck` passes.
- [x] `pnpm lint` passes, or lint setup status is documented.

## Phase 2: Domain Kernel

Goal: encode the domain model before persistence and UI logic depend on it.

### 2.1 Types And Vocabularies

- [x] Add `domain/ids.ts` with typed ID helpers.
- [x] Add `domain/enums.ts` for platform names: `iOS`, `Windows`, `Mac`, `Linux`, `Android`.
- [x] Add trigger names: `onHover`, `onPress`, `onRelease`, `onHold`.
- [x] Add event types: `Button`, `Toggle`, `Banner`, `Toast`.
- [x] Add resolution behaviors: `Preempt`, `Queue`, `Co-play`, `Suppress`, `Not possible`.
- [x] Add media kinds: `audio`, `haptic`.
- [x] Add `domain/entities.ts` for all persisted entities in the model.
- [x] Store timestamps as ISO strings in domain types.
- [x] Represent share targets as a discriminated union.

### 2.2 Validation And Errors

- [x] Add Valibot schemas for fixed vocabularies.
- [x] Add Valibot schemas for persisted entities.
- [x] Add Valibot schemas for command inputs used by create/update flows.
- [x] Add Valibot schema for share route params.
- [x] Add `domain/errors.ts` with `ValidationError`.
- [x] Add `NotFoundError`.
- [x] Add `ConflictError`.
- [x] Add `ConstraintError`.
- [x] Add `PersistenceError`.
- [x] Add `UnsupportedMediaError`.
- [x] Add `ShareLinkError`.
- [x] Add shared `AppError`.
- [x] Add neverthrow result aliases and query unwrap helpers.
- [x] Add user-facing error message mapping.

### 2.3 Rule Functions

- [x] Enforce project folders cannot contain child folders and projects at the same time.
- [x] Allow empty leaf project folders.
- [x] Enforce project creation creates one default asset library and root folder.
- [x] Enforce project cannot import its own default asset library.
- [x] Enforce device creation creates one collision matrix.
- [x] Enforce unique device per project/platform/name.
- [x] Enforce collections are flat.
- [x] Enforce unique event-trigger binding per event/trigger.
- [x] Enforce disabled event triggers do not fire in preview.
- [x] Enforce trigger playback offsets are non-negative.
- [x] Enforce playback assets come from the project default library or imported libraries.
- [x] Enforce asset folders cannot mix assets and child folders.
- [x] Enforce matrix row/column events belong to the selected device.
- [x] Enforce matrix entries require selected row and column membership.
- [x] Enforce unique matrix entry per playing/incoming pair.
- [x] Enforce `Suppress` requires a target.
- [x] Enforce resolution target is the playing or incoming event.
- [x] Enforce sharing link target exclusivity.

Phase gate:

- [x] Unit tests cover all fixed vocabularies.
- [x] Unit tests cover folder leaf rules.
- [x] Unit tests cover trigger uniqueness and playback offset rules.
- [x] Unit tests cover asset eligibility.
- [x] Unit tests cover matrix membership and target rules.
- [x] `pnpm typecheck` passes.
- [x] `pnpm test` passes for domain tests.

## Phase 3: IndexedDB Persistence And Seed Data

Goal: make the prototype self-contained with realistic seeded data.

### 3.1 Dexie Schema

- [x] Add `data/db.ts`.
- [x] Add `users` store.
- [x] Add `folders` store.
- [x] Add `folderAccess` store.
- [x] Add `projects` store.
- [x] Add `platforms` store.
- [x] Add `devices` store.
- [x] Add `collisionMatrices` store.
- [x] Add `collisionMatrixRows` store.
- [x] Add `collisionMatrixColumns` store.
- [x] Add `collisionMatrixEntries` store.
- [x] Add `collections` store.
- [x] Add `events` store.
- [x] Add `triggers` store.
- [x] Add `eventTriggers` store.
- [x] Add `triggerPlaybacks` store.
- [x] Add `assetLibraries` store.
- [x] Add `projectAssetLibraryImports` store.
- [x] Add `assetLibraryFolders` store.
- [x] Add `assets` store.
- [x] Add `sharingLinks` store.
- [x] Add schema versioning/migration notes.

### 3.2 Seed And Reset

- [x] Add one prototype user.
- [x] Seed platform catalog rows.
- [x] Seed trigger catalog rows.
- [x] Seed two accessible top-level project folders.
- [x] Seed nested folders.
- [x] Seed one empty leaf folder.
- [x] Seed at least two projects.
- [x] Seed each project's default asset library and root folder.
- [x] Seed iOS and Android devices for one project.
- [x] Seed one disabled device.
- [x] Seed multiple collections per device.
- [x] Seed Button, Toggle, Banner, and Toast events.
- [x] Seed enabled and disabled event triggers.
- [x] Seed trigger playbacks with different offsets.
- [x] Seed audio and haptic assets.
- [x] Seed one imported asset library.
- [x] Seed nested asset folders with icons.
- [x] Seed collision matrix rows and columns.
- [x] Seed collision entries for multiple behavior types.
- [x] Seed share links for a project, event, and matrix entry.
- [x] Seed only when the database is empty.
- [x] Add a reset/reseed utility.

### 3.3 Repositories And Query Hooks

- [x] Implement project tree loading.
- [x] Implement project creation with default library/root folder creation.
- [x] Implement project workspace loading.
- [x] Implement device creation with collision matrix creation.
- [x] Implement device workspace loading.
- [x] Implement collection and event create/update.
- [x] Implement event trigger and playback create/update/delete.
- [x] Implement asset library tree loading.
- [x] Implement asset library folder and asset create flows.
- [x] Implement library import flow.
- [x] Implement collision matrix loading and entry updates.
- [x] Implement share link generation and lookup.
- [x] Validate IndexedDB reads before returning domain objects.
- [x] Convert unknown persistence failures into `PersistenceError`.
- [x] Add TanStack Query keys for each aggregate.
- [x] Add mutation invalidation for each create/update flow.

Phase gate:

- [x] Fresh browser seeds automatically.
- [x] Demo reset/reseed works.
- [x] Query hooks load project tree, project workspace, device workspace, asset libraries, collision matrix, and share links.
- [x] Repository tests cover dependent creation flows.
- [x] `pnpm test` passes for repository tests.

## Phase 4: Projects Vertical Slice

Goal: make `/projects` demoable.

- [x] Build project folder breadcrumb.
- [x] Build folder/project table.
- [x] Build accessible top-level folder view for the prototype user.
- [x] Support nested folder browsing.
- [x] Render empty leaf folders intentionally.
- [x] Build create folder dialog.
- [x] Build create project dialog.
- [x] Hide or disable invalid folder/project creation actions where possible.
- [x] Show typed validation errors when invalid actions are attempted.
- [x] Show default asset library after project creation.
- [x] Apply visual direction from `design-screenshots/project-folder-explorer.png`.
- [x] Add Playwright smoke test for browsing folders.
- [x] Add Playwright smoke test for creating a project.

Phase gate:

- [x] User can browse seeded folders.
- [x] User can create a valid empty folder.
- [x] User can create a valid project.
- [x] Folder leaf rules are enforced in UI and service logic.
- [x] Project creation is visible immediately after mutation.

## Phase 5: Device And Event Vertical Slice

Goal: configure platform-specific sound/haptic events.

### 5.1 Device And Collection Workspace

- [x] Build project header.
- [x] Build device selector or tabs.
- [x] Build create device flow.
- [x] Build enabled/disabled device switch.
- [x] Mark disabled devices as excluded from playback/export.
- [x] Build collection sidebar.
- [x] Build create/edit collection flow.
- [x] Ensure collections are scoped to the selected device.
- [x] Apply visual direction from `empty-project-viewer.png` and `event-list.png`.

### 5.2 Events And Trigger Scheduling

- [x] Build event table.
- [x] Build create/edit event flow.
- [x] Add event type selection.
- [x] Build event details/editor panel.
- [x] Build trigger binding list.
- [x] Add trigger selector.
- [x] Add optional trigger label field.
- [x] Add trigger enabled/disabled switch.
- [x] Build playback schedule editor.
- [x] Add asset picker entry point.
- [x] Add start offset input.
- [x] Show audio/haptic media kind per playback.
- [x] Build deterministic timeline preview.
- [x] Sort preview playbacks by `startOffset`.
- [x] Explain disabled triggers in preview.
- [x] Apply visual direction from `event-playback-timeline.png`.

Phase gate:

- [x] User can add/edit devices, collections, events, triggers, and playbacks.
- [x] Duplicate device rule is enforced.
- [x] Trigger uniqueness rule is enforced.
- [x] Playback offset validation is enforced.
- [x] Preview shows scheduled audio/haptic feedback clearly.
- [x] Playwright smoke test covers creating an event with a playback.

## Phase 6: Asset Libraries Vertical Slice

Goal: make reusable sound/haptic libraries usable in event scheduling.

- [x] Build `/libraries` route UI.
- [x] Build project asset library panel.
- [x] Show default library indicator.
- [x] Show imported library indicator.
- [x] Build asset library list.
- [x] Build folder tree or breadcrumb.
- [x] Build list view for assets/folders.
- [x] Build tile view for assets/folders.
- [x] Build create asset library flow.
- [x] Build create asset folder flow.
- [x] Build mock upload/create asset flow for audio and haptic assets.
- [x] Store asset metadata in IndexedDB.
- [x] Persist asset blobs or use stable prototype playback URLs.
- [x] Build import library flow.
- [x] Prevent importing a project's own default library.
- [x] Prevent asset folders from mixing child folders and assets.
- [x] Integrate asset picker with trigger playback editor.
- [x] Enforce asset eligibility for playback selection.
- [x] Apply visual direction from asset library screenshots and overlay screenshots.

Phase gate:

- [x] User can browse default and imported libraries.
- [x] User can create folders and assets.
- [x] User can import another library.
- [x] Imported assets can be selected for event playbacks.
- [x] Asset folder and import constraints are enforced.
- [x] Playwright smoke test covers importing a library and selecting an asset.

## Phase 7: Collision Matrix Vertical Slice

Goal: configure overlap behavior between device-specific events.

- [x] Build collision matrix tab/view in project workspace.
- [x] Load candidates from events belonging to the selected device.
- [x] Build playing row selector.
- [x] Build incoming column selector.
- [x] Build matrix grid.
- [x] Build unset cell state.
- [x] Build behavior pill states for all behavior names.
- [x] Map `Not possible` to the N/A visual treatment.
- [x] Build selected row/column/cell state.
- [x] Build resolution behavior editor.
- [x] Build target selector for `Suppress`.
- [x] Validate row membership before entry creation.
- [x] Validate column membership before entry creation.
- [x] Reject duplicate playing/incoming entries.
- [x] Persist matrix changes.
- [x] Add matrix entry share action entry point.
- [x] Apply visual direction from `collision-matrix.png` and `matrix-cells.png`.

Phase gate:

- [x] User can select rows and columns.
- [x] User can configure a valid matrix entry.
- [x] `Suppress` target validation works.
- [x] Matrix changes survive reload.
- [x] Playwright smoke test covers configuring a matrix entry.

## Phase 8: Sharing And Mobile Preview

Goal: demonstrate distribution of sound/haptic systems through generated links.

- [x] Build share link dialog.
- [x] Generate project share links.
- [x] Generate event share links.
- [x] Generate collision matrix entry share links.
- [x] Copy generated links.
- [x] Build `/share/[shareToken]` lookup.
- [x] Render invalid share link state.
- [x] Render project target summary.
- [x] Render event target summary.
- [x] Render matrix entry target summary.
- [x] Add playback preview to event share page.
- [x] Explain disabled device/trigger behavior in share previews.
- [x] Apply visual direction from overlay popup screenshots.
- [x] Add Playwright smoke test for generating and opening a share link.

Phase gate:

- [x] User can create each share link type.
- [x] Generated links resolve after page reload.
- [x] Invalid links fail gracefully.
- [x] Share pages are useful as stakeholder demo artifacts.

## Phase 9: Real Asset Upload And Audio Preview

Goal: replace metadata-only asset creation and visual-only sound previews with real upload and browser audio playback.

### 9.1 Asset Binary Persistence

- [x] Decide whether to store uploaded Blobs on `assets` or in a companion `assetBlobs` IndexedDB store.
- [x] Add Dexie schema migration notes for uploaded asset binary persistence.
- [x] Add repository write support for storing uploaded audio and haptic files.
- [x] Add repository read support for returning browser-usable audio playback URLs.
- [x] Revoke generated object URLs from preview components when no longer needed.
- [x] Preserve existing seeded prototype playback URLs or replace them with seeded browser-playable fixtures.
- [x] Add tests for uploaded asset persistence after reload.
- [x] Add tests for missing/corrupt asset blob error handling.

### 9.2 Real Upload Flow

- [x] Replace mock create-asset controls in `/libraries` with file upload controls.
- [x] Accept audio uploads for browser playback.
- [x] Accept haptic uploads for storage, picking, and visual timeline previews.
- [x] Validate uploaded media kind from MIME type and/or extension.
- [x] Reject unsupported file types with typed user-facing errors.
- [x] Keep asset-folder leaf constraints enforced before upload.
- [x] Store original filename, upload date, media kind, and playback URL/blob reference.
- [x] Keep seeded/mock asset creation available only as a dev/demo helper if still needed.
- [x] Update asset list and tile views to distinguish uploaded audio, uploaded haptic, and seeded/demo assets.
- [x] Add Playwright smoke coverage for uploading an audio fixture.
- [x] Add Playwright smoke coverage for uploading a haptic fixture.

### 9.3 Browser Audio Preview

- [x] Add play/stop controls for audio assets in the asset browser.
- [x] Add play/stop controls for scheduled audio rows in the event timeline preview.
- [x] Add play/stop controls for scheduled audio rows in event share previews.
- [x] Schedule preview audio playback by `startOffset` after a user-initiated play action.
- [x] Skip disabled trigger bindings during audio preview.
- [x] Skip disabled devices during project/share preview playback.
- [x] Keep haptic playbacks visual-only in browser previews.
- [x] Stop or replace any active preview run before starting a new one.
- [x] Surface playback errors when an audio file cannot be decoded or loaded.
- [x] Add Playwright smoke coverage for selecting an uploaded audio asset in a trigger playback.
- [x] Add Playwright smoke coverage for the user-initiated preview control path.

Phase gate:

- [x] Uploaded audio assets persist after reload.
- [x] Uploaded haptic assets persist after reload and remain selectable.
- [x] Uploaded audio can be scheduled on an event trigger.
- [x] Event timeline preview plays scheduled audio in offset order after user action.
- [x] Event share preview plays scheduled audio after user action.
- [x] Demo reset/reseed restores canonical browser-playable audio assets.
- [x] Repository and smoke tests cover the upload/playback path.

## Phase 10: Visual System And Demo Hardening

Goal: make the prototype feel polished enough for stakeholder review.

### 10.1 Primitive Visual System

- [x] Define Tailwind color tokens from `color-palette.png`.
- [x] Harden `Button` against all screenshot states.
- [x] Harden `IconButton` against all screenshot states.
- [x] Harden `TextInput` against all screenshot states.
- [x] Harden `Select` against all screenshot states.
- [x] Build `Checkbox`.
- [x] Build `Switch`.
- [x] Harden `Tabs` against all screenshot states.
- [x] Harden `Dialog` against all screenshot states.
- [x] Harden `Popover` against all screenshot states.
- [x] Build `Tooltip`.
- [x] Build `Menu`.
- [x] Harden `Table` against all screenshot states.
- [x] Harden `Breadcrumbs` against all screenshot states.
- [x] Harden `EmptyState`, `ErrorState`, and `LoadingState`.
- [x] Use lucide icons in icon buttons and row actions.

### 10.2 Screen Polish

- [x] Start the app locally for a Codex-driven visual audit.
- [x] Use Codex browser screenshots to capture `/projects` on desktop.
- [x] Use Codex browser screenshots to capture `/projects` on mobile.
- [x] Use Codex browser screenshots to capture project `Events` on desktop and mobile.
- [x] Use Codex browser screenshots to capture project `Assets` on desktop and mobile.
- [x] Use Codex browser screenshots to capture project `Matrix` on desktop and mobile.
- [x] Use Codex browser screenshots to capture `/libraries` list and tile views.
- [x] Use Codex browser screenshots to capture share project, share event, and share matrix views.
- [x] Audit screenshots for redundant navigation and repeated labels, including project explorer repetition.
- [x] Audit screenshots for toolbar/header controls that do not support the current view.
- [x] Audit screenshots for layout shifts from status/readout regions.
- [x] Audit asset library screenshots for clear navigation into folders and assets.
- [x] Audit timeline screenshots for believable waveform lanes at distinct playback offsets.
- [x] Audit matrix screenshots for clear `Playing` and `Incoming` axes, compact cells, icons, labels, and selected states.
- [x] Write `docs/plan/VISUAL_AUDIT_IMPLEMENTATION_PLAN.md` with findings, affected views, proposed fixes, acceptance criteria, and implementation order.
- [x] Write `docs/plan/VISUAL_AUDIT_CHECKLIST.md` with bounded follow-up tasks generated from the screenshot findings.
- [x] Match `/projects` to `project-folder-explorer.png`.
- [x] Match empty project workspace to `empty-project-viewer.png`.
- [x] Match event list to `event-list.png`.
- [x] Match timeline editor to `event-playback-timeline.png`.
- [x] Match asset list and tile views to asset library screenshots.
- [x] Match matrix editor to matrix screenshots.
- [x] Match dialogs/popovers/pickers to overlay screenshots.
- [x] Check desktop viewport.
- [x] Check tablet viewport.
- [x] Check mobile viewport.
- [x] Confirm button text does not overflow.
- [x] Confirm table text does not overlap.
- [x] Confirm dialogs fit their content.
- [x] Confirm hover/focus/loading states do not shift layout.

### 10.3 Demo Reliability

- [x] Add visible demo reset/reseed control.
- [x] Add stakeholder demo script.
- [x] Document known prototype limitations.
- [x] Ensure fresh browser loads seeded data.
- [x] Ensure full demo spine has no console errors.
- [x] Run Playwright smoke suite.
- [x] Capture or document main screen screenshots for QA.

Final gate:

- [x] Fresh checkout can start the app.
- [x] Fresh browser can complete the product demo spine.
- [x] Core domain rules have tests.
- [x] Core screens have smoke tests.
- [x] Demo reset/reseed is reliable.
- [x] ADRs and memory notes are current.

## Phase 11: Workspace Authoring And CRUD

Detailed plan: `docs/plan/WORKSPACE_CRUD_IMPLEMENTATION_PLAN.md`  
Detailed checklist: `docs/plan/WORKSPACE_CRUD_CHECKLIST.md`

- [x] 11.1 Relax folder containment in the domain model and rules.
- [x] 11.2 Make the header breadcrumb stationary across all routes.
- [x] 11.3 Rebuild the project creator with a device preset picker.
- [x] 11.4 Allow folder, project, and asset creation at any level.
- [x] 11.5 Add delete for every user-visible entity with cascade safety.

## Phase 12: Component Decomposition And Context Layer

Detailed plan: `docs/plan/COMPONENT_DECOMPOSITION_PLAN.md`  
Detailed checklist: `docs/plan/COMPONENT_DECOMPOSITION_CHECKLIST.md`

Goal: split the five page-dense routes (5,914 lines) into feature modules organized by data dependency, using TanStack Query cache sharing and React context instead of prop drilling.

**This is a pure refactor.** No copy, DOM structure, class string, ARIA attribute, or test id changes. Anything worth fixing goes to the follow-up list in the detailed checklist, not into a commit.

One commit per stage, each independently green against all four gates plus the structural greps. Stages 12.11-12.14 are independent of each other and of 12.7-12.10, so they may run in parallel once 12.6 lands.

- [x] 12.0 Capture baselines: test ids, ARIA/role grep, page line counts, projects-list and share captures.
- [x] 12.1 Add `lib/` pure utilities plus unit tests, no call sites changed.
- [x] 12.2 Adopt `lib/` utilities across the pages.
- [x] 12.3 Add `Badge`, `FormDialog`, `PageStateScaffold`, and `RowActionsMenu` primitives.
- [x] 12.4 Adopt the new primitives at existing call sites; delete the 7 menu-open state slots.
- [x] 12.5 Extract `features/sharing/` from its verbatim duplication across two pages.
- [x] 12.6 Add the feedback and audio-preview contexts; `runWithFeedback` replaces ~25 try/catch blocks.
- [x] 12.7 Extract `features/matrix/`, keeping the 6 matrix fields on the page as props.
- [ ] 12.8 Extract the workspace scope context, header, sidebar, and tab bar; move the matrix fields into the context.
- [ ] 12.9 Extract the assets and events tabs plus their row models.
- [ ] 12.10 Extract the workspace dialogs and delete confirm; the project page reaches ~110 lines.
- [ ] 12.11 Decompose the event detail page; memoize `timelineLanes`.
- [ ] 12.12 Decompose the libraries page plus shared `features/assets/*`.
- [ ] 12.13 Decompose the projects list page.
- [ ] 12.14 Decompose the share preview page.
- [ ] 12.15 Cleanup: remove `useCollisionMatrixQuery` and `useSharingLinkQuery`; confirm line-count targets.

Phase gate:

- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm test:e2e` green.
- [ ] `data-testid` grep still yields exactly 6 results, unchanged.
- [ ] ARIA/role grep matches the 12.0 baseline.
- [ ] Visual captures diff clean against the 12.0 and `docs/plan/visual-audit-captures/` baselines.
- [ ] Matrix cell selection survives tab switches; schedule playback animates without stutter; both flash-message channels work.
- [ ] No page over ~120 lines and no file in `features/` over ~260 lines.
- [ ] The four ADRs from the detailed plan are written.
- [ ] Out-of-scope follow-ups are recorded, not implemented.
