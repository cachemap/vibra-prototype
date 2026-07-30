# 0034 Pure Utility Layer Boundary

## Context

Component decomposition needs duplicated helper logic removed from page files before JSX moves into feature modules. Those helpers cover generic formatting, plural labels, tree traversal, search-param updates, flash messages, and app-error display copy.

## Decision

Add a small `lib/` layer for pure shared utilities before changing call sites. Keep the helpers generic and domain-free, except `lib/errors.ts`, which may import the domain error classes to preserve the existing user-facing error mapping. Make error fallbacks explicit named constants rather than defaults so later adoption cannot silently change page copy.

## Consequences

- Stage 2 can replace duplicated page helpers mechanically while preserving current strings and URL output.
- Generic tree, format, plural, and search-param helpers stay reusable by future feature modules.
- `lib/flash-message.ts` is the only client-only helper because it touches `window.sessionStorage`.
