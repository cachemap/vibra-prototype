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

- Implement UX Polish checklist group 8: focused resolution behavior editor and collision preview. Start with the adaptive rule domain/schema work, allocating a new IndexedDB migration version because v3 has already shipped.
