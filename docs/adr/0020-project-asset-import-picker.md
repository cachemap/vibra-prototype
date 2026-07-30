# 0020 Project Asset Import Picker

## Context

The project workspace needs to make imported libraries visible and let designers use imported assets in event playbacks without duplicating asset eligibility rules in React.

## Decision

Keep import and playback eligibility enforcement in the project repository. Annotate `DeviceWorkspaceAggregate.playbackAssets` with library display metadata, and let the project screen render an asset-picker list from that eligible aggregate. Import candidates are computed from the library summary aggregate by excluding the current project's default library and already-imported libraries before submitting through the repository import command.

## Consequences

- The picker cannot accidentally show assets from unimported libraries.
- The project sidebar now shows the default library and imports beside devices and collections.
- The import overlay remains lightweight for the prototype, while repository constraints still reject duplicate imports and own-default imports.
