"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef
} from "react";

import type { AudioPreviewItem } from "./audio-preview";
import { useAudioPreviewPlayer } from "./audio-preview";
import { AudioPreviewIconButton } from "./audio-preview-controls";

type AudioPreviewState = {
  activeKey: string | null;
  errorMessage: string | null;
  isPlaying: boolean;
  playheadByScheduleKey: Readonly<Record<string, number>>;
};

type AudioPreviewActions = {
  isSchedulePlaying: (scheduleKey: string) => boolean;
  playItem: (item: AudioPreviewItem) => Promise<void>;
  playSchedule: (
    scheduleKey: string,
    items: readonly AudioPreviewItem[],
    durationSeconds?: number
  ) => void;
  playheadFor: (scheduleKey: string) => number | null;
  stop: () => void;
  stopSchedule: (scheduleKey: string) => void;
};

const AudioPreviewStateContext = createContext<AudioPreviewState | null>(null);
const AudioPreviewActionsContext = createContext<AudioPreviewActions | null>(null);

export function AudioPreviewProvider({ children }: { children: ReactNode }) {
  const preview = useAudioPreviewPlayer();
  const previewRef = useRef(preview);

  useEffect(() => {
    previewRef.current = preview;
  }, [preview]);

  const state = useMemo<AudioPreviewState>(
    () => ({
      activeKey: preview.activeKey,
      errorMessage: preview.errorMessage,
      isPlaying: preview.isPlaying,
      playheadByScheduleKey: preview.playheadByScheduleKey
    }),
    [preview.activeKey, preview.errorMessage, preview.isPlaying, preview.playheadByScheduleKey]
  );

  const actions = useMemo<AudioPreviewActions>(
    () => ({
      isSchedulePlaying: (scheduleKey) => previewRef.current.isSchedulePlaying(scheduleKey),
      playItem: (item) => previewRef.current.playItem(item),
      playSchedule: (scheduleKey, items, durationSeconds) =>
        previewRef.current.playSchedule(scheduleKey, items, durationSeconds),
      playheadFor: (scheduleKey) => previewRef.current.playheadFor(scheduleKey),
      stop: () => previewRef.current.stop(),
      stopSchedule: (scheduleKey) => previewRef.current.stopSchedule(scheduleKey)
    }),
    []
  );

  // Providers receive children as an opaque subtree so provider state changes only re-render context consumers.
  return (
    <AudioPreviewActionsContext.Provider value={actions}>
      <AudioPreviewStateContext.Provider value={state}>{children}</AudioPreviewStateContext.Provider>
    </AudioPreviewActionsContext.Provider>
  );
}

export function useAudioPreviewState(): AudioPreviewState {
  const state = useContext(AudioPreviewStateContext);

  if (!state) {
    throw new Error("useAudioPreviewState must be used within AudioPreviewProvider.");
  }

  return state;
}

export function useAudioPreviewActions(): AudioPreviewActions {
  const actions = useContext(AudioPreviewActionsContext);

  if (!actions) {
    throw new Error("useAudioPreviewActions must be used within AudioPreviewProvider.");
  }

  return actions;
}

export function AudioPreviewButton({ item }: { item: AudioPreviewItem }) {
  const { activeKey } = useAudioPreviewState();
  const { playItem, stop } = useAudioPreviewActions();

  return <AudioPreviewIconButton activeKey={activeKey} item={item} onPlay={playItem} onStop={stop} />;
}
