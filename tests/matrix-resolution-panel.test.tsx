import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  asEntityId,
  type CollectionId,
  type CollisionMatrixEntry,
  type CollisionMatrixId,
  type Event,
  type EventId
} from "@/domain";
import type { DeviceWorkspaceAggregate } from "@/data/repositories/project-repository";
import { MatrixResolutionPanel } from "@/features/matrix/matrix-resolution-panel";
import { MatrixResolutionEditor } from "@/features/matrix/matrix-resolution-editor";
import { previewOffsetAfterPointerDrag } from "@/features/matrix/collision-preview-timeline";
import { AudioPreviewProvider } from "@/features/projects/audio-preview-context";

const matrixId = asEntityId<CollisionMatrixId>("matrix_checkout");
const collectionId = asEntityId<CollectionId>("collection_checkout");
const playingEventId = asEntityId<EventId>("event_pay_now");
const incomingEventId = asEntityId<EventId>("event_card_declined");

const events: readonly Event[] = [
  { id: playingEventId, collectionId, name: "Pay now", eventType: "Button", sortOrder: 0 },
  { id: incomingEventId, collectionId, name: "Card declined", eventType: "Toast", sortOrder: 1 }
];

const selectedEntry: CollisionMatrixEntry = {
  id: asEntityId("matrix_entry_pay_now_card_declined"),
  incomingEventId,
  matrixId,
  playingEventId,
  resolutionBehavior: {
    behaviorName: "Preempt",
    targetEventId: playingEventId,
    postInterruptionRecovery: "Stay stopped",
    systemInterruptionRecovery: "Stay stopped"
  }
};

const previewWorkspace = {
  collections: [
    {
      events: [
        {
          event: events[0],
          eventTriggers: [
            {
              eventId: playingEventId,
              id: asEntityId("trigger_pay_now"),
              isEnabled: true,
              label: null,
              playbacks: [
                { assetId: asEntityId("asset_payment_pop"), eventTriggerId: asEntityId("trigger_pay_now"), id: asEntityId("playback_payment_pop"), startOffset: 0 },
                { assetId: asEntityId("asset_payment_chime"), eventTriggerId: asEntityId("trigger_pay_now"), id: asEntityId("playback_payment_chime"), startOffset: 0.2 }
              ],
              triggerId: asEntityId("trigger_on_press")
            }
          ]
        },
        {
          event: events[1],
          eventTriggers: [
            {
              eventId: incomingEventId,
              id: asEntityId("trigger_card_declined"),
              isEnabled: true,
              label: null,
              playbacks: [{ assetId: asEntityId("asset_error_tone"), eventTriggerId: asEntityId("trigger_card_declined"), id: asEntityId("playback_error_tone"), startOffset: 0 }],
              triggerId: asEntityId("trigger_on_press")
            }
          ]
        }
      ]
    }
  ],
  device: { isEnabled: true },
  playbackAssets: [
    { id: asEntityId("asset_payment_pop"), mediaKind: "audio", name: "Payment Pop", playbackUrl: "/payment-pop.wav" },
    { id: asEntityId("asset_payment_chime"), mediaKind: "audio", name: "Payment Chime", playbackUrl: "/payment-chime.wav" },
    { id: asEntityId("asset_error_tone"), mediaKind: "audio", name: "Error Tone", playbackUrl: "/error-tone.wav" }
  ]
} as unknown as DeviceWorkspaceAggregate;

type PreviewSourceSpy = {
  buffer: AudioBuffer | null;
  connect: ReturnType<typeof vi.fn>;
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
};

function installCollisionPreviewAudioMocks() {
  const sources: PreviewSourceSpy[] = [];

  class AudioContextMock {
    currentTime = 0;
    destination = {} as AudioNode;
    createBufferSource = vi.fn(() => {
      const source: PreviewSourceSpy = {
        buffer: null,
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn()
      };
      sources.push(source);
      return source;
    });
    decodeAudioData = vi.fn().mockResolvedValue({ duration: 1 });
    resume = vi.fn().mockResolvedValue(undefined);
  }

  vi.stubGlobal("AudioContext", AudioContextMock);
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
      ok: true
    })
  );
  vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));
  vi.stubGlobal("cancelAnimationFrame", vi.fn());

  return sources;
}

function renderPanel(behavior: "Preempt" | "Co-play" = "Preempt") {
  const onTargetEventIdChange = vi.fn();
  const onPostInterruptionRecoveryChange = vi.fn();
  const onSystemInterruptionRecoveryChange = vi.fn();

  render(
    <MatrixResolutionPanel
      behavior={behavior}
      eventById={new Map(events.map((event) => [event.id, event]))}
      onBehaviorChange={vi.fn()}
      onClearEntry={vi.fn()}
      onPostInterruptionRecoveryChange={onPostInterruptionRecoveryChange}
      onSaveEntry={vi.fn()}
      onSystemInterruptionRecoveryChange={onSystemInterruptionRecoveryChange}
      onTargetEventIdChange={onTargetEventIdChange}
      postInterruptionRecovery={behavior === "Preempt" ? "Stay stopped" : null}
      selectedEntry={selectedEntry}
      selectedIncomingEventId={incomingEventId}
      selectedPlayingEventId={playingEventId}
      systemInterruptionRecovery={behavior === "Co-play" ? "Resume" : "Stay stopped"}
      targetEventId={behavior === "Preempt" ? playingEventId : ""}
    />
  );

  return {
    onPostInterruptionRecoveryChange,
    onSystemInterruptionRecoveryChange,
    onTargetEventIdChange
  };
}

describe("MatrixResolutionPanel adaptive controls", () => {
  it("uses labeled segmented controls for target and applicable recoveries", () => {
    const {
      onPostInterruptionRecoveryChange,
      onSystemInterruptionRecoveryChange,
      onTargetEventIdChange
    } = renderPanel();

    const target = screen.getByRole("group", { name: "Target" });
    const postInterruption = screen.getByRole("group", { name: "Post interruption" });
    const systemInterruption = screen.getByRole("group", { name: "System interruption" });

    expect(target.getAttribute("aria-describedby")).toBe("matrix-target-description");
    expect(screen.getByRole("button", { name: "Learn about Target" }).getAttribute("aria-describedby")).toBe(
      "matrix-target-description"
    );
    expect(screen.getByRole("button", { name: "Playing" }).getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(screen.getByRole("button", { name: "Incoming" }));
    fireEvent.click(postInterruption.querySelectorAll("button")[0]!);
    fireEvent.click(systemInterruption.querySelectorAll("button")[0]!);

    expect(onTargetEventIdChange).toHaveBeenCalledWith(incomingEventId);
    expect(onPostInterruptionRecoveryChange).toHaveBeenCalledWith("Resume");
    expect(onSystemInterruptionRecoveryChange).toHaveBeenCalledWith("Resume");
  });

  it("hides inapplicable target and post-interruption controls", () => {
    renderPanel("Co-play");

    expect(screen.queryByRole("group", { name: "Target" })).toBeNull();
    expect(screen.queryByRole("group", { name: "Post interruption" })).toBeNull();
    expect(screen.getByRole("group", { name: "System interruption" })).not.toBeNull();
  });
});

describe("MatrixResolutionEditor", () => {
  it("selects the target side independently when both sides use the same event", () => {
    const onTargetEventIdChange = vi.fn();

    render(
      <AudioPreviewProvider><MatrixResolutionEditor
        behavior="Preempt"
        eventById={new Map(events.map((event) => [event.id, event]))}
        onBack={vi.fn()}
        onBehaviorChange={vi.fn()}
        onClearEntry={vi.fn()}
        onPostInterruptionRecoveryChange={vi.fn()}
        onSaveEntry={vi.fn()}
        onSystemInterruptionRecoveryChange={vi.fn()}
        onTargetEventIdChange={onTargetEventIdChange}
        postInterruptionRecovery="Stay stopped"
        selectedEntry={{ ...selectedEntry, incomingEventId: playingEventId }}
        selectedIncomingEventId={playingEventId}
        selectedPlayingEventId={playingEventId}
        systemInterruptionRecovery="Stay stopped"
        targetEventId={playingEventId}
        workspace={previewWorkspace}
      /></AudioPreviewProvider>
    );

    const playing = screen.getByRole("button", { name: "Playing" });
    const incoming = screen.getByRole("button", { name: "Incoming" });

    expect(playing.getAttribute("aria-pressed")).toBe("true");
    expect(incoming.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(incoming);

    expect(playing.getAttribute("aria-pressed")).toBe("false");
    expect(incoming.getAttribute("aria-pressed")).toBe("true");
    expect(onTargetEventIdChange).toHaveBeenCalledWith(playingEventId);
  });

  it("disables Tap with an explanation when either event has no previewable audio", () => {
    render(
      <AudioPreviewProvider><MatrixResolutionEditor
        behavior="Preempt"
        eventById={new Map(events.map((event) => [event.id, event]))}
        onBack={vi.fn()}
        onBehaviorChange={vi.fn()}
        onClearEntry={vi.fn()}
        onPostInterruptionRecoveryChange={vi.fn()}
        onSaveEntry={vi.fn()}
        onSystemInterruptionRecoveryChange={vi.fn()}
        onTargetEventIdChange={vi.fn()}
        postInterruptionRecovery="Stay stopped"
        selectedEntry={selectedEntry}
        selectedIncomingEventId={incomingEventId}
        selectedPlayingEventId={playingEventId}
        systemInterruptionRecovery="Stay stopped"
        targetEventId={playingEventId}
        workspace={{ ...previewWorkspace, playbackAssets: [] }}
      /></AudioPreviewProvider>
    );

    expect((screen.getByRole("button", { name: "Tap to preview collision" }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getAllByText(/Playing has no enabled previewable audio playback/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Incoming has no enabled previewable audio playback/).length).toBeGreaterThan(0);
  });

  it("keeps the selected pair, accessible editor actions, and a scrollable shared timeline together", () => {
    const onBack = vi.fn();

    render(
      <AudioPreviewProvider><MatrixResolutionEditor
        behavior="Preempt"
        eventById={new Map(events.map((event) => [event.id, event]))}
        onBack={onBack}
        onBehaviorChange={vi.fn()}
        onClearEntry={vi.fn()}
        onPostInterruptionRecoveryChange={vi.fn()}
        onSaveEntry={vi.fn()}
        onSystemInterruptionRecoveryChange={vi.fn()}
        onTargetEventIdChange={vi.fn()}
        postInterruptionRecovery="Stay stopped"
        selectedEntry={selectedEntry}
        selectedIncomingEventId={incomingEventId}
        selectedPlayingEventId={playingEventId}
        systemInterruptionRecovery="Stay stopped"
        targetEventId={playingEventId}
        workspace={previewWorkspace}
      /></AudioPreviewProvider>
    );

    expect(screen.getByRole("region", { name: "Collision Matrix resolution editor" })).not.toBeNull();
    expect(screen.getByRole("heading", { name: /Pay now.*Card declined/i })).not.toBeNull();
    expect((screen.getByRole("button", { name: "Tap to preview collision" }) as HTMLButtonElement).disabled).toBe(false);
    expect(screen.getByLabelText(/Collision preview timeline/i)).not.toBeNull();
    expect(screen.queryByRole("button", { name: "Stop collision preview" })).toBeNull();
    expect(screen.getByRole("button", { name: "Clear collision rule" })).not.toBeNull();
    expect(screen.getByRole("button", { name: "Save collision rule" })).not.toBeNull();
    const playingSound = screen.getByLabelText("Playing sound") as HTMLSelectElement;
    expect(playingSound.value).toBe("trigger_pay_now:playback_payment_pop");
    expect(screen.getByText("Error Tone")).not.toBeNull();

    fireEvent.change(playingSound, {
      target: { value: "trigger_pay_now:playback_payment_chime" }
    });
    expect(playingSound.value).toBe("trigger_pay_now:playback_payment_chime");

    fireEvent.click(screen.getByRole("button", { name: "Back to Matrix" }));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it("keeps rule controls stackable while preserving a wide, scrollable timeline on narrow screens", () => {
    render(
      <AudioPreviewProvider><MatrixResolutionEditor
        behavior="Preempt"
        eventById={new Map(events.map((event) => [event.id, event]))}
        onBack={vi.fn()}
        onBehaviorChange={vi.fn()}
        onClearEntry={vi.fn()}
        onPostInterruptionRecoveryChange={vi.fn()}
        onSaveEntry={vi.fn()}
        onSystemInterruptionRecoveryChange={vi.fn()}
        onTargetEventIdChange={vi.fn()}
        postInterruptionRecovery="Stay stopped"
        selectedEntry={selectedEntry}
        selectedIncomingEventId={incomingEventId}
        selectedPlayingEventId={playingEventId}
        systemInterruptionRecovery="Stay stopped"
        targetEventId={playingEventId}
        workspace={previewWorkspace}
      /></AudioPreviewProvider>
    );

    const behavior = screen.getByLabelText("Behavior");
    const controlGrid = behavior.closest("div");
    const timeline = screen.getByLabelText(/Collision preview timeline/i);
    const scroller = timeline.closest(".overflow-x-auto");

    expect(controlGrid?.className).toContain("lg:grid-cols-2");
    expect(screen.getByRole("group", { name: "Target" }).className).toContain("grid-cols-2");
    expect(scroller).not.toBeNull();
    expect(scroller?.getAttribute("data-testid")).toBe("collision-preview-timeline");
    expect((scroller?.firstElementChild as HTMLElement | null)?.style.width).toBe("12176px");
    expect(screen.getByRole("button", { name: "Tap to preview collision" }).className).toContain("h-12");
    expect(behavior.className).toContain("h-11");
  });

  it("gives editor actions distinct names and a visible keyboard focus treatment", () => {
    render(
      <AudioPreviewProvider><MatrixResolutionEditor
        behavior="Preempt"
        eventById={new Map(events.map((event) => [event.id, event]))}
        onBack={vi.fn()}
        onBehaviorChange={vi.fn()}
        onClearEntry={vi.fn()}
        onPostInterruptionRecoveryChange={vi.fn()}
        onSaveEntry={vi.fn()}
        onSystemInterruptionRecoveryChange={vi.fn()}
        onTargetEventIdChange={vi.fn()}
        postInterruptionRecovery="Stay stopped"
        selectedEntry={selectedEntry}
        selectedIncomingEventId={incomingEventId}
        selectedPlayingEventId={playingEventId}
        systemInterruptionRecovery="Stay stopped"
        targetEventId={playingEventId}
        workspace={previewWorkspace}
      /></AudioPreviewProvider>
    );

    const actions = [
      screen.getByRole("button", { name: "Back to Matrix" }),
      screen.getByRole("button", { name: "Tap to preview collision" }),
      screen.getByRole("button", { name: "Clear collision rule" }),
      screen.getByRole("button", { name: "Save collision rule" })
    ];

    expect(new Set(actions.map((action) => action.getAttribute("aria-label"))).size).toBe(actions.length);
    actions.forEach((action) => {
      expect(action.className).toContain("focus-visible:outline-purple-500/40");
    });
    actions.filter((action) => !(action as HTMLButtonElement).disabled).forEach((action) => {
      action.focus();
      expect(document.activeElement).toBe(action);
    });
    expect(screen.queryByRole("button", { name: "Stop collision preview" })).toBeNull();
  });

  it("keeps sound choice and audition timing local while offering precise keyboard and input controls", () => {
    const onSaveEntry = vi.fn();
    const authoredOffsets = previewWorkspace.collections.flatMap((collection) => collection.events).flatMap((event) =>
      event.eventTriggers.flatMap((trigger) => trigger.playbacks.map((playback) => playback.startOffset))
    );

    render(
      <AudioPreviewProvider><MatrixResolutionEditor
        behavior="Preempt"
        eventById={new Map(events.map((event) => [event.id, event]))}
        onBack={vi.fn()}
        onBehaviorChange={vi.fn()}
        onClearEntry={vi.fn()}
        onPostInterruptionRecoveryChange={vi.fn()}
        onSaveEntry={onSaveEntry}
        onSystemInterruptionRecoveryChange={vi.fn()}
        onTargetEventIdChange={vi.fn()}
        postInterruptionRecovery="Stay stopped"
        selectedEntry={selectedEntry}
        selectedIncomingEventId={incomingEventId}
        selectedPlayingEventId={playingEventId}
        systemInterruptionRecovery="Stay stopped"
        targetEventId={playingEventId}
        workspace={previewWorkspace}
      /></AudioPreviewProvider>
    );

    const incomingOffset = screen.getByLabelText("Incoming offset in milliseconds") as HTMLInputElement;
    expect(incomingOffset.value).toBe("150");

    fireEvent.keyDown(screen.getByRole("button", { name: "Move Incoming sound" }), { key: "ArrowRight" });
    expect(incomingOffset.value).toBe("160");

    fireEvent.change(incomingOffset, { target: { value: "655" } });
    expect(incomingOffset.value).toBe("655");
    expect(screen.getByLabelText(/Incoming starts at 655 milliseconds/)).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Reset collision preview timing" }));
    expect(incomingOffset.value).toBe("150");

    fireEvent.click(screen.getByRole("button", { name: "Save collision rule" }));
    expect(onSaveEntry).toHaveBeenCalledOnce();
    expect(
      previewWorkspace.collections.flatMap((collection) => collection.events).flatMap((event) =>
        event.eventTriggers.flatMap((trigger) => trigger.playbacks.map((playback) => playback.startOffset))
      )
    ).toEqual(authoredOffsets);
  });

  it("keeps pointer and keyboard timeline moves aligned to the shared millisecond ruler", () => {
    render(
      <AudioPreviewProvider><MatrixResolutionEditor
        behavior="Preempt"
        eventById={new Map(events.map((event) => [event.id, event]))}
        onBack={vi.fn()}
        onBehaviorChange={vi.fn()}
        onClearEntry={vi.fn()}
        onPostInterruptionRecoveryChange={vi.fn()}
        onSaveEntry={vi.fn()}
        onSystemInterruptionRecoveryChange={vi.fn()}
        onTargetEventIdChange={vi.fn()}
        postInterruptionRecovery="Stay stopped"
        selectedEntry={selectedEntry}
        selectedIncomingEventId={incomingEventId}
        selectedPlayingEventId={playingEventId}
        systemInterruptionRecovery="Stay stopped"
        targetEventId={playingEventId}
        workspace={previewWorkspace}
      /></AudioPreviewProvider>
    );

    const incomingOffset = screen.getByLabelText("Incoming offset in milliseconds") as HTMLInputElement;
    const playingOffset = screen.getByLabelText("Playing offset in milliseconds") as HTMLInputElement;
    const incomingHandle = screen.getByRole("button", { name: "Move Incoming sound" });

    expect(incomingOffset.value).toBe("150");
    expect(playingOffset.value).toBe("0");
    expect(previewOffsetAfterPointerDrag(150, 120, 600, 600)).toBe(270);
    expect(previewOffsetAfterPointerDrag(150, -200, 600, 600)).toBe(0);

    fireEvent.keyDown(incomingHandle, { key: "ArrowLeft" });
    expect(incomingOffset.value).toBe("140");
    expect(screen.getByLabelText(/Incoming starts at 140 milliseconds/)).not.toBeNull();
    expect(screen.getByLabelText(/Playing starts at 0 milliseconds/)).not.toBeNull();
  });

  it("marks the collision timeline for reduced motion while preserving its controls", async () => {
    const mediaQuery = {
      addEventListener: vi.fn(),
      matches: true,
      removeEventListener: vi.fn()
    } as unknown as MediaQueryList;
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue(mediaQuery));

    render(
      <AudioPreviewProvider><MatrixResolutionEditor
        behavior="Preempt"
        eventById={new Map(events.map((event) => [event.id, event]))}
        onBack={vi.fn()}
        onBehaviorChange={vi.fn()}
        onClearEntry={vi.fn()}
        onPostInterruptionRecoveryChange={vi.fn()}
        onSaveEntry={vi.fn()}
        onSystemInterruptionRecoveryChange={vi.fn()}
        onTargetEventIdChange={vi.fn()}
        postInterruptionRecovery="Stay stopped"
        selectedEntry={selectedEntry}
        selectedIncomingEventId={incomingEventId}
        selectedPlayingEventId={playingEventId}
        systemInterruptionRecovery="Stay stopped"
        targetEventId={playingEventId}
        workspace={previewWorkspace}
      /></AudioPreviewProvider>
    );

    await waitFor(() =>
      expect(screen.getByRole("region", { name: /Pay now.*Card declined/i }).dataset.motionPreference).toBe("reduced")
    );
    expect((screen.getByRole("button", { name: "Tap to preview collision" }) as HTMLButtonElement).disabled).toBe(false);
    expect((screen.getByRole("button", { name: "Move Playing sound" }) as HTMLButtonElement).disabled).toBe(false);

    vi.unstubAllGlobals();
  });

  it("uses Tap as the play/stop toggle and cleans up the collision preview", async () => {
    const sources = installCollisionPreviewAudioMocks();
    const { unmount } = render(
      <AudioPreviewProvider><MatrixResolutionEditor
        behavior="Preempt"
        eventById={new Map(events.map((event) => [event.id, event]))}
        onBack={vi.fn()}
        onBehaviorChange={vi.fn()}
        onClearEntry={vi.fn()}
        onPostInterruptionRecoveryChange={vi.fn()}
        onSaveEntry={vi.fn()}
        onSystemInterruptionRecoveryChange={vi.fn()}
        onTargetEventIdChange={vi.fn()}
        postInterruptionRecovery="Stay stopped"
        selectedEntry={selectedEntry}
        selectedIncomingEventId={incomingEventId}
        selectedPlayingEventId={playingEventId}
        systemInterruptionRecovery="Stay stopped"
        targetEventId={playingEventId}
        workspace={previewWorkspace}
      /></AudioPreviewProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Tap to preview collision" }));
    await waitFor(() => expect(sources).toHaveLength(2));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Stop collision preview" })).not.toBeNull()
    );
    expect(screen.getByTestId("collision-preview-playhead")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Stop collision preview" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Tap to preview collision" })).not.toBeNull()
    );
    expect(sources.slice(0, 2).every((source) => source.stop.mock.calls.length === 1)).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Tap to preview collision" }));
    await waitFor(() => expect(sources).toHaveLength(4));
    unmount();
    expect(sources.slice(2).every((source) => source.stop.mock.calls.length === 1)).toBe(true);
    vi.unstubAllGlobals();
  });
});
