import type { VibraDatabase } from "../db";

export type DeleteCascadeEntity =
  | "asset"
  | "assetLibrary"
  | "assetLibraryFolder"
  | "collection"
  | "collisionMatrixColumn"
  | "collisionMatrixEntry"
  | "collisionMatrixRow"
  | "device"
  | "event"
  | "eventTrigger"
  | "project"
  | "projectFolder"
  | "sharingLink"
  | "triggerPlayback";

export type DeleteCascadeStep = {
  entity: DeleteCascadeEntity;
  reason: string;
  tables: (keyof VibraDatabase)[];
};

export const deleteCascadeTransactionTables = [
  "assetBlobs",
  "assets",
  "assetLibraries",
  "assetLibraryFolders",
  "collections",
  "collisionMatrices",
  "collisionMatrixColumns",
  "collisionMatrixEntries",
  "collisionMatrixRows",
  "devices",
  "eventTriggers",
  "events",
  "folders",
  "folderAccess",
  "projectAssetLibraryImports",
  "projects",
  "sharingLinks",
  "triggerPlaybacks"
] as const satisfies readonly (keyof VibraDatabase)[];

export const deleteCascadeOrder: readonly DeleteCascadeStep[] = [
  {
    entity: "triggerPlayback",
    reason: "leaf timeline rows can be removed before their owning trigger or referenced asset",
    tables: ["triggerPlaybacks"]
  },
  {
    entity: "eventTrigger",
    reason: "trigger rows own trigger playbacks",
    tables: ["eventTriggers", "triggerPlaybacks"]
  },
  {
    entity: "asset",
    reason: "assets own stored blobs and may be referenced by trigger playbacks",
    tables: ["assetBlobs", "assets", "triggerPlaybacks"]
  },
  {
    entity: "assetLibraryFolder",
    reason: "folders recurse through child folders and asset cascades",
    tables: ["assetBlobs", "assets", "assetLibraryFolders", "triggerPlaybacks"]
  },
  {
    entity: "assetLibrary",
    reason: "libraries own the root folder tree unless protected as a project default",
    tables: ["assetBlobs", "assets", "assetLibraries", "assetLibraryFolders", "projectAssetLibraryImports", "triggerPlaybacks"]
  },
  {
    entity: "event",
    reason: "events own triggers and participate in matrix rows, columns, entries, and sharing links",
    tables: [
      "collisionMatrixColumns",
      "collisionMatrixEntries",
      "collisionMatrixRows",
      "eventTriggers",
      "events",
      "sharingLinks",
      "triggerPlaybacks"
    ]
  },
  {
    entity: "collection",
    reason: "collections own events",
    tables: [
      "collections",
      "collisionMatrixColumns",
      "collisionMatrixEntries",
      "collisionMatrixRows",
      "eventTriggers",
      "events",
      "sharingLinks",
      "triggerPlaybacks"
    ]
  },
  {
    entity: "device",
    reason: "devices own collections, events, and their collision matrix",
    tables: [
      "collections",
      "collisionMatrices",
      "collisionMatrixColumns",
      "collisionMatrixEntries",
      "collisionMatrixRows",
      "devices",
      "eventTriggers",
      "events",
      "sharingLinks",
      "triggerPlaybacks"
    ]
  },
  {
    entity: "project",
    reason: "projects own devices, default libraries, imports, and project sharing links",
    tables: [...deleteCascadeTransactionTables]
  },
  {
    entity: "projectFolder",
    reason: "project folders recurse through child folders and project cascades",
    tables: [...deleteCascadeTransactionTables]
  },
  {
    entity: "collisionMatrixRow",
    reason: "axis removal clears entries on that row",
    tables: ["collisionMatrixEntries", "collisionMatrixRows", "sharingLinks"]
  },
  {
    entity: "collisionMatrixColumn",
    reason: "axis removal clears entries on that column",
    tables: ["collisionMatrixColumns", "collisionMatrixEntries", "sharingLinks"]
  },
  {
    entity: "collisionMatrixEntry",
    reason: "matrix cells own matrix-entry sharing links",
    tables: ["collisionMatrixEntries", "sharingLinks"]
  },
  {
    entity: "sharingLink",
    reason: "sharing links are leaves",
    tables: ["sharingLinks"]
  }
];

export const getDeleteCascadeStep = (entity: DeleteCascadeEntity) =>
  deleteCascadeOrder.find((step) => step.entity === entity);
