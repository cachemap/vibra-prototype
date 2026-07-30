# 0050 Share Link Delete Confirmation Layering

## Context

The workspace share-link delete action used the generic confirmation primitive, but closed the share dialog first. That removed the target context instead of presenting a stacked confirmation over the active share dialog.

## Decision

Keep the share dialog open while a share-link deletion is pending, and render its confirmation after the shared workspace dialog overlay.

## Consequences

- Users can verify the share-link target while confirming deletion.
- The confirmation is visually above the share dialog without changing the centralized overlay primitive.
- Regular workspace delete confirmations remain independent of the share-link flow.
