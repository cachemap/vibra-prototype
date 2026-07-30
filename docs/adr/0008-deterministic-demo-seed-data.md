# 0008 Deterministic Demo Seed Data

## Context

Phase 3.2 needs the prototype to seed itself in a fresh browser and reset to a believable stakeholder demo story. Future repository and UI tests also need stable records to assert against without relying on generated IDs.

## Decision

Keep demo seed data deterministic in `data/seed.ts`, with stable IDs for the prototype user, folder tree, projects, libraries, devices, event interactions, collision matrix state, and share links. Seed only when the `users` table is empty at app startup, and use `resetDemoData()` to clear all stores and rewrite the canonical story.

## Consequences

- Demo walkthroughs and tests can rely on stable IDs and record counts.
- Reset/reseed remains browser-local and backend-free.
- Future repository creation flows can use the same canonical data as their fixture baseline instead of inventing parallel test stories.
