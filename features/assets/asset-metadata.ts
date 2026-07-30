import type { Asset } from "@/domain";

export const assetExtensionFor = (asset: Asset) =>
  asset.originalFilename.includes(".") ? `.${asset.originalFilename.split(".").pop()}` : asset.mediaKind;

export const assetSourceLabelFor = (asset: Asset) =>
  asset.playbackUrl.startsWith("blob:") || asset.playbackUrl.includes("/assets/uploaded/")
    ? `Uploaded ${asset.mediaKind}`
    : `Demo ${asset.mediaKind}`;
