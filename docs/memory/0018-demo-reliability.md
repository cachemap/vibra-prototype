# Demo Reliability

## Changed

- Moved demo reset/reseed into the global workspace shell so it is visible from Projects, Libraries, project workspaces, and share previews.
- Removed the duplicate project-explorer reset button to keep the reset action unambiguous.
- Added `docs/plan/STAKEHOLDER_DEMO_SCRIPT.md` with the stakeholder walkthrough, known prototype limitations, and QA screenshot capture references.
- Added Playwright coverage for fresh-browser seeded data, global reset from `/libraries`, and console-error-free navigation across the seeded demo spine and share previews.
- Marked Phase 10.3 demo reliability complete in the implementation checklist.

## Verification

- `pnpm typecheck` passed.
- `pnpm lint` passed.
- `pnpm test` passed: 60 tests.
- `pnpm test:e2e` passed: 10 tests.

## Notes

- Existing uncommitted `.gitignore` and `playwright.config.ts` edits still predate this chunk and should remain outside this commit.
- No ADR was added because this chunk uses the existing seed/reset and route-shell architecture rather than choosing a new architecture.

## Recommended Next Group

- No implementation checklist groups remain open. Recommended next step is a clean deployment/readiness pass: review the committed diff, start from a fresh clone/browser profile if needed, and deploy when approved.

## Workspace CRUD Domain Relaxation

## Changed

- Started the Workspace CRUD checklist and completed group 1.
- Relaxed the domain model so ProjectFolders and AssetLibraryFolders can contain both child folders and content.
- Added root-level Project semantics to the model for the later Create Anywhere slice, but did not make `Project.folderId` nullable in code yet.
- Replaced leaf-rule helpers with parent-existence and sibling-name checks for project folders, projects, asset folders, and assets.
- Updated repository call sites and tests to allow mixed containment.
- Added ADR `0030-relaxed-folder-containment.md`.

## Verification

- `pnpm test -- tests/domain-rules.test.ts tests/project-repository.test.ts` passed: 66 tests.
- `pnpm typecheck` passed.
- `pnpm lint` passed with one pre-existing warning in `.codex-verify/verify-event-timeline.mjs`.

## Notes

- Root-level project/folder creation is still blocked in the repository/UI and belongs to Workspace CRUD group 5.
- Existing uncommitted `playwright.config.ts` and `.claude/` changes predate this chunk and were left untouched.

## Recommended Next Group

- Workspace CRUD group 2: add and adopt the stationary `PageHeader` primitive for stable breadcrumb positioning.
