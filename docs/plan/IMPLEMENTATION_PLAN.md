# Vibra Prototype Implementation Plan

Source model: `docs/domain-model/MODEL.md`  
Purpose: build a self-contained local/Vercel demo app for designing sound and haptic feedback systems across web and mobile platforms.

## North Star

Vibra should let a stakeholder understand the product by using it, not by hearing an explanation. The prototype should open directly into a realistic workspace where users can browse projects, configure platform devices, organize sound/haptic assets, attach scheduled playbacks to UI events, resolve playback collisions, and generate share links for mobile-style preview flows.

This is a prototype, so optimize for demo confidence and implementation speed. Prefer believable, coherent workflows over production completeness. IndexedDB is the persistence layer so the app can run locally, deploy to Vercel, and reset/reseed itself without an external backend.

## Product Demo Spine

The first complete demo should cover this path:

1. Open `/projects` and see seeded shared folders, nested folders, empty leaf folders, and projects.
2. Create a new project in a valid leaf folder.
3. Open a project and switch between iOS/Android device targets.
4. Create or edit collections and UI events for a selected device.
5. Attach `onPress`, `onRelease`, `onHover`, or `onHold` trigger playbacks using audio and haptic assets.
6. Preview the scheduled feedback timeline.
7. Import an asset library and use an imported asset in a playback.
8. Configure a collision matrix entry between two events.
9. Generate project, event, and matrix-entry share links.
10. Reset/reseed the demo data before the next stakeholder walkthrough.

Everything else supports this path.

## Domain Commitments

The implementation should encode the model in `docs/domain-model/MODEL.md`, especially:

- Projects live in shared `ProjectFolder` trees; folders can contain child folders or projects, but not both.
- A project has devices, and each device owns its own collections, events, and collision matrix.
- A device is a named target on one of the seeded platforms: `iOS`, `Windows`, `Mac`, `Linux`, `Android`.
- Events represent UI sound triggers and have an `eventType`: `Button`, `Toggle`, `Banner`, or `Toast`.
- Events may bind zero or more interaction triggers: `onHover`, `onPress`, `onRelease`, `onHold`.
- Each event-trigger binding schedules zero or more `TriggerPlayback` rows, each pointing to one audio or haptic asset and a non-negative `startOffset`.
- Every project gets exactly one default asset library with exactly one root folder when created.
- Projects may import other asset libraries, including another project's default library, but not their own default library.
- Asset library folders can nest, but a folder with assets is a leaf and cannot also contain child folders.
- Each device has exactly one collision matrix. Matrix rows and columns are selected from that device's events.
- Matrix entries use `Preempt`, `Queue`, `Co-play`, `Suppress`, or `Not possible`; `Suppress` requires a target event.
- Sharing links target exactly one project, event, or collision matrix entry and record the creating user.

Prototype defaults for open questions:

- Folder sharing is access-only; no roles or permissions.
- Standalone asset libraries are owned by the prototype user, but ownership is not surfaced deeply.
- Only `Suppress` requires a target event.
- Share links are unique and may be regenerated; revocation and expiry are deferred.

## Technical Strategy

Use a simple, modern frontend stack:

- Next.js App Router
- TypeScript strict mode
- Tailwind CSS
- Dexie for IndexedDB
- TanStack Query for screen-level data loading and mutation invalidation
- Valibot for runtime validation
- neverthrow for domain/data result contracts
- Vitest for domain and repository tests
- Playwright for smoke tests across the demo spine
- lucide-react for interface icons

Keep the app client-first. Server routes are not required for the prototype unless Vercel deployment needs static metadata or future share-link experiments. IndexedDB is the source of truth in the browser.

## Repository Shape

Recommended layout:

```text
app/
  layout.tsx
  page.tsx
  projects/page.tsx
  projects/[projectId]/page.tsx
  libraries/page.tsx
  share/[shareToken]/page.tsx
components/
  primitives/
  layout/
  demo/
domain/
  ids.ts
  enums.ts
  entities.ts
  schemas.ts
  errors.ts
  rules/
data/
  db.ts
  seed.ts
  reset.ts
  repositories/
features/
  projects/
  devices/
  events/
  assets/
  collision-matrix/
  sharing/
lib/
  query.ts
  result.ts
  dates.ts
docs/
  adr/
  memory/
  plan/
```

The split is intentionally boring:

- `domain/` defines types, schemas, rules, and errors with no React or Dexie imports.
- `data/` owns IndexedDB tables, seeding, reset, and repository implementations.
- `features/` owns query hooks, commands, view models, and feature UI.
- `components/primitives/` owns reusable controls shaped by the screenshots.
- `docs/adr/` records important implementation decisions.
- `docs/memory/` records handoff notes for future implementation agents.

## Data Model In IndexedDB

Use stable string IDs and ISO timestamps. Store references by ID. Seed catalog concepts at startup.

Suggested Dexie stores:

```ts
users: 'id'
folders: 'id, parentFolderId, createdAt'
folderAccess: '[userId+folderId], userId, folderId'
projects: 'id, folderId, defaultAssetLibraryId, createdAt'
platforms: 'id, name'
devices: 'id, projectId, platformId, [projectId+platformId+name], isEnabled'
collisionMatrices: 'id, deviceId'
collisionMatrixRows: '[matrixId+eventId], matrixId, eventId'
collisionMatrixColumns: '[matrixId+eventId], matrixId, eventId'
collisionMatrixEntries: 'id, matrixId, [matrixId+playingEventId+incomingEventId]'
collections: 'id, deviceId, name'
events: 'id, collectionId, eventType, name'
triggers: 'id, name'
eventTriggers: 'id, eventId, triggerId, [eventId+triggerId], isEnabled'
triggerPlaybacks: 'id, eventTriggerId, assetId, startOffset'
assetLibraries: 'id, name, defaultForProjectId'
projectAssetLibraryImports: '[projectId+assetLibraryId], projectId, assetLibraryId'
assetLibraryFolders: 'id, libraryId, parentFolderId'
assets: 'id, libraryId, folderId, mediaKind, uploadedAt'
sharingLinks: 'id, targetKind, targetId, createdByUserId, url'
```

For asset uploads, store metadata and a browser-usable playback URL. If actual file persistence is needed during the prototype, add Blob storage in IndexedDB behind the asset repository. Haptics can be represented visually until native device integrations exist.

## Seed-First Demo Data

Seed data is part of the product, not an afterthought. The app should seed itself when IndexedDB is empty and expose a visible developer reset/reseed control.

Seed enough data to demonstrate:

- One prototype user.
- Shared top-level folders and nested folders.
- At least one empty leaf folder.
- At least two projects.
- One project with iOS and Android devices.
- One disabled device.
- Multiple collections per device.
- Button, Toggle, Banner, and Toast events.
- Enabled and disabled event triggers.
- Audio and haptic playbacks at different offsets.
- Default and imported asset libraries.
- Nested asset folders with display icons.
- Collision matrix rows, columns, and entries using several behavior types.
- Existing share links for project, event, and matrix-entry targets.

The demo reset should restore this canonical story quickly.

## AI-Friendly Development Lifecycle

Implement in bounded vertical slices. Each slice should leave the app runnable, update documentation, and commit the work.

For every implementation chunk:

1. Read `docs/domain-model/MODEL.md`, this plan, the checklist, the latest ADRs, and the latest memory note.
2. Select the next unchecked checklist group that can fit in one focused implementation pass.
3. Preserve the demo spine and avoid speculative backend work.
4. Implement code, tests, and small documentation updates together.
5. Record significant decisions in `docs/adr/`.
6. Record handoff notes in `docs/memory/`.
7. Run the smallest useful verification set.
8. Commit the completed slice.

Do not wait until the end to integrate screens. Walking skeleton first, then domain/data, then demo workflows.

## Build Phases

### Phase 0: Planning And Harness Setup

Create the planning docs, ADR directory, memory directory, and AI harness system prompt. This phase makes future chunks repeatable.

Acceptance:

- Plan, checklist, and harness prompt exist.
- ADR and memory conventions are documented.
- Initial ADR captures the prototype architecture choices.

### Phase 1: Walking Skeleton

Scaffold the Next.js app, install dependencies, configure Tailwind, add TanStack Query, and create all core routes with placeholder workspace UI.

Acceptance:

- `npm run dev` starts.
- `/`, `/projects`, `/projects/[projectId]`, `/libraries`, and `/share/[shareToken]` render.
- Typecheck and lint pass.

### Phase 2: Domain Kernel

Encode domain enums, IDs, entities, Valibot schemas, errors, Result helpers, and the highest-risk rules.

Acceptance:

- Fixed vocabularies and persisted entities are typed and validated.
- Folder leaf rules, asset eligibility, trigger uniqueness, device uniqueness, and matrix rules have unit tests.
- No React or Dexie imports leak into `domain/`.

### Phase 3: IndexedDB Persistence And Seed Data

Build Dexie schema, repositories, seed data, reset/reseed utility, and query hooks for aggregate loading.

Acceptance:

- Fresh IndexedDB seeds automatically.
- Reset/reseed restores the canonical demo story.
- Repository tests cover dependent creation flows.
- Project tree, project workspace, asset libraries, and collision matrix aggregates load through query hooks.

### Phase 4: Projects Vertical Slice

Implement `/projects` with folder browsing, breadcrumbs, project rows, create folder, and create project.

Acceptance:

- Seeded folder tree is browsable.
- Empty leaf folders render intentionally.
- Folder/project containment rules are enforced in UI and services.
- Creating a project creates its default asset library and root folder.

### Phase 5: Device/Event Vertical Slice

Implement the main project workspace for devices, collections, events, event triggers, and playback scheduling.

Acceptance:

- Users can select devices and see device-specific collections/events.
- Users can create/edit collections and events.
- Users can add enabled/disabled trigger bindings.
- Users can schedule audio and haptic playbacks with offsets.
- Timeline preview communicates what will play.

### Phase 6: Asset Library Vertical Slice

Implement asset library browsing, folder creation, upload/mock asset creation, imports, and asset picker integration.

Acceptance:

- Default and imported libraries are visible.
- Users can browse folders in list and tile views.
- Users can create folders/assets without violating leaf-folder constraints.
- Imported libraries expand eligible assets for event playbacks.

### Phase 7: Collision Matrix Vertical Slice

Implement matrix row/column selection, entry editing, behavior pills, target selection, and validation.

Acceptance:

- Candidate events come only from the selected device.
- Users can select playing rows and incoming columns.
- Users can create/update matrix entries.
- `Suppress` requires a valid target.
- Matrix changes persist after reload.

### Phase 8: Sharing And Mobile Preview

Implement share link generation and `/share/[shareToken]` resolution for projects, events, and collision matrix entries.

Acceptance:

- Share dialogs generate unique links.
- Share pages resolve valid links and handle invalid ones.
- Event previews sort scheduled playbacks by offset.
- Disabled devices/triggers are explained in preview.

### Phase 9: Visual Integration And Demo Hardening

Apply the screenshot-driven visual system, add Playwright smoke tests, and write a stakeholder demo script.

Acceptance:

- Main screens match the supplied screenshot direction.
- Fresh browser can complete the full demo spine.
- No console errors on core screens.
- Demo reset works.
- Known prototype limitations are documented.

## Visual Direction

Use `design-screenshots/` as the UI reference library:

- `color-palette.png` for Tailwind tokens.
- `buttons-and-tabbed-interface.png` for buttons, icon buttons, tabs, checkbox, inputs, and selected states.
- `project-folder-explorer.png` for `/projects`.
- `empty-project-viewer.png` and `event-list.png` for the project workspace.
- `event-playback-timeline.png` for event preview and playback scheduling.
- `asset-library-explorer-list-view.png` and `asset-library-explorer-tile-view.png` for asset browsing.
- `collision-matrix.png` and `matrix-cells.png` for matrix states and behavior pills.
- `overlay-popups-*.png` for dialogs, popovers, picker panels, filter menus, QR/share states, and create flows.

Keep the UI quiet, dense, and tool-like. Use white/near-white surfaces, thin dividers, compact tables, small controls, predictable sidebars, and restrained purple accents. Avoid landing-page composition.

## Verification Strategy

Use tests where they protect domain correctness and demo reliability:

- Domain unit tests for fixed vocabularies and constraint rules.
- Repository tests for aggregate creation and persistence reads.
- Playwright smoke tests for the demo spine.
- Manual visual QA against the screenshot references.

Each chunk should run the smallest relevant command set, usually one or more of:

```bash
npm run typecheck
npm run lint
npm test
npm run test:e2e
```

## Documentation Strategy

Use ADRs for decisions that affect future implementation. Store them in `docs/adr/` with sequential names such as `0001-indexeddb-client-persistence.md`.

Use memory entries for implementation handoffs. Store them in `docs/memory/` with sequential names such as `0001-initial-planning.md`. Update the latest file when it is still short; create the next sequential file when the latest grows beyond roughly 50 lines.

Keep docs short and practical. Future agents need enough context to continue quickly, not a chronicle of every keystroke.
