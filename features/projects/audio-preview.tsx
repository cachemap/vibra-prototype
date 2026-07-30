"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Square } from "lucide-react";
import { Button, IconButton } from "@/components/primitives";
import type { Asset } from "@/domain";

export interface AudioPreviewItem {
  asset: Pick<Asset, "id" | "mediaKind" | "name" | "playbackUrl">;
  isEnabled: boolean;
  key: string;
  startOffset: number;
}

const scheduleTailSeconds = 1;

export const audioPreviewErrorMessage =
  "Audio preview could not play. The file may be missing, unsupported, or blocked by the browser.";

export const isPreviewableAudioAsset = (
  asset: Pick<Asset, "mediaKind" | "playbackUrl"> | null | undefined
) => Boolean(asset && asset.mediaKind === "audio" && asset.playbackUrl);

export const playableAudioItems = (items: readonly AudioPreviewItem[]) =>
  items.filter((item) => item.isEnabled && isPreviewableAudioAsset(item.asset));

interface RunningSchedule {
  audios: Set<HTMLAudioElement>;
  frameId: number | null;
  timeoutIds: number[];
}

export const useAudioPreviewPlayer = () => {
  const itemAudioRef = useRef<HTMLAudioElement | null>(null);
  const schedulesRef = useRef<Map<string, RunningSchedule>>(new Map());
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [playheadByScheduleKey, setPlayheadByScheduleKey] = useState<Record<string, number>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const teardownSchedule = useCallback((scheduleKey: string) => {
    const running = schedulesRef.current.get(scheduleKey);

    if (!running) {
      return;
    }

    running.timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
    running.audios.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });

    if (running.frameId !== null) {
      window.cancelAnimationFrame(running.frameId);
    }

    schedulesRef.current.delete(scheduleKey);
  }, []);

  const stopSchedule = useCallback(
    (scheduleKey: string) => {
      teardownSchedule(scheduleKey);
      setPlayheadByScheduleKey((current) => {
        if (!(scheduleKey in current)) {
          return current;
        }

        const next = { ...current };
        delete next[scheduleKey];

        return next;
      });
    },
    [teardownSchedule]
  );

  const stopItem = useCallback(() => {
    if (itemAudioRef.current) {
      itemAudioRef.current.pause();
      itemAudioRef.current.currentTime = 0;
      itemAudioRef.current = null;
    }

    setActiveKey(null);
  }, []);

  const stop = useCallback(() => {
    Array.from(schedulesRef.current.keys()).forEach(teardownSchedule);
    setPlayheadByScheduleKey({});
    stopItem();
  }, [stopItem, teardownSchedule]);

  const playItem = useCallback(
    async (item: AudioPreviewItem) => {
      if (!isPreviewableAudioAsset(item.asset)) {
        return;
      }

      stopItem();
      setErrorMessage(null);

      const audio = new Audio(item.asset.playbackUrl);
      itemAudioRef.current = audio;
      setActiveKey(item.key);

      audio.addEventListener("ended", () => {
        if (itemAudioRef.current === audio) {
          stopItem();
        }
      });
      audio.addEventListener("error", () => {
        setErrorMessage(audioPreviewErrorMessage);
        stopItem();
      });

      try {
        await audio.play();
      } catch {
        setErrorMessage(audioPreviewErrorMessage);
        stopItem();
      }
    },
    [stopItem]
  );

  const playSchedule = useCallback(
    (scheduleKey: string, items: readonly AudioPreviewItem[], durationSeconds?: number) => {
      const scheduledItems = items
        .filter((item) => item.isEnabled)
        .toSorted(
          (first, second) =>
            first.startOffset - second.startOffset || first.asset.name.localeCompare(second.asset.name)
        );

      stopSchedule(scheduleKey);
      setErrorMessage(null);

      if (!scheduledItems.length) {
        setErrorMessage("No enabled playbacks are scheduled for this preview.");
        return;
      }

      const running: RunningSchedule = { audios: new Set(), frameId: null, timeoutIds: [] };
      schedulesRef.current.set(scheduleKey, running);

      scheduledItems.filter((item) => isPreviewableAudioAsset(item.asset)).forEach((item) => {
        const timeoutId = window.setTimeout(() => {
          const audio = new Audio(item.asset.playbackUrl);
          running.audios.add(audio);

          audio.addEventListener("ended", () => running.audios.delete(audio));
          audio.addEventListener("error", () => {
            setErrorMessage(audioPreviewErrorMessage);
            stopSchedule(scheduleKey);
          });

          void audio.play().catch(() => {
            setErrorMessage(audioPreviewErrorMessage);
            stopSchedule(scheduleKey);
          });
        }, Math.max(0, item.startOffset * 1000));

        running.timeoutIds.push(timeoutId);
      });

      const scheduleDuration =
        durationSeconds ?? (scheduledItems.at(-1)?.startOffset ?? 0) + scheduleTailSeconds;
      const startedAt = window.performance.now();

      const step = () => {
        if (schedulesRef.current.get(scheduleKey) !== running) {
          return;
        }

        const elapsedSeconds = (window.performance.now() - startedAt) / 1000;

        if (elapsedSeconds >= scheduleDuration) {
          stopSchedule(scheduleKey);
          return;
        }

        setPlayheadByScheduleKey((current) => ({ ...current, [scheduleKey]: elapsedSeconds }));
        running.frameId = window.requestAnimationFrame(step);
      };

      setPlayheadByScheduleKey((current) => ({ ...current, [scheduleKey]: 0 }));
      running.frameId = window.requestAnimationFrame(step);
    },
    [stopSchedule]
  );

  useEffect(() => stop, [stop]);

  return {
    activeKey,
    errorMessage,
    isPlaying: Boolean(activeKey) || Object.keys(playheadByScheduleKey).length > 0,
    isSchedulePlaying: (scheduleKey: string) => scheduleKey in playheadByScheduleKey,
    playItem,
    playSchedule,
    playheadByScheduleKey,
    playheadFor: (scheduleKey: string) => playheadByScheduleKey[scheduleKey] ?? null,
    stop,
    stopSchedule
  };
};


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
