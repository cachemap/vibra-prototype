# Component Decomposition Baselines

## Changed

- Completed Component Decomposition Stage 0.
- Captured `projects-list` baselines at desktop, tablet, and mobile:
  - `docs/plan/visual-audit-captures/projects-list-desktop.png`
  - `docs/plan/visual-audit-captures/projects-list-tablet.png`
  - `docs/plan/visual-audit-captures/projects-list-mobile.png`
- Captured share-preview baselines for all three seeded share targets at desktop and mobile:
  - `docs/plan/visual-audit-captures/share-preview-project-desktop.png`
  - `docs/plan/visual-audit-captures/share-preview-project-mobile.png`
  - `docs/plan/visual-audit-captures/share-preview-event-desktop.png`
  - `docs/plan/visual-audit-captures/share-preview-event-mobile.png`
  - `docs/plan/visual-audit-captures/share-preview-matrix-desktop.png`
  - `docs/plan/visual-audit-captures/share-preview-matrix-mobile.png`
- Fixed `ActionMenu` pointer containment for portalled menus. Pointer clicks inside a menu now stop propagation before the document-level outside-pointer closer runs, so destructive row menu items open their confirm dialogs reliably.
- Extended the two slow project-delete e2e tests to 120s. They previously timed out under the current `slowMo: 1000` Playwright config.

## Baseline Greps

`grep -rn 'data-testid' app components features | sort` yields exactly 6:

```text
app/projects/[projectId]/page.tsx:1444:            <div className="grid gap-1" data-testid="device-list">
app/projects/[projectId]/page.tsx:1515:              <div className="grid gap-1" data-testid="collection-list">
app/projects/[projectId]/page.tsx:1800:                            data-testid="collision-matrix-grid"
app/projects/[projectId]/page.tsx:1953:                    <div className="grid gap-4" data-testid="project-asset-libraries">
components/primitives/timeline.tsx:184:                    data-testid="timeline-playhead"
features/projects/matrix-axis-filter.tsx:154:          data-testid="matrix-axis-filter"
```

`grep -rno 'aria-label\|role="status"\|role="tab"\|aria-selected\|aria-checked' app features | sort` baseline:

```text
app/libraries/page.tsx:586:aria-label
app/libraries/page.tsx:645:role="status"
app/projects/[projectId]/events/[eventId]/page.tsx:772:role="status"
app/projects/[projectId]/page.tsx:1392:aria-selected
app/projects/[projectId]/page.tsx:1394:role="tab"
app/projects/[projectId]/page.tsx:1403:aria-selected
app/projects/[projectId]/page.tsx:1405:role="tab"
app/projects/[projectId]/page.tsx:1414:aria-selected
app/projects/[projectId]/page.tsx:1416:role="tab"
app/projects/[projectId]/page.tsx:1542:aria-label
app/projects/[projectId]/page.tsx:1547:aria-selected
app/projects/[projectId]/page.tsx:1549:role="tab"
app/projects/[projectId]/page.tsx:1558:aria-selected
app/projects/[projectId]/page.tsx:1560:role="tab"
app/projects/[projectId]/page.tsx:1569:aria-selected
app/projects/[projectId]/page.tsx:1571:role="tab"
app/projects/[projectId]/page.tsx:1641:role="status"
app/projects/[projectId]/page.tsx:1646:role="status"
app/projects/[projectId]/page.tsx:1892:aria-label
app/projects/page.tsx:552:role="status"
features/projects/audio-preview.tsx:264:aria-label
features/projects/matrix-axis-filter.tsx:142:aria-label
features/projects/matrix-axis-filter.tsx:167:aria-selected
features/projects/matrix-axis-filter.tsx:177:role="tab"
features/projects/matrix-axis-filter.tsx:220:aria-label
features/projects/matrix-axis-filter.tsx:66:aria-checked
features/projects/matrix-axis-filter.tsx:67:aria-label
```

## Page Line Counts

```text
2757 app/projects/[projectId]/page.tsx
1042 app/projects/[projectId]/events/[eventId]/page.tsx
 948 app/libraries/page.tsx
 813 app/projects/page.tsx
 354 app/share/[shareToken]/page.tsx
5914 total
```

## Verification

- `pnpm typecheck` passed.
- `pnpm lint` passed with the existing warnings in `.codex-verify/verify-event-timeline.mjs` and `components/layout/workspace-shell.tsx`.
- `pnpm test` passed: 83 tests.
- `pnpm test:e2e` passed: 17 tests.
- Browser capture used the existing dev server at `http://localhost:3000`.

## Notes

- Existing untracked `.claude/` files were left untouched.
- No ADR was added; this was baseline capture plus a small row-menu reliability fix, not a new architecture decision.

## Recommended Next Group

- Start Component Decomposition Stage 1: add the pure `lib/` utility layer and tests without changing call sites.
