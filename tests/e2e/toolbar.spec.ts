import { expect, test, type Page } from "@playwright/test";

type HeaderCoordinates = {
  breadcrumb: { x: number; y: number };
  title: { x: number; y: number };
};

async function readHeaderCoordinates(page: Page) {
  const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
  const title = breadcrumb.locator("xpath=ancestor::header").getByRole("heading");

  await expect(breadcrumb).toBeVisible();
  await expect(title).toBeVisible();

  const [breadcrumbBox, titleBox] = await Promise.all([breadcrumb.boundingBox(), title.boundingBox()]);

  if (!breadcrumbBox || !titleBox) {
    throw new Error("Expected a visible page header.");
  }

  return {
    breadcrumb: { x: breadcrumbBox.x, y: breadcrumbBox.y },
    title: { x: titleBox.x, y: titleBox.y }
  };
}

function expectAlignedHeader(reference: HeaderCoordinates, current: HeaderCoordinates) {
  expect(current.breadcrumb.x).toBe(reference.breadcrumb.x);
  expect(current.breadcrumb.y).toBe(reference.breadcrumb.y);
  expect(current.title.x).toBe(reference.title.x);
  expect(current.title.y).toBe(reference.title.y);
}

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

test("keeps breadcrumbs and titles aligned across Projects, Libraries, Workspace, and Event Detail", async ({ page }) => {
  await page.goto("/projects");
  const projectsHeader = await readHeaderCoordinates(page);

  await page.goto("/libraries");
  expectAlignedHeader(projectsHeader, await readHeaderCoordinates(page));

  await page.goto("/projects");
  await page.getByRole("link", { name: "Mobile App Systems" }).click();
  await page.getByRole("link", { name: "Checkout Experience" }).click();
  await page.getByRole("link", { name: "Checkout Feedback System" }).click();
  expectAlignedHeader(projectsHeader, await readHeaderCoordinates(page));

  await page.getByRole("row", { name: /Pay Now/ }).getByRole("button", { name: "Open", exact: true }).click();
  expectAlignedHeader(projectsHeader, await readHeaderCoordinates(page));
});
