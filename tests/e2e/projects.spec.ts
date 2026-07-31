import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

const fixturePath = (filename: string) => path.join(process.cwd(), "tests/e2e/fixtures", filename);

const persistedPlaybackOffsets = (page: Page, playbackIds: readonly string[]) =>
  page.evaluate(async (ids) => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("vibra-prototype");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });

    try {
      const transaction = database.transaction("triggerPlaybacks", "readonly");
      const store = transaction.objectStore("triggerPlaybacks");
      const records = await Promise.all(
        ids.map(
          (id) =>
            new Promise<{ startOffset?: number } | undefined>((resolve, reject) => {
              const request = store.get(id);
              request.onerror = () => reject(request.error);
              request.onsuccess = () => resolve(request.result as { startOffset?: number } | undefined);
            })
        )
      );

      return records.map((record) => record?.startOffset ?? null);
    } finally {
      database.close();
    }
  }, [...playbackIds]);

test("persists theme preferences and follows system changes", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/projects");

  const documentRoot = page.locator("html");
  const themePreference = page.getByRole("group", { name: "Theme preference" });

  await expect(documentRoot).toHaveAttribute("data-theme", "light");
  await themePreference.getByRole("button", { name: "Use dark theme" }).click();
  await expect(documentRoot).toHaveAttribute("data-theme", "dark");
  await expect(themePreference.getByRole("button", { name: "Use dark theme" })).toHaveAttribute(
    "aria-pressed",
    "true"
  );

  await page.reload();
  await expect(documentRoot).toHaveAttribute("data-theme", "dark");
  await expect(themePreference.getByRole("button", { name: "Use dark theme" })).toHaveAttribute(
    "aria-pressed",
    "true"
  );

  await themePreference.getByRole("button", { name: "Use system theme" }).click();
  await expect(documentRoot).toHaveAttribute("data-theme", "light");
  await expect(themePreference.getByRole("button", { name: "Use system theme" })).toHaveAttribute(
    "aria-pressed",
    "true"
  );

  await page.emulateMedia({ colorScheme: "dark" });
  await expect(documentRoot).toHaveAttribute("data-theme", "dark");
  await page.emulateMedia({ colorScheme: "light" });
  await expect(documentRoot).toHaveAttribute("data-theme", "light");
});

test("loads seeded data in a fresh browser and resets from the global shell", async ({ page }) => {
  await page.goto("/projects");

  await expect(page.getByRole("link", { name: "Mobile App Systems" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Shared Platform Kits" })).toBeVisible();

  await page.goto("/libraries");
  await page.getByRole("button", { name: "Create library" }).click();
  const libraryDialog = page.getByRole("dialog", { name: "New Library" });
  await libraryDialog.getByLabel("Name").fill("Reset Candidate Kit");
  await libraryDialog.getByRole("button", { name: "Create" }).click();
  await expect(page.getByRole("heading", { name: "Reset Candidate Kit" })).toBeVisible();

  await page.getByRole("button", { name: "Reset demo" }).click();
  await expect(page).toHaveURL(/\/projects$/);
  await page.goto("/libraries");
  await expect(page.getByRole("button", { name: /Checkout Feedback System Default/ })).toBeVisible();
  await expect(page.getByText("Reset Candidate Kit")).toHaveCount(0);
});

test("keeps the seeded demo spine free of console errors", async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  await page.goto("/projects");
  await page.getByRole("button", { name: "Reset demo" }).click();
  await page.getByRole("link", { name: "Mobile App Systems" }).click();
  await page.getByRole("link", { name: "Checkout Experience" }).click();
  await page.getByRole("link", { name: "Checkout Feedback System" }).click();
  await expect(page.getByRole("heading", { name: "Checkout Feedback System" })).toBeVisible();

  await page.getByRole("row", { name: /Pay Now/ }).getByRole("button", { name: "Open", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Pay Now" })).toBeVisible();
  await expect(page.getByText("Event playback timeline")).toBeVisible();
  await page.getByRole("button", { name: "Back to events" }).click();
  await expect(page.getByRole("heading", { name: "Checkout Feedback System" })).toBeVisible();

  await page.getByRole("tab", { name: "Assets" }).click();
  await expect(page.getByTestId("project-asset-libraries")).toContainText(
    "Checkout Feedback System Default"
  );

  await page.getByRole("tab", { name: "Matrix" }).click();
  await expect(page.getByTestId("collision-matrix-grid")).toContainText("Incoming");

  await page.goto("/share/project-checkout");
  await expect(page.getByRole("heading", { name: "Checkout Feedback System" })).toBeVisible();
  await page.goto("/share/event-pay-now");
  await expect(page.getByRole("heading", { name: "Pay Now" })).toBeVisible();
  await page.goto("/share/matrix-pay-now-card-declined");
  await expect(page.getByRole("heading", { name: "Pay Now x Card Declined" })).toBeVisible();

  expect(consoleErrors).toEqual([]);
});

test("browses seeded project folders", async ({ page }) => {
  await page.goto("/projects");
  await page.getByRole("button", { name: "Reset demo" }).click();

  await expect(page.getByRole("link", { name: "Mobile App Systems" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Shared Platform Kits" })).toBeVisible();

  await page.getByRole("link", { name: "Mobile App Systems" }).click();

  await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toContainText(
    "Mobile App Systems"
  );
  await expect(page.getByRole("link", { name: "Checkout Experience" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Empty Explorations" })).toBeVisible();

  await page.getByRole("link", { name: "Empty Explorations" }).click();

  await expect(page.getByRole("heading", { name: "Empty Explorations" })).toBeVisible();
  await expect(page.getByText("Empty folder")).toBeVisible();
});

test("creates a project with selected systems and starter events", async ({ page }) => {
  await page.goto("/projects");
  await page.getByRole("button", { name: "Reset demo" }).click();
  await page.getByRole("link", { name: "Mobile App Systems" }).click();
  await page.getByRole("link", { name: "Empty Explorations" }).click();
  await expect(page.getByRole("heading", { name: "Empty Explorations" })).toBeVisible();

  await page.getByRole("button", { name: "New", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "New Project" });
  await dialog.getByLabel("iPhone Pro").check();
  await dialog.getByLabel("Pixel Pro").check();
  await dialog.getByLabel("Project name").fill("Settings Feedback");
  await dialog.getByLabel("Toast").check();
  await dialog.getByLabel("Button").check();
  await dialog.getByRole("button", { name: "Create project" }).click();

  await expect(page).toHaveURL(/\/projects\/project_/);
  await expect(page.getByRole("heading", { name: "Settings Feedback" })).toBeVisible();
  await expect(page.getByTestId("device-list")).toContainText("iPhone Pro");
  await expect(page.getByTestId("device-list")).toContainText("Pixel Pro");
  await expect(page.getByRole("row", { name: /Toast/ })).toBeVisible();
  await expect(page.getByRole("row", { name: /Button/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add event" })).toBeVisible();
});

test("creates folders and projects at the projects root", async ({ page }) => {
  await page.goto("/projects");
  await page.getByRole("button", { name: "Reset demo" }).click();

  await page.getByRole("button", { name: "New folder" }).click();
  const folderDialog = page.getByRole("dialog", { name: "Create folder" });
  await folderDialog.getByLabel("Folder name").fill("Root Experiments");
  await folderDialog.getByRole("button", { name: "Create folder" }).click();

  await expect(page).toHaveURL(/\/projects\?folder=folder_/);
  await expect(page.getByRole("heading", { name: "Root Experiments" })).toBeVisible();

  await page.getByLabel("Workspace sections").getByRole("link", { name: "Projects" }).click();
  await page.getByRole("button", { name: "New", exact: true }).click();
  const projectDialog = page.getByRole("dialog", { name: "New Project" });
  await projectDialog.getByLabel("Project name").fill("Root Feedback System");
  await projectDialog.getByRole("button", { name: "Create project" }).click();

  await expect(page).toHaveURL(/\/projects\/project_/);
  await expect(page.getByRole("heading", { name: "Root Feedback System" })).toBeVisible();

  await page.getByLabel("Workspace sections").getByRole("link", { name: "Projects" }).click();
  await expect(page.getByRole("link", { name: "Root Experiments" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Root Feedback System" })).toBeVisible();
});

test("deletes projects and folders from explorer row menus", async ({ page }) => {
  test.setTimeout(120000);

  await page.goto("/projects");
  await page.getByRole("button", { name: "Reset demo" }).click();

  await page.getByRole("button", { name: "New folder" }).click();
  const folderDialog = page.getByRole("dialog", { name: "Create folder" });
  await folderDialog.getByLabel("Folder name").fill("Delete Candidate Folder");
  await folderDialog.getByRole("button", { name: "Create folder" }).click();
  await expect(page.getByRole("heading", { name: "Delete Candidate Folder" })).toBeVisible();

  await page.getByLabel("Workspace sections").getByRole("link", { name: "Projects" }).click();
  await page.getByRole("button", { name: "New", exact: true }).click();
  const projectDialog = page.getByRole("dialog", { name: "New Project" });
  await projectDialog.getByLabel("Project name").fill("Delete Candidate Project");
  await projectDialog.getByRole("button", { name: "Create project" }).click();
  await expect(page.getByRole("heading", { name: "Delete Candidate Project" })).toBeVisible();

  await page.getByLabel("Workspace sections").getByRole("link", { name: "Projects" }).click();

  await page
    .getByRole("row", { name: /Delete Candidate Project/ })
    .getByRole("button", { name: "Open actions for Delete Candidate Project" })
    .click();
  await page.getByRole("menuitem", { name: "Delete project" }).click();
  const projectDeleteDialog = page.getByRole("dialog", { name: "Delete project?" });
  await projectDeleteDialog.getByRole("button", { name: "Delete project" }).click();
  await expect(page.getByRole("status")).toContainText("Deleted project Delete Candidate Project.");
  await expect(page.getByRole("link", { name: "Delete Candidate Project" })).toHaveCount(0);

  await page.getByRole("button", { name: "New folder" }).click();
  const activeFolderDialog = page.getByRole("dialog", { name: "Create folder" });
  await activeFolderDialog.getByLabel("Folder name").fill("Active Delete Folder");
  await activeFolderDialog.getByRole("button", { name: "Create folder" }).click();
  await expect(page.getByRole("heading", { name: "Active Delete Folder" })).toBeVisible();
  await page.getByRole("button", { name: "Open actions for Active Delete Folder" }).click();
  await page.getByRole("menuitem", { name: "Delete folder" }).click();
  const activeFolderDeleteDialog = page.getByRole("dialog", { name: "Delete folder?" });
  await activeFolderDeleteDialog.getByRole("button", { name: "Delete folder" }).click();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.getByRole("status")).toContainText("Deleted folder Active Delete Folder.");
  await expect(page.getByRole("link", { name: "Active Delete Folder" })).toHaveCount(0);

  await page
    .getByRole("row", { name: /Delete Candidate Folder/ })
    .getByRole("button", { name: "Open actions for Delete Candidate Folder" })
    .click();
  await page.getByRole("menuitem", { name: "Delete folder" }).click();
  const folderDeleteDialog = page.getByRole("dialog", { name: "Delete folder?" });
  await folderDeleteDialog.getByRole("button", { name: "Delete folder" }).click();
  await expect(page.getByRole("status")).toContainText("Deleted folder Delete Candidate Folder.");
  await expect(page.getByRole("link", { name: "Delete Candidate Folder" })).toHaveCount(0);
});

test("deletes a project and reloads the explorer cleanly", async ({ page }) => {
  test.setTimeout(120000);

  await page.goto("/projects");
  await page.getByRole("button", { name: "Reset demo" }).click();

  await page.getByRole("button", { name: "New", exact: true }).click();
  const projectDialog = page.getByRole("dialog", { name: "New Project" });
  await projectDialog.getByLabel("Project name").fill("Reload Delete Project");
  await projectDialog.getByRole("button", { name: "Create project" }).click();
  await expect(page.getByRole("heading", { name: "Reload Delete Project" })).toBeVisible();

  await page.getByLabel("Workspace sections").getByRole("link", { name: "Projects" }).click();
  await expect(page.getByRole("link", { name: "Reload Delete Project" })).toBeVisible();
  await page
    .getByRole("row", { name: /Reload Delete Project/ })
    .getByRole("button", { name: "Open actions for Reload Delete Project" })
    .click();
  await page.getByRole("menuitem", { name: "Delete project" }).click();
  await page
    .getByRole("dialog", { name: "Delete project?" })
    .getByRole("button", { name: "Delete project" })
    .click();

  await expect(page.getByRole("status")).toContainText("Deleted project Reload Delete Project.");
  await page.reload();
  await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Reload Delete Project" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Mobile App Systems" })).toBeVisible();
});

test("configures devices and collections in a project workspace", async ({ page }) => {
  await page.goto("/projects");
  await page.getByRole("button", { name: "Reset demo" }).click();
  await page.goto("/projects/project_checkout-system");

  await expect(page.getByRole("heading", { name: "Checkout Feedback System" })).toBeVisible();
  await expect(page.getByTestId("device-list")).toContainText("iPhone 16 Pro");
  await expect(page.getByRole("heading", { name: "iPhone 16 Pro" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Pay Now", exact: true })).toBeVisible();

  await page.getByRole("switch", { name: "Included in playback/export" }).click();
  await expect(page.getByText("This device is excluded from playback and export until it is enabled again.")).toBeVisible();

  await page.getByRole("button", { name: "Add device" }).first().click();
  const deviceDialog = page.getByRole("dialog", { name: "Create Device" });
  await deviceDialog.getByLabel("Name").fill("iPad Demo");
  await deviceDialog.getByLabel("Platform").selectOption({ label: "iOS" });
  await deviceDialog.getByRole("button", { name: "Create device" }).click();

  await expect(page.getByRole("heading", { name: "iPad Demo" })).toBeVisible();
  await page.getByRole("button", { name: "Add collection" }).click();
  const collectionDialog = page.getByRole("dialog", { name: "Create Collection" });
  await collectionDialog.getByLabel("Name").fill("Keyboard");
  await collectionDialog.getByRole("button", { name: "Create collection" }).click();

  await expect(page.getByTestId("collection-list")).toContainText("Keyboard");
  await expect(page.getByText("Collections are scoped to iPad Demo.")).toBeVisible();
});

test("deletes a device and project from the workspace", async ({ page }) => {
  await page.goto("/projects");
  await page.getByRole("button", { name: "Reset demo" }).click();
  await page.goto("/projects/project_checkout-system");

  await expect(page.getByRole("heading", { name: "Checkout Feedback System" })).toBeVisible();
  await page.getByRole("button", { name: "Open actions for iPhone 16 Pro" }).click();
  await page.getByRole("menuitem", { name: "Delete device" }).click();

  const deviceDeleteDialog = page.getByRole("dialog", { name: "Delete device?" });
  await deviceDeleteDialog.getByRole("button", { name: "Delete device" }).click();

  await expect(page.getByRole("status")).toContainText("Deleted device iPhone 16 Pro.");
  await expect(page.getByTestId("device-list")).not.toContainText("iPhone 16 Pro");
  await expect(page.getByRole("heading", { name: "Pixel 9" })).toBeVisible();

  await page.getByRole("button", { name: "Open actions for Checkout Feedback System" }).click();
  await page.getByRole("menuitem", { name: "Delete project" }).click();

  const projectDeleteDialog = page.getByRole("dialog", { name: "Delete project?" });
  await projectDeleteDialog.getByRole("button", { name: "Delete project" }).click();

  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.getByRole("status")).toContainText("Deleted project Checkout Feedback System.");
  await page.goto("/projects?folder=folder_checkout");
  await expect(page.getByRole("link", { name: "Checkout Feedback System" })).toHaveCount(0);
});

test("deletes collections and events from the workspace", async ({ page }) => {
  await page.goto("/projects");
  await page.getByRole("button", { name: "Reset demo" }).click();
  await page.goto("/projects/project_checkout-system");

  await expect(page.getByRole("heading", { name: "Checkout Feedback System" })).toBeVisible();
  await page.getByRole("button", { name: "Add collection" }).click();
  const collectionDialog = page.getByRole("dialog", { name: "Create Collection" });
  await collectionDialog.getByLabel("Name").fill("Delete Flow");
  await collectionDialog.getByRole("button", { name: "Create collection" }).click();

  await expect(page.getByText("Collections are scoped to iPhone 16 Pro.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Delete", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open actions for Delete Flow" })).toHaveCount(0);
  await page.getByRole("button", { name: "Add event" }).first().click();
  let eventDialog = page.getByRole("dialog", { name: "Create Event" });
  await eventDialog.getByLabel("Name").fill("Temporary Toast");
  await eventDialog.getByLabel("Event type").selectOption("Toast");
  await eventDialog.getByRole("button", { name: "Create event" }).click();

  await expect(page.getByRole("heading", { name: "Temporary Toast" })).toBeVisible();
  await page.getByRole("button", { name: "Back to events" }).click();
  await page
    .getByRole("row", { name: /Temporary Toast/ })
    .getByRole("button", { name: "Open actions for Temporary Toast" })
    .click();
  await page.getByRole("menuitem", { name: "Delete event" }).click();
  let deleteDialog = page.getByRole("dialog", { name: "Delete event?" });
  await deleteDialog.getByRole("button", { name: "Delete event" }).click();
  await expect(page.getByText("Deleted event Temporary Toast.", { exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Temporary Toast", exact: true })).toHaveCount(0);

  await page.getByRole("button", { name: "Delete", exact: true }).click();
  deleteDialog = page.getByRole("dialog", { name: "Delete collection?" });
  await expect(deleteDialog).toContainText(
    "This removes Delete Flow and its dependent demo records from IndexedDB."
  );
  await expect(deleteDialog).toContainText(
    "Events, trigger schedules, collision matrix rows, columns, entries, and share links."
  );
  await deleteDialog.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByTestId("collection-list")).toContainText("Delete Flow");

  await page.getByRole("button", { name: "Delete", exact: true }).click();
  deleteDialog = page.getByRole("dialog", { name: "Delete collection?" });
  await deleteDialog.getByRole("button", { name: "Delete collection" }).click();
  await expect(page.getByText("Deleted collection Delete Flow.", { exact: true })).toBeVisible();
  await expect(page.getByTestId("collection-list")).not.toContainText("Delete Flow");

  await page.getByRole("button", { name: "Add event" }).first().click();
  eventDialog = page.getByRole("dialog", { name: "Create Event" });
  await eventDialog.getByLabel("Name").fill("Detail Delete");
  await eventDialog.getByLabel("Event type").selectOption("Banner");
  await eventDialog.getByRole("button", { name: "Create event" }).click();
  await expect(page.getByRole("heading", { name: "Detail Delete" })).toBeVisible();

  await page.getByRole("button", { name: "Open actions for Detail Delete" }).click();
  await page.getByRole("menuitem", { name: "Delete event" }).click();
  deleteDialog = page.getByRole("dialog", { name: "Delete event?" });
  await deleteDialog.getByRole("button", { name: "Delete event" }).click();

  await expect(page).toHaveURL(/\/projects\/project_checkout-system/);
  await expect(page.getByText("Deleted event Detail Delete.", { exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Detail Delete", exact: true })).toHaveCount(0);
});

test("reorders collection events with pointer and keyboard controls", async ({ page }) => {
  await page.goto("/projects");
  await page.getByRole("button", { name: "Reset demo" }).click();
  await page.goto("/projects/project_checkout-system");

  const rowOrder = () =>
    page
      .locator('[data-testid^="event-row-"]')
      .evaluateAll((rows) => rows.map((row) => row.getAttribute("data-testid")));
  const payNowHandle = page.getByRole("button", { name: "Reorder Pay Now" });
  const saveCardHandle = page.getByRole("button", { name: "Reorder Save Card" });

  await expect.poll(rowOrder).toEqual(["event-row-event_ios-pay-now", "event-row-event_ios-save-card"]);
  const sourceBox = await payNowHandle.boundingBox();
  const destinationBox = await saveCardHandle.boundingBox();

  if (!sourceBox || !destinationBox) {
    throw new Error("Event reorder handles must be visible before dragging.");
  }

  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(destinationBox.x + destinationBox.width / 2, destinationBox.y + destinationBox.height - 2, {
    steps: 8
  });
  await page.mouse.up();
  await expect.poll(rowOrder).toEqual(["event-row-event_ios-save-card", "event-row-event_ios-pay-now"]);

  await page.reload();
  await expect.poll(rowOrder).toEqual(["event-row-event_ios-save-card", "event-row-event_ios-pay-now"]);

  await page.getByRole("button", { name: "Reorder Pay Now" }).focus();
  await page.keyboard.press("Space");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Space");
  await expect.poll(rowOrder).toEqual(["event-row-event_ios-pay-now", "event-row-event_ios-save-card"]);

  await page.reload();
  await expect.poll(rowOrder).toEqual(["event-row-event_ios-pay-now", "event-row-event_ios-save-card"]);
});

test("creates an event with an interaction playback", async ({ page }) => {
  await page.goto("/projects");
  await page.getByRole("button", { name: "Reset demo" }).click();
  await page.goto("/projects/project_checkout-system");

  await expect(page.getByRole("heading", { name: "Checkout Feedback System" })).toBeVisible();
  await page.getByRole("button", { name: "Add event" }).click();

  const eventDialog = page.getByRole("dialog", { name: "Create Event" });
  await eventDialog.getByLabel("Name").fill("Undo Purchase");
  await eventDialog.getByLabel("Event type").selectOption("Toast");
  await eventDialog.getByRole("button", { name: "Create event" }).click();

  await expect(page).toHaveURL(/\/events\//);
  await expect(page.getByRole("heading", { name: "Undo Purchase" })).toBeVisible();

  await page.getByRole("button", { name: "Interaction" }).click();
  const interactionDialog = page.getByRole("dialog", { name: "Add Interaction" });
  await interactionDialog.getByLabel("Interaction").selectOption({ label: "onPress" });
  await interactionDialog.getByLabel("Label").fill("Primary undo press");
  await interactionDialog.getByRole("button", { name: "Add interaction" }).click();

  await expect(page.getByTitle("Primary undo press")).toBeVisible();

  await page.getByRole("button", { name: "Playback" }).click();
  const playbackDialog = page.getByRole("dialog", { name: "Add Playback" });
  await playbackDialog.getByLabel(/Navigation Click/).check();
  await playbackDialog.getByLabel("Start offset").fill("0.12");
  await playbackDialog.getByRole("button", { name: "Add playback" }).click();

  await expect(page.getByText("Event playback timeline")).toBeVisible();
  await expect(page.getByText("0.12s").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Play onPress" })).toBeEnabled();

  await page.getByRole("button", { name: "Edit playback Navigation Click" }).click();
  const editPlaybackDialog = page.getByRole("dialog", { name: "Edit Playback" });
  await editPlaybackDialog.getByLabel("Start offset").fill("0.2");
  await editPlaybackDialog.getByRole("button", { name: "Save playback" }).click();

  await expect(page.getByText("0.20s").first()).toBeVisible();
  await page.getByRole("button", { name: "Delete playback Navigation Click" }).click();
  let deleteDialog = page.getByRole("dialog", { name: "Delete playback?" });
  await deleteDialog.getByRole("button", { name: "Delete playback" }).click();

  await expect(page.getByRole("status")).toContainText("Deleted playback Navigation Click.");
  await expect(page.getByText("0.20s")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Playback" })).toBeVisible();

  await page.getByRole("button", { name: "Delete interaction onPress" }).click();
  deleteDialog = page.getByRole("dialog", { name: "Delete interaction?" });
  await deleteDialog.getByRole("button", { name: "Delete interaction" }).click();

  await expect(page.getByRole("status")).toContainText("Deleted interaction Primary undo press.");
  await expect(page.getByText("No interactions bound yet")).toBeVisible();

  await page.getByRole("button", { name: "Back to events" }).click();
  await expect(page.getByRole("cell", { name: "Undo Purchase", exact: true })).toBeVisible();
  await page
    .getByRole("row", { name: /Undo Purchase/ })
    .getByRole("button", { name: "Open", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: "Undo Purchase" })).toBeVisible();
  await expect(page.getByText("No interactions bound yet")).toBeVisible();

});

test("browses and mutates asset libraries", async ({ page }) => {
  test.setTimeout(60000);

  await page.goto("/projects");
  await page.getByRole("button", { name: "Reset demo" }).click();
  await page.goto("/libraries");

  await expect(page.getByRole("heading", { name: "Asset Libraries" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Checkout Feedback System Default/ })).toContainText("Default");
  await page.getByText("Confirmation").click();
  await expect(page.getByRole("cell", { name: "Success Chime", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Create library" }).click();
  const libraryDialog = page.getByRole("dialog", { name: "New Library" });
  await libraryDialog.getByLabel("Name").fill("Notification Kit");
  await libraryDialog.getByRole("button", { name: "Create" }).click();

  await expect(page.getByRole("heading", { name: "Notification Kit" })).toBeVisible();

  await page.getByRole("button", { name: "New folder" }).click();
  const folderDialog = page.getByRole("dialog", { name: "New Folder" });
  await folderDialog.getByLabel("Name").fill("Toasts");
  await folderDialog.getByRole("button", { name: "Create" }).click();

  await expect(page.getByRole("heading", { name: "Notification Kit" })).toBeVisible();
  await page.getByRole("button", { name: "New asset" }).click();
  const assetDialog = page.getByRole("dialog", { name: "New Asset" });
  await assetDialog.getByLabel("Display name").fill("Toast Tap");
  await assetDialog.getByLabel("File").setInputFiles(fixturePath("toast-tap.ahap"));
  await expect(assetDialog).toContainText("haptic asset");
  await assetDialog.getByRole("button", { name: "Upload" }).click();

  await expect(page.getByRole("cell", { name: "Toast Tap", exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Uploaded haptic" })).toBeVisible();
  await page
    .getByRole("row", { name: /Toast Tap/ })
    .getByRole("button", { name: "Open actions for Toast Tap" })
    .click();
  await page.getByRole("menuitem", { name: "Delete asset" }).click();
  let deleteDialog = page.getByRole("dialog", { name: "Delete asset?" });
  await deleteDialog.getByRole("button", { name: "Delete asset" }).click();
  await expect(page.getByRole("status")).toContainText("Deleted asset Toast Tap.");
  await expect(page.getByRole("cell", { name: "Toast Tap", exact: true })).toHaveCount(0);

  await page.getByRole("button", { name: "New folder" }).click();
  const nestedFolderDialog = page.getByRole("dialog", { name: "New Folder" });
  await nestedFolderDialog.getByLabel("Name").fill("Nested Delete");
  await nestedFolderDialog.getByRole("button", { name: "Create" }).click();
  await expect(page.getByRole("heading", { name: "Notification Kit" })).toBeVisible();
  await page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: "Toasts" }).click();

  await page.getByRole("button", { name: "Show tile view" }).click();
  await expect(page.getByRole("button", { name: "Nested Delete 0 items" })).toBeVisible();
  await page.getByRole("button", { name: "Open actions for Nested Delete" }).click();
  await page.getByRole("menuitem", { name: "Delete folder" }).click();
  deleteDialog = page.getByRole("dialog", { name: "Delete folder?" });
  await deleteDialog.getByRole("button", { name: "Delete folder" }).click();
  await expect(page.getByRole("status")).toContainText("Deleted folder Nested Delete.");
  await expect(page.getByRole("button", { name: "Nested Delete 0 items" })).toHaveCount(0);

  await page.getByRole("button", { name: "New folder" }).click();
  const activeFolderDialog = page.getByRole("dialog", { name: "New Folder" });
  await activeFolderDialog.getByLabel("Name").fill("Active Asset Folder");
  await activeFolderDialog.getByRole("button", { name: "Create" }).click();
  await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toContainText("Active Asset Folder");
  await page.getByRole("button", { name: "Open actions for Active Asset Folder" }).click();
  await page.getByRole("menuitem", { name: "Delete folder" }).click();
  deleteDialog = page.getByRole("dialog", { name: "Delete folder?" });
  await deleteDialog.getByRole("button", { name: "Delete folder" }).click();
  await expect(page.getByRole("status")).toContainText("Deleted folder Active Asset Folder.");
  await expect(page.getByRole("navigation", { name: "Breadcrumb" })).not.toContainText("Active Asset Folder");

  await page.getByRole("button", { name: "Open actions for Notification Kit" }).click();
  await page.getByRole("menuitem", { name: "Delete library" }).click();
  deleteDialog = page.getByRole("dialog", { name: "Delete library?" });
  await deleteDialog.getByRole("button", { name: "Delete library" }).click();
  await expect(page.getByRole("status")).toContainText("Deleted library Notification Kit.");
  await expect(page.getByRole("button", { name: /Notification Kit/ })).toHaveCount(0);
});

test("imports a library and selects its asset for playback", async ({ page }) => {
  test.setTimeout(60000);

  await page.goto("/projects");
  await page.getByRole("button", { name: "Reset demo" }).click();
  await page.goto("/libraries");

  await page.getByRole("button", { name: "Create library" }).click();
  const libraryDialog = page.getByRole("dialog", { name: "New Library" });
  await libraryDialog.getByLabel("Name").fill("Modal Feedback");
  await libraryDialog.getByRole("button", { name: "Create" }).click();
  await expect(page.getByRole("heading", { name: "Modal Feedback" })).toBeVisible();

  await page.getByRole("button", { name: "New asset" }).click();
  const assetDialog = page.getByRole("dialog", { name: "New Asset" });
  await assetDialog.getByLabel("Display name").fill("Modal Open");
  await assetDialog.getByLabel("File").setInputFiles(fixturePath("modal-open.wav"));
  await expect(assetDialog).toContainText("audio asset");
  await assetDialog.getByRole("button", { name: "Upload" }).click();
  await expect(page.getByRole("cell", { name: "Modal Open", exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Uploaded audio" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Play Modal Open" })).toBeVisible();

  await page.goto("/projects/project_checkout-system");
  await page.getByRole("tab", { name: "Assets" }).click();
  await expect(page.getByTestId("project-asset-libraries")).toContainText("Checkout Feedback System Default");
  await page.getByRole("cell", { name: "Confirmation", exact: true }).click();
  await expect(page.getByRole("cell", { name: "Success Chime", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Play Success Chime" })).toBeVisible();
  await expect(page.getByTestId("project-asset-libraries")).not.toContainText("Modal Feedback");
  await page.getByRole("button", { name: "Import library" }).click();
  const importDialog = page.getByRole("dialog", { name: "Import Library" });
  await importDialog.getByLabel("Library").selectOption({ index: 0 });
  await importDialog.getByRole("button", { name: "Import library" }).click();
  await expect(page.getByTestId("project-asset-libraries")).toContainText("Modal Feedback");

  await page.getByRole("tab", { name: "Events" }).click();
  await page.getByRole("button", { name: "Add event" }).click();
  const eventDialog = page.getByRole("dialog", { name: "Create Event" });
  await eventDialog.getByLabel("Name").fill("Modal Appeared");
  await eventDialog.getByLabel("Event type").selectOption("Banner");
  await eventDialog.getByRole("button", { name: "Create event" }).click();
  await expect(page.getByRole("heading", { name: "Modal Appeared" })).toBeVisible();

  await page.getByRole("button", { name: "Interaction" }).click();
  const interactionDialog = page.getByRole("dialog", { name: "Add Interaction" });
  await interactionDialog.getByLabel("Interaction").selectOption({ label: "onPress" });
  await interactionDialog.getByRole("button", { name: "Add interaction" }).click();

  await page.getByRole("button", { name: "Playback" }).click();
  const playbackDialog = page.getByRole("dialog", { name: "Add Playback" });
  await playbackDialog.getByLabel(/Modal Open/).check();
  await playbackDialog.getByLabel("Start offset").fill("0.05");
  await playbackDialog.getByRole("button", { name: "Add playback" }).click();

  await expect(page.getByText("Modal Open").last()).toBeVisible();
  await expect(page.getByRole("button", { name: "Play onPress" })).toBeEnabled();
  await page.getByRole("button", { name: "Play onPress" }).click();
  await expect(page.getByText("Event playback timeline")).toBeVisible();
});

test("uploads assets from the project workspace default library", async ({ page }) => {
  test.setTimeout(60000);

  await page.goto("/projects");
  await page.getByRole("button", { name: "Reset demo" }).click();
  await page.goto("/projects/project_checkout-system");

  await page.getByRole("tab", { name: "Assets" }).click();
  await expect(page.getByTestId("project-asset-libraries")).toContainText("Checkout Feedback System Default");

  await page.getByRole("button", { name: "New asset" }).click();
  let assetDialog = page.getByRole("dialog", { name: "New Asset" });
  await assetDialog.getByLabel("Display name").fill("Root Modal Open");
  await assetDialog.getByLabel("File").setInputFiles(fixturePath("modal-open.wav"));
  await expect(assetDialog).toContainText("audio asset");
  await assetDialog.getByRole("button", { name: "Upload" }).click();

  await expect(page.getByRole("cell", { name: "Root Modal Open", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Play Root Modal Open" })).toBeVisible();

  await page.getByRole("button", { name: "New folder" }).click();
  const folderDialog = page.getByRole("dialog", { name: "New Folder" });
  await folderDialog.getByLabel("Name").fill("Project Uploads");
  await folderDialog.getByRole("button", { name: "Create" }).click();

  await expect(page.getByRole("heading", { name: "Project Uploads" })).toBeVisible();
  await page.getByRole("button", { name: "New asset" }).click();
  assetDialog = page.getByRole("dialog", { name: "New Asset" });
  await assetDialog.getByLabel("Display name").fill("Nested Toast Tap");
  await assetDialog.getByLabel("File").setInputFiles(fixturePath("toast-tap.ahap"));
  await expect(assetDialog).toContainText("haptic asset");
  await assetDialog.getByRole("button", { name: "Upload" }).click();

  await expect(page.getByRole("cell", { name: "Nested Toast Tap", exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Uploaded haptic" })).toBeVisible();

  await page
    .getByRole("row", { name: /Nested Toast Tap/ })
    .getByRole("button", { name: "Open actions for Nested Toast Tap" })
    .click();
  await page.getByRole("menuitem", { name: "Delete asset" }).click();
  let deleteDialog = page.getByRole("dialog", { name: "Delete asset?" });
  await deleteDialog.getByRole("button", { name: "Delete asset" }).click();
  await expect(page.getByRole("status")).toContainText("Deleted asset Nested Toast Tap.");
  await expect(page.getByRole("cell", { name: "Nested Toast Tap", exact: true })).toHaveCount(0);

  await page.getByRole("button", { name: "Open actions for Project Uploads" }).click();
  await page.getByRole("menuitem", { name: "Delete folder" }).click();
  deleteDialog = page.getByRole("dialog", { name: "Delete folder?" });
  await deleteDialog.getByRole("button", { name: "Delete folder" }).click();
  await expect(page.getByRole("status")).toContainText("Deleted folder Project Uploads.");
  await expect(page.getByRole("heading", { name: "Project Uploads" })).toHaveCount(0);
});

test("configures a collision matrix entry", async ({ page }) => {
  await page.goto("/projects");
  await page.getByRole("button", { name: "Reset demo" }).click();
  await page.goto("/projects/project_checkout-system");

  await page.getByRole("tab", { name: "Matrix" }).click();
  await expect(page.getByRole("heading", { name: "Collision Matrix" })).toBeVisible();
  await expect(page.getByTestId("collision-matrix-grid")).toContainText("Incoming");
  await expect(page.getByTestId("collision-matrix-grid")).toContainText("Playing");

  await page.getByRole("button", { name: "Playing", exact: true }).click();
  const matrixFilters = page.getByTestId("matrix-axis-filter");
  await expect(matrixFilters.getByRole("tab", { name: "Playing" })).toHaveAttribute(
    "aria-selected",
    "true"
  );
  const playingCheckoutActions = matrixFilters.getByRole("checkbox", {
    name: "Toggle playing rows in Checkout Actions"
  });
  await expect(playingCheckoutActions).toHaveAttribute("aria-checked", "mixed");
  await playingCheckoutActions.click();
  await expect(page.getByRole("status")).toContainText("Added Save Card to playing rows.");
  await expect(playingCheckoutActions).toHaveAttribute("aria-checked", "true");

  await matrixFilters.getByRole("tab", { name: "Incoming" }).click();
  await expect(
    matrixFilters.getByRole("checkbox", { name: "Toggle incoming column Card Declined" })
  ).toHaveAttribute("aria-checked", "true");
  await page.getByRole("button", { name: "Close matrix filters" }).click();

  await page
    .getByTestId("collision-matrix-grid")
    .getByRole("button", { name: "Unset: Save Card when Card Declined arrives" })
    .click();
  await page.getByLabel("Behavior").selectOption("Queue");
  await page.getByRole("button", { name: "Save rule" }).click();
  await page.getByRole("button", { name: "Back to Matrix" }).click();

  await expect(page.getByTestId("collision-matrix-grid")).toContainText("Queue");

  await page.reload();
  await page.getByRole("tab", { name: "Matrix" }).click();
  await expect(page.getByTestId("collision-matrix-grid")).toContainText("Queue");
});

test("renders the focused resolution editor at wide and narrow viewports", async ({ page }) => {
  const editor = page.getByRole("region", { name: "Collision Matrix resolution editor" });

  await page.setViewportSize({ height: 1100, width: 1440 });
  await page.goto("/projects");
  await page.getByRole("button", { name: "Reset demo" }).click();
  await page.goto("/projects/project_checkout-system");
  await page.getByRole("tab", { name: "Matrix" }).click();
  await page
    .getByTestId("collision-matrix-grid")
    .getByRole("button", { name: "Suppress: Pay Now when Card Declined arrives" })
    .click();

  await expect(editor).toBeVisible();
  await page.locator("nextjs-portal").evaluateAll((portals) => {
    for (const portal of portals) {
      portal.setAttribute("style", "display: none");
    }
  });
  await expect(editor).toHaveScreenshot("matrix-resolution-editor-wide.png", {
    animations: "disabled",
    caret: "hide"
  });

  await page.setViewportSize({ height: 1100, width: 375 });
  await expect(editor).toHaveScreenshot("matrix-resolution-editor-375.png", {
    animations: "disabled",
    caret: "hide"
  });
});

test("keeps collision audition offsets out of authored event playback schedules", async ({ page }) => {
  await page.goto("/projects");
  await page.getByRole("button", { name: "Reset demo" }).click();
  await page.goto("/projects/project_checkout-system");
  await page.getByRole("tab", { name: "Matrix" }).click();
  await page
    .getByTestId("collision-matrix-grid")
    .getByRole("button", { name: "Suppress: Pay Now when Card Declined arrives" })
    .click();

  const editor = page.getByRole("region", { name: "Collision Matrix resolution editor" });
  await editor.getByLabel("Playing offset in milliseconds").fill("420");
  await editor.getByLabel("Incoming offset in milliseconds").fill("670");
  await expect(editor.getByLabel(/Collision preview timeline, Playing starts at 420 milliseconds and Incoming starts at 670 milliseconds/)).toBeVisible();

  await editor.getByRole("button", { name: "Save collision rule" }).click();
  await expect.poll(() =>
    persistedPlaybackOffsets(page, [
      "playback_pay-now-release-audio",
      "playback_card-declined-warning"
    ])
  ).toEqual([0, 0]);

  await page.reload();
  await page.getByRole("tab", { name: "Matrix" }).click();
  await expect(
    page.getByTestId("collision-matrix-grid").getByRole("button", {
      name: "Suppress: Pay Now when Card Declined arrives"
    })
  ).toBeVisible();
  await expect(
    persistedPlaybackOffsets(page, [
      "playback_pay-now-release-audio",
      "playback_card-declined-warning"
    ])
  ).resolves.toEqual([0, 0]);
});

test("keeps Collision Matrix hover feedback motionless when reduced motion is preferred", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/projects");
  await page.getByRole("button", { name: "Reset demo" }).click();
  await page.goto("/projects/project_checkout-system");
  await page.getByRole("tab", { name: "Matrix" }).click();

  const cell = page
    .getByTestId("collision-matrix-grid")
    .getByRole("button", { name: "Suppress: Pay Now when Card Declined arrives" });
  await expect(cell).toBeVisible();

  const before = await cell.evaluate((element) => getComputedStyle(element).boxShadow);
  await cell.hover();
  const hovered = await cell.evaluate((element) => {
    const styles = getComputedStyle(element);

    return {
      boxShadow: styles.boxShadow,
      reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
      transform: styles.transform,
      transitionProperty: styles.transitionProperty
    };
  });

  expect(hovered.reducedMotion).toBe(true);
  expect(hovered.transform).toBe("none");
  expect(hovered.transitionProperty).not.toContain("transform");
  expect(hovered.boxShadow).not.toBe(before);
});

test("clears collision matrix rows columns and entries", async ({ page }) => {
  await page.goto("/projects");
  await page.getByRole("button", { name: "Reset demo" }).click();
  await page.goto("/projects/project_checkout-system");

  await page.getByRole("tab", { name: "Matrix" }).click();
  const matrixGrid = page.getByTestId("collision-matrix-grid");
  const matrixFilters = page.getByTestId("matrix-axis-filter");

  await page.getByRole("button", { name: "Filters" }).click();
  await matrixFilters.getByRole("checkbox", { name: "Toggle playing row Save Card" }).click();
  await expect(page.getByRole("status")).toContainText("Added Save Card to playing rows.");
  await page.getByRole("button", { name: "Close matrix filters" }).click();

  await matrixGrid.getByRole("button", { name: "Unset: Save Card when Card Declined arrives" }).click();
  await page.getByLabel("Behavior").selectOption("Queue");
  await page.getByRole("button", { name: "Save rule" }).click();
  await expect(matrixGrid).toContainText("Queue");

  await page.getByRole("button", { name: "Clear rule" }).click();
  await page.getByRole("dialog", { name: "Clear matrix rule?" }).getByRole("button", { name: "Clear matrix rule" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Cleared matrix rule" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Unset: Save Card when Card Declined arrives" })
  ).toBeVisible();

  await page.getByRole("button", { name: "Playing", exact: true }).click();
  await matrixFilters.getByRole("checkbox", { name: "Toggle playing row Save Card" }).click();
  await expect(page.getByRole("status")).toContainText("Removed Save Card from playing rows.");

  await matrixFilters.getByRole("tab", { name: "Incoming" }).click();
  await matrixFilters
    .getByRole("checkbox", { name: "Toggle incoming columns in System Messaging" })
    .click();
  await expect(page.getByRole("status")).toContainText("Removed 2 events from incoming columns.");
  await page.getByRole("button", { name: "Close matrix filters" }).click();

  await expect(matrixGrid.getByRole("button", { name: /Save Card when/ })).toHaveCount(0);
  await expect(matrixGrid.getByRole("button", { name: /when Card Declined arrives/ })).toHaveCount(0);

  await page.reload();
  await page.getByRole("tab", { name: "Matrix" }).click();
  await expect(matrixGrid.getByRole("button", { name: /Save Card when/ })).toHaveCount(0);
  await expect(matrixGrid.getByRole("button", { name: /when Card Declined arrives/ })).toHaveCount(0);
});

test("generates and opens share links", async ({ page }) => {
  await page.goto("/projects");
  await page.getByRole("button", { name: "Reset demo" }).click();
  await page.goto("/projects/project_checkout-system");

  await page.getByRole("button", { name: "Share project" }).click();
  let shareDialog = page.getByRole("dialog", { name: "Share Link" });
  await expect(shareDialog).toContainText("/share/share_");
  const projectSharePath = (await shareDialog.getByText(/\/share\/share_/).textContent())?.trim();
  await shareDialog.getByRole("button", { name: "Delete link" }).click();
  await page.getByRole("dialog", { name: "Delete share link?" }).getByRole("button", { name: "Delete link" }).click();
  expect(projectSharePath).toMatch(/^\/share\/share_/);
  await expect(page.getByRole("status").filter({ hasText: "Deleted share link" })).toBeVisible();
  await page.goto(projectSharePath ?? "/share/missing");
  await expect(page.getByText("Invalid share link").last()).toBeVisible();
  await page.goto("/projects/project_checkout-system");

  await page.getByRole("button", { name: "Share project" }).click();
  shareDialog = page.getByRole("dialog", { name: "Share Link" });
  await expect(shareDialog).toContainText("/share/share_");
  await shareDialog.getByRole("button", { name: "Close" }).click();

  await page.getByRole("cell", { name: "Save Card", exact: true }).getByRole("button").click();
  await page.getByRole("button", { name: "Share", exact: true }).click();
  shareDialog = page.getByRole("dialog", { name: "Share Link" });
  await expect(shareDialog).toContainText("/share/share_");
  const eventSharePath = (await shareDialog.getByText(/\/share\/share_/).textContent())?.trim();
  await shareDialog.getByRole("button", { name: "Close" }).click();
  await page.getByRole("button", { name: "Back to events" }).click();

  await page.getByRole("tab", { name: "Matrix" }).click();
  await page.getByTestId("collision-matrix-grid").getByRole("button", { name: "Preempt" }).first().click();
  await page.getByRole("button", { name: "Share entry" }).click();
  shareDialog = page.getByRole("dialog", { name: "Share Link" });
  await expect(shareDialog).toContainText("/share/share_");

  expect(eventSharePath).toMatch(/^\/share\/share_/);
  await page.goto(eventSharePath ?? "/share/missing");
  await expect(page.getByRole("heading", { name: "Save Card" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Workspace sections" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Reset demo" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Open mobile preview" })).toHaveCount(0);
  await expect(page.getByRole("columnheader", { name: "URL" })).toHaveCount(0);
  await expect(page.getByText("Playback Preview")).toBeVisible();
  await expect(page.getByRole("button", { name: "Play playback preview" })).toBeDisabled();
  await expect(page.getByText("disabled interaction")).toBeVisible();

  await page.goto("/share/missing-token");
  await expect(page.getByText("Invalid share link").last()).toBeVisible();
});

test("keeps workspace dialogs singular and stacks share-link deletion confirmation", async ({ page }) => {
  await page.goto("/projects");
  await page.getByRole("button", { name: "Reset demo" }).click();
  await page.goto("/projects/project_checkout-system");

  const overlays = page.locator("div.fixed.inset-0.z-20");
  const expectSingleDialog = async (name: string) => {
    await expect(page.getByRole("dialog", { name })).toBeVisible();
    await expect(overlays).toHaveCount(1);
  };

  await page.getByRole("button", { name: "Share project" }).click();
  await expectSingleDialog("Share Link");
  await page.getByRole("dialog", { name: "Share Link" }).getByRole("button", { name: "Close" }).click();

  await page.getByRole("button", { name: "Add device" }).first().click();
  await expectSingleDialog("Create Device");
  await page.getByRole("dialog", { name: "Create Device" }).getByRole("button", { name: "Cancel" }).click();

  await page.getByRole("button", { name: "Add collection" }).click();
  await expectSingleDialog("Create Collection");
  await page.getByRole("dialog", { name: "Create Collection" }).getByRole("button", { name: "Cancel" }).click();

  await page.getByRole("button", { name: "Rename" }).click();
  await expectSingleDialog("Rename Collection");
  await page.getByRole("dialog", { name: "Rename Collection" }).getByRole("button", { name: "Cancel" }).click();

  await page.getByRole("button", { name: "Add event" }).first().click();
  await expectSingleDialog("Create Event");
  await page.getByRole("dialog", { name: "Create Event" }).getByRole("button", { name: "Cancel" }).click();

  await page.getByRole("tab", { name: "Assets" }).click();
  await page.getByRole("button", { name: "Import library" }).click();
  await expectSingleDialog("Import Library");
  await page.getByRole("dialog", { name: "Import Library" }).getByRole("button", { name: "Cancel" }).click();

  await page.getByRole("button", { name: "New folder" }).click();
  await expectSingleDialog("New Folder");
  await page.getByRole("dialog", { name: "New Folder" }).getByRole("button", { name: "Cancel" }).click();

  await page.getByRole("button", { name: "New asset" }).click();
  await expectSingleDialog("New Asset");
  await page.getByRole("dialog", { name: "New Asset" }).getByRole("button", { name: "Cancel" }).click();

  await page.getByRole("tab", { name: "Events" }).click();
  await page.getByRole("button", { name: "Share project" }).click();
  await page.getByRole("dialog", { name: "Share Link" }).getByRole("button", { name: "Delete link" }).click();
  await expect(page.getByRole("dialog", { name: "Share Link" })).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Delete share link?" })).toBeVisible();
  await expect(overlays).toHaveCount(2);
  await expect(overlays.last().getByRole("dialog", { name: "Delete share link?" })).toBeVisible();
  await page.getByRole("dialog", { name: "Delete share link?" }).getByRole("button", { name: "Cancel" }).click();
  await page.getByRole("dialog", { name: "Share Link" }).getByRole("button", { name: "Close" }).click();
  await expect(overlays).toHaveCount(0);
});
