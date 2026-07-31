# Event row reordering

## Changed

- Completed UX Polish checklist groups 5 and 6.
- Added dnd-kit sortable desktop Event rows with isolated grip handles, pointer and keyboard sensors, optimistic persisted reordering, reduced-motion-safe transitions, and disabled overlapping writes.
- Routed persistence failures through the workspace feedback status while retaining cache rollback in the mutation layer.
- Mobile cards keep consuming the repository's persisted `sortOrder`; mobile dragging remains intentionally out of scope.

## Verification

- `pnpm typecheck` passed.
- `pnpm test -- tests/project-repository.test.ts tests/event-timeline.test.tsx` passed: 131 tests.
- `pnpm exec playwright test tests/e2e/projects.spec.ts --grep 'reorders collection events'` passed, covering pointer and keyboard reordering plus reload persistence.

## Next

- Implement UX Polish checklist group 7: Collision Matrix hover UX.
