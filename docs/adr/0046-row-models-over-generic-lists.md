# 0046 Row Models Over Generic Lists

## Context

Projects, libraries, workspace assets, and events all render dense table/card pairs, but each surface has different columns, actions, navigation, selection, and copy. A generic record-list abstraction would make visual parity harder to audit during a pure refactor.

## Decision

Use small row-model derivation helpers per feature instead of a generic table/list abstraction. Each feature computes row metadata once, then renders its own desktop table and mobile cards with the existing primitives.

## Consequences

- Desktop and mobile views share derived counts and labels without hiding surface-specific layout.
- Components remain easy to diff against the original DOM and screenshot baselines.
- Future common patterns can still become primitives after repeated needs are clearer.
- The refactor avoids a configuration-heavy list component that would obscure domain vocabulary.
