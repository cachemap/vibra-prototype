import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { asEntityId, type CollectionId, type CollisionMatrixEntry, type CollisionMatrixId, type Event, type EventId } from "@/domain";
import { MatrixGrid } from "@/features/matrix/matrix-grid";

const matrixId = asEntityId<CollisionMatrixId>("matrix_checkout");
const collectionId = asEntityId<CollectionId>("collection_checkout");
const playingEventId = asEntityId<EventId>("event_pay_now");
const incomingEventId = asEntityId<EventId>("event_card_declined");

const events: readonly Event[] = [
  { id: playingEventId, collectionId, name: "Pay now", eventType: "Button", sortOrder: 0 },
  { id: incomingEventId, collectionId, name: "Card declined", eventType: "Toast", sortOrder: 1 }
];

const configuredEntry: CollisionMatrixEntry = {
  id: asEntityId("matrix_entry_pay_now_card_declined"),
  incomingEventId,
  matrixId,
  playingEventId,
  resolutionBehavior: { behaviorName: "Preempt", targetEventId: playingEventId }
};

function renderGrid(entries: readonly CollisionMatrixEntry[] = []) {
  return render(
    <MatrixGrid
      collections={[{ events, id: collectionId, name: "Checkout" }]}
      columns={[{ eventId: incomingEventId, matrixId }]}
      entries={entries}
      eventById={new Map(events.map((event) => [event.id, event]))}
      incomingEventIds={new Set([incomingEventId])}
      matrixFilterAnchor={null}
      matrixFilterAxis="playing"
      onChangeAxis={vi.fn()}
      onCloseFilter={vi.fn()}
      onIncomingEventIdChange={vi.fn()}
      onOpenFilter={vi.fn()}
      onPlayingEventIdChange={vi.fn()}
      onSelectCell={vi.fn()}
      onToggleEvents={vi.fn()}
      playingEventIds={new Set([playingEventId])}
      rows={[{ eventId: playingEventId, matrixId }]}
      selectedIncomingEventId={incomingEventId}
      selectedPlayingEventId={playingEventId}
    />
  );
}

describe("MatrixGrid hover feedback", () => {
  it("keeps an unset cell's accessible name while adding touch-safe, reduced-motion-safe feedback", () => {
    renderGrid();

    const cell = screen.getByRole("button", { name: "Unset: Pay now when Card declined arrives" });

    expect(cell.className).toContain("[@media(hover:hover)]:hover:-translate-y-px");
    expect(cell.className).toContain("[@media(hover:hover)]:hover:scale-[1.015]");
    expect(cell.className).toContain("motion-reduce:transform-none");
    expect(cell.className).toContain("ring-2");
  });

  it("adds restrained group hover feedback to configured behavior pills", () => {
    renderGrid([configuredEntry]);

    const cell = screen.getByRole("button", { name: "Preempt: Pay now when Card declined arrives" });
    const pill = screen.getByText("Preempt").parentElement;

    expect(cell.className).toContain("[@media(hover:hover)]:hover:ring-1");
    expect(pill?.className).toContain("[@media(hover:hover)]:group-hover:scale-[1.02]");
    expect(pill?.className).toContain("motion-reduce:transform-none");
  });
});
