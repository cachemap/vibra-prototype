import type { PlatformName } from "./enums";

export const deviceFormFactors = ["Mobile", "Tablet", "Desktop"] as const;
export type DeviceFormFactor = (typeof deviceFormFactors)[number];

export type DevicePreset = {
  deviceName: string;
  formFactor: DeviceFormFactor;
  platformName: PlatformName;
  presetId: string;
};

export const devicePresets = [
  { presetId: "ios-iphone-pro", platformName: "iOS", deviceName: "iPhone Pro", formFactor: "Mobile" },
  { presetId: "ios-iphone", platformName: "iOS", deviceName: "iPhone", formFactor: "Mobile" },
  { presetId: "ios-iphone-e", platformName: "iOS", deviceName: "iPhone e", formFactor: "Mobile" },
  { presetId: "ios-ipad-pro", platformName: "iOS", deviceName: "iPad Pro", formFactor: "Tablet" },
  { presetId: "ios-ipad-air", platformName: "iOS", deviceName: "iPad Air", formFactor: "Tablet" },
  { presetId: "android-pixel-pro", platformName: "Android", deviceName: "Pixel Pro", formFactor: "Mobile" },
  { presetId: "android-pixel", platformName: "Android", deviceName: "Pixel", formFactor: "Mobile" },
  { presetId: "android-galaxy-s", platformName: "Android", deviceName: "Galaxy S", formFactor: "Mobile" },
  { presetId: "android-galaxy-fold", platformName: "Android", deviceName: "Galaxy Fold", formFactor: "Mobile" },
  {
    presetId: "android-tablet",
    platformName: "Android",
    deviceName: "Android Tablet",
    formFactor: "Tablet"
  },
  { presetId: "mac-macbook-pro", platformName: "Mac", deviceName: "MacBook Pro", formFactor: "Desktop" },
  { presetId: "mac-macbook-air", platformName: "Mac", deviceName: "MacBook Air", formFactor: "Desktop" },
  { presetId: "mac-imac", platformName: "Mac", deviceName: "iMac", formFactor: "Desktop" },
  { presetId: "mac-mini", platformName: "Mac", deviceName: "Mac mini", formFactor: "Desktop" },
  { presetId: "windows-surface-pro", platformName: "Windows", deviceName: "Surface Pro", formFactor: "Tablet" },
  {
    presetId: "windows-surface-laptop",
    platformName: "Windows",
    deviceName: "Surface Laptop",
    formFactor: "Desktop"
  },
  {
    presetId: "windows-desktop",
    platformName: "Windows",
    deviceName: "Windows Desktop",
    formFactor: "Desktop"
  },
  { presetId: "linux-laptop", platformName: "Linux", deviceName: "Linux Laptop", formFactor: "Desktop" },
  { presetId: "linux-desktop", platformName: "Linux", deviceName: "Linux Desktop", formFactor: "Desktop" }
] as const satisfies readonly DevicePreset[];

export function groupDevicePresetsByFormFactor(presets: readonly DevicePreset[] = devicePresets) {
  return deviceFormFactors.map((formFactor) => ({
    formFactor,
    presets: presets.filter((preset) => preset.formFactor === formFactor)
  }));
}
