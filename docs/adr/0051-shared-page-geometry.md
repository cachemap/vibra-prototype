# 0051 Shared Page Geometry

## Context

Projects, Libraries, the project workspace, and Event Detail used independent wrappers and padding overrides around the shared page header. The top-level project and library rails also used the same fixed width without a shared source of truth.

## Decision

Define shell height, top-level rail width, and page gutter tokens in `app/globals.css`. `PageHeader` owns the canonical page-header gutters, while each page owns only its body gutters. Both top-level rails use the 320px token; the nested project asset-library rail remains at 268px because the baseline capture did not show the same truncation issue.

## Consequences

- Navigation preserves a common breadcrumb and title baseline across these workspace routes.
- Future top-level rail changes are made in one place.
- The nested asset rail can be independently reconsidered without widening it by accident.
