# Workspace Authoring And CRUD Checklist

Source plan: `docs/plan/WORKSPACE_CRUD_IMPLEMENTATION_PLAN.md`

## Status Legend

- `[ ]` Not started
- `[~]` In progress
- `[x]` Complete
- `[!]` Blocked

## 1. Domain Model Relaxation

- [x] Remove the ProjectFolder leaf constraint from `docs/domain-model/MODEL.md` and state that a folder may contain both child folders and projects.
- [x] Remove the AssetLibraryFolder leaf constraint and state the same for asset folders.
- [x] Change `ProjectFolder contains Project` to `0..1` on the Project side and document root-level projects.
- [x] Add the delete cascade contract to the Constraints section.
- [x] Append change-log rows for each model edit.
- [x] Relax `canAddChildFolder` and `canAddProjectToFolder` in `domain/rules/folders.ts` to parent-existence and sibling-name checks.
- [x] Relax `canAddChildFolderToAssetFolder` and `canAddAssetToFolder` in `domain/rules/projects.ts`.
- [x] Update `domain/rules` tests: drop `folder-leaf-*` and `asset-folder-leaf-*` cases, add mixed-containment cases.
- [x] Write the ADR for relaxed folder containment.

## 2. Stationary Breadcrumb

- [x] Add a `PageHeader` primitive with a fixed-height breadcrumb row and an always-rendered action slot.
- [x] Render the optional title/subtitle below the breadcrumb row so it never displaces the crumbs.
- [x] Adopt `PageHeader` in `/projects`, keeping actions in the reserved slot.
- [x] Adopt `PageHeader` in the project workspace header.
- [x] Adopt `PageHeader` in event detail.
- [x] Adopt `PageHeader` in `/libraries`.
- [x] Render the breadcrumb in loading and error states so it does not pop in.
- [x] Show a single `Projects` crumb at the projects root.
- [x] Verify identical breadcrumb top offset across the four routes at desktop and mobile.

## 3. Device Preset Catalog And Card Primitives

- [x] Add `domain/device-catalog.ts` with presets covering iOS, Android, Mac, Windows, and Linux.
- [x] Group presets by `Mobile`, `Tablet`, and `Desktop` form factors.
- [x] Add `SelectableCard` and `CardGrid` primitives using the existing peer-overlay pattern.
- [x] Add device glyph selection per form factor from lucide icons.
- [x] Add a size option to the `Dialog` primitive for wide two-pane dialogs.
- [x] Write the ADR for the preset catalog as presentation data.

## 4. Project Creator Dialog

- [x] Build the two-pane New Project dialog with the system picker on the left and details on the right.
- [x] Render form-factor section labels and multi-select device cards with the purple check badge.
- [x] Add the project name field and the searchable starter-event list grouped by event type.
- [x] Stack the panes vertically below `md`.
- [x] Extend `createProjectCommandSchema` with `devices` and `starterEventTypes`.
- [x] Extend `createDefaultProjectRecords` to mint devices, collision matrices, default collections, and starter events.
- [x] Widen the `createProject` transaction to all affected tables and return created devices.
- [x] Route to the first created device after creation, or the empty workspace when none were selected.
- [x] Reuse the preset catalog in the existing Create Device dialog with a free-text fallback.
- [x] Add repository tests for multi-device creation and starter-event creation.
- [x] Update `tests/e2e/projects.spec.ts` project-creation assertions.
- [x] Write the ADR for project creation as a multi-aggregate transaction.

## 5. Create Anywhere

- [x] Remove the `project-folder-parent-required` guard so top-level folders can be created.
- [x] Register new top-level folders in `folderAccess` for the current user.
- [x] Make `folderId` nullable across the Project entity, schema, and repository.
- [x] Include root-level projects in `loadProjectTree` and adjust `buildFolderNode`.
- [x] Remove `canCreateFolder`/`canCreateProject` gating in `app/projects/page.tsx`.
- [x] Fix the empty-state create action to match the ungated behavior.
- [x] Add repository tests for root folders, root projects, and mixed containment.
- [x] Add an e2e case creating a folder and a project at the projects root.

## 6. Upload Anywhere

- [x] Remove `canCreateFolder`/`canUploadAsset` gating in `app/libraries/page.tsx`.
- [x] Allow uploads into a library root folder and into folders that contain child folders.
- [x] Extract the new-folder and new-asset dialogs into shared components under `features/assets/`.
- [x] Mount both dialogs in the project Assets tab.
- [x] Allow folder creation and upload into each project's default library.
- [x] Note the Assets tab React-state navigation divergence in the memory handoff.
- [x] Add an e2e case uploading into a project default library from the project workspace.

## 7. Delete Foundations

- [x] Add a `ConfirmDialog` primitive with a destructive confirm action and a cascade summary body.
- [x] Adopt the unused `Menu`/`MenuItem` primitives for row overflow menus.
- [x] Adopt `Button variant="destructive"` for confirm actions.
- [x] Define the shared cascade helper and transaction boundary conventions.
- [x] Write the ADR for the delete cascade contract.

## 8. Delete Commands And Repository Functions

- [x] `deleteTriggerPlayback` UI wiring for the existing command.
- [x] `deleteEventTrigger` UI wiring for the existing command.
- [x] `deleteAsset` with `assetBlobs` cleanup, object-URL revoke, and TriggerPlayback cascade.
- [x] `deleteAssetLibraryFolder` with recursive folder and asset cascade.
- [x] `deleteAssetLibrary` with root-tree cascade and default-library protection.
- [x] `deleteEvent` with trigger, playback, matrix reference, and sharing-link cascade.
- [x] `deleteCollection` with event cascade.
- [x] `deleteDevice` with collection, event, and collision-matrix cascade.
- [x] `deleteProject` with device, library, import-link, and sharing-link cascade.
- [x] `deleteProjectFolder` with recursive folder and project cascade.
- [x] `deselectCollisionMatrixRow` and `deselectCollisionMatrixColumn` with entry cascade.
- [x] `deleteCollisionMatrixEntry` with sharing-link cascade.
- [x] `deleteSharingLink`.
- [x] Add repository tests asserting no orphan rows remain after each cascade.
- [x] Add a test that an event referencing a deleted asset still loads.

## 9. Delete Affordances

- [x] Project folder and project row menus in `/projects`.
- [x] Project delete in the project workspace header menu.
- [x] Device delete in the systems rail.
- [x] Collection delete in the collection header.
- [x] Event delete in the event row and event detail header.
- [x] Trigger and playback delete in event detail and the timeline.
- [x] Asset and asset folder delete in `/libraries` list and tile views.
- [x] Asset library delete in the library list.
- [x] Matrix row and column clears through the axis filter popover toggles, plus the entry clear action.
- [x] Sharing link delete in the share panel.
- [x] Selection fallback after deleting the active device, folder, or asset folder.
- [x] Route the current folder to its parent after deleting it.
- [x] Report every delete result through the existing `role="status"` feedback pattern.
- [x] Add an e2e case deleting a project and confirming the explorer reloads cleanly.

## 10. Batch Closure

- [x] `pnpm typecheck` passes.
- [x] `pnpm lint` passes.
- [x] `pnpm test` passes.
- [x] `pnpm test:e2e` passes.
- [x] Browser verification of the project creator, breadcrumb offsets, and delete confirmations at `http://localhost:3000`.
- [x] Check desktop, tablet, and mobile viewports for the new dialog and menus.
- [x] Confirm demo reset/reseed still produces a clean seeded state.
- [x] Recapture affected screenshots into `docs/plan/visual-audit-captures/`.
- [x] Record the memory handoff in `docs/memory/`.
