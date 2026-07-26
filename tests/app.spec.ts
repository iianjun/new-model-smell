import { expect, test } from "@playwright/test";

test("visitor moves from the loading surface into New Model Motors", async ({
  page,
}) => {
  const loadingSurface = page.getByRole("status", {
    name: "Loading New Model Motors",
  });

  await page.goto("/");

  await expect(loadingSurface).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "New Model Motors" }),
  ).toBeVisible();
  await expect(loadingSurface).toBeHidden();
});

test("visitor drives the Inspector Cart through a collision and remains in control", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("status", { name: "Loading New Model Motors" }),
  ).toBeHidden();

  const drivingState = page.getByTestId("driving-state");

  await expect(drivingState).toContainText("Ready to inspect");

  await page.keyboard.down("w");
  await expect(drivingState).toContainText("Cart in motion");
  await expect(drivingState).toContainText("Bounced clear", { timeout: 8_000 });
  await page.keyboard.up("w");
  await page.waitForTimeout(1_100);
  await expect(drivingState).not.toContainText("Recovery complete");

  await page.keyboard.down("w");
  await expect(drivingState).toContainText("Recovery complete", {
    timeout: 8_000,
  });
  await page.keyboard.up("w");

  await page.waitForTimeout(750);
  await page.keyboard.down("ArrowDown");
  await expect(drivingState).toContainText("Cart in motion");
  await expect(drivingState).toContainText("Bounced clear", { timeout: 8_000 });
  await page.keyboard.down("Space");
  await expect(drivingState).toContainText("handbrake");
  await page.keyboard.up("Space");
  await page.keyboard.up("ArrowDown");
  expect(await page.evaluate("window.scrollY")).toBe(0);
  await expect(drivingState).not.toContainText(/damage|failed|game over/i);
});
