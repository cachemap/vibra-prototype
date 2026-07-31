# UX Polish: event order and Matrix hover

## Changed

- Completed UX Polish checklist groups 5 and 6.
- Added dnd-kit sortable desktop Event rows with isolated grip handles, pointer and keyboard sensors, optimistic persisted reordering, reduced-motion-safe transitions, and disabled overlapping writes.
- Routed persistence failures through the workspace feedback status while retaining cache rollback in the mutation layer.
- Mobile cards keep consuming the repository's persisted `sortOrder`; mobile dragging remains intentionally out of scope.

## Verification

- `pnpm typecheck` passed.
- `pnpm test -- tests/project-repository.test.ts tests/event-timeline.test.tsx` passed: 131 tests.
- `pnpm exec playwright test tests/e2e/projects.spec.ts --grep 'reorders collection events'` passed, covering pointer and keyboard reordering plus reload persistence.

## Changed (continued)

- Completed UX Polish checklist group 7: Collision Matrix hover UX.
- Interactive Matrix data cells now lift and subtly scale only for hover-capable pointers, with a theme-aware ring/shadow. Configured behavior pills respond with a smaller group hover motion.
- Selected cells retain a stronger persistent inset ring, cross-highlighting remains untouched, and reduced-motion users receive ring/color feedback without transforms.
- Added `tests/matrix-grid.test.tsx` to cover unchanged accessible names plus hover and reduced-motion class contracts for unset and configured cells.

## Verification

- `pnpm test -- tests/matrix-grid.test.tsx` passed: 133 tests.
- `pnpm typecheck` passed.
- `pnpm lint` passed with two pre-existing warnings in `.codex-verify/verify-event-timeline.mjs` and `components/layout/workspace-shell.tsx`.
- Tailwind compilation confirmed the pointer hover rules are emitted inside `@media (hover:hover)`.

## Next

- Started UX Polish checklist group 8's adaptive rule foundation (remaining visual controls are still in progress).

## Changed (continued)

- Added `InterruptionRecovery` and behavior-specific nullable recovery fields to `ResolutionBehavior`.
- Centralized required/forbidden fields, defaults, and help copy in `resolutionBehaviorDefinitions`; repository validation rejects missing or stale values.
- Added IndexedDB v4 migration to normalize version-3 rule objects, preserving valid Suppress targets and applying deterministic defaults.
- Seed/share data and the existing interim Matrix form now retain behavior-aware recovery values; the form disables Save for an invalid visible draft.

## Verification

- `pnpm typecheck` passed.
- `pnpm lint` passed with the two existing warnings in `.codex-verify/verify-event-timeline.mjs` and `components/layout/workspace-shell.tsx`.
- `pnpm test -- tests/domain-rules.test.ts tests/db-schema.test.ts tests/project-repository.test.ts tests/matrix-grid.test.tsx` passed: 134 tests.

## Next

- Complete the remaining adaptive control work: accessible help buttons and Playing/Incoming plus Resume/Stay stopped segmented controls. Then build the focused editor layout and collision preview timeline.
