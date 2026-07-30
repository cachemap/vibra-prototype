import { describe, expect, it } from "vitest";
import { asEntityId } from "../domain";
import {
  cascadeSummaryFor,
  deleteActionLabelFor,
  deleteBodyCopyFor,
  type DeleteTarget
} from "../features/project-workspace/delete-target";

describe("project workspace delete target copy", () => {
  const targets: Array<{
    action: string;
    body: string;
    summary: string;
    target: DeleteTarget;
  }> = [
    {
      action: "Delete project",
      body: "This removes Checkout and its dependent demo records from IndexedDB.",
      summary: "Devices, collections, events, default assets, imports, matrix rules, and share links.",
      target: { kind: "project", id: asEntityId("project_checkout-system"), name: "Checkout" }
    },
    {
      action: "Delete device",
      body: "This removes iPhone and its dependent demo records from IndexedDB.",
      summary: "Collections, events, trigger schedules, collision matrix rows, columns, entries, and share links.",
      target: { kind: "device", id: asEntityId("device_iphone"), name: "iPhone" }
    },
    {
      action: "Delete collection",
      body: "This removes Keyboard and its dependent demo records from IndexedDB.",
      summary: "Events, trigger schedules, collision matrix rows, columns, entries, and share links.",
      target: { kind: "collection", id: asEntityId("collection_keyboard"), name: "Keyboard" }
    },
    {
      action: "Delete event",
      body: "This removes Primary CTA and its dependent demo records from IndexedDB.",
      summary: "Trigger schedules, collision matrix rows, columns, entries, and share links.",
      target: { kind: "event", id: asEntityId("event_primary-cta"), name: "Primary CTA" }
    },
    {
      action: "Delete folder",
      body: "This removes Ambience and its dependent demo records from IndexedDB.",
      summary: "1 child folder and 1 asset.",
      target: {
        counts: { assets: 1, folders: 1 },
        kind: "assetFolder",
        id: asEntityId("folder_ambience"),
        name: "Ambience"
      }
    },
    {
      action: "Delete folder",
      body: "This removes Empty and its dependent demo records from IndexedDB.",
      summary: "0 child folders and 0 assets.",
      target: {
        counts: { assets: 0, folders: 0 },
        kind: "assetFolder",
        id: asEntityId("folder_empty"),
        name: "Empty"
      }
    },
    {
      action: "Delete asset",
      body: "This removes Tap and its dependent demo records from IndexedDB.",
      summary: "Scheduled playbacks that reference this asset.",
      target: { kind: "asset", id: asEntityId("asset_tap"), name: "Tap" }
    },
    {
      action: "Clear matrix rule",
      body: "This clears Tap -> Toast and its dependent demo records from IndexedDB.",
      summary: "The selected matrix rule and its share links.",
      target: { kind: "matrixEntry", id: asEntityId("matrix_entry_tap-toast"), name: "Tap -> Toast" }
    }
  ];

  it.each(targets)("keeps byte-identical copy for $action", ({ action, body, summary, target }) => {
    expect(deleteActionLabelFor(target)).toBe(action);
    expect(cascadeSummaryFor(target)).toBe(summary);
    expect(deleteBodyCopyFor(target)).toBe(body);
  });
});
