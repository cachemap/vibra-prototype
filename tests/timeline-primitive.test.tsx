import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Timeline, type TimelineLane } from "../components/primitives";

const lanes: TimelineLane[] = [
  {
    blocks: [
      { id: "playback-1", kind: "audio", label: "Payment Pop", meta: "0.10s", offsetSeconds: 0.1 },
      { id: "playback-2", kind: "haptic", label: "Light Tap", meta: "0.25s", offsetSeconds: 0.25 }
    ],
    id: "event-trigger-1",
    label: "onPress",
    meta: "Primary press"
  }
];

describe("Timeline", () => {
  it("renders one block per scheduled playback with its lane label", () => {
    render(<Timeline lanes={lanes} maxSeconds={1} />);

    expect(screen.getByText("onPress")).toBeDefined();
    expect(screen.getByText("Payment Pop")).toBeDefined();
    expect(screen.getByText("Light Tap")).toBeDefined();
  });

  it("hides the playhead until playback reports a position", () => {
    const { container } = render(<Timeline lanes={lanes} maxSeconds={1} />);

    expect(container.querySelector("[data-testid='timeline-playhead']")).toBeNull();
  });

  it("positions the playhead proportionally to the timeline length", () => {
    const { container } = render(
      <Timeline lanes={[{ ...lanes[0], playheadSeconds: 0.5 }]} maxSeconds={2} />
    );
    const playhead = container.querySelector<HTMLElement>("[data-testid='timeline-playhead']");

    expect(playhead).not.toBeNull();
    expect(playhead?.style.left).toBe("25%");
  });

  it("clamps a playhead that runs past the end of the timeline", () => {
    const { container } = render(
      <Timeline lanes={[{ ...lanes[0], playheadSeconds: 4 }]} maxSeconds={1} />
    );
    const playhead = container.querySelector<HTMLElement>("[data-testid='timeline-playhead']");

    expect(playhead?.style.left).toBe("100%");
  });
});
