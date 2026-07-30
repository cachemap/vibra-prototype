# 0002 Primitive Styling Boundary

## Context

The route shell and future feature screens need to follow the Vibra design system without repeating long Tailwind utility stacks across every screen. The prototype also needs compact, tool-like controls before real project and asset data arrives.

## Decision

Create `components/primitives/` as the first UI layer for shared controls, dense tables, breadcrumbs, dialogs, and empty/error/loading states. Keep authored design tokens such as 34px buttons, 40px rows, gray surfaces, purple focus/selection, and lucide icon action patterns inside those primitives.

Feature screens should compose these primitives and add layout/data wiring around them. When a new recurring visual pattern appears, extend the primitive library before copying styling into feature code.

## Consequences

- Future route work can move faster while staying visually consistent.
- Design changes can be made in one shared layer instead of across feature screens.
- Some early primitives are intentionally minimal and may need behavior upgrades when real forms, menus, and dialogs become interactive.
