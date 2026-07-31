import * as v from "valibot";

import {
  eventTypes,
  interruptionRecoveries,
  mediaKinds,
  platformNames,
  resolutionBehaviorNames,
  triggerNames
} from "./enums";

const idSchema = v.pipe(v.string(), v.nonEmpty());
const nullableIdSchema = v.nullable(idSchema);
const isoDateStringSchema = v.pipe(v.string(), v.isoTimestamp());
const nameSchema = v.pipe(v.string(), v.nonEmpty());
const optionalNameSchema = v.optional(nameSchema);
const optionalNullableStringSchema = v.optional(v.nullable(v.string()));
const nonNegativeNumberSchema = v.pipe(v.number(), v.minValue(0));
const nonNegativeIntegerSchema = v.pipe(v.number(), v.integer(), v.minValue(0));

export const platformNameSchema = v.picklist(platformNames);
export const triggerNameSchema = v.picklist(triggerNames);
export const eventTypeSchema = v.picklist(eventTypes);
export const resolutionBehaviorNameSchema = v.picklist(resolutionBehaviorNames);
export const interruptionRecoverySchema = v.picklist(interruptionRecoveries);
export const mediaKindSchema = v.picklist(mediaKinds);

export const userSchema = v.strictObject({
  id: idSchema,
  preferredName: nameSchema
});

export const projectFolderSchema = v.strictObject({
  id: idSchema,
  parentFolderId: nullableIdSchema,
  name: nameSchema,
  createdAt: isoDateStringSchema
});

export const folderAccessSchema = v.strictObject({
  userId: idSchema,
  folderId: idSchema
});

export const projectSchema = v.strictObject({
  id: idSchema,
  folderId: nullableIdSchema,
  defaultAssetLibraryId: idSchema,
  name: nameSchema,
  createdAt: isoDateStringSchema
});

export const platformSchema = v.strictObject({
  id: idSchema,
  name: platformNameSchema
});

export const deviceSchema = v.strictObject({
  id: idSchema,
  projectId: idSchema,
  platformId: idSchema,
  name: nameSchema,
  createdAt: isoDateStringSchema,
  updatedAt: isoDateStringSchema,
  isEnabled: v.boolean()
});

export const collisionMatrixSchema = v.strictObject({
  id: idSchema,
  deviceId: idSchema
});

export const collisionMatrixRowSchema = v.strictObject({
  matrixId: idSchema,
  eventId: idSchema
});

export const collisionMatrixColumnSchema = v.strictObject({
  matrixId: idSchema,
  eventId: idSchema
});

export const resolutionBehaviorSchema = v.strictObject({
  behaviorName: resolutionBehaviorNameSchema,
  targetEventId: nullableIdSchema,
  postInterruptionRecovery: v.nullable(interruptionRecoverySchema),
  systemInterruptionRecovery: v.nullable(interruptionRecoverySchema)
});

export const collisionMatrixEntrySchema = v.strictObject({
  id: idSchema,
  matrixId: idSchema,
  playingEventId: idSchema,
  incomingEventId: idSchema,
  resolutionBehavior: resolutionBehaviorSchema
});

export const collectionSchema = v.strictObject({
  id: idSchema,
  deviceId: idSchema,
  name: nameSchema
});

export const eventSchema = v.strictObject({
  id: idSchema,
  collectionId: idSchema,
  name: nameSchema,
  eventType: eventTypeSchema,
  sortOrder: nonNegativeIntegerSchema
});

export const triggerSchema = v.strictObject({
  id: idSchema,
  name: triggerNameSchema
});

export const eventTriggerSchema = v.strictObject({
  id: idSchema,
  eventId: idSchema,
  triggerId: idSchema,
  label: v.nullable(v.string()),
  isEnabled: v.boolean()
});

export const triggerPlaybackSchema = v.strictObject({
  id: idSchema,
  eventTriggerId: idSchema,
  assetId: idSchema,
  startOffset: nonNegativeNumberSchema
});

export const shareTargetSchema = v.variant("kind", [
  v.strictObject({ kind: v.literal("project"), projectId: idSchema }),
  v.strictObject({ kind: v.literal("event"), eventId: idSchema }),
  v.strictObject({
    kind: v.literal("collisionMatrixEntry"),
    collisionMatrixEntryId: idSchema
  })
]);

export const sharingLinkSchema = v.strictObject({
  id: idSchema,
  target: shareTargetSchema,
  createdByUserId: idSchema,
  url: v.pipe(v.string(), v.url())
});

export const assetLibrarySchema = v.strictObject({
  id: idSchema,
  name: nameSchema,
  defaultForProjectId: nullableIdSchema
});

export const projectAssetLibraryImportSchema = v.strictObject({
  projectId: idSchema,
  assetLibraryId: idSchema
});

export const assetLibraryFolderSchema = v.strictObject({
  id: idSchema,
  libraryId: idSchema,
  parentFolderId: nullableIdSchema,
  name: nameSchema,
  icon: nameSchema
});

export const assetSchema = v.strictObject({
  id: idSchema,
  libraryId: idSchema,
  folderId: idSchema,
  name: nameSchema,
  assetId: nameSchema,
  mediaKind: mediaKindSchema,
  originalFilename: nameSchema,
  uploadedAt: isoDateStringSchema,
  playbackUrl: v.pipe(v.string(), v.url())
});

export const assetBlobSchema = v.strictObject({
  assetId: idSchema,
  blob: v.unknown(),
  contentType: v.string(),
  size: nonNegativeNumberSchema,
  storedAt: isoDateStringSchema
});

export const createProjectFolderCommandSchema = v.strictObject({
  parentFolderId: nullableIdSchema,
  createdByUserId: v.optional(idSchema),
  name: nameSchema
});

export const updateProjectFolderCommandSchema = v.strictObject({
  folderId: idSchema,
  name: nameSchema
});

export const createProjectCommandSchema = v.strictObject({
  folderId: nullableIdSchema,
  name: nameSchema,
  devices: v.optional(v.array(v.strictObject({
    platformId: idSchema,
    name: nameSchema
  })), []),
  starterEventTypes: v.optional(v.array(eventTypeSchema), [])
});

export const updateProjectCommandSchema = v.strictObject({
  projectId: idSchema,
  name: nameSchema
});

export const createDeviceCommandSchema = v.strictObject({
  projectId: idSchema,
  platformId: idSchema,
  name: nameSchema,
  isEnabled: v.optional(v.boolean())
});

export const updateDeviceCommandSchema = v.strictObject({
  deviceId: idSchema,
  name: optionalNameSchema,
  isEnabled: v.optional(v.boolean())
});

export const createCollectionCommandSchema = v.strictObject({
  deviceId: idSchema,
  name: nameSchema
});

export const updateCollectionCommandSchema = v.strictObject({
  collectionId: idSchema,
  name: nameSchema
});

export const createEventCommandSchema = v.strictObject({
  collectionId: idSchema,
  name: nameSchema,
  eventType: eventTypeSchema
});

export const reorderCollectionEventsCommandSchema = v.strictObject({
  collectionId: idSchema,
  orderedEventIds: v.array(idSchema)
});

export const updateEventCommandSchema = v.strictObject({
  eventId: idSchema,
  name: optionalNameSchema,
  eventType: v.optional(eventTypeSchema)
});

export const createEventTriggerCommandSchema = v.strictObject({
  eventId: idSchema,
  triggerId: idSchema,
  label: v.optional(v.nullable(v.string())),
  isEnabled: v.optional(v.boolean())
});

export const updateEventTriggerCommandSchema = v.strictObject({
  eventTriggerId: idSchema,
  label: optionalNullableStringSchema,
  isEnabled: v.optional(v.boolean())
});

export const createTriggerPlaybackCommandSchema = v.strictObject({
  eventTriggerId: idSchema,
  assetId: idSchema,
  startOffset: nonNegativeNumberSchema
});

export const updateTriggerPlaybackCommandSchema = v.strictObject({
  triggerPlaybackId: idSchema,
  assetId: v.optional(idSchema),
  startOffset: v.optional(nonNegativeNumberSchema)
});

export const createAssetLibraryCommandSchema = v.strictObject({
  name: nameSchema
});

export const importAssetLibraryCommandSchema = v.strictObject({
  projectId: idSchema,
  assetLibraryId: idSchema
});

export const createAssetLibraryFolderCommandSchema = v.strictObject({
  libraryId: idSchema,
  parentFolderId: idSchema,
  name: nameSchema,
  icon: nameSchema
});

export const createAssetCommandSchema = v.strictObject({
  libraryId: idSchema,
  folderId: idSchema,
  name: nameSchema,
  assetId: nameSchema,
  mediaKind: mediaKindSchema,
  originalFilename: nameSchema,
  playbackUrl: v.optional(v.pipe(v.string(), v.url())),
  blob: v.optional(v.blob()),
  contentType: v.optional(v.string())
});

export const upsertCollisionMatrixEntryCommandSchema = v.strictObject({
  matrixId: idSchema,
  playingEventId: idSchema,
  incomingEventId: idSchema,
  resolutionBehavior: resolutionBehaviorSchema
});

export const selectCollisionMatrixEventCommandSchema = v.strictObject({
  matrixId: idSchema,
  eventId: idSchema
});

export const generateSharingLinkCommandSchema = v.strictObject({
  target: shareTargetSchema,
  createdByUserId: idSchema
});

export const shareRouteParamsSchema = v.strictObject({
  shareToken: idSchema
});
