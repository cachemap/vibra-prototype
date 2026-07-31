# 0062 Reduced-Motion Matrix Hover Override

## Context

Collision Matrix hover feedback uses hover-media utilities alongside reduced-motion utilities. In compiled CSS, the hover transform selectors could win over the ordinary reduced-motion transform reset, causing a lift and scale even when a user requested reduced motion.

## Decision

Use an important reduced-motion transform reset on interactive Matrix cells and behavior pills. Keep the non-motion border, ring, and shadow feedback active so cells remain discoverable without animation. Protect the behavior with a browser test that emulates `prefers-reduced-motion: reduce` and asserts the hovered cell has no transform or transform transition.

## Consequences

- Reduced-motion users retain a visible hover affordance without spatial movement.
- The explicit override guards against Tailwind selector ordering changes between hover and media variants.
- Matrix hover coverage now validates compiled browser behavior as well as component class composition.
