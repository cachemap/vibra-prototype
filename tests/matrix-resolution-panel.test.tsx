import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  asEntityId,
  type CollectionId,
  type CollisionMatrixEntry,
  type CollisionMatrixId,
  type Event,
  type EventId
} from "@/domain";
import { MatrixResolutionPanel } from "@/features/matrix/matrix-resolution-panel";
import { MatrixResolutionEditor } from "@/features/matrix/matrix-resolution-editor";

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
  it("keeps the selected pair, accessible editor actions, and a scrollable shared timeline together", () => {
    const onBack = vi.fn();

    render(
      <MatrixResolutionEditor
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
      />
    );

    expect(screen.getByRole("region", { name: "Collision Matrix resolution editor" })).not.toBeNull();
    expect(screen.getByRole("heading", { name: /Pay now.*Card declined/i })).not.toBeNull();
    expect(screen.getByRole("button", { name: "Tap to preview collision" })).not.toBeNull();
    expect(screen.getByLabelText(/Collision preview timeline/i)).not.toBeNull();
    expect(screen.getByRole("button", { name: "Stop collision preview" })).not.toBeNull();
    expect(screen.getByRole("button", { name: "Clear collision rule" })).not.toBeNull();
    expect(screen.getByRole("button", { name: "Save collision rule" })).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Back to Matrix" }));
    expect(onBack).toHaveBeenCalledOnce();
  });
});
