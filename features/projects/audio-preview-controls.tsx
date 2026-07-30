"use client";

import { Play, Square } from "lucide-react";
import { Button, IconButton } from "@/components/primitives";
import type { AudioPreviewItem } from "./audio-preview";
import { isPreviewableAudioAsset } from "./audio-preview";

interface AudioPreviewIconButtonProps {
  activeKey: string | null;
  item: AudioPreviewItem;
  onPlay: (item: AudioPreviewItem) => void;
  onStop: () => void;
}

export function AudioPreviewIconButton({
  activeKey,
  item,
  onPlay,
  onStop
}: AudioPreviewIconButtonProps) {
  const isActive = activeKey === item.key;
  const disabled = !item.isEnabled || !isPreviewableAudioAsset(item.asset);

  return (
    <IconButton
      disabled={disabled}
      icon={isActive ? Square : Play}
      label={`${isActive ? "Stop" : "Play"} ${item.asset.name}`}
      onClick={() => {
        if (isActive) {
          onStop();
        } else {
          onPlay(item);
        }
      }}
      size="compact"
    />
  );
}

interface TimelinePreviewControlsProps {
  disabled?: boolean;
  isPlaying: boolean;
  label?: string;
  onPlay: () => void;
  onStop: () => void;
  playText?: string;
  stopText?: string;
  variant?: "primary" | "secondary";
}

export function TimelinePreviewControls({
  disabled,
  isPlaying,
  label = "timeline preview",
  onPlay,
  onStop,
  playText = "Play",
  stopText = "Stop",
  variant = "secondary"
}: TimelinePreviewControlsProps) {
  return (
    <Button
      aria-label={`${isPlaying ? "Stop" : "Play"} ${label}`}
      disabled={disabled}
      leftIcon={isPlaying ? <Square className="size-4" /> : <Play className="size-4" />}
      onClick={isPlaying ? onStop : onPlay}
      size="compact"
      variant={variant}
    >
      {isPlaying ? stopText : playText}
    </Button>
  );
}
