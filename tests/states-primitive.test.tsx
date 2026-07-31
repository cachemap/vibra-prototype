import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LoadingState, PageHeader } from "../components/primitives";

describe("LoadingState", () => {
  it("renders optional descriptive copy", () => {
    render(<LoadingState title="Loading project workspace" description="Opening the local device workspace." />);

    expect(screen.getByText("Loading project workspace")).toBeDefined();
    expect(screen.getByText("Opening the local device workspace.")).toBeDefined();
  });
});

describe("PageHeader", () => {
  it("owns the shared page gutter geometry by default", () => {
    const { container } = render(<PageHeader breadcrumbs={[{ href: "/projects", label: "Projects" }]} />);
    const header = container.querySelector("header");

    expect(header?.className).toContain("px-[var(--page-gutter-x)]");
    expect(header?.className).toContain("py-[var(--page-gutter-y)]");
  });
});
