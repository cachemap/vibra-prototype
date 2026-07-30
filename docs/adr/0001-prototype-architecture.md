# 0001 Prototype Architecture

## Context

Vibra needs to be self-contained, demoable locally, and deployable to Vercel without waiting on a production backend. The prototype must preserve the domain model while letting stakeholders complete the demo spine quickly.

## Decision

Build Vibra as a client-first Next.js App Router prototype using TypeScript, Tailwind CSS, TanStack Query, and reusable primitives for the workspace UI. Persist prototype data in IndexedDB through Dexie, with domain rules and validation kept outside React and Dexie-specific modules.

Use seed-first demo data as part of the product experience. A fresh browser seeds canonical projects, devices, events, assets, collision matrix entries, and share links; a reset/reseed utility restores that story for demos.

Defer production backend concerns such as authentication, server persistence, asset processing, share-link revocation, and roles/permissions until the prototype validates the core workflow.

## Consequences

- The app can run locally and on Vercel as a browser-owned prototype.
- Demo reliability depends on deterministic seed and reset behavior.
- Repository and domain tests are needed to protect creation flows that span multiple IndexedDB stores.
- Future backend work can replace repositories without rewriting the domain kernel or feature UI.
