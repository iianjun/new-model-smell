import { expect, type Page, test } from "@playwright/test";
import { DYNO_ALIGNMENT_POSITION, DYNO_ALIGNMENT_YAW } from "../src/dyno.js";
import { installRuntimeFixtures } from "./support/runtime.js";

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

async function installDynoFixture(page: Page, lateralOffset = 0) {
  await installRuntimeFixtures(page, {
    initialActiveFlagshipPosition: {
      ...DYNO_ALIGNMENT_POSITION,
      x: DYNO_ALIGNMENT_POSITION.x + lateralOffset,
    },
    initialActiveFlagshipYaw: DYNO_ALIGNMENT_YAW,
    initialDriveOutFlagshipId: DYNO_FLAGSHIP[0].id,
    openAiFlagshipLineup: DYNO_FLAGSHIP,
  });
}

async function installCartAtDynoFixture(page: Page) {
  await installRuntimeFixtures(page, {
    initialCartPosition: {
      ...DYNO_ALIGNMENT_POSITION,
      y: 0.72,
    },
    openAiFlagshipLineup: DYNO_FLAGSHIP,
  });
}

async function enterDriving(page: Page) {
  await page.goto("/");
  await expect(
    page.getByRole("status", { name: "Loading New Model Motors" }),
  ).toBeHidden();
  await page.keyboard.press("x");
}

async function readVisibleProgress(page: Page) {
  const progress = await page
    .getByTestId("dyno-state")
    .locator("strong")
    .textContent();

  return Number.parseInt(progress ?? "0", 10);
}

async function readDynoAudioState(page: Page) {
  return page.evaluate(() => {
    const audio = (window as Window & { __dynoAudio?: HTMLAudioElement })
      .__dynoAudio;

    return audio
      ? {
          loop: audio.loop,
          paused: audio.paused,
          playbackRate: audio.playbackRate,
          volume: audio.volume,
        }
      : null;
  });
}

test("an aligned Active Flagship runs on held acceleration, pauses on release, and prints a long Dyno Sheet", async ({
  page,
}) => {
  await installDynoFixture(page);
  await enterDriving(page);

  const dynoState = page.getByTestId("dyno-state");
  await expect(dynoState).toHaveAttribute("data-phase", "ready", {
    timeout: 8_000,
  });
  await expect(page.getByTestId("driving-state")).toContainText(
    "Wheel clamps secured",
  );

  await page.keyboard.down("w");
  await expect.poll(() => readVisibleProgress(page)).toBeGreaterThan(12);
  await page.keyboard.up("w");

  await expect(dynoState).toHaveAttribute("data-phase", "paused");
  const pausedProgress = await readVisibleProgress(page);
  await page.waitForTimeout(450);
  expect(await readVisibleProgress(page)).toBe(pausedProgress);

  await page.keyboard.down("w");
  await expect(dynoState).toHaveAttribute("data-phase", "sheet-ready", {
    timeout: 8_000,
  });
  await page.keyboard.up("w");

  await expect(dynoState).toContainText("100%");
  await expect(dynoState).toContainText("Physical Dyno Sheet printed");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("optional Dyno sound rises with the visible run and stops on release", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const NativeAudio = window.Audio;
    const instrumentedWindow = window as Window & {
      __dynoAudio?: HTMLAudioElement;
    };

    window.Audio = class extends NativeAudio {
      constructor(source?: string) {
        super(source);

        if (source?.includes("click2.ogg")) {
          instrumentedWindow.__dynoAudio = this;
        }
      }
    };
  });
  await installDynoFixture(page);
  await enterDriving(page);

  const dynoState = page.getByTestId("dyno-state");
  await expect(dynoState).toHaveAttribute("data-phase", "ready", {
    timeout: 8_000,
  });
  await page.getByRole("button", { name: "Enable Motor Town audio" }).click();
  await page.locator("canvas").click({
    force: true,
    position: { x: 640, y: 360 },
  });

  await page.keyboard.down("w");
  await expect.poll(() => readVisibleProgress(page)).toBeGreaterThan(15);
  const earlySound = await readDynoAudioState(page);
  await page.keyboard.up("w");

  await expect(dynoState).toHaveAttribute("data-phase", "paused");
  const stoppedEarlySound = await readDynoAudioState(page);

  await page.keyboard.down("w");
  await expect.poll(() => readVisibleProgress(page)).toBeGreaterThan(55);
  const lateSound = await readDynoAudioState(page);
  await page.keyboard.up("w");

  expect(earlySound?.loop).toBe(true);
  expect(earlySound?.paused).toBe(false);
  expect(stoppedEarlySound?.loop).toBe(false);
  expect(stoppedEarlySound?.paused).toBe(true);
  expect(lateSound?.loop).toBe(true);
  expect(lateSound?.paused).toBe(false);
  expect(lateSound?.playbackRate).toBeGreaterThan(
    earlySound?.playbackRate ?? Number.POSITIVE_INFINITY,
  );
  expect(lateSound?.volume).toBeGreaterThan(
    earlySound?.volume ?? Number.POSITIVE_INFINITY,
  );
  await expect(dynoState).toHaveAttribute("data-phase", "paused");
  const stoppedSound = await readDynoAudioState(page);
  expect(stoppedSound?.loop).toBe(false);
  expect(stoppedSound?.paused).toBe(true);
});

test("the Dyno rejects a near but laterally misaligned Active Flagship", async ({
  page,
}) => {
  await installDynoFixture(page, 0.72);
  await enterDriving(page);

  const drivingState = page.getByTestId("driving-state");
  await expect(drivingState).toContainText("Dyno Lab · GPT Dyno");
  await expect(drivingState).toContainText(
    "Align Flagship with orange rollers",
  );
  await page.waitForTimeout(1_000);
  await expect(page.getByTestId("dyno-state")).toHaveCount(0);
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
});
