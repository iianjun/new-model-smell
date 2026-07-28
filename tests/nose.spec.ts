import { expect, test } from "@playwright/test";
import type {
  RuntimeTrackedCompanyFixture,
  RuntimeWorldPosition,
} from "../src/runtimeFixtures.js";
import type { NoseRuntimeTestState } from "../src/runtimeTestState.js";

const model = (id: string, publicAvailabilityDate: string) => ({
  id,
  name: id,
  provenance: {
    label: `${id} launch post`,
    url: `https://example.com/${id}`,
  },
  publicAvailabilityDate,
});

function trackedCompanies(
  openAiDate: string,
  rightLabsDate: string,
): readonly RuntimeTrackedCompanyFixture[] {
  return [
    {
      dealershipPosition: { x: -9.2, y: 0, z: -4.25 },
      flagshipLineup: [model("openai-flagship", openAiDate)],
      id: "openai",
      name: "OpenAI",
    },
    {
      dealershipPosition: { x: 9.2, y: 0, z: -4.25 },
      flagshipLineup: [model("right-labs-flagship", rightLabsDate)],
      id: "right-labs",
      name: "Right Labs",
    },
  ];
}

async function installNoseFixture(
  page: import("@playwright/test").Page,
  companies: readonly RuntimeTrackedCompanyFixture[],
  initialCartPosition: RuntimeWorldPosition = { x: 0, y: 0.72, z: 10.5 },
) {
  await page.addInitScript(
    ({ companies, initialCartPosition }) => {
      window.__NEW_MODEL_MOTORS_TEST_FIXTURES__ = {
        initialCartPosition,
        trackedCompanies: companies,
      };
    },
    { companies, initialCartPosition },
  );
}

async function enterDriving(page: import("@playwright/test").Page) {
  await page.goto("/");
  await expect(
    page.getByRole("status", { name: "Loading New Model Motors" }),
  ).toBeHidden();
  await page.keyboard.press("x");
  await expect(page.getByTestId("driving-state")).toContainText(
    "Ready to inspect",
  );
}

async function readNoseSceneState(
  page: import("@playwright/test").Page,
): Promise<NoseRuntimeTestState> {
  return page.evaluate(() => {
    const state = window.__NEW_MODEL_MOTORS_TEST_STATE__?.nose;

    if (!state) {
      throw new Error("The Nose runtime test state is unavailable");
    }

    return state;
  });
}

async function observeFreshnessDirection(
  browser: import("@playwright/test").Browser,
  companies: readonly RuntimeTrackedCompanyFixture[],
) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.clock.setFixedTime(new Date("2026-07-29T12:00:00.000Z"));
  await installNoseFixture(page, companies);
  await page.goto("/");
  await expect(
    page.getByRole("status", { name: "Loading New Model Motors" }),
  ).toBeHidden();

  await expect
    .poll(async () => (await readNoseSceneState(page)).turntableYaw)
    .not.toBeCloseTo(0, 1);
  const openingState = await readNoseSceneState(page);

  await page.keyboard.press("x");
  await expect(page.getByTestId("driving-state")).toContainText(
    "Ready to inspect",
  );
  await expect
    .poll(async () => (await readNoseSceneState(page)).turntableYaw)
    .not.toBeCloseTo(0, 1);
  const drivingState = await readNoseSceneState(page);
  await context.close();

  return { drivingState, openingState };
}

test("fixture dates redirect The Nose to the Dealership containing the newest Flagship Launch", async ({
  browser,
}) => {
  const left = await observeFreshnessDirection(
    browser,
    trackedCompanies("2026-07-28", "2026-07-08"),
  );
  const right = await observeFreshnessDirection(
    browser,
    trackedCompanies("2026-07-08", "2026-07-28"),
  );

  expect(left.openingState.targetCompanyId).toBe("openai");
  expect(left.openingState.turntableYaw).toBeLessThan(-0.5);
  expect(left.drivingState.turntableYaw).toBeLessThan(-0.5);
  expect(right.openingState.targetCompanyId).toBe("right-labs");
  expect(right.openingState.turntableYaw).toBeGreaterThan(0.5);
  expect(right.drivingState.turntableYaw).toBeGreaterThan(0.5);
  expect(left.openingState.gaugeLabel).toBe("NEW MODEL SMELL REMAINING");
  expect(left.openingState.smellRemainingPercent).toBe(98);
});

test("a nearby vehicle triggers a visible sneeze without taking steering", async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date("2026-07-29T12:00:00.000Z"));
  await installNoseFixture(page, trackedCompanies("2026-07-28", "2026-07-08"), {
    x: 0,
    y: 0.72,
    z: 3.55,
  });
  await enterDriving(page);
  await expect
    .poll(
      async () => {
        const state = await readNoseSceneState(page);

        return {
          particlesVisible: state.particlesVisible,
          reaction: state.reaction,
        };
      },
      { intervals: [40, 60, 80, 100], timeout: 5_000 },
    )
    .toEqual({ particlesVisible: true, reaction: "sneeze" });

  await page.keyboard.down("w");
  await expect(page.getByTestId("driving-state")).toContainText(
    /Cart in motion|Bounced clear/,
    { timeout: 10_000 },
  );
  await page.keyboard.up("w");

  const state = await readNoseSceneState(page);
  expect(state.mode).toBe("vehicle-tracking");
});
