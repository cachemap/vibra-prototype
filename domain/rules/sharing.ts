import type { ShareTarget } from "../entities";
import { ConstraintError } from "../errors";
import { errApp, okApp, type AppResult } from "../results";

export const canGenerateSharingLink = (target: ShareTarget): AppResult<void> => {
  const populatedTargets = [
    "projectId" in target && target.projectId,
    "eventId" in target && target.eventId,
    "collisionMatrixEntryId" in target && target.collisionMatrixEntryId
  ].filter(Boolean);

  if (populatedTargets.length !== 1) {
    return errApp(
      new ConstraintError("A sharing link must target exactly one project, event, or matrix entry.", {
        constraint: "share-target-exclusivity"
      })
    );
  }

  return okApp(undefined);
};
