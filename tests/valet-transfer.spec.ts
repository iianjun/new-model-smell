import { expect, test } from "@playwright/test";
import {
  installRuntimeFixtures,
  MULTI_MODEL_FLAGSHIP_LINEUP,
} from "./support/runtime.js";

async function installShowroomFixture(
  page: import("@playwright/test").Page,
  initialCart:
    | { initialCartPosition: { x: number; y: number; z: number } }
    | { initialCartValetBayIndex: number },
) {
  await installRuntimeFixtures(page, {
    ...initialCart,
    openAiFlagshipLineup: MULTI_MODEL_FLAGSHIP_LINEUP,
  });
}

async function enterDriving(page: import("@playwright/test").Page) {
  await page.goto("/");
  await expect(
    page.getByRole("status", { name: "Loading New Model Motors" }),
  ).toBeHidden();
  await page.keyboard.press("x");
}

test("a Valet Transfer rejects a near but laterally misaligned Cart", async ({
  page,
}) => {
  await installShowroomFixture(page, {
    initialCartPosition: {
      x: -8.48,
      y: 0.72,
      z: -3.07,
    },
  });
  await enterDriving(page);

  const drivingState = page.getByTestId("driving-state");

  await expect(drivingState).toContainText("Inspector Cart");
  await expect(drivingState).toContainText("Ready to inspect");
  await page.waitForTimeout(1_000);
  await expect(drivingState).not.toContainText("Valet Transfer");
});

test("parking in a non-first bay transfers into that Flagship for a manual Drive-Out", async ({
  page,
}) => {
  await installShowroomFixture(page, { initialCartValetBayIndex: 2 });
  await enterDriving(page);

  const drivingState = page.getByTestId("driving-state");

  await expect(drivingState).toContainText("Valet Transfer · GPT Zenith");
  await expect(drivingState).toContainText(/Floor guidance (and|aligned)/);
  await expect(drivingState).toContainText("Valet clamps secured", {
    timeout: 3_000,
  });
  await expect(drivingState).toContainText("Packing Inspector Cart");
  await expect(drivingState).toContainText("Flagship systems waking");
  await expect(drivingState).toContainText("Active Flagship · GPT Zenith");
  await expect(drivingState).toContainText("Ready for Drive-Out");
  await expect(drivingState).not.toContainText("GPT Atlas");
  await expect(drivingState).not.toContainText("GPT Meridian");
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await page.keyboard.down("w");
  await expect(drivingState).toContainText("Drive-Out complete", {
    timeout: 6_000,
  });
  await page.keyboard.up("w");

  await expect(drivingState).toContainText("Active Flagship · GPT Zenith");
  await expect(drivingState).not.toContainText(/damage|failed|game over/i);
});
