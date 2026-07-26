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

  const odometer = page.getByTestId("inspection-odometer");
  const recoveryAssist = page.getByTestId("recovery-assist");

  await expect(odometer).toHaveText("000 m");
  await expect(recoveryAssist).toContainText(/standing by/i);

  await page.keyboard.down("w");
  await expect
    .poll(async () =>
      Number.parseInt((await odometer.textContent()) ?? "0", 10),
    )
    .toBeGreaterThan(2);
  await expect(page.getByTestId("driving-state")).toContainText(
    "Bounced clear",
    {
      timeout: 8_000,
    },
  );
  await page.keyboard.up("w");
  await page.waitForTimeout(1_100);
  await expect(recoveryAssist).toContainText(/standing by/i);

  await page.keyboard.down("w");
  await expect(recoveryAssist).toContainText("complete", { timeout: 8_000 });
  await page.keyboard.up("w");

  const distanceAfterRecovery = Number.parseInt(
    (await odometer.textContent()) ?? "0",
    10,
  );

  await page.waitForTimeout(150);
  await page.keyboard.down("ArrowDown");
  await expect(page.getByTestId("driving-state")).toContainText("motion");
  await expect
    .poll(
      async () => Number.parseInt((await odometer.textContent()) ?? "0", 10),
      {
        timeout: 8_000,
      },
    )
    .toBeGreaterThan(distanceAfterRecovery);
  await page.keyboard.down("Space");
  await expect(page.getByTestId("driving-state")).toContainText("handbrake");
  await page.keyboard.up("Space");
  await page.keyboard.up("ArrowDown");
  expect(await page.evaluate("window.scrollY")).toBe(0);
  await expect(page.getByTestId("driving-state")).not.toContainText(
    /damage|failed|game over/i,
  );
});
