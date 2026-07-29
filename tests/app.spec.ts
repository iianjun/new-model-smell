import { expect, test } from "@playwright/test";
import { installRuntimeFixtures, loadingSurface } from "./support/runtime.js";

test.describe.configure({ mode: "serial" });

const drivingState = (page: import("@playwright/test").Page) =>
  page.getByTestId("driving-state");

async function observeDrivingState(
  page: import("@playwright/test").Page,
  expectedText: string,
) {
  await page.evaluate((text) => {
    const state = document.querySelector('[data-testid="driving-state"]');

    if (!state) {
      throw new Error("Driving state is unavailable");
    }

    const testWindow = window as Window & {
      observedDrivingStates?: Record<string, boolean>;
    };
    const observations = testWindow.observedDrivingStates ?? {};
    testWindow.observedDrivingStates = observations;
    observations[text] = false;

    const updateObservation = () => {
      if (state.textContent?.includes(text)) {
        observations[text] = true;
      }
    };

    new MutationObserver(updateObservation).observe(state, {
      characterData: true,
      childList: true,
      subtree: true,
    });
    updateObservation();
  }, expectedText);
}

async function expectDrivingStateWasObserved(
  page: import("@playwright/test").Page,
  expectedText: string,
  timeout: number,
) {
  await expect
    .poll(
      () =>
        page.evaluate((text) => {
          const testWindow = window as Window & {
            observedDrivingStates?: Record<string, boolean>;
          };

          return testWindow.observedDrivingStates?.[text];
        }, expectedText),
      { timeout },
    )
    .toBe(true);
}

async function skipOpening(page: import("@playwright/test").Page) {
  await expect(loadingSurface(page)).toBeHidden();
  await page.keyboard.down("w");
  await expect(drivingState(page)).toContainText("Ready to inspect", {
    timeout: 1_500,
  });
  await expect(page.getByText("WASD — BEGIN INSPECTION")).toBeAttached();
  await page.keyboard.up("w");
}

async function installInitialCartPosition(
  page: import("@playwright/test").Page,
  initialCartPosition: { x: number; y: number; z: number },
) {
  await installRuntimeFixtures(page, { initialCartPosition });
}

test("visitor moves from the loading surface into New Model Motors", async ({
  page,
}) => {
  await page.goto("/");

  await expect(loadingSurface(page)).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "New Model Motors" }),
  ).toBeVisible();
  await expect(loadingSurface(page)).toBeHidden();
});

test("full opening reveals Motor Town before handing over the Inspector Cart", async ({
  page,
}) => {
  await page.goto("/");
  await expect(loadingSurface(page)).toBeHidden();

  await expect(drivingState(page)).not.toContainText("Cart in motion");

  const freshnessEvent = page.getByText("FRESHNESS EVENT DETECTED");
  await expect(freshnessEvent).toBeVisible({ timeout: 7_000 });
  await expect(drivingState(page)).toContainText("Ready to inspect", {
    timeout: 10_000,
  });
  await expect(page.getByText("WASD — BEGIN INSPECTION")).toBeAttached();
  await expect(freshnessEvent).toBeHidden();

  await page.keyboard.down("w");
  await expect(drivingState(page)).toContainText("Cart in motion");
  await page.keyboard.up("w");
});

test("any key skips promptly to the controllable Inspector Cart state", async ({
  page,
}) => {
  await page.goto("/");
  await skipOpening(page);

  await page.keyboard.down("w");
  await expect(drivingState(page)).toContainText("Cart in motion");
  await page.keyboard.up("w");
});

test("reduced motion uses a calm reveal and reaches controllable driving", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await installRuntimeFixtures(page, { openingElapsedSeconds: 0.72 });
  await page.goto("/");
  await expect(loadingSurface(page)).toBeHidden();

  await expect(page.getByText("Calm Motor Town reveal")).toBeVisible();
  await expect(page).toHaveScreenshot("reduced-motion-calm-reveal.png", {
    animations: "disabled",
    maxDiffPixelRatio: 0.015,
    threshold: 0.2,
  });
  await page.evaluate(() => {
    const fixtures = window.__NEW_MODEL_MOTORS_TEST_FIXTURES__;

    if (!fixtures) {
      throw new Error("Reduced-motion fixture is unavailable");
    }

    fixtures.openingElapsedSeconds = 1.2;
  });
  await expect(drivingState(page)).toContainText("Ready to inspect", {
    timeout: 7_000,
  });
  await expect(page.getByText("WASD — BEGIN INSPECTION")).toBeAttached();

  await page.keyboard.down("ArrowUp");
  await expect(drivingState(page)).toContainText("Cart in motion");
  await page.keyboard.up("ArrowUp");
});

test("visitor drives the Inspector Cart through a collision and remains in control", async ({
  page,
}) => {
  await page.goto("/");
  await skipOpening(page);

  await expect(drivingState(page)).toContainText("Ready to inspect");

  await observeDrivingState(page, "Bounced clear");
  await page.keyboard.down("w");
  await expect(drivingState(page)).toContainText("Cart in motion");
  await expectDrivingStateWasObserved(page, "Bounced clear", 8_000);
  await page.keyboard.up("w");
  await page.waitForTimeout(1_100);
  await expect(drivingState(page)).not.toContainText("Recovery complete");

  await observeDrivingState(page, "Recovery complete");
  await page.keyboard.down("w");
  await expectDrivingStateWasObserved(page, "Recovery complete", 8_000);
  await page.keyboard.up("w");

  await page.waitForTimeout(750);
  await observeDrivingState(page, "Bounced clear");
  await page.keyboard.down("ArrowDown");
  await expect(drivingState(page)).toContainText("Cart in motion");
  await expectDrivingStateWasObserved(page, "Bounced clear", 8_000);
  await page.keyboard.down("Space");
  await expect(drivingState(page)).toContainText("handbrake");
  await page.keyboard.up("Space");
  await page.keyboard.up("ArrowDown");
  expect(await page.evaluate("window.scrollY")).toBe(0);
  await expect(drivingState(page)).not.toContainText(
    /damage|failed|game over/i,
  );
});

test("a roadside tree stops the Inspector Cart before the town boundary", async ({
  page,
}) => {
  await installInitialCartPosition(page, { x: -4.8, y: 0.72, z: -6.2 });
  await page.goto("/");
  await skipOpening(page);
  await observeDrivingState(page, "Bounced clear");

  await page.keyboard.down("w");

  await expectDrivingStateWasObserved(page, "Bounced clear", 2_800);
  await page.keyboard.up("w");
});

test("a destination building stops the Inspector Cart before the blocked road", async ({
  page,
}) => {
  await installInitialCartPosition(page, { x: -9.2, y: 0.72, z: -7 });
  await page.goto("/");
  await skipOpening(page);
  await observeDrivingState(page, "Bounced clear");

  await page.keyboard.down("w");

  await expectDrivingStateWasObserved(page, "Bounced clear", 2_800);
  await page.keyboard.up("w");
});
