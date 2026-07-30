"use client";

import { useParams } from "next/navigation";
import { useMemo } from "react";
import { Copy, ExternalLink, Grid2X2, Radio, Smartphone } from "lucide-react";
import {
  Badge,
  Breadcrumbs,
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Timeline,
  type TimelineLane
} from "@/components/primitives";
import { useSharingLinkPreviewQuery } from "@/features/projects/queries";
import {
  AudioPreviewIconButton,
  TimelinePreviewControls,
  playableAudioItems,
  useAudioPreviewPlayer,
  type AudioPreviewItem
} from "@/features/projects/audio-preview";
import { messageForError, shareErrorFallback } from "@/lib/errors";
import { formatSeconds } from "@/lib/format";
import { pluralSuffix } from "@/lib/plural";
import { shareBehaviorCopy } from "@/features/matrix/behavior";

export default function SharePage() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const previewQuery = useSharingLinkPreviewQuery(shareToken);
  const audioPreview = useAudioPreviewPlayer();
  const { activeKey, playItem, playSchedule, stop } = audioPreview;
  const previewTarget = previewQuery.data?.target;
  const sharePath = `/share/${shareToken}`;
  const sharePreviewItems = useMemo<AudioPreviewItem[]>(() => {
    if (previewTarget?.kind !== "event") {
      return [];
    }

    return previewTarget.eventTriggers
      .flatMap((eventTrigger) =>
        eventTrigger.playbacks.map((playback) => ({
          asset: playback.asset,
          isEnabled: Boolean(previewTarget.device.isEnabled && eventTrigger.isEnabled),
          key: `share-${playback.id}`,
          startOffset: playback.startOffset
        }))
      )
      .filter((item) => item.asset.mediaKind === "audio");
  }, [previewTarget]);
  const sharePreviewItemsByPlaybackId = useMemo(
    () => new Map(sharePreviewItems.map((item) => [item.key.replace("share-", ""), item])),
    [sharePreviewItems]
  );
  const hasPlayableShareAudio = playableAudioItems(sharePreviewItems).length > 0;
  const shareTimelineMaxSeconds = useMemo(() => {
    const playbacks =
      previewTarget?.kind === "event"
        ? previewTarget.eventTriggers.flatMap((eventTrigger) => eventTrigger.playbacks)
        : [];

    return Math.max(1, ...playbacks.map((playback) => playback.startOffset + 0.45));
  }, [previewTarget]);
  const shareTimelineLanes = useMemo<TimelineLane[]>(() => {
    if (previewTarget?.kind !== "event") {
      return [];
    }

    return previewTarget.eventTriggers.map((eventTrigger) => {
      const playbacks = eventTrigger.playbacks
        .map((playback) => ({
          playback,
          previewItem: sharePreviewItemsByPlaybackId.get(playback.id)
        }))
        .sort(
          (first, second) =>
            first.playback.startOffset - second.playback.startOffset ||
            first.playback.asset.name.localeCompare(second.playback.asset.name)
        );

      return {
        blocks: playbacks.map(({ playback, previewItem }) => ({
          controls: previewItem ? (
            <AudioPreviewIconButton
              activeKey={activeKey}
              item={previewItem}
              onPlay={(item) => void playItem(item)}
              onStop={stop}
            />
          ) : undefined,
          id: playback.id,
          isDisabled: !eventTrigger.isEnabled || !previewTarget.device.isEnabled,
          kind: playback.asset.mediaKind,
          label: playback.asset.name,
          meta: formatSeconds(playback.startOffset),
          offsetSeconds: playback.startOffset
        })),
        id: eventTrigger.id,
        isDisabled: !eventTrigger.isEnabled || !previewTarget.device.isEnabled,
        label: eventTrigger.trigger.name,
        meta: [
          eventTrigger.label || (eventTrigger.isEnabled ? "Enabled" : null),
          eventTrigger.isEnabled ? null : "disabled interaction",
          previewTarget.device.isEnabled ? null : "disabled device"
        ]
          .filter(Boolean)
          .join(" / ")
      };
    });
  }, [activeKey, playItem, previewTarget, sharePreviewItemsByPlaybackId, stop]);

  const copyLink = async () => {
    const absoluteUrl = `${window.location.origin}${sharePath}`;

    try {
      await navigator.clipboard.writeText(absoluteUrl);
    } catch {
      await navigator.clipboard.writeText(sharePath);
    }
  };

  if (previewQuery.isLoading) {
    return (
      <section className="px-4 py-5">
        <LoadingState title="Loading share target" description="Resolving the local Vibra preview." />
      </section>
    );
  }

  if (previewQuery.isError || !previewQuery.data) {
    return (
      <section className="grid gap-5 px-4 py-5">
        <Breadcrumbs
          items={[
            { href: "/projects", label: "Projects" },
            { label: "Invalid share link" }
          ]}
        />
        <ErrorState
          title="Invalid share link"
          description={messageForError(previewQuery.error, shareErrorFallback)}
          action={<Button onClick={() => void previewQuery.refetch()}>Retry</Button>}
        />
      </section>
    );
  }

  const preview = previewQuery.data;
  const target = preview.target;
  const targetLabel =
    target.kind === "project"
      ? target.project.name
      : target.kind === "event"
        ? target.event.name
        : `${target.playingEvent.name} x ${target.incomingEvent.name}`;
  const targetKind =
    target.kind === "collisionMatrixEntry" ? "Collision Matrix Entry" : target.kind === "project" ? "Project" : "Event";
  const sourceContext =
    target.kind === "project"
      ? `${target.devices.length} device target${pluralSuffix(target.devices.length)} configured`
      : target.kind === "event"
        ? `${target.project.name} / ${target.device.name} / ${target.collection.name}`
        : `${target.project.name} / ${target.device.name} / Collision Matrix`;

  return (
    <section className="grid gap-5 px-4 py-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-2">
          <Breadcrumbs
            items={[
              { href: "/projects", label: "Projects" },
              { label: "Share preview" }
            ]}
          />
          <div className="grid gap-2 border-y border-gray-300 bg-gray-50 px-3 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="text-xs font-semibold text-gray-700" variant="outline">
                {targetKind}
              </Badge>
              <span className="text-xs font-medium text-gray-500">Source: {sourceContext}</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-700">{targetLabel}</h1>
              <p className="text-sm text-gray-500">Created by {preview.createdByUser.preferredName}.</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button leftIcon={<Copy className="size-4" />} onClick={() => void copyLink()}>
            Copy link
          </Button>
          <Button leftIcon={<ExternalLink className="size-4" />} onClick={() => window.open(sharePath, "_blank")}>
            Open mobile preview
          </Button>
        </div>
      </div>

      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Target</TableHeaderCell>
            <TableHeaderCell>Kind</TableHeaderCell>
            <TableHeaderCell>Created by</TableHeaderCell>
            <TableHeaderCell>URL</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">{targetLabel}</TableCell>
            <TableCell>{targetKind}</TableCell>
            <TableCell>{preview.createdByUser.preferredName}</TableCell>
            <TableCell>{sharePath}</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      {target.kind === "project" ? (
        <div className="grid gap-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Smartphone className="size-4 text-gray-500" />
            Device Targets
          </h2>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Device</TableHeaderCell>
                <TableHeaderCell>Platform</TableHeaderCell>
                <TableHeaderCell>Collections</TableHeaderCell>
                <TableHeaderCell>Events</TableHeaderCell>
                <TableHeaderCell>Playback/export</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {target.devices.map((summary) => (
                <TableRow key={summary.device.id}>
                  <TableCell className="font-medium">{summary.device.name}</TableCell>
                  <TableCell>{summary.platform.name}</TableCell>
                  <TableCell>{summary.collectionCount}</TableCell>
                  <TableCell>{summary.eventCount}</TableCell>
                  <TableCell>{summary.device.isEnabled ? "Included" : "Disabled device excluded"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}

      {target.kind === "event" ? (
        <div className="grid gap-4 xl:grid-cols-[1fr_450px]">
          <div className="grid content-start gap-2 border-y border-gray-300 bg-gray-50 px-3 py-3">
            <h2 className="text-sm font-semibold text-gray-700">Event Summary</h2>
            <p className="text-sm text-gray-600">
              {target.event.eventType} in {target.collection.name} for {target.device.name} on {target.platform.name}.
            </p>
            {target.device.isEnabled ? null : (
              <p className="border-y border-gray-300 bg-gray-100 px-2 py-2 text-sm text-gray-700">
                This device is disabled and excluded from playback/export.
              </p>
            )}
          </div>
          <div className="grid content-start gap-2 border-y border-gray-300 bg-gray-50 px-3 py-3">
            <div className="flex min-h-[34px] items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Radio className="size-4 text-gray-500" />
                Playback Preview
              </h2>
              <TimelinePreviewControls
                disabled={!hasPlayableShareAudio}
                isPlaying={audioPreview.isPlaying}
                label="playback preview"
                onPlay={() => playSchedule("share-preview", sharePreviewItems)}
                onStop={stop}
              />
            </div>
            {audioPreview.errorMessage ? (
              <p className="text-xs font-medium text-gray-600">{audioPreview.errorMessage}</p>
            ) : null}
            {shareTimelineLanes.some((lane) => lane.blocks.length) ? (
              <Timeline lanes={shareTimelineLanes} maxSeconds={shareTimelineMaxSeconds} />
            ) : (
              <EmptyState title="No scheduled playbacks" description="This event has no previewable feedback yet." />
            )}
          </div>
        </div>
      ) : null}

      {target.kind === "collisionMatrixEntry" ? (
        <div className="grid gap-3 border-y border-gray-300 bg-gray-50 px-3 py-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Grid2X2 className="size-4 text-gray-500" />
            Matrix Resolution
          </h2>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr]">
            <div className="border-y border-gray-200 bg-gray-25 px-3 py-2">
              <p className="text-xs font-medium text-gray-500">Playing</p>
              <p className="truncate text-sm font-semibold text-gray-700">{target.playingEvent.name}</p>
              <p className="text-xs text-gray-500">{target.device.name} / {target.platform.name}</p>
            </div>
            <div className="flex min-h-14 items-center justify-center text-xs font-semibold text-gray-500">
              overlaps
            </div>
            <div className="border-y border-gray-200 bg-gray-25 px-3 py-2">
              <p className="text-xs font-medium text-gray-500">Incoming</p>
              <p className="truncate text-sm font-semibold text-gray-700">{target.incomingEvent.name}</p>
              <p className="text-xs text-gray-500">{target.device.name} / {target.platform.name}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 border-y border-gray-300 bg-gray-25 px-3 py-2">
            <span className="rounded-lg border border-gray-300 bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
              {target.entry.resolutionBehavior.behaviorName}
            </span>
            <span className="text-sm text-gray-600">
              {shareBehaviorCopy[target.entry.resolutionBehavior.behaviorName]}
            </span>
          </div>
          <p className="text-sm text-gray-600">
            {target.entry.resolutionBehavior.targetEventId
              ? `Resolution targets ${
                  target.entry.resolutionBehavior.targetEventId === target.playingEvent.id
                    ? target.playingEvent.name
                    : target.incomingEvent.name
                }.`
              : "No target event is required for this behavior."}
          </p>
        </div>
      ) : null}

      <div className="min-h-10 border-y border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-700">
        Disabled devices and disabled event interactions remain visible here, but are excluded from playback/export.
      </div>
    </section>
  );
}
