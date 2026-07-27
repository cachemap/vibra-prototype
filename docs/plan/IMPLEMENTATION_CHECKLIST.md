# Vibra Prototype Implementation Checklist

Source plan: `docs/plan/IMPLEMENTATION_PLAN.md`  
Source model: `docs/domain-model/MODEL.md`

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

- [ ] Create `docs/adr/` if missing.
- [ ] Create `docs/memory/` if missing.
- [ ] Add `docs/adr/0001-prototype-architecture.md` covering client-first Next.js, IndexedDB/Dexie, seed-first demo data, and deferred backend concerns.
- [ ] Add `docs/memory/0001-initial-planning.md` summarizing the plan, current repo state, and next implementation step.
- [ ] Add `docs/plan/AI_HARNESS_SYSTEM_PROMPT.md`.
- [ ] Confirm `docs/plan/IMPLEMENTATION_PLAN.md` points to `docs/domain-model/MODEL.md`.
- [ ] Confirm this checklist is organized into bounded implementation chunks.

Phase gate:

- [ ] Planning docs exist and agree on the prototype direction.
- [ ] ADR and memory conventions are documented.

## Phase 1: Walking Skeleton

Goal: create a runnable app with the routes and shell needed for vertical slices.

### 1.1 App Scaffold

- [ ] Identify the package manager used by the repo, or choose npm if none exists.
- [ ] Scaffold or configure Next.js App Router.
- [ ] Enable TypeScript strict mode.
- [ ] Configure Tailwind CSS.
- [ ] Install `@tanstack/react-query`.
- [ ] Install `dexie`.
- [ ] Install `neverthrow`.
- [ ] Install `valibot`.
- [ ] Install `lucide-react`.
- [ ] Install/configure Vitest.
- [ ] Install/configure Playwright.
- [ ] Add scripts for `dev`, `build`, `typecheck`, `lint`, `test`, and `test:e2e`.

### 1.2 Route Shell

- [ ] Create `app/layout.tsx`.
- [ ] Create `app/page.tsx` that redirects or links directly into `/projects`.
- [ ] Create `app/projects/page.tsx`.
- [ ] Create `app/projects/[projectId]/page.tsx`.
- [ ] Create `app/libraries/page.tsx`.
- [ ] Create `app/share/[shareToken]/page.tsx`.
- [ ] Add a compact top bar.
- [ ] Add a workspace left rail placeholder for project screens.
- [ ] Add loading, empty, and error state placeholders.
- [ ] Add TanStack Query provider wiring.

Phase gate:

- [ ] `npm run dev` starts.
- [ ] Core routes render without crashing.
- [ ] `npm run typecheck` passes.
- [ ] `npm run lint` passes, or lint setup status is documented.

## Phase 2: Domain Kernel

Goal: encode the domain model before persistence and UI logic depend on it.

### 2.1 Types And Vocabularies

- [ ] Add `domain/ids.ts` with typed ID helpers.
- [ ] Add `domain/enums.ts` for platform names: `iOS`, `Windows`, `Mac`, `Linux`, `Android`.
- [ ] Add trigger names: `onHover`, `onPress`, `onRelease`, `onHold`.
- [ ] Add event types: `Button`, `Toggle`, `Banner`, `Toast`.
- [ ] Add resolution behaviors: `Preempt`, `Queue`, `Co-play`, `Suppress`, `Not possible`.
- [ ] Add media kinds: `audio`, `haptic`.
- [ ] Add `domain/entities.ts` for all persisted entities in the model.
- [ ] Store timestamps as ISO strings in domain types.
- [ ] Represent share targets as a discriminated union.

### 2.2 Validation And Errors

- [ ] Add Valibot schemas for fixed vocabularies.
- [ ] Add Valibot schemas for persisted entities.
- [ ] Add Valibot schemas for command inputs used by create/update flows.
- [ ] Add Valibot schema for share route params.
- [ ] Add `domain/errors.ts` with `ValidationError`.
- [ ] Add `NotFoundError`.
- [ ] Add `ConflictError`.
- [ ] Add `ConstraintError`.
- [ ] Add `PersistenceError`.
- [ ] Add `UnsupportedMediaError`.
- [ ] Add `ShareLinkError`.
- [ ] Add shared `AppError`.
- [ ] Add neverthrow result aliases and query unwrap helpers.
- [ ] Add user-facing error message mapping.

### 2.3 Rule Functions

- [ ] Enforce project folders cannot contain child folders and projects at the same time.
- [ ] Allow empty leaf project folders.
- [ ] Enforce project creation creates one default asset library and root folder.
- [ ] Enforce project cannot import its own default asset library.
- [ ] Enforce device creation creates one collision matrix.
- [ ] Enforce unique device per project/platform/name.
- [ ] Enforce collections are flat.
- [ ] Enforce unique event-trigger binding per event/trigger.
- [ ] Enforce disabled event triggers do not fire in preview.
- [ ] Enforce trigger playback offsets are non-negative.
- [ ] Enforce playback assets come from the project default library or imported libraries.
- [ ] Enforce asset folders cannot mix assets and child folders.
- [ ] Enforce matrix row/column events belong to the selected device.
- [ ] Enforce matrix entries require selected row and column membership.
- [ ] Enforce unique matrix entry per playing/incoming pair.
- [ ] Enforce `Suppress` requires a target.
- [ ] Enforce resolution target is the playing or incoming event.
- [ ] Enforce sharing link target exclusivity.

Phase gate:

- [ ] Unit tests cover all fixed vocabularies.
- [ ] Unit tests cover folder leaf rules.
- [ ] Unit tests cover trigger uniqueness and playback offset rules.
- [ ] Unit tests cover asset eligibility.
- [ ] Unit tests cover matrix membership and target rules.
- [ ] `npm run typecheck` passes.
- [ ] `npm test` passes for domain tests.

## Phase 3: IndexedDB Persistence And Seed Data

Goal: make the prototype self-contained with realistic seeded data.

### 3.1 Dexie Schema

- [ ] Add `data/db.ts`.
- [ ] Add `users` store.
- [ ] Add `folders` store.
- [ ] Add `folderAccess` store.
- [ ] Add `projects` store.
- [ ] Add `platforms` store.
- [ ] Add `devices` store.
- [ ] Add `collisionMatrices` store.
- [ ] Add `collisionMatrixRows` store.
- [ ] Add `collisionMatrixColumns` store.
- [ ] Add `collisionMatrixEntries` store.
- [ ] Add `collections` store.
- [ ] Add `events` store.
- [ ] Add `triggers` store.
- [ ] Add `eventTriggers` store.
- [ ] Add `triggerPlaybacks` store.
- [ ] Add `assetLibraries` store.
- [ ] Add `projectAssetLibraryImports` store.
- [ ] Add `assetLibraryFolders` store.
- [ ] Add `assets` store.
- [ ] Add `sharingLinks` store.
- [ ] Add schema versioning/migration notes.

### 3.2 Seed And Reset

- [ ] Add one prototype user.
- [ ] Seed platform catalog rows.
- [ ] Seed trigger catalog rows.
- [ ] Seed two accessible top-level project folders.
- [ ] Seed nested folders.
- [ ] Seed one empty leaf folder.
- [ ] Seed at least two projects.
- [ ] Seed each project's default asset library and root folder.
- [ ] Seed iOS and Android devices for one project.
- [ ] Seed one disabled device.
- [ ] Seed multiple collections per device.
- [ ] Seed Button, Toggle, Banner, and Toast events.
- [ ] Seed enabled and disabled event triggers.
- [ ] Seed trigger playbacks with different offsets.
- [ ] Seed audio and haptic assets.
- [ ] Seed one imported asset library.
- [ ] Seed nested asset folders with icons.
- [ ] Seed collision matrix rows and columns.
- [ ] Seed collision entries for multiple behavior types.
- [ ] Seed share links for a project, event, and matrix entry.
- [ ] Seed only when the database is empty.
- [ ] Add a reset/reseed utility.

### 3.3 Repositories And Query Hooks

- [ ] Implement project tree loading.
- [ ] Implement project creation with default library/root folder creation.
- [ ] Implement project workspace loading.
- [ ] Implement device creation with collision matrix creation.
- [ ] Implement device workspace loading.
- [ ] Implement collection and event create/update.
- [ ] Implement event trigger and playback create/update/delete.
- [ ] Implement asset library tree loading.
- [ ] Implement asset library folder and asset create flows.
- [ ] Implement library import flow.
- [ ] Implement collision matrix loading and entry updates.
- [ ] Implement share link generation and lookup.
- [ ] Validate IndexedDB reads before returning domain objects.
- [ ] Convert unknown persistence failures into `PersistenceError`.
- [ ] Add TanStack Query keys for each aggregate.
- [ ] Add mutation invalidation for each create/update flow.

Phase gate:

- [ ] Fresh browser seeds automatically.
- [ ] Demo reset/reseed works.
- [ ] Query hooks load project tree, project workspace, device workspace, asset libraries, collision matrix, and share links.
- [ ] Repository tests cover dependent creation flows.
- [ ] `npm test` passes for repository tests.

## Phase 4: Projects Vertical Slice

Goal: make `/projects` demoable.

- [ ] Build project folder breadcrumb.
- [ ] Build folder/project table.
- [ ] Build accessible top-level folder view for the prototype user.
- [ ] Support nested folder browsing.
- [ ] Render empty leaf folders intentionally.
- [ ] Build create folder dialog.
- [ ] Build create project dialog.
- [ ] Hide or disable invalid folder/project creation actions where possible.
- [ ] Show typed validation errors when invalid actions are attempted.
- [ ] Show default asset library after project creation.
- [ ] Apply visual direction from `design-screenshots/project-folder-explorer.png`.
- [ ] Add Playwright smoke test for browsing folders.
- [ ] Add Playwright smoke test for creating a project.

Phase gate:

- [ ] User can browse seeded folders.
- [ ] User can create a valid empty folder.
- [ ] User can create a valid project.
- [ ] Folder leaf rules are enforced in UI and service logic.
- [ ] Project creation is visible immediately after mutation.

## Phase 5: Device And Event Vertical Slice

Goal: configure platform-specific sound/haptic events.

### 5.1 Device And Collection Workspace

- [ ] Build project header.
- [ ] Build device selector or tabs.
- [ ] Build create device flow.
- [ ] Build enabled/disabled device switch.
- [ ] Mark disabled devices as excluded from playback/export.
- [ ] Build collection sidebar.
- [ ] Build create/edit collection flow.
- [ ] Ensure collections are scoped to the selected device.
- [ ] Apply visual direction from `empty-project-viewer.png` and `event-list.png`.

### 5.2 Events And Trigger Scheduling

- [ ] Build event table.
- [ ] Build create/edit event flow.
- [ ] Add event type selection.
- [ ] Build event details/editor panel.
- [ ] Build trigger binding list.
- [ ] Add trigger selector.
- [ ] Add optional trigger label field.
- [ ] Add trigger enabled/disabled switch.
- [ ] Build playback schedule editor.
- [ ] Add asset picker entry point.
- [ ] Add start offset input.
- [ ] Show audio/haptic media kind per playback.
- [ ] Build deterministic timeline preview.
- [ ] Sort preview playbacks by `startOffset`.
- [ ] Explain disabled triggers in preview.
- [ ] Apply visual direction from `event-playback-timeline.png`.

Phase gate:

- [ ] User can add/edit devices, collections, events, triggers, and playbacks.
- [ ] Duplicate device rule is enforced.
- [ ] Trigger uniqueness rule is enforced.
- [ ] Playback offset validation is enforced.
- [ ] Preview shows scheduled audio/haptic feedback clearly.
- [ ] Playwright smoke test covers creating an event with a playback.

## Phase 6: Asset Libraries Vertical Slice

Goal: make reusable sound/haptic libraries usable in event scheduling.

- [ ] Build `/libraries` route UI.
- [ ] Build project asset library panel.
- [ ] Show default library indicator.
- [ ] Show imported library indicator.
- [ ] Build asset library list.
- [ ] Build folder tree or breadcrumb.
- [ ] Build list view for assets/folders.
- [ ] Build tile view for assets/folders.
- [ ] Build create asset library flow.
- [ ] Build create asset folder flow.
- [ ] Build mock upload/create asset flow for audio and haptic assets.
- [ ] Store asset metadata in IndexedDB.
- [ ] Persist asset blobs or use stable prototype playback URLs.
- [ ] Build import library flow.
- [ ] Prevent importing a project's own default library.
- [ ] Prevent asset folders from mixing child folders and assets.
- [ ] Integrate asset picker with trigger playback editor.
- [ ] Enforce asset eligibility for playback selection.
- [ ] Apply visual direction from asset library screenshots and overlay screenshots.

Phase gate:

- [ ] User can browse default and imported libraries.
- [ ] User can create folders and assets.
- [ ] User can import another library.
- [ ] Imported assets can be selected for event playbacks.
- [ ] Asset folder and import constraints are enforced.
- [ ] Playwright smoke test covers importing a library and selecting an asset.

## Phase 7: Collision Matrix Vertical Slice

Goal: configure overlap behavior between device-specific events.

- [ ] Build collision matrix tab/view in project workspace.
- [ ] Load candidates from events belonging to the selected device.
- [ ] Build playing row selector.
- [ ] Build incoming column selector.
- [ ] Build matrix grid.
- [ ] Build unset cell state.
- [ ] Build behavior pill states for all behavior names.
- [ ] Map `Not possible` to the N/A visual treatment.
- [ ] Build selected row/column/cell state.
- [ ] Build resolution behavior editor.
- [ ] Build target selector for `Suppress`.
- [ ] Validate row membership before entry creation.
- [ ] Validate column membership before entry creation.
- [ ] Reject duplicate playing/incoming entries.
- [ ] Persist matrix changes.
- [ ] Add matrix entry share action entry point.
- [ ] Apply visual direction from `collision-matrix.png` and `matrix-cells.png`.

Phase gate:

- [ ] User can select rows and columns.
- [ ] User can configure a valid matrix entry.
- [ ] `Suppress` target validation works.
- [ ] Matrix changes survive reload.
- [ ] Playwright smoke test covers configuring a matrix entry.

## Phase 8: Sharing And Mobile Preview

Goal: demonstrate distribution of sound/haptic systems through generated links.

- [ ] Build share link dialog.
- [ ] Generate project share links.
- [ ] Generate event share links.
- [ ] Generate collision matrix entry share links.
- [ ] Copy generated links.
- [ ] Build `/share/[shareToken]` lookup.
- [ ] Render invalid share link state.
- [ ] Render project target summary.
- [ ] Render event target summary.
- [ ] Render matrix entry target summary.
- [ ] Add playback preview to event share page.
- [ ] Explain disabled device/trigger behavior in share previews.
- [ ] Apply visual direction from overlay popup screenshots.
- [ ] Add Playwright smoke test for generating and opening a share link.

Phase gate:

- [ ] User can create each share link type.
- [ ] Generated links resolve after page reload.
- [ ] Invalid links fail gracefully.
- [ ] Share pages are useful as stakeholder demo artifacts.

## Phase 9: Visual System And Demo Hardening

Goal: make the prototype feel polished enough for stakeholder review.

### 9.1 Primitive Visual System

- [ ] Define Tailwind color tokens from `color-palette.png`.
- [ ] Build `Button`.
- [ ] Build `IconButton`.
- [ ] Build `TextInput`.
- [ ] Build `Select`.
- [ ] Build `Checkbox`.
- [ ] Build `Switch`.
- [ ] Build `Tabs`.
- [ ] Build `Dialog`.
- [ ] Build `Popover`.
- [ ] Build `Tooltip`.
- [ ] Build `Menu`.
- [ ] Build `Table`.
- [ ] Build `Breadcrumbs`.
- [ ] Build `EmptyState`.
- [ ] Build `ErrorState`.
- [ ] Build `LoadingState`.
- [ ] Use lucide icons in icon buttons and row actions.

### 9.2 Screen Polish

- [ ] Match `/projects` to `project-folder-explorer.png`.
- [ ] Match empty project workspace to `empty-project-viewer.png`.
- [ ] Match event list to `event-list.png`.
- [ ] Match timeline editor to `event-playback-timeline.png`.
- [ ] Match asset list and tile views to asset library screenshots.
- [ ] Match matrix editor to matrix screenshots.
- [ ] Match dialogs/popovers/pickers to overlay screenshots.
- [ ] Check desktop viewport.
- [ ] Check tablet viewport.
- [ ] Check mobile viewport.
- [ ] Confirm button text does not overflow.
- [ ] Confirm table text does not overlap.
- [ ] Confirm dialogs fit their content.
- [ ] Confirm hover/focus/loading states do not shift layout.

### 9.3 Demo Reliability

- [ ] Add visible demo reset/reseed control.
- [ ] Add stakeholder demo script.
- [ ] Document known prototype limitations.
- [ ] Ensure fresh browser loads seeded data.
- [ ] Ensure full demo spine has no console errors.
- [ ] Run Playwright smoke suite.
- [ ] Capture or document main screen screenshots for QA.

Final gate:

- [ ] Fresh checkout can start the app.
- [ ] Fresh browser can complete the product demo spine.
- [ ] Core domain rules have tests.
- [ ] Core screens have smoke tests.
- [ ] Demo reset/reseed is reliable.
- [ ] ADRs and memory notes are current.
