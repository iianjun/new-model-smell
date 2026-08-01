import { expect, type Page, test } from "@playwright/test";
import {
  completeDynoRunToSheet,
  openDynoSheetDossier,
} from "./support/dynoDossier.js";
import {
  installRuntimeFixtures,
  loadingSurface,
  MULTI_MODEL_FLAGSHIP_LINEUP,
} from "./support/runtime.js";

type DrivingKey = "a" | "d" | "s" | "w";
type InputEvent = {
  atMilliseconds: number;
  handbrake?: true;
  pressedKeys?: readonly DrivingKey[];
};
type NavigationDirection = "ahead" | "left" | "right";
type NavigationTarget = "Dyno Lab" | "Showroom";
type NavigationReading = {
  direction: NavigationDirection;
  distanceMeters: number;
  target: NavigationTarget;
};

const FLAGSHIP_DRIVE_OUT: readonly InputEvent[] = [
  { atMilliseconds: 100, pressedKeys: ["w"] },
  { atMilliseconds: 1_250, pressedKeys: ["s"] },
  { atMilliseconds: 1_430 },
  { atMilliseconds: 1_850 },
];

const DRIVING_KEYS: readonly DrivingKey[] = ["a", "d", "s", "w"];
const HANDBRAKE_PULSE_MS = 80;
const JOURNEY_TIMEOUT_MS = 240_000;

async function waitInBrowser(page: Page, milliseconds: number) {
  await page.evaluate(
    (duration) =>
      new Promise<void>((resolve) => {
        window.setTimeout(() => {
          window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => resolve());
          });
        }, duration);
      }),
    milliseconds,
  );
}

async function setPressedKeys(
  page: Page,
  pressed: Set<DrivingKey>,
  pressedKeys: readonly DrivingKey[],
) {
  const next = new Set(pressedKeys);

  for (const key of DRIVING_KEYS) {
    if (pressed.has(key) && !next.has(key)) {
      await page.keyboard.up(key);
      pressed.delete(key);
    }
  }

  for (const key of DRIVING_KEYS) {
    if (!pressed.has(key) && next.has(key)) {
      await page.keyboard.down(key);
      pressed.add(key);
    }
  }
}

async function replayInputTrace(
  page: Page,
  trace: readonly InputEvent[],
  stopWhen?: () => Promise<boolean>,
) {
  const pressed = new Set<DrivingKey>();
  let previousAt = 0;

  try {
    for (const { atMilliseconds: at, handbrake, pressedKeys = [] } of trace) {
      let waitRemaining = Math.max(0, at - previousAt);

      if (!stopWhen && waitRemaining > 0) {
        await waitInBrowser(page, waitRemaining);
        waitRemaining = 0;
      }

      while (waitRemaining > 0) {
        const interval = Math.min(waitRemaining, 400);
        await waitInBrowser(page, interval);
        waitRemaining -= interval;

        if (await stopWhen?.()) {
          return true;
        }
      }

      await setPressedKeys(page, pressed, pressedKeys);

      if (handbrake) {
        await page.keyboard.down("Space");
        await waitInBrowser(page, HANDBRAKE_PULSE_MS);
        await page.keyboard.up("Space");
      }

      previousAt = at + (handbrake ? HANDBRAKE_PULSE_MS : 0);
    }
  } finally {
    await setPressedKeys(page, pressed, []);
  }

  await waitInBrowser(page, 250);
  return (await stopWhen?.()) ?? false;
}

async function readNavigationGuide(
  guide: ReturnType<Page["getByTestId"]>,
): Promise<NavigationReading> {
  const text = (await guide.textContent())?.trim() ?? "";
  const match =
    /^(Showroom|Dyno Lab) · (\d+) m · (straight ahead|steer left|steer right)$/.exec(
      text,
    );

  if (!match) {
    throw new Error(`Unexpected visible navigation guidance: "${text}"`);
  }

  return {
    direction:
      match[3] === "straight ahead"
        ? "ahead"
        : match[3] === "steer left"
          ? "left"
          : "right",
    distanceMeters: Number(match[2]),
    target: match[1] as NavigationTarget,
  };
}

async function driveByVisibleNavigation(
  page: Page,
  guide: ReturnType<Page["getByTestId"]>,
  expectedTarget: NavigationTarget,
  stopWhen: () => Promise<boolean>,
) {
  let bestDistance = Number.POSITIVE_INFINITY;
  let stalledPulses = 0;

  for (let pulse = 0; pulse < 90; pulse += 1) {
    if (await stopWhen()) {
      return;
    }

    await expect(guide).toBeVisible({ timeout: 8_000 });
    const reading = await readNavigationGuide(guide);

    if (reading.target !== expectedTarget && (await stopWhen())) {
      return;
    }

    expect(reading.target).toBe(expectedTarget);

    if (
      reading.distanceMeters <= 1 &&
      (expectedTarget === "Showroom" || reading.direction === "ahead")
    ) {
      if (await replayInputTrace(page, [{ atMilliseconds: 1_100 }], stopWhen)) {
        return;
      }
    }

    const beganNextNavigationLeg =
      bestDistance <= 2 && reading.distanceMeters >= bestDistance + 2;

    if (reading.distanceMeters < bestDistance || beganNextNavigationLeg) {
      bestDistance = reading.distanceMeters;
      stalledPulses = 0;
    } else if (expectedTarget === "Showroom" || reading.direction === "ahead") {
      stalledPulses += 1;
    } else {
      stalledPulses = 0;
    }

    if (
      stalledPulses >= 6 &&
      (expectedTarget === "Showroom" || reading.distanceMeters > 6)
    ) {
      const reverseSteer: readonly DrivingKey[] =
        reading.direction === "right" ? ["a", "s"] : ["d", "s"];
      const recovery: readonly InputEvent[] = [
        { atMilliseconds: 100, pressedKeys: reverseSteer },
        { atMilliseconds: 500 },
        { atMilliseconds: 850, handbrake: true },
        { atMilliseconds: 1_100 },
      ];
      await replayInputTrace(page, recovery, stopWhen);
      bestDistance = reading.distanceMeters;
      stalledPulses = 0;
      continue;
    }

    const pressedKeys: readonly DrivingKey[] =
      reading.direction === "ahead"
        ? ["w"]
        : reading.direction === "left"
          ? ["a", "w"]
          : ["d", "w"];
    const reverseSteer: readonly DrivingKey[] =
      reading.direction === "left" ? ["d", "s"] : ["a", "s"];
    const showroomDuration =
      reading.distanceMeters > 8
        ? reading.direction === "ahead"
          ? 600
          : 350
        : reading.distanceMeters > 3
          ? reading.direction === "ahead"
            ? 350
            : 240
          : 120;
    const movement: readonly InputEvent[] =
      expectedTarget === "Showroom"
        ? [
            { atMilliseconds: 100, pressedKeys },
            { atMilliseconds: 100 + showroomDuration },
            { atMilliseconds: 350 + showroomDuration },
          ]
        : reading.direction === "ahead" && reading.distanceMeters <= 6
          ? [
              { atMilliseconds: 100, pressedKeys },
              { atMilliseconds: 250 },
              { atMilliseconds: 350, pressedKeys: ["s"] },
              { atMilliseconds: 410 },
              { atMilliseconds: 970 },
            ]
          : reading.direction !== "ahead" && reading.distanceMeters <= 6
            ? [
                { atMilliseconds: 100, pressedKeys: reverseSteer },
                { atMilliseconds: 370 },
                { atMilliseconds: 1_200 },
              ]
            : [
                { atMilliseconds: 100, pressedKeys },
                {
                  atMilliseconds:
                    100 + (reading.direction === "ahead" ? 600 : 350),
                },
                {
                  atMilliseconds:
                    450 + (reading.direction === "ahead" ? 600 : 350),
                },
              ];

    if (await replayInputTrace(page, movement, stopWhen)) {
      return;
    }
  }

  const finalReading = await readNavigationGuide(guide);
  throw new Error(
    `Visible navigation did not reach ${expectedTarget}; last guide was ` +
      `${finalReading.distanceMeters} m, ${finalReading.direction}`,
  );
}

async function isDynoSecuring(
  dynoState: ReturnType<Page["getByTestId"]>,
): Promise<boolean> {
  if (!(await dynoState.isVisible())) {
    return false;
  }

  return /^(clamping|paused|ready)$/.test(
    (await dynoState.getAttribute("data-phase")) ?? "",
  );
}

async function inspectorControlEnded(
  drivingState: ReturnType<Page["getByTestId"]>,
) {
  return !((await drivingState.getAttribute("data-phase")) ?? "").startsWith(
    "inspector",
  );
}

test.use({ viewport: { height: 720, width: 1280 } });
test.describe.configure({ mode: "serial" });

async function completeWholeDesktopLoop(
  page: Page,
  {
    expectedEvidence,
    expectedModel,
    expectNoFixtures,
  }: {
    expectedEvidence?: string;
    expectedModel: string;
    expectNoFixtures: boolean;
  },
) {
  const runtimeErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      runtimeErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => runtimeErrors.push(error.message));

  await page.goto("/");
  await expect(loadingSurface(page)).toBeVisible({ timeout: 15_000 });
  await expect(loadingSurface(page)).toBeHidden({ timeout: 45_000 });

  if (expectNoFixtures) {
    expect(
      await page.evaluate(
        () => window.__NEW_MODEL_MOTORS_TEST_FIXTURES__ ?? null,
      ),
    ).toBeNull();
  }

  const drivingState = page.getByTestId("driving-state");
  await expect(drivingState).toContainText("Ready to inspect", {
    timeout: 20_000,
  });

  const showroom = page.getByRole("region", {
    name: "OpenAI Flagship Showroom",
  });
  const navigationGuide = page.getByTestId("navigation-guide");
  await driveByVisibleNavigation(page, navigationGuide, "Showroom", () =>
    inspectorControlEnded(drivingState),
  );
  await expect(showroom).toBeVisible();
  await expect(drivingState).toContainText("Active Flagship ·", {
    timeout: 8_000,
  });
  await expect(drivingState).toContainText("Ready for Drive-Out");
  const activeFlagshipLabel = (
    await drivingState.locator("p").first().textContent()
  )?.trim();
  const selectedModel = activeFlagshipLabel?.replace(/^Active Flagship · /, "");

  if (!selectedModel) {
    throw new Error("Visible Active Flagship identity was empty");
  }

  expect(selectedModel).toBe(expectedModel);

  await replayInputTrace(page, FLAGSHIP_DRIVE_OUT);
  await expect(drivingState).toContainText("Drive-Out complete");

  const dynoState = page.getByTestId("dyno-state");
  await driveByVisibleNavigation(page, navigationGuide, "Dyno Lab", () =>
    isDynoSecuring(dynoState),
  );
  await expect(drivingState).toContainText(`Dyno Lab · ${selectedModel}`, {
    timeout: 8_000,
  });
  await completeDynoRunToSheet(page);
  const dossier = page.getByRole("dialog");
  await openDynoSheetDossier(page);
  await expect(dossier).toContainText(selectedModel);

  if (expectedEvidence) {
    await expect(dossier).toContainText(expectedEvidence);
  }

  await dossier
    .getByRole("button", {
      name: "Close Model Dossier and return to driving",
    })
    .click();
  await expect(dossier).toBeHidden({ timeout: 3_000 });
  await expect(dynoState).toBeHidden({ timeout: 5_000 });
  await expect(drivingState).toContainText(
    `Active Flagship · ${selectedModel}`,
  );
  await expect(navigationGuide).toBeVisible({ timeout: 5_000 });
  const releasedNavigation = await readNavigationGuide(navigationGuide);
  expect(releasedNavigation.target).toBe("Dyno Lab");
  expect(releasedNavigation.distanceMeters).toBeLessThanOrEqual(2);

  const canvas = page.locator("canvas");
  const beforeResume = await canvas.screenshot();
  await page.keyboard.down("s");
  await page.waitForTimeout(650);
  await page.keyboard.up("s");
  await page.waitForTimeout(150);
  const afterResume = await canvas.screenshot();

  expect(afterResume.equals(beforeResume)).toBe(false);
  await expect(drivingState).toContainText("Drive-Out complete");
  expect(runtimeErrors).toEqual([]);
}

test("a clean first visit completes the whole desktop loop through public input", async ({
  page,
}) => {
  test.setTimeout(JOURNEY_TIMEOUT_MS);
  await completeWholeDesktopLoop(page, {
    expectedEvidence: "Artificial Analysis Intelligence Index",
    expectedModel: "GPT-5.6 Sol",
    expectNoFixtures: true,
  });
});

test("a multi-model first visit parks in a non-first bay and completes the same loop", async ({
  page,
}) => {
  test.setTimeout(JOURNEY_TIMEOUT_MS);
  await installRuntimeFixtures(page, {
    initialCartPosition: { x: -9.2, y: 0.72, z: 5.5 },
    openAiFlagshipLineup: MULTI_MODEL_FLAGSHIP_LINEUP,
  });
  await completeWholeDesktopLoop(page, {
    expectedModel: "GPT Meridian",
    expectNoFixtures: false,
  });
});

test("visible Dyno guidance ends in deliberate roller alignment", async ({
  page,
}) => {
  test.setTimeout(JOURNEY_TIMEOUT_MS);
  await installRuntimeFixtures(page, {
    initialActiveFlagshipPosition: { x: -10.85, y: 0.38, z: -0.5 },
    initialActiveFlagshipYaw: Math.PI,
    initialDriveOutFlagshipId: "gpt-5-6-sol",
  });
  await page.goto("/");
  await expect(loadingSurface(page)).toBeVisible({ timeout: 15_000 });
  await expect(loadingSurface(page)).toBeHidden({ timeout: 45_000 });

  const dynoState = page.getByTestId("dyno-state");
  await driveByVisibleNavigation(
    page,
    page.getByTestId("navigation-guide"),
    "Dyno Lab",
    () => isDynoSecuring(dynoState),
  );

  await expect(dynoState).toHaveAttribute("data-phase", /^(clamping|ready)$/);
});
