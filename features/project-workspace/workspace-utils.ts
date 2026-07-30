import type { DeviceSummary } from "@/data/repositories/project-repository";

export const formatDeviceMeta = (summary: DeviceSummary) =>
  summary.device.isEnabled ? summary.platform.name : "Excluded";

