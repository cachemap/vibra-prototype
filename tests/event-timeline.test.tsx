import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  asEntityId,
  asISODateString,
  type Asset,
  type AssetId,
  type CollectionId,
  type EventId,
  type EventTriggerId,
  type Trigger,
  type TriggerId,
  type TriggerPlaybackId
} from "../domain";
import type { DeviceEventAggregate, DeviceWorkspaceAggregate } from "../data/repositories/project-repository";
import { EventTimeline } from "../features/events/event-timeline";
import { AudioPreviewProvider } from "../features/projects/audio-preview-context";

const assetId = asEntityId<AssetId>("asset-tap");
const eventTriggerId = asEntityId<EventTriggerId>("event-trigger-press");
const triggerId = asEntityId<TriggerId>("trigger-press");

const hapticAsset = {
  assetId: "tap",
  folderId: asEntityId("folder-feedback"),
  id: assetId,
  isDefaultLibrary: true,
  isImportedLibrary: false,
  libraryId: asEntityId("library-feedback"),
  libraryName: "Feedback",
  mediaKind: "haptic",
  name: "Success Tap",
  originalFilename: "success.ahap",
  playbackUrl: "/fixtures/success.ahap",
  uploadedAt: asISODateString("2026-07-30T00:00:00.000Z")
} satisfies DeviceWorkspaceAggregate["playbackAssets"][number];

const selectedEvent = {
  event: {
    collectionId: asEntityId<CollectionId>("collection-checkout"),
    eventType: "Button",
    id: asEntityId<EventId>("event-pay-now"),
    name: "Pay Now"
  },
  eventTriggers: [
    {
      eventId: asEntityId<EventId>("event-pay-now"),
      id: eventTriggerId,
      isEnabled: true,
      label: null,
      playbacks: [
        {
          assetId,
          eventTriggerId,
          id: asEntityId<TriggerPlaybackId>("playback-success-tap"),
          startOffset: 4
        }
      ],
      triggerId
    }
  ]
} satisfies DeviceEventAggregate;

const trigger = {
  id: triggerId,
  name: "onPress"
} satisfies Trigger;

describe("EventTimeline", () => {
  it("renders the timeline playhead when a schedule starts", async () => {
    const requestAnimationFrameSpy = vi
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((callback) => window.setTimeout(() => callback(performance.now()), 16));
    const cancelAnimationFrameSpy = vi
      .spyOn(window, "cancelAnimationFrame")
      .mockImplementation((handle) => window.clearTimeout(handle));

    render(
      <AudioPreviewProvider>
        <EventTimeline
          assetById={new Map<Asset["id"], DeviceWorkspaceAggregate["playbackAssets"][number]>([
            [assetId, hapticAsset]
          ])}
          onCreatePlayback={vi.fn()}
          onDeleteEventTrigger={vi.fn()}
          onDeleteTriggerPlayback={vi.fn()}
          onEditPlayback={vi.fn()}
          onTriggerEnabledChange={vi.fn()}
          selectedDeviceIsEnabled={true}
          selectedEvent={selectedEvent}
          triggerById={new Map([[triggerId, trigger]])}
        />
      </AudioPreviewProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Play onPress" }));

    await waitFor(() => {
      expect(screen.getByTestId("timeline-playhead")).toBeTruthy();
    });

    requestAnimationFrameSpy.mockRestore();
    cancelAnimationFrameSpy.mockRestore();
  });
});
