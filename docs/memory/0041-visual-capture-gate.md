# Visual Capture Gate

## Changed

- Closed the remaining Component Decomposition / Phase 12 visual capture gate.
- Confirmed the Stage 0 `projects-list-*` captures and all six `share-preview-*` captures still match byte-for-byte before updating any QA artifacts.
- Found a real mobile overflow in the project Events tab: the collection action row stayed on one line at 390px and expanded the full-page screenshot to 416px wide.
- Fixed the overflow by allowing the Events tab action group to wrap and right-align on narrow screens.
- Refreshed current QA captures for project explorer, project Events/Assets/Matrix, and `/libraries` list/tile views in `docs/plan/visual-audit-captures/`.
- Marked the main implementation checklist visual-capture gate complete and checked the component-decomposition browser-check gate.

## Verification

- Playwright capture script reset the demo and refreshed:
  - `projects-{desktop,tablet,mobile}.png`
  - `project-{events,assets,matrix}-{desktop,mobile}.png`
  - `libraries-{list,tile}-{desktop,mobile}.png`
- Mobile scroll-width checks passed at 390px for `/projects`, project Events, project Assets, project Matrix, `/libraries`, and `/libraries?view=tiles`: `scrollWidth === innerWidth === 390`.
- `pnpm typecheck` passed.
- `pnpm lint` passed with the existing warnings in `.codex-verify/verify-event-timeline.mjs` and `components/layout/workspace-shell.tsx`.
- `pnpm test` passed: 109 tests.
- `pnpm test:e2e` passed: 17 tests.
- `grep -rn 'data-testid' app components features | sort` still yields exactly 6 hooks.
- ARIA/role grep completed against the decomposed feature-file surfaces.

## Notes

- No ADR was added; this was visual QA closure plus a responsive layout correction, not a new architecture/domain decision.
- Existing untracked `.claude/` files were left untouched.

## Recommended Next Group

- Component decomposition is closed. Pick one explicit follow-up from `docs/plan/COMPONENT_DECOMPOSITION_CHECKLIST.md` if product work continues; the remaining unchecked items there are intentionally out of scope follow-ups.
