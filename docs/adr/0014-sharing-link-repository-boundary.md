# 0014 Sharing Link Repository Boundary

## Context

Phase 3.3 needs share link generation and lookup before the share dialogs and `/share/[shareToken]` route can render project, event, and matrix-entry previews. Links must target exactly one supported domain object and keep working with the existing seeded demo URLs.

## Decision

Keep sharing link generation and lookup in `data/repositories/project-repository.ts`. The repository validates the creator user, validates the target object exists, creates URLs in the form `https://vibra.local/share/{shareId}`, and resolves links by route token from the stored URL.

## Consequences

- Seeded links with readable tokens continue to resolve for stakeholder demos.
- Newly generated links use the generated share ID as their route token, avoiding a separate token column for the prototype.
- Future share UI can use one repository/query boundary before deciding whether richer share aggregates need their own repository.
