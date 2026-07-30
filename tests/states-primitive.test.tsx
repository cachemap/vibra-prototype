import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LoadingState } from "../components/primitives";

describe("LoadingState", () => {
  it("renders optional descriptive copy", () => {
    render(<LoadingState title="Loading project workspace" description="Opening the local device workspace." />);

    expect(screen.getByText("Loading project workspace")).toBeDefined();
    expect(screen.getByText("Opening the local device workspace.")).toBeDefined();
  });
});
