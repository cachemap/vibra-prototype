# 0012 Asset Library Repository Boundary

## Context

Phase 3.3 needs asset library loading and mutations before the asset browser and playback asset picker can be built. These flows cross project imports, asset libraries, asset folders, and assets, and they must preserve domain constraints around default libraries and asset-folder leaf behavior.

## Decision

Keep asset library tree loading, standalone library creation, nested folder creation, mock asset creation, and project library imports in `data/repositories/project-repository.ts` for now. The repository validates command input, returns parsed domain records, creates standalone libraries with exactly one root folder, prevents a project from importing its own default library, rejects duplicate imports, and enforces that asset folders cannot mix child folders with assets.

## Consequences

- Future asset UI can load one tree aggregate and call focused mutations without duplicating Dexie traversal or leaf-folder rules.
- Imported asset eligibility for trigger playbacks continues to use the same project aggregate boundary.
- The project repository is getting broad, but it remains useful while the prototype is still assembling the main demo spine.
