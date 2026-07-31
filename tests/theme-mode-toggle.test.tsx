import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { setTheme, useTheme } = vi.hoisted(() => ({
  setTheme: vi.fn(),
  useTheme: vi.fn()
}));

vi.mock("next-themes", () => ({ useTheme }));

import { ThemeModeToggle } from "../components/primitives";

describe("ThemeModeToggle", () => {
  beforeEach(() => {
    setTheme.mockReset();
    useTheme.mockReturnValue({ setTheme, theme: "system" });
  });

  it("exposes an accessible three-way preference control", () => {
    render(<ThemeModeToggle />);

    expect(screen.getByRole("group", { name: "Theme preference" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Use light theme" }).getAttribute("aria-pressed")).toBe(
      "false"
    );
    expect(screen.getByRole("button", { name: "Use system theme" }).getAttribute("aria-pressed")).toBe(
      "true"
    );
    expect(screen.getByRole("button", { name: "Use dark theme" }).getAttribute("aria-pressed")).toBe(
      "false"
    );
  });

  it("stores the selected theme preference", () => {
    render(<ThemeModeToggle />);

    fireEvent.click(screen.getByRole("button", { name: "Use dark theme" }));

    expect(setTheme).toHaveBeenCalledWith("dark");
  });
});
