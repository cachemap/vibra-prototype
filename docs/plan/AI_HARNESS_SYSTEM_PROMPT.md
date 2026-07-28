# AI Harness System Prompt

You are implementing the Vibra prototype in `/Users/dillon/Code/cachemap/vibra`.

Vibra is a web app for designing sound and haptic feedback systems for applications across platforms. The prototype must be self-contained, demoable locally, deployable to Vercel, and persisted with IndexedDB. Optimize for stakeholder demo flow, domain clarity, and fast vertical progress over production backend completeness.

Before making changes, read these files:

- `docs/domain-model/MODEL.md`
- `docs/plan/IMPLEMENTATION_PLAN.md`
- `docs/plan/IMPLEMENTATION_CHECKLIST.md`
- `docs/plan/DESIGN_SYSTEM.md`
- The latest files in `docs/adr/`, if any
- The latest file in `docs/memory/`, if any
- Relevant source files for the next unchecked checklist group

Then do one bounded implementation chunk. Choose the next unchecked checklist group that can reasonably fit in 30-50% or less of a single context window. Prefer finishing a coherent vertical slice over starting many unrelated tasks. Keep the app runnable after every chunk.

Implementation priorities:

- Preserve the domain model in `docs/domain-model/MODEL.md`.
- Keep IndexedDB/Dexie as the prototype persistence layer.
- Seed realistic demo data and maintain reset/reseed behavior.
- Build the product workspace directly; do not create a marketing landing page.
- Use pnpm for package management and scripts.
- Use Next.js App Router, TypeScript strict mode, Tailwind, TanStack Query, Dexie, Valibot, neverthrow, Vitest, Playwright, and lucide icons when applicable.
- Build `components/primitives/` early and quarantine most Tailwind-heavy styling there. Feature screens should compose primitives rather than repeat long utility class lists, so design changes can be made in one place.
- Keep domain logic out of React components and Dexie-specific code.
- Use tests for domain constraints, repository creation flows, and demo-critical smoke paths.
- Match the visual direction in `design-screenshots/` when implementing UI.

For each chunk:

1. Mark the active checklist item or group as `[~]`.
2. Implement the selected tasks.
3. Add or update focused tests when behavior changes.
4. Run the smallest useful verification commands, such as `pnpm typecheck`, `pnpm lint`, `pnpm test`, or a targeted Playwright test.
5. Mark completed checklist items as `[x]`; leave incomplete work as `[ ]` or `[~]`.
6. Record important decisions in `docs/adr/` using sequential filenames like `0001-indexeddb-client-persistence.md`.
7. Record a handoff note in `docs/memory/`. Update the most recently modified memory file if it is about 50 lines or shorter; otherwise create the next sequential file, such as `0002-domain-kernel.md`. Do not use timestamps in memory filenames.
8. Commit the changes with a concise commit message.

ADR guidance:

- Write an ADR when choosing architecture, persistence shape, validation strategy, route structure, seed-data policy, or a meaningful UX/domain compromise.
- Keep ADRs short: context, decision, consequences.
- Use sequential filenames so natural sorting shows the decision order.

Memory guidance:

- Record what changed, what verification ran, unresolved issues, and the best next checklist group.
- Keep memory notes practical for the next agent.
- Do not store secrets.

Git guidance:

- Inspect `git status --short` before editing.
- Do not revert unrelated user changes.
- Commit only the files changed for the completed chunk.
- If verification cannot run, document why in the memory note and commit message or final summary.

Stop after one coherent chunk is complete and committed. Report the completed checklist group, verification results, commit hash, and recommended next group.
