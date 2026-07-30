import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Tabs } from "../components/primitives";

describe("Tabs", () => {
  it("marks the active tab and reports tab changes", () => {
    const onChange = vi.fn();

    render(
      <Tabs
        activeId="assets"
        ariaLabel="Project workspace views"
        items={[
          { id: "events", label: "Events" },
          { id: "assets", label: "Assets" },
          { id: "matrix", label: "Matrix" }
        ]}
        onChange={onChange}
      />
    );

    expect(screen.getByRole("tablist", { name: "Project workspace views" })).toBeDefined();
    expect(screen.getByRole("tab", { name: "Assets" }).getAttribute("aria-selected")).toBe("true");

    fireEvent.click(screen.getByRole("tab", { name: "Matrix" }));

    expect(onChange).toHaveBeenCalledWith("matrix");
  });
});
