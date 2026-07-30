# 0029 Overlay Dialog Boundary

## Context

Phase 10.2 still had inconsistent overlay behavior: project explorer dialogs rendered inline, library dialogs owned ad hoc overlay wrappers, and project workspace dialogs positioned themselves directly.

## Decision

Add a shared `DialogOverlay` primitive and keep `Dialog` responsible only for the popup surface. Route screens choose centered or right-aligned placement through the overlay, while form content and actions stay inside `Dialog`.

## Consequences

- Dialogs, popovers, and picker-like flows share the documented overlay margin, dimming, rounded surface, and scroll constraints.
- Project workspace dialogs keep their right-side workflow placement without embedding fixed positioning in each dialog.
- Future overlay changes can be made in the primitive instead of every feature screen.
