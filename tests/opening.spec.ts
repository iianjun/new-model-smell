import { expect, test } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test("opening fades driving guidance into the live scene", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("status", { name: "Loading New Model Motors" }),
  ).toBeHidden();

  await expect(page.getByTestId("driving-state")).toContainText(
    "Ready to inspect",
    { timeout: 15_000 },
  );
  await expect(page.locator(".driving-guide")).toHaveCSS(
    "animation-name",
    "handoff-guide-in",
  );
  await expect(page.locator(".driving-guide")).toHaveCSS(
    "animation-duration",
    "0.45s",
  );
  await page.waitForTimeout(700);
  await expect(page.getByText("WASD — BEGIN INSPECTION")).toBeAttached();
});
