# 0049 Action Menu Side Placement

## Context

Dense row action menus opened below their trigger. In compact tables and sidebars, that could physically cover the next row's action trigger, so one-click switching to the adjacent row was unreliable even though the menu state model supported it.

## Decision

Keep dropdown placement as the default `ActionMenu` behavior, but add an explicit side-placement mode. `RowActionsMenu` opts compact controls into side placement, preferring the side away from the trigger column and falling back to the existing dropdown behavior when neither side has room.

## Consequences

- Compact row menus no longer cover the adjacent action-trigger column when horizontal space is available.
- Header and default-size menus keep their dropdown placement.
- The positioning calculation is pure and covered by unit tests, while the existing portal, flip, and close behavior remains centralized in `ActionMenu`.
