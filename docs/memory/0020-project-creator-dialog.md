# Project Creator Dialog

## Changed

- Completed Workspace CRUD group 4 and Phase 11.3.
- Rebuilt `/projects` New Project as a wide two-pane dialog with grouped multi-select device presets and searchable starter-event checkboxes.
- Extended `createProject` to accept optional starter devices and event types, then create Project, default library, root folder, Devices, CollisionMatrices, default Collections, and starter Events in one Dexie transaction.
- Added the platform catalog to the project tree aggregate so `/projects` maps preset platform names to persisted platform IDs.
- Reused the preset catalog in the project workspace Create Device dialog while keeping free-text name/platform fields as the fallback.
- Widened `Checkbox` labels to accept React nodes for icon+label starter rows.
- Added ADR `0032-project-creation-aggregate-transaction.md`.

## Verification

- `pnpm typecheck` passed.
- `pnpm lint` passed with the same two pre-existing warnings in `.codex-verify/verify-event-timeline.mjs` and `components/layout/workspace-shell.tsx`.
- `pnpm test -- tests/project-repository.test.ts tests/selectable-card-primitive.test.tsx tests/domain-validation-errors.test.ts` passed; Vitest ran 10 files / 74 tests due the current config.
- `pnpm exec playwright test tests/e2e/projects.spec.ts -g "creates a project with selected systems"` passed.

## Notes

- A first attempted `pnpm test:e2e -- ... -g ...` ran the full project spec despite the grep argument. It exposed one unrelated timeout in the existing import-library playback test; the focused direct Playwright command for this chunk passed.
- Existing uncommitted `playwright.config.ts` and `.claude/` changes predate this chunk and were left untouched.

## Recommended Next Group

- Workspace CRUD group 5: create-anywhere for root folders/projects, nullable project folder IDs, and project explorer gating removal.

---

# Create Anywhere

## Changed

- Completed Workspace CRUD group 5.
- Made `Project.folderId` nullable in domain types, schemas, repository inputs, and project workspace aggregates.
- Removed the root-folder guard in `createProjectFolder`; top-level folders now register a `folderAccess` row for the creating user.
- Added `rootProjects` to `loadProjectTree` and rendered root-level projects alongside root folders in `/projects`.
- Removed folder/project creation gating in the Projects route, including root and mixed-content folders.
- Root-level project breadcrumbs now omit a containing folder crumb.

## Verification

- `pnpm typecheck` passed.
- `pnpm test -- tests/project-repository.test.ts tests/domain-rules.test.ts tests/domain-validation-errors.test.ts tests/seed-reset.test.ts` passed; Vitest ran 10 files / 77 tests due the current config.
- `pnpm lint` passed with the same two pre-existing warnings in `.codex-verify/verify-event-timeline.mjs` and `components/layout/workspace-shell.tsx`.
- `pnpm exec playwright test tests/e2e/projects.spec.ts -g "creates folders and projects at the projects root"` passed.

## Notes

- Root project access is represented by `Project.folderId === null`; the prototype user sees all root-level projects in the tree aggregate.
- Top-level folders require `createdByUserId` so the folder can be shared with the current user immediately.

## Recommended Next Group

- Workspace CRUD group 6: upload-anywhere, including shared asset dialogs mounted in the project Assets tab.
