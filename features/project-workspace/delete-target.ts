import type {
  AssetId,
  AssetLibraryFolderId,
  CollectionId,
  CollisionMatrixEntryId,
  DeviceId,
  EventId,
  ProjectId
} from "@/domain";
import { pluralSuffix } from "../../lib/plural";

export type DeleteTarget =
  | { kind: "project"; id: ProjectId; name: string }
  | { kind: "device"; id: DeviceId; name: string }
  | { kind: "collection"; id: CollectionId; name: string }
  | { kind: "event"; id: EventId; name: string }
  | { counts: { assets: number; folders: number }; kind: "assetFolder"; id: AssetLibraryFolderId; name: string }
  | { kind: "asset"; id: AssetId; name: string }
  | { kind: "matrixEntry"; id: CollisionMatrixEntryId; name: string };

export const deleteActionLabelFor = (target: DeleteTarget) => {
  switch (target.kind) {
    case "matrixEntry":
      return "Clear matrix rule";
    case "assetFolder":
      return "Delete folder";
    default:
      return `Delete ${target.kind}`;
  }
};

export const cascadeSummaryFor = (target: DeleteTarget) => {
  switch (target.kind) {
    case "project":
      return "Devices, collections, events, default assets, imports, matrix rules, and share links.";
    case "device":
      return "Collections, events, trigger schedules, collision matrix rows, columns, entries, and share links.";
    case "collection":
      return "Events, trigger schedules, collision matrix rows, columns, entries, and share links.";
    case "event":
      return "Trigger schedules, collision matrix rows, columns, entries, and share links.";
    case "assetFolder":
      return `${target.counts.folders} child folder${pluralSuffix(
        target.counts.folders
      )} and ${target.counts.assets} asset${pluralSuffix(target.counts.assets)}.`;
    case "asset":
      return "Scheduled playbacks that reference this asset.";
    case "matrixEntry":
      return "The selected matrix rule and its share links.";
  }
};

export const deleteBodyCopyFor = (target: DeleteTarget) => {
  switch (target.kind) {
    case "matrixEntry":
      return `This clears ${target.name} and its dependent demo records from IndexedDB.`;
    default:
      return `This removes ${target.name} and its dependent demo records from IndexedDB.`;
  }
};
