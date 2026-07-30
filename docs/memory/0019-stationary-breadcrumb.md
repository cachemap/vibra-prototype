# Stationary Breadcrumb

## Changed

- Added a `PageHeader` primitive with a fixed 34px breadcrumb/action row and optional title/subtitle below it.
- Adopted `PageHeader` in `/projects`, project workspace, event detail, and `/libraries`.
- Added breadcrumb rows to loading, error, and not-found states so the top breadcrumb offset stays stable.
- Marked Workspace CRUD group 2 and Phase 11.2 complete. Also reconciled Phase 11.1 as complete based on the prior relaxed-folder-containment chunk.

## Verification

- `pnpm typecheck` passed.
- `pnpm lint` passed with warnings only: the pre-existing `.codex-verify/verify-event-timeline.mjs` unused variable warning and an unrelated dirty `components/layout/workspace-shell.tsx` `<img>` warning.
- `pnpm test -- tests/timeline-primitive.test.tsx tests/scaffold.test.ts` passed; Vitest ran the configured related suite, 66 tests total.

## Notes

- Existing uncommitted `playwright.config.ts`, `.claude/`, `components/layout/workspace-shell.tsx`, and `public/vibra-logo.svg` changes predate this chunk and were left untouched.
- No ADR was added because this chunk standardizes presentation layout through primitives without changing architecture or domain behavior.

## Recommended Next Group

- Workspace CRUD group 3: add the device preset catalog and selectable card primitives before rebuilding the project creator.

## Device Preset Foundations

Changed:

- Completed Workspace CRUD group 3.
- Added `domain/device-catalog.ts` with typed presets for iOS, Android, Mac, Windows, and Linux grouped by Mobile, Tablet, and Desktop.
- Added `SelectableCard`, `CardGrid`, and `DeviceGlyph` primitives for the upcoming system picker.
- Added `Dialog size="wide"` for two-pane workflows.
- Added ADR `0031-device-preset-catalog.md`.
- Marked Phase 11.3 as in-progress in the main checklist because the creator rebuild itself is still the next group.

Verification:

- `pnpm test -- tests/device-catalog.test.ts tests/selectable-card-primitive.test.tsx` passed; Vitest ran 10 files / 72 tests due the current test config.
- `pnpm typecheck` passed.
- `pnpm lint` passed with the same two pre-existing warnings in `.codex-verify/verify-event-timeline.mjs` and `components/layout/workspace-shell.tsx`.

Notes:

- Existing uncommitted `playwright.config.ts` and `.claude/` changes predate this chunk and were left untouched.

Recommended next group:

- Workspace CRUD group 4: rebuild the New Project dialog, extend `createProject`, and reuse the preset catalog in Create Device.
