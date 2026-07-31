# 0057 Editor-local collision sound selection

## Context

Matrix events can have multiple enabled trigger playbacks, while a collision audition needs one audio source on each side. Persisting that choice on an Event or Matrix rule would silently change authored schedules or make a local audition decision part of governance data.

## Decision

Derive previewable audio from the selected device workspace at render time: enabled event triggers only, ordered by their authored offset. Keep a source choice per Playing/Incoming lane in the focused editor's local state. Haptic playbacks remain represented as an explicit no-audio explanation, and the collision Tap control stays disabled until the scheduling engine is implemented.

## Consequences

- Matrix rules and `TriggerPlayback.startOffset` remain unchanged by source selection.
- The upcoming timing controls and scheduler can consume a small lane-source projection rather than querying Dexie or rebuilding event aggregates in React.
- An event with only haptic feedback remains understandable but cannot accidentally promise browser audio playback.
