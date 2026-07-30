import { FileAudio, Waves } from "lucide-react";
import type { Asset } from "@/domain";
import { AudioPreviewButton } from "@/features/projects/audio-preview-context";
import type { AudioPreviewItem } from "@/features/projects/audio-preview";

type AssetNameCellProps = {
  asset: Asset;
  iconClassName?: string;
};

export function AssetNameCell({ asset, iconClassName = "size-4 text-gray-600" }: AssetNameCellProps) {
  const Icon = asset.mediaKind === "audio" ? FileAudio : Waves;

  return (
    <span className="flex items-center gap-2">
      <Icon className={iconClassName} strokeWidth={1.8} />
      {asset.name}
    </span>
  );
}

type AssetPreviewCellProps = {
  asset: Asset;
  fallbackLabel: string;
  previewKeyPrefix: string;
};

export function AssetPreviewCell({ asset, fallbackLabel, previewKeyPrefix }: AssetPreviewCellProps) {
  const previewItem: AudioPreviewItem = {
    asset,
    isEnabled: asset.mediaKind === "audio",
    key: `${previewKeyPrefix}-${asset.id}`,
    startOffset: 0
  };

  return asset.mediaKind === "audio" ? (
    <AudioPreviewButton item={previewItem} />
  ) : (
    <span className="text-xs text-gray-500">{fallbackLabel}</span>
  );
}
