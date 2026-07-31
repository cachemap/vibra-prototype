# 0052 Variable-backed theme palette

## Context

Vibra's components use authored `gray-*` and `purple-*` Tailwind utilities throughout the workspace. Adding local dark-mode variants would duplicate visual decisions and leave shared UI states easy to miss.

## Decision

Map the authored Tailwind palette to alpha-capable CSS variables, define light and dark values at the document theme boundary, and use `next-themes` with `data-theme`. Theme preference is `light`, `system`, or `dark`; the future global toolbar composes the shared three-option toggle.

## Consequences

- Existing palette utilities, alpha modifiers, and focus rings become theme-aware without per-component `dark:` classes.
- Native controls follow the mode via `color-scheme`, while variable-backed shadows and matrix dividers remain legible.
- New visual work must use the authored palette or an explicit theme variable rather than raw mode-sensitive colors.
