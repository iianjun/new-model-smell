import { expect, type Page, test } from "@playwright/test";
import {
  DYNO_ALIGNMENT_POSITION,
  DYNO_ALIGNMENT_YAW,
  type DynoRuntimeState,
} from "../src/dyno.js";

const DYNO_FLAGSHIP = [
  {
    id: "gpt-dyno",
    name: "GPT Dyno",
    publicAvailabilityDate: "2026-07-18",
    provenance: {
      label: "OpenAI Dyno launch post",
      url: "https://openai.com/dyno",
    },
  },
] as const;

async function installDynoFixture(page: Page) {
  await page.addInitScript(
    ({ alignmentPosition, alignmentYaw, lineup }) => {
      window.__NEW_MODEL_MOTORS_TEST_FIXTURES__ = {
        initialActiveFlagshipPosition: {
          ...alignmentPosition,
          z: alignmentPosition.z + 0.7,
        },
        initialActiveFlagshipYaw: alignmentYaw,
        initialDriveOutFlagshipId: lineup[0].id,
        openAiFlagshipLineup: lineup,
      };
    },
    {
      alignmentPosition: DYNO_ALIGNMENT_POSITION,
      alignmentYaw: DYNO_ALIGNMENT_YAW,
      lineup: DYNO_FLAGSHIP,
    },
  );
}

async function installCartAtDynoFixture(page: Page) {
  await page.addInitScript(
    ({ alignmentPosition, lineup }) => {
      window.__NEW_MODEL_MOTORS_TEST_FIXTURES__ = {
        initialCartPosition: {
          ...alignmentPosition,
          y: 0.72,
        },
        openAiFlagshipLineup: lineup,
      };
    },
    {
      alignmentPosition: DYNO_ALIGNMENT_POSITION,
      lineup: DYNO_FLAGSHIP,
    },
  );
}

async function enterDriving(page: Page) {
  await page.goto("/");
  await expect(
    page.getByRole("status", { name: "Loading New Model Motors" }),
  ).toBeHidden();
  await page.keyboard.press("x");
}

async function readDynoState(page: Page) {
  return page.evaluate(
    () =>
      (window.__NEW_MODEL_MOTORS_TEST_STATE__?.dyno ??
        null) satisfies DynoRuntimeState | null,
  );
}

async function readRequiredDynoState(page: Page) {
  const state = await readDynoState(page);

  if (!state) {
    throw new Error("Dyno runtime state has not been published");
  }

  return state;
}

test("an aligned Active Flagship runs on held acceleration, pauses on release, and prints a long Dyno Sheet", async ({
  page,
}) => {
  await installDynoFixture(page);
  await enterDriving(page);

  await expect
    .poll(async () => (await readDynoState(page))?.phase, {
      timeout: 8_000,
    })
    .toBe("approach");
  await page.keyboard.down("w");
  await page.waitForTimeout(50);
  await page.keyboard.up("w");

  await expect
    .poll(async () => (await readDynoState(page))?.phase, {
      timeout: 8_000,
    })
    .toBe("ready");

  const readyState = await readRequiredDynoState(page);
  expect(readyState.vehicleSecured).toBe(true);
  expect(readyState.alignmentError).toBe(0);

  await page.keyboard.down("w");
  await expect
    .poll(async () => (await readDynoState(page))?.progress ?? 0)
    .toBeGreaterThan(0.12);
  await page.keyboard.up("w");

  await expect
    .poll(async () => (await readDynoState(page))?.phase)
    .toBe("paused");
  const pausedProgress = (await readRequiredDynoState(page)).progress;
  await page.waitForTimeout(450);
  expect((await readRequiredDynoState(page)).progress).toBe(pausedProgress);

  await page.keyboard.down("w");
  await expect
    .poll(async () => (await readDynoState(page))?.phase, {
      timeout: 8_000,
    })
    .toBe("sheet-ready");
  await page.keyboard.up("w");

  await expect
    .poll(async () => (await readDynoState(page))?.sheetLength ?? 0)
    .toBeGreaterThan(5);
  await expect(page.getByTestId("dyno-state")).toContainText("100%");
  await expect(page.getByTestId("dyno-state")).toContainText(
    "Physical Dyno Sheet printed",
  );
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("the Dyno Lab refuses the Inspector Cart without an Active Flagship", async ({
  page,
}) => {
  await installCartAtDynoFixture(page);
  await enterDriving(page);

  const drivingState = page.getByTestId("driving-state");
  await expect(drivingState).toContainText("Dyno Lab · Flagship only");
  await expect(drivingState).toContainText(
    "Inspector Cart refused · Active Flagship required",
  );
  await expect(page.getByTestId("dyno-state")).toHaveCount(0);
  expect((await readRequiredDynoState(page)).vehicleSecured).toBe(false);
});
