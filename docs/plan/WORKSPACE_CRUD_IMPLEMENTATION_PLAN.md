# Workspace Authoring And CRUD Implementation Plan

Follow-on batch after `docs/plan/VISUAL_AUDIT_IMPLEMENTATION_PLAN.md`.  
Companion checklist: `docs/plan/WORKSPACE_CRUD_CHECKLIST.md`  
Reference screenshot: new-project system picker (two-pane dialog, form-factor grouped device cards).

## Scope

Four requested changes, in dependency order:

1. Rebuild the project creator as a two-pane dialog with a device-preset picker covering the major device lines on every platform.
2. Stop the header breadcrumb from moving vertically between the projects root, a nested folder, and a project workspace.
3. Allow folder and project creation at any point in the hierarchy, and asset upload into any library folder including each project's default library.
4. Add delete for every user-visible entity, in the canonical place a user would look for it.

## Blocking Domain Decision

Items 3 and 4 cannot be implemented against the current model as written. `docs/domain-model/MODEL.md` states:

- "A ProjectFolder that contains Projects is a leaf: it must not also contain child ProjectFolders."
- "An AssetLibraryFolder that contains Assets is a leaf: it must not also contain child folders."
- "A Project belongs to exactly one ProjectFolder" (`Project.folderId` is required).

Enforced at `domain/rules/folders.ts:14-43` (`folder-leaf-projects`, `folder-leaf-children`), `domain/rules/projects.ts:85-113` (`asset-folder-leaf-assets`, `asset-folder-leaf-children`), and `data/repositories/project-repository.ts:1476-1480`, which rejects `parentFolderId === null` with `project-folder-parent-required` — so today there is no path to a top-level folder at all.

"Create folders and projects at any level" and "upload into any library folder" mean mixed containment. **Decision: relax both leaf rules to filesystem semantics, and make `Project.folderId` nullable so a Project can sit at the root of the Projects view.** This is a model change, not just a UI change, and `docs/domain-model/MODEL.md` must be edited before the code. The alternative — keep the leaf rules and only relax root-folder creation — is cheaper but does not deliver the request, so it is not the plan.

Model edits required:

- Delete the two leaf constraints and the `project-folder-parent-required` rule; add "A ProjectFolder may contain both child ProjectFolders and Projects" and the asset-folder equivalent.
- Change `ProjectFolder contains Project` multiplicity from `1` to `0..1` on the Project side; add "A Project with no ProjectFolder is a root-level Project in the Projects view."
- Add a Constraints section for deletion semantics (see Workstream 4).
- Append change-log rows.

## Workstream 1 — Project Creator

Today `app/projects/page.tsx:376-402` is a single `TextInput`; devices are added later, one at a time, through the `Create Device` dialog in `app/projects/[projectId]/page.tsx:1843-1878` (free-text name plus a native platform `<select>`). The screenshot replaces this with system selection at creation time.

Target: a wide two-pane dialog.

- **Left pane** — "Select the systems for your project". Device presets rendered as selectable cards, grouped by form factor (`Mobile`, `Tablet`, `Desktop`) with small section labels. Each card is a bordered tile with a line-art device glyph and the device name; selected state is a filled gray tile plus a purple check badge in the top-right corner. Multi-select.
- **Right pane** — "Details": `Project name` text input, then a filterable starter-event list grouped by `eventType` (`Notifications`: Toast, Banner; `Key interactions`: Button, Toggle) with a search field. Starter events are optional; a project created with none is still valid.
- Primary action stays disabled until a name is present. Zero selected systems is allowed and lands on the existing empty-workspace state.

Device preset catalog:

- New `domain/device-catalog.ts` exporting a static, typed list of `{ presetId, platformName, deviceName, formFactor }` covering the major current lines for each of the five platforms: iOS (iPhone Pro / standard / e-series, iPad Pro and iPad Air under Tablet), Android (Pixel Pro / standard, Galaxy S / Fold, Android Tablet), Mac (MacBook Pro, MacBook Air, iMac, Mac mini), Windows (Surface Pro under Tablet, Surface Laptop, Windows Desktop), Linux (Linux Laptop, Linux Desktop).
- The catalog is presentation/seed data, not a domain entity. `Device.name` stays free text and the existing `unique-project-platform-device-name` rule is unchanged — presets are unique by construction. Record this in an ADR.
- Reuse the catalog in the existing `Create Device` dialog so a device added later comes from the same list, with a free-text escape hatch.

Data layer:

- Extend `createProjectCommandSchema` (`domain/schemas.ts:191-194`) with `devices: Array<{ platformId, name }>` and `starterEventTypes: EventType[]`, both defaulting to empty.
- Extend `createDefaultProjectRecords` (`project-repository.ts:550-577`) to also mint, per selected device, a `Device` + its `CollisionMatrix` + one default `Collection`, and one `Event` per starter event type inside each of those collections. `createProject` (`:1423-1471`) widens its `rw` transaction to `devices`, `collisionMatrices`, `collections`, and `events`, and reuses `validateDeviceCreationRecords` and `canCreateDevice`.
- Return the created devices in `CreatedProjectAggregate` so the UI can route straight to the first device.

Primitives: add `SelectableCard` and `CardGrid` to `components/primitives/`, built on the existing peer-overlay pattern in `checkbox.tsx:1-41`. Widen `Dialog` (`dialog.tsx:35-54`) to accept a size so the two-pane layout is not hard-coded per screen; the panes stack vertically below `md`.

Acceptance:

- Every platform in `platformNames` is reachable from the picker, under at least one form-factor group.
- Creating a project with two systems selected produces two Devices, two CollisionMatrices, and two default Collections in one transaction.
- Selecting Toast and Button creates those two Events in each selected device's default collection.
- The existing e2e assertion at `tests/e2e/projects.spec.ts:106-111` ("Select a system to begin") is updated: it still holds when no system is selected, and is replaced by a device assertion when one is.

## Workstream 2 — Stationary Breadcrumb

Each route renders its own breadcrumb in its own wrapper, so the y-position moves:

- `app/projects/page.tsx:298-318` — `px-4 py-5`, breadcrumb sharing a `flex items-center justify-between` row with conditionally *unmounted* action buttons. At the root both buttons are absent, so the row collapses to text line-height; inside a folder a `h-[34px]` button (`components/primitives/button.tsx:26`) grows the row and pushes the vertically centered breadcrumb down.
- `app/projects/[projectId]/page.tsx:859-868` and `app/projects/[projectId]/events/[eventId]/page.tsx:522-526` — a bordered `<header>` with `py-3`, breadcrumb stacked above an `<h1>`.
- `app/libraries/page.tsx:441-454` — `px-4 py-5`.
- The loading and error branches (`app/projects/page.tsx:269,277`) render no breadcrumb, so it pops in when the query resolves.

Fix: one `PageHeader` primitive owning the breadcrumb row.

- Fixed row height (`min-h-[52px]`) with the breadcrumb vertically centered, independent of whether actions are present; the action slot always renders, empty when there is nothing to show.
- Optional title/subtitle block renders *below* the fixed breadcrumb row, so workspace screens with an `<h1>` do not displace the breadcrumb.
- Adopted by `/projects`, the project workspace, event detail, and `/libraries`, with identical horizontal padding.
- Rendered in loading and error states too, with whatever crumbs are already known, so the breadcrumb never appears or disappears mid-render.
- The projects root shows a single `Projects` crumb rather than an empty nav.

Acceptance: screenshot the breadcrumb bounding box at `/projects`, `/projects?folder=<id>`, `/projects/<id>`, and `/libraries` — the top offset is identical in all four, at desktop and mobile widths.

## Workstream 3 — Create And Upload Anywhere

Domain and data:

- Replace `canAddChildFolder` and `canAddProjectToFolder` (`domain/rules/folders.ts:14-43`) with rules that only check parent existence and name uniqueness among siblings; keep `allowsEmptyLeafFolder` semantics under a clearer name. Same treatment for `canAddChildFolderToAssetFolder` and `canAddAssetToFolder` (`domain/rules/projects.ts:85-113`).
- Remove the `project-folder-parent-required` guard (`project-repository.ts:1476-1480`) so `parentFolderId: null` creates a top-level folder registered in `folderAccess` for the current user.
- Make `folderId` nullable on the Project entity, schema, and `createProject`; `loadProjectTree` (`:1153-1200`) gains root-level projects alongside root folders, and `buildFolderNode` (`:503-519`) drops or redefines `isEmptyLeaf`.
- Delete the now-dead constraint tests and add coverage for mixed containment.

UI:

- `/projects`: replace the `canCreateFolder`/`canCreateProject` gating at `app/projects/page.tsx:215-216` — both actions are always available, at the root and in every folder. Remove the empty-state inconsistency at `:476-485`.
- `/libraries`: drop `canCreateFolder`/`canUploadAsset` gating at `app/libraries/page.tsx:271-274`; both buttons stay enabled for any selected folder including a library root.
- Project **Assets** tab (`app/projects/[projectId]/page.tsx:1453-1639`) is read-only today, with only `Import library`. Extract the `/libraries` new-folder and new-asset dialogs into shared components under `features/assets/` and mount them here, so uploads land in the project's default library and any folder inside it. This tab keeps its React-state navigation (`:290-291`) rather than adopting URL params — noted as a deliberate divergence.

Acceptance:

- A folder can be created at the projects root and a project can be created beside it at the root.
- A folder that already contains a project accepts a child folder, and vice versa.
- An asset uploads into a project's default library root and into a nested folder that also contains child folders.
- The project Assets tab can create a folder and upload an asset without leaving the project.

## Workstream 4 — Delete Everywhere

Today the repository interface (`project-repository.ts:384-415`) has exactly two delete methods, `deleteEventTrigger` (`:2043`) and `deleteTriggerPlayback` (`:2112`), and **no UI exposes either** — `useDeleteEventTriggerMutation` and `useDeleteTriggerPlaybackMutation` (`features/projects/queries.ts:309,345`) are never imported. Everything else has no delete at any layer.

Cascade contract, to be added to `MODEL.md` Constraints and implemented as one transaction per command:

| Entity | Canonical UI position | Cascade |
|---|---|---|
| ProjectFolder | Row overflow menu in `/projects` | Child folders, projects, and each project's cascade; recursive |
| Project | Row overflow menu in `/projects`; workspace header menu | Devices, default AssetLibrary, import links, SharingLinks |
| Device | Systems rail item menu in the project workspace | Collections + Events, CollisionMatrix with rows/columns/entries |
| Collection | Collection header menu | Its Events |
| Event | Event row menu; event detail header menu | EventTriggers, TriggerPlaybacks, matrix rows/columns/entries referencing it, SharingLinks |
| EventTrigger | Trigger row action in event detail (wire up the existing command) | Its TriggerPlaybacks |
| TriggerPlayback | Timeline block / playback row action (wire up the existing command) | None |
| Asset | Asset row menu and tile menu in `/libraries` and project Assets | `assetBlobs` row, object-URL revoke, referencing TriggerPlaybacks |
| AssetLibraryFolder | Folder row/tile menu | Child folders and assets, recursively, with the asset cascade |
| AssetLibrary | Library list item menu in `/libraries` | Root folder tree and assets; a project's default library is deleted only with its project |
| Matrix row / column | Axis rail item menu | Entries on that row or column |
| CollisionMatrixEntry | Cell context action / resolution editor "Clear" | Its SharingLinks |
| SharingLink | Share panel list item | None |

Asset deletion has three traps flagged during exploration and must be tested:

1. `parseAssetRecord` (`:466-501`) throws when an `assets` row has a placeholder `playbackUrl` but no `assetBlobs` row, which hard-fails the whole `loadAssetLibraryTree`. Both rows must go in one transaction.
2. `objectUrlsByAssetId` (`:1146`) is only cleaned on re-read, so the delete path must `URL.revokeObjectURL` and drop the map entry.
3. `triggerPlaybacks` is indexed by `assetId` (`data/db.ts:63`) with no FK enforcement; dangling ids break event timelines and share previews. Cascade the playbacks, using the pattern already at `:2052`.

Supporting UI work:

- Add a `ConfirmDialog` primitive — none exists, and there is no `window.confirm` anywhere. Built on `DialogOverlay`/`Dialog`, with a destructive confirm button and a body that names what else will be removed.
- `Menu`, `MenuItem` (including its unused `destructive` prop) and `Popover` are exported but entirely dead code, as is `Button variant="destructive"`. Use them for the row overflow menus rather than adding new primitives.
- Deleting the currently selected entity must move selection somewhere valid: deleting the active device falls back to the first remaining device or the empty-workspace state; deleting the current folder navigates to its parent; deleting the selected asset folder falls back to the library root.

Acceptance:

- Every row in the cascade table has a domain command, a repository function with a single transaction, a React Query mutation, and a reachable UI affordance.
- Deleting a project removes its devices, matrices, collections, events, default library, and assets, and `/projects` reloads with no orphan rows.
- Deleting an asset that a TriggerPlayback references leaves the owning event loadable.
- Every destructive action is confirmed and reports its result through the existing `role="status"` feedback pattern.

## Implementation Order

1. Model edits in `docs/domain-model/MODEL.md` plus the domain-rule relaxations and their tests (unblocks 3 and 4).
2. `PageHeader` primitive and breadcrumb adoption across the four routes.
3. Device preset catalog, `SelectableCard`/`CardGrid` primitives, and the wider `Dialog` size.
4. Project creator dialog and the widened `createProject` aggregate, including starter events.
5. Create-anywhere for project folders/projects, root-level projects, and `/projects` UI gating removal.
6. Upload-anywhere in `/libraries` plus the extracted shared asset dialogs mounted in the project Assets tab.
7. `ConfirmDialog` primitive, delete commands and repository functions in cascade-safety order (leaf entities first: TriggerPlayback, EventTrigger, Asset, then containers).
8. Delete UI affordances per the cascade table, with selection-fallback behavior.
9. Final responsive and demo pass: reseed, walk the demo spine, recapture screenshots.

## Verification Plan

- `pnpm typecheck` and `pnpm lint` after each chunk.
- `pnpm test` for every domain rule change and every new repository command; cascade tests assert no orphan rows remain in any table.
- `pnpm test:e2e` for create-at-root, create-in-mixed-folder, upload-into-default-library, and delete-project spines. Existing specs that assert the old behavior — `tests/e2e/projects.spec.ts:87-136` and the `folder-leaf-*` cases in `tests/domain-rules.test.ts:199-209` and `tests/project-repository.test.ts:129-143,1174-1190` — are updated, not deleted silently.
- Browser verification against the running stack on `http://localhost:3000` via `/projects` with the seeded demo credentials, for the project creator layout, breadcrumb offsets, and each delete confirmation.
- Recapture affected screenshots into `docs/plan/visual-audit-captures/`.

## ADRs To Write

- Device preset catalog as presentation data rather than a domain entity.
- Relaxed folder containment: mixed folders and root-level projects.
- Delete cascade contract and transaction boundaries, including asset blob and object-URL cleanup.
- Project creation as a multi-aggregate transaction (project + devices + matrices + collections + starter events).
