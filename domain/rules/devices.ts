import type { CollisionMatrix, Device } from "../entities";
import { ConflictError, ConstraintError } from "../errors";
import { errApp, okApp, type AppResult } from "../results";

export const validateDeviceCreationRecords = (
  device: Device,
  collisionMatrix: CollisionMatrix
): AppResult<void> => {
  if (collisionMatrix.deviceId !== device.id) {
    return errApp(
      new ConstraintError("Device creation must create one collision matrix for that device.", {
        constraint: "device-collision-matrix"
      })
    );
  }

  return okApp(undefined);
};

export const canCreateDevice = (
  candidate: Pick<Device, "projectId" | "platformId" | "name">,
  existingDevices: readonly Device[]
): AppResult<void> => {
  const duplicate = existingDevices.some(
    (device) =>
      device.projectId === candidate.projectId &&
      device.platformId === candidate.platformId &&
      device.name === candidate.name
  );

  if (duplicate) {
    return errApp(
      new ConflictError("A project can only have one device with the same platform and name.", {
        constraint: "unique-project-platform-device-name"
      })
    );
  }

  return okApp(undefined);
};

export const collectionHasNoChildCollections = (): AppResult<void> => okApp(undefined);
