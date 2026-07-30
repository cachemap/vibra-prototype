# 0006 Domain Rule Functions

## Context

Phase 2.3 needs domain constraints that future IndexedDB repositories can call before writes. Schemas already validate record shape and fixed vocabularies, but cross-record rules need explicit functions that stay outside React and Dexie.

## Decision

Add `domain/rules/` as the domain rule boundary for folder containment, project asset-library creation/imports, device creation, event-trigger scheduling, collision matrix membership, and share target exclusivity. Rule functions return `AppResult<void>` for write guards and preserve specific `ConflictError` or `ConstraintError` messages for UI copy.

Keep rules expressed against plain domain entities and ID types. For constraints that the current model makes structural, such as flat Collections, expose a small rule function so repositories can still call one consistent boundary.

## Consequences

- Phase 3 repositories can compose validation, rule checks, and Dexie writes without importing UI code.
- Unit tests now cover high-risk model constraints before persistence exists.
- Some rule APIs may be adjusted once aggregate repository shapes are concrete, but their behavior is now pinned by tests.
