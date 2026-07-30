import { Laptop, Smartphone, Tablet } from "lucide-react";
import { describe, expect, it } from "vitest";
import {
  deviceFormFactors,
  devicePresets,
  groupDevicePresetsByFormFactor,
  platformNames,
  type DeviceFormFactor
} from "../domain";

const glyphByFormFactor = {
  Mobile: Smartphone,
  Tablet,
  Desktop: Laptop
} satisfies Record<DeviceFormFactor, unknown>;

describe("device catalog", () => {
  it("covers every supported platform", () => {
    const presetPlatforms = new Set(devicePresets.map((preset) => preset.platformName));

    expect(platformNames.every((platformName) => presetPlatforms.has(platformName))).toBe(true);
  });

  it("groups presets by stable form factor order", () => {
    const groups = groupDevicePresetsByFormFactor();

    expect(groups.map((group) => group.formFactor)).toEqual(deviceFormFactors);
    expect(groups.every((group) => group.presets.length > 0)).toBe(true);
  });

  it("keeps presets unique by id and platform device pair", () => {
    const ids = new Set(devicePresets.map((preset) => preset.presetId));
    const platformDevicePairs = new Set(
      devicePresets.map((preset) => `${preset.platformName}:${preset.deviceName}`)
    );

    expect(ids.size).toBe(devicePresets.length);
    expect(platformDevicePairs.size).toBe(devicePresets.length);
  });

  it("has a lucide glyph available for every form factor", () => {
    expect(Object.keys(glyphByFormFactor)).toEqual([...deviceFormFactors]);
    expect(glyphByFormFactor.Mobile).toBe(Smartphone);
    expect(glyphByFormFactor.Tablet).toBe(Tablet);
    expect(glyphByFormFactor.Desktop).toBe(Laptop);
  });
});
