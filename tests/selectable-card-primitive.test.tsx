import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CardGrid, ConfirmDialog, DeviceGlyph, Dialog, SelectableCard } from "../components/primitives";

describe("SelectableCard", () => {
  it("renders a selectable card with label, description, and glyph", () => {
    render(
      <CardGrid>
        <SelectableCard
          description="iOS"
          icon={<DeviceGlyph formFactor="Mobile" />}
          id="ios-iphone-pro"
          label="iPhone Pro"
          value="ios-iphone-pro"
        />
      </CardGrid>
    );

    expect(screen.getByLabelText("iPhone Pro")).toBeDefined();
    expect(screen.getByText("iOS")).toBeDefined();
  });
});

describe("Dialog", () => {
  it("applies the wide dialog size for two-pane workflows", () => {
    const { container } = render(
      <Dialog size="wide" title="New Project">
        <div>Project details</div>
      </Dialog>
    );

    expect(container.querySelector(".max-w-\\[960px\\]")).not.toBeNull();
  });
});

describe("ConfirmDialog", () => {
  it("renders a destructive confirm action and cascade summary", () => {
    render(
      <ConfirmDialog
        cascadeSummary={<span>2 events and 4 playbacks</span>}
        onCancel={() => undefined}
        onConfirm={() => undefined}
        title="Delete project"
      >
        This cannot be undone.
      </ConfirmDialog>
    );

    expect(screen.getByRole("dialog", { name: "Delete project" })).toBeDefined();
    expect(screen.getByRole("button", { name: /Delete/ }).className).toContain("bg-gray-700");
    expect(screen.getByText("2 events and 4 playbacks")).toBeDefined();
  });
});
