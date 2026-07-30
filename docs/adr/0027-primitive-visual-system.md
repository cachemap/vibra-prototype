# 0027 Primitive Visual System

## Context

Phase 10 polish needs screens to converge on the screenshot direction without repeating long Tailwind class stacks in feature files. The existing primitive set had the right shape but lacked several expected controls and shared state handling.

## Decision

Keep the visual system in `components/primitives/` and standardize control states around the existing grayscale and purple Tailwind tokens from `color-palette.png`. Add `Checkbox`, `Popover`, `Tooltip`, and `Menu` primitives, and harden existing controls with shared focus, disabled, sizing, overflow, and grayscale validation treatments.

## Consequences

- Feature screens can compose a broader primitive surface during Phase 10.2 polish.
- Purple remains limited to primary, focus, and selected states.
- Menu and tooltip behavior is intentionally lightweight for the prototype; richer placement and dismissal logic can be added later if screen polish requires it.
