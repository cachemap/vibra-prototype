# 0063 Stable Collision Preview Controls

## Context

The focused Collision Matrix editor had three ambiguous or unstable behaviors. A diagonal matrix cell could use the same Event ID for both roles and highlight both target buttons. Its audition ruler grew with the largest offset, which made later time difficult to discover. Playback also used a separate Stop action and a live millisecond readout that shifted the editor layout.

## Decision

Track the selected semantic target side (`playing` or `incoming`) in editor-local state while continuing to persist the domain model's Event association. Use a fixed 30-second horizontally scrollable audition canvas with sticky millisecond controls on the left, 10ms drag/keyboard snapping, and a visible playhead. Make Tap itself toggle to Stop during playback and omit a changing textual progress readout.

This supersedes the dynamically extending ruler described in ADR 0058; audition offsets remain editor-local and never rewrite authored EventTrigger playback offsets.

## Consequences

- Exactly one target button is selected, including when both matrix roles reference the same Event.
- A diagonal cell's non-default semantic side is session-local because the persisted Event association cannot distinguish identical playing and incoming IDs.
- The complete audition horizon is discoverable by horizontal scrolling and dragging without rescaling existing offsets.
- Playback remains visible through the playhead and Tap/Stop state without introducing layout shift.
