# Phase 6 Asset Libraries Browser

## Changed

- Replaced the `/libraries` placeholder with a two-pane asset-library browser.
- Added the library rail with seeded/default/imported indicators and asset/folder counts.
- Added route state for selected library, selected folder, and list/tile view.
- Added folder breadcrumbs, list view, tile view, empty states, and stable folder navigation.
- Added create-library, create-folder, and mock create-asset dialogs.
- Added `loadAssetLibraries` repository/query aggregate for the route-level library summary.
- Added ADR `0019-asset-library-browser-aggregate.md`.
- Added Playwright smoke coverage for browsing seeded assets, creating a library, creating a folder, creating a haptic asset, and switching to tile view.

## Verification

- `pnpm typecheck` passed.
- `pnpm lint` passed.
- `pnpm test -- tests/project-repository.test.ts` passed; Vitest ran 7 files and 57 tests.
- `pnpm test:e2e -- tests/e2e/projects.spec.ts --grep "browses and mutates asset libraries"` passed; Playwright still ran the full projects spec file and all 5 tests passed.

## Recommended Next Group

Continue Phase 6 with the project asset library panel and import flow: show default/imported libraries inside `/projects/[projectId]`, prevent importing a project's own default library in the UI, and then replace the simple playback asset select with a richer asset picker using the same eligible-asset boundary.

---

# Phase 6 Project Import And Picker

## Changed

- Added a project workspace asset-library panel showing the default library and imports.
- Added the project import-library dialog using candidates that exclude the project's own default library and already-imported libraries.
- Annotated eligible playback assets with library metadata in `DeviceWorkspaceAggregate`.
- Replaced the playback asset select with a dense picker list showing media kind and source library.
- Disabled `/libraries` create controls that would mix child folders and assets.
- Added ADR `0020-project-asset-import-picker.md`.
- Added Playwright smoke coverage for creating a standalone library, importing it into a project, and selecting its asset for playback.

## Verification

- `pnpm typecheck` passed.
- `pnpm lint` passed.
- `pnpm test -- tests/project-repository.test.ts` passed; Vitest ran 7 files and 57 tests.
- `pnpm test:e2e -- tests/e2e/projects.spec.ts --grep "imports a library"` passed; Playwright ran the full projects spec and all 6 tests passed.

## Recommended Next Group

Start Phase 7 with the collision matrix workspace: expose the matrix view in `/projects/[projectId]`, load selected-device candidates, and build row/column selection before the behavior editor.
