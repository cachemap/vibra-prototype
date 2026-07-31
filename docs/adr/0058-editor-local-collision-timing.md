# 0058 Editor-local collision timing

## Context

The Collision Matrix editor needs an audible-preview timeline before the scheduling engine exists. Its relative timing is an audition decision; it must not rewrite an EventTrigger playback's authored start offset or become part of a saved Collision Matrix rule.

## Decision

Keep the Playing and Incoming offsets in `CollisionPreviewTimeline` local state. Default them to 0ms and 150ms, respectively. The horizontal DnD interaction and keyboard movement snap to 10ms; an exact millisecond field remains available for precision. Extend the local ruler as an offset grows and offer Reset timing without touching the rule draft.

## Consequences

- Saving, clearing, navigating back, or changing the event pair cannot persist audition timing.
- A later scheduler consumes the local offsets explicitly rather than interpreting authored playback data as collision timing.
- The two-lane timeline has stable controls and accessible pointer, keyboard, and exact-input paths before audio playback is enabled.
