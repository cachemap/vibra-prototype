import { expect, test } from "@playwright/test";

test("shows the active section and keeps the global toolbar within a 375px viewport", async ({ page }) => {
  await page.setViewportSize({ height: 812, width: 375 });
  await page.goto("/projects");

  const toolbar = page.getByRole("banner");
  const workspaceNavigation = page.getByRole("navigation", { name: "Workspace sections" });
  expect(await toolbar.evaluate((header) => header.scrollWidth <= header.clientWidth)).toBe(true);
  await expect(workspaceNavigation.getByRole("link", { name: "Projects", exact: true })).toHaveAttribute(
    "aria-current",
    "page"
  );
  await expect(workspaceNavigation.getByRole("link", { name: "Libraries", exact: true })).not.toHaveAttribute(
    "aria-current"
  );
  await expect(page.getByRole("button", { name: "Reset demo" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Theme preference" })).toBeVisible();

  await page.goto("/libraries");

  await expect(workspaceNavigation.getByRole("link", { name: "Projects", exact: true })).not.toHaveAttribute(
    "aria-current"
  );
  await expect(workspaceNavigation.getByRole("link", { name: "Libraries", exact: true })).toHaveAttribute(
    "aria-current",
    "page"
  );

  await page.evaluate(() => window.localStorage.setItem("theme", "dark"));
  await page.getByRole("button", { name: "Reset demo" }).click();
  await expect(page).toHaveURL(/\/projects$/);
  expect(await page.evaluate(() => window.localStorage.getItem("theme"))).toBe("dark");
});
