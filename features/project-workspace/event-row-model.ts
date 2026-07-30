import type { DeviceEventAggregate } from "@/data/repositories/project-repository";

export type EventRowModel = DeviceEventAggregate & {
  playbackCount: number;
  triggerCount: number;
};

export const eventRowModelFor = (row: DeviceEventAggregate): EventRowModel => ({
  ...row,
  playbackCount: row.eventTriggers.reduce((total, trigger) => total + trigger.playbacks.length, 0),
  triggerCount: row.eventTriggers.length
});

export const eventRowModelsFor = (rows: readonly DeviceEventAggregate[]): EventRowModel[] =>
  rows.map(eventRowModelFor);
