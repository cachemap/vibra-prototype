# 0055 Resolution behavior recovery migration

## Context

Collision rules previously stored only a behavior name and optional target. The focused resolution editor needs behavior-specific recovery choices, while existing version-3 IndexedDB data must remain readable.

## Decision

Add nullable post-interruption and system-interruption recovery fields, constrained by one behavior-definition map. Ship this as IndexedDB version 4: normalize legacy Preempt, Queue, and Suppress targets, default applicable recoveries to `Stay stopped`, and clear inapplicable values.

## Consequences

- Repository writes reject stale hidden fields rather than persisting ambiguous rules.
- The forthcoming editor can share definitions, defaults, and help text with the domain validator.
- Existing local data receives deterministic semantics without rewriting the version-3 event-order migration.
