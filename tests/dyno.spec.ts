import { expect, type Page, test } from "@playwright/test";
import {
  DYNO_ALIGNMENT_POSITION,
  DYNO_ALIGNMENT_YAW,
  DYNO_DISPLAY_LAYOUT,
  getDynoDisplayLineWorldY,
} from "../src/dyno.js";
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
    const probe = (
      window as Window & {
        __dynoAudioProbe?: {
          frequencyTargets: number[];
          gainTimeConstants: number[];
          gainTargets: number[];
          oscillatorStarts: number;
        };
      }
    ).__dynoAudioProbe;

    return probe
      ? {
          frequencyTargets: [...probe.frequencyTargets],
          gainTimeConstants: [...probe.gainTimeConstants],
          gainTargets: [...probe.gainTargets],
          oscillatorStarts: probe.oscillatorStarts,
        }
      : null;
  });
}

test("both Dyno instruction lines clear the roof instead of being clipped", () => {
  for (const lineY of DYNO_DISPLAY_LAYOUT.instructionLineY) {
    expect(getDynoDisplayLineWorldY(lineY)).toBeGreaterThan(
      DYNO_DISPLAY_LAYOUT.roofTopY,
    );
  }
});

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
    const probe = {
      frequencyTargets: [] as number[],
      gainTimeConstants: [] as number[],
      gainTargets: [] as number[],
      oscillatorStarts: 0,
    };
    const instrumentedWindow = window as Window & {
      __dynoAudioProbe?: typeof probe;
    };
    const nativeCreateGain = AudioContext.prototype.createGain;
    const nativeCreateOscillator = AudioContext.prototype.createOscillator;

    instrumentedWindow.__dynoAudioProbe = probe;
    AudioContext.prototype.createGain = function createGain() {
      const gain = nativeCreateGain.call(this);
      const nativeSetTargetAtTime = gain.gain.setTargetAtTime.bind(gain.gain);

      gain.gain.setTargetAtTime = (target, startTime, timeConstant) => {
        probe.gainTargets.push(target);
        probe.gainTimeConstants.push(timeConstant);
        return nativeSetTargetAtTime(target, startTime, timeConstant);
      };

      return gain;
    };
    AudioContext.prototype.createOscillator = function createOscillator() {
      const oscillator = nativeCreateOscillator.call(this);
      const nativeSetTargetAtTime = oscillator.frequency.setTargetAtTime.bind(
        oscillator.frequency,
      );
      const nativeStart = oscillator.start.bind(oscillator);

      oscillator.frequency.setTargetAtTime = (
        target,
        startTime,
        timeConstant,
      ) => {
        probe.frequencyTargets.push(target);
        return nativeSetTargetAtTime(target, startTime, timeConstant);
      };
      oscillator.start = (when) => {
        probe.oscillatorStarts += 1;
        nativeStart(when);
      };

      return oscillator;
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
  const primedSound = await readDynoAudioState(page);

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

  expect(primedSound?.oscillatorStarts).toBeGreaterThanOrEqual(2);
  expect(Math.max(...(earlySound?.gainTargets ?? []))).toBeGreaterThan(0);
  expect(stoppedEarlySound?.gainTargets.at(-1)).toBe(0);
  expect(Math.max(...(lateSound?.frequencyTargets ?? []))).toBeGreaterThan(
    Math.max(...(earlySound?.frequencyTargets ?? [Number.POSITIVE_INFINITY])),
  );
  expect(Math.max(...(lateSound?.gainTargets ?? []))).toBeGreaterThan(
    Math.max(...(earlySound?.gainTargets ?? [Number.POSITIVE_INFINITY])),
  );
  await expect(dynoState).toHaveAttribute("data-phase", "paused");
  const stoppedSound = await readDynoAudioState(page);
  expect(stoppedSound?.gainTargets.at(-1)).toBe(0);
});

test("Dyno sound winds down after reaching 100% instead of cutting out", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const probe = {
      frequencyTargets: [] as number[],
      gainTimeConstants: [] as number[],
      gainTargets: [] as number[],
      oscillatorStarts: 0,
    };
    const instrumentedWindow = window as Window & {
      __dynoAudioProbe?: typeof probe;
    };
    const nativeCreateGain = AudioContext.prototype.createGain;

    instrumentedWindow.__dynoAudioProbe = probe;
    AudioContext.prototype.createGain = function createGain() {
      const gain = nativeCreateGain.call(this);
      const nativeSetTargetAtTime = gain.gain.setTargetAtTime.bind(gain.gain);

      gain.gain.setTargetAtTime = (target, startTime, timeConstant) => {
        probe.gainTargets.push(target);
        probe.gainTimeConstants.push(timeConstant);
        return nativeSetTargetAtTime(target, startTime, timeConstant);
      };

      return gain;
    };
  });
  await installDynoFixture(page);
  await enterDriving(page);

  const dynoState = page.getByTestId("dyno-state");
  await expect(dynoState).toHaveAttribute("data-phase", "ready", {
    timeout: 8_000,
  });
  await page.getByRole("button", { name: "Enable Motor Town audio" }).click();
  await page.keyboard.down("w");
  await expect(dynoState).toHaveAttribute("data-phase", "sheet-printing", {
    timeout: 8_000,
  });
  await page.keyboard.up("w");

  const completedSound = await readDynoAudioState(page);
  const lastZeroGainIndex = completedSound?.gainTargets.lastIndexOf(0) ?? -1;

  expect(lastZeroGainIndex).toBeGreaterThanOrEqual(0);
  expect(
    completedSound?.gainTimeConstants[lastZeroGainIndex],
  ).toBeGreaterThanOrEqual(0.4);
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
