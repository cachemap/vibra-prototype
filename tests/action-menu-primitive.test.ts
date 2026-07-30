import { describe, expect, it } from "vitest";
import { positionActionMenu } from "../components/primitives/action-menu";

const rect = (left: number, top: number, width: number, height: number) =>
  ({
    bottom: top + height,
    height,
    left,
    right: left + width,
    top,
    width
  }) as DOMRect;

describe("positionActionMenu", () => {
  it("places compact row menus beside the trigger when horizontal space is available", () => {
    const triggerRect = rect(320, 120, 30, 30);
    const position = positionActionMenu({
      align: "end",
      menuSize: { height: 96, width: 150 },
      placement: "side",
      triggerRect,
      viewportHeight: 800,
      viewportWidth: 640
    });

    expect(position.left + 150).toBeLessThan(triggerRect.left);
    expect(position.top).toBe(triggerRect.top);
  });

  it("falls back to dropdown placement when neither side has room", () => {
    const triggerRect = rect(86, 120, 28, 28);
    const position = positionActionMenu({
      align: "end",
      menuSize: { height: 96, width: 150 },
      placement: "side",
      triggerRect,
      viewportHeight: 800,
      viewportWidth: 220
    });

    expect(position.left).toBe(8);
    expect(position.top).toBe(triggerRect.bottom + 6);
  });
});
