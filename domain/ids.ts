export type Brand<Value, Name extends string> = Value & { readonly __brand: Name };

export type ISODateString = Brand<string, "ISODateString">;

export type UserId = Brand<string, "UserId">;
export type ProjectFolderId = Brand<string, "ProjectFolderId">;
export type ProjectId = Brand<string, "ProjectId">;
export type PlatformId = Brand<string, "PlatformId">;
export type DeviceId = Brand<string, "DeviceId">;
export type CollisionMatrixId = Brand<string, "CollisionMatrixId">;
export type CollisionMatrixEntryId = Brand<string, "CollisionMatrixEntryId">;
export type CollectionId = Brand<string, "CollectionId">;
export type EventId = Brand<string, "EventId">;
export type TriggerId = Brand<string, "TriggerId">;
export type EventTriggerId = Brand<string, "EventTriggerId">;
export type TriggerPlaybackId = Brand<string, "TriggerPlaybackId">;
export type SharingLinkId = Brand<string, "SharingLinkId">;
export type AssetLibraryId = Brand<string, "AssetLibraryId">;
export type AssetLibraryFolderId = Brand<string, "AssetLibraryFolderId">;
export type AssetId = Brand<string, "AssetId">;

export type EntityId =
  | UserId
  | ProjectFolderId
  | ProjectId
  | PlatformId
  | DeviceId
  | CollisionMatrixId
  | CollisionMatrixEntryId
  | CollectionId
  | EventId
  | TriggerId
  | EventTriggerId
  | TriggerPlaybackId
  | SharingLinkId
  | AssetLibraryId
  | AssetLibraryFolderId
  | AssetId;

export const asEntityId = <Id extends EntityId>(value: string): Id => value as Id;

export const asISODateString = (value: string): ISODateString => value as ISODateString;

export const createEntityId = <Id extends EntityId>(prefix: string): Id => {
  const randomPart =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  return asEntityId<Id>(`${prefix}_${randomPart}`);
};

export const currentISODateString = (): ISODateString => asISODateString(new Date().toISOString());
