import { expect, type Locator, type Page, test } from "@playwright/test";
import {
  DYNO_SHEET_DRAG_TOLERANCE_PX,
  DYNO_SHEET_OPEN_THRESHOLD,
  DYNO_SHEET_PULL_DISTANCE_PX,
} from "../src/dossier.js";
import {
  DYNO_ALIGNMENT_POSITION,
  DYNO_ALIGNMENT_YAW,
  DYNO_SHEET_LENGTH,
  DYNO_SHEET_RETRACTED_LENGTH,
  type DynoRuntimeState,
} from "../src/dyno.js";
import type { DossierRuntimeTestState } from "../src/runtimeTestState.js";

const SHARED_SOURCE = {
  label: "Independent Eval Lab · Agent Bench v2 results",
  url: "https://example.com/evals/agent-bench-v2",
} as const;
const SHARED_BENCHMARK = {
  name: "Agent Bench",
  version: "v2.0",
} as const;
const SHARED_CONDITIONS =
  "Four-worker desktop harness · max reasoning · identical task set";

const COMPARABLE_LINEUP = [
  {
    id: "gpt-atlas",
    name: "GPT Atlas",
    publicAvailabilityDate: "2026-07-22",
    provenance: {
      label: "OpenAI Atlas launch post",
      url: "https://example.com/models/atlas",
    },
  },
  {
    benchmarkRecords: [
      {
        benchmark: SHARED_BENCHMARK,
        caveats: [
          "Success rate only; latency and cost are reported separately",
        ],
        conditions: SHARED_CONDITIONS,
        evaluationDate: "2026-07-24",
        evaluator: "Independent Eval Lab",
        provenance:
          "Evaluator-published run log linked from the Agent Bench v2 results",
        score: 91.4,
        source: SHARED_SOURCE,
        subject: {
          id: "gpt-meridian",
          name: "GPT Meridian",
        },
        unit: "% success",
      },
      {
        benchmark: SHARED_BENCHMARK,
        caveats: [
          "Success rate only; latency and cost are reported separately",
        ],
        conditions: SHARED_CONDITIONS,
        evaluationDate: "2026-07-24",
        evaluator: "Independent Eval Lab",
        provenance:
          "Evaluator-published run log linked from the Agent Bench v2 results",
        score: 87.2,
        source: SHARED_SOURCE,
        subject: {
          id: "rival-orbit",
          name: "Rival Orbit",
        },
        unit: "% success",
      },
      {
        benchmark: SHARED_BENCHMARK,
        caveats: ["Eight-shot run cannot be compared with the four-worker run"],
        conditions: "Eight-shot hosted harness · max reasoning",
        evaluationDate: "2026-07-24",
        evaluator: "Independent Eval Lab",
        provenance: "Separate evaluator appendix using different conditions",
        score: 94.8,
        source: SHARED_SOURCE,
        subject: {
          id: "rival-mirage",
          name: "Rival Mirage",
        },
        unit: "% success",
      },
    ],
    id: "gpt-meridian",
    name: "GPT Meridian",
    publicAvailabilityDate: "2026-07-18",
    provenance: {
      label: "OpenAI Meridian launch post",
      url: "https://example.com/models/meridian",
    },
  },
] as const;

const SOLO_LINEUP = [
  {
    benchmarkRecords: [
      {
        benchmark: SHARED_BENCHMARK,
        caveats: ["Single-provider result; no matched rival run was published"],
        conditions: SHARED_CONDITIONS,
        evaluationDate: "2026-07-24",
        evaluator: "Independent Eval Lab",
        provenance: "Evaluator-published active-model run log",
        score: 83.6,
        source: SHARED_SOURCE,
        subject: {
          id: "gpt-solo",
          name: "GPT Solo",
        },
        unit: "% success",
      },
      {
        benchmark: SHARED_BENCHMARK,
        caveats: ["Different task set; direct comparison is invalid"],
        conditions: "Mobile harness · reduced task set",
        evaluationDate: "2026-07-24",
        evaluator: "Independent Eval Lab",
        provenance: "Separate mobile evaluation appendix",
        score: 96.1,
        source: SHARED_SOURCE,
        subject: {
          id: "rival-unmatched",
          name: "Rival Unmatched",
        },
        unit: "% success",
      },
    ],
    id: "gpt-solo",
    name: "GPT Solo",
    publicAvailabilityDate: "2026-07-20",
    provenance: {
      label: "OpenAI Solo launch post",
      url: "https://example.com/models/solo",
    },
  },
] as const;

async function installDossierFixture(
  page: Page,
  lineup: typeof COMPARABLE_LINEUP | typeof SOLO_LINEUP,
  activeFlagshipId: string,
) {
  await page.clock.setFixedTime(new Date("2026-07-28T12:00:00.000Z"));
  await page.addInitScript(
    ({ activeId, alignmentPosition, alignmentYaw, models }) => {
      window.__NEW_MODEL_MOTORS_TEST_FIXTURES__ = {
        initialActiveFlagshipPosition: alignmentPosition,
        initialActiveFlagshipYaw: alignmentYaw,
        initialDriveOutFlagshipId: activeId,
        openAiFlagshipLineup: models,
      };
    },
    {
      activeId: activeFlagshipId,
      alignmentPosition: DYNO_ALIGNMENT_POSITION,
      alignmentYaw: DYNO_ALIGNMENT_YAW,
      models: lineup,
    },
  );
}

async function readDynoState(page: Page) {
  return page.evaluate(
    () =>
      (window.__NEW_MODEL_MOTORS_TEST_STATE__?.dyno ??
        null) satisfies DynoRuntimeState | null,
  );
}

async function readDossierState(page: Page) {
  return page.evaluate(
    () =>
      (window.__NEW_MODEL_MOTORS_TEST_STATE__?.dossier ??
        null) satisfies DossierRuntimeTestState | null,
  );
}

async function runDyno(page: Page) {
  await page.goto("/");
  await expect(
    page.getByRole("status", { name: "Loading New Model Motors" }),
  ).toBeHidden();

  await expect
    .poll(async () => (await readDynoState(page))?.phase, {
      timeout: 8_000,
    })
    .toBe("ready");

  await page.keyboard.down("w");
  await expect
    .poll(async () => (await readDynoState(page))?.phase, {
      timeout: 8_000,
    })
    .toBe("sheet-ready");
  await page.keyboard.up("w");
  await expect
    .poll(async () => (await readDossierState(page))?.sheetHandle)
    .not.toBeUndefined();
}

async function pullDynoSheet(page: Page) {
  const handle = await readDossierState(page).then(
    (state) => state?.sheetHandle,
  );

  if (!handle) {
    throw new Error("Projected Dyno Sheet handle is unavailable");
  }

  const thresholdDistance =
    DYNO_SHEET_DRAG_TOLERANCE_PX +
    DYNO_SHEET_OPEN_THRESHOLD * DYNO_SHEET_PULL_DISTANCE_PX;
  const firstPullDistance = thresholdDistance * 0.55;
  const completedPullDistance = thresholdDistance + 32;
  const viewport = page.viewportSize();
  const direction =
    !viewport || handle.x + completedPullDistance < viewport.width - 16
      ? 1
      : -1;

  await page.mouse.move(handle.x, handle.y);
  await page.mouse.down();
  await page.mouse.move(handle.x + direction * firstPullDistance, handle.y, {
    steps: 5,
  });
  await expect
    .poll(async () => (await readDossierState(page))?.pullProgress ?? 0)
    .toBeGreaterThan(0.2);
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await page.mouse.move(
    handle.x + direction * completedPullDistance,
    handle.y,
    { steps: 7 },
  );
  await page.mouse.up();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveAttribute("data-phase", "open");
}

function distance(
  left: { x: number; y: number; z: number },
  right: { x: number; y: number; z: number },
) {
  return Math.hypot(left.x - right.x, left.y - right.y, left.z - right.z);
}

function planarDistance(
  left: { x: number; z: number },
  right: { x: number; z: number },
) {
  return Math.hypot(left.x - right.x, left.z - right.z);
}

type WorldSnapshot = {
  activeFlagshipPosition: { x: number; y: number; z: number };
  cameraPosition: { x: number; y: number; z: number };
};

async function readWorldSnapshot(page: Page, context: string) {
  const state = await readDossierState(page);

  if (!state?.activeFlagshipPosition || !state.cameraPosition) {
    throw new Error(`${context} world state is unavailable`);
  }

  return {
    activeFlagshipPosition: state.activeFlagshipPosition,
    cameraPosition: state.cameraPosition,
  } satisfies WorldSnapshot;
}

async function readRequiredDynoState(page: Page, context: string) {
  const state = await readDynoState(page);

  if (!state) {
    throw new Error(`${context} Dyno state is unavailable`);
  }

  return state;
}

async function expectComparableEvidence(dossier: Locator) {
  await expect(dossier).toBeVisible();
  await expect(dossier).toContainText("Active Flagship");
  await expect(dossier).toContainText("Public Availability Date");
  await expect(dossier).toContainText("Jul 18, 2026");
  await expect(dossier).toContainText("Current Release Age");
  await expect(dossier).toContainText("10 days");
  await expect(dossier).toContainText("Agent Bench");
  await expect(dossier).toContainText("v2.0");
  await expect(dossier).toContainText("91.4");
  await expect(dossier).toContainText("% success");
  await expect(dossier).toContainText("Independent Eval Lab");
  await expect(dossier).toContainText("Jul 24, 2026");
  await expect(dossier).toContainText("Evaluator-published run log");
  await expect(dossier).toContainText(
    "Success rate only; latency and cost are reported separately",
  );
  await expect(dossier).toContainText("Rival Orbit");
  await expect(dossier).toContainText("87.2");
  await expect(dossier).not.toContainText("Rival Mirage");
  await expect(dossier).not.toContainText(/overall score/i);
}

async function expectWorldSuspended(
  page: Page,
  beforeOpen: WorldSnapshot,
  beforeOpenDynoState: DynoRuntimeState,
) {
  const openState = await readWorldSnapshot(page, "Open-dossier");
  const openDynoState = await readRequiredDynoState(page, "Open-dossier");

  expect(
    planarDistance(
      beforeOpen.activeFlagshipPosition,
      openState.activeFlagshipPosition,
    ),
  ).toBeLessThan(0.02);
  expect(
    Math.abs(
      beforeOpen.activeFlagshipPosition.y - openState.activeFlagshipPosition.y,
    ),
  ).toBeLessThan(0.08);
  expect(
    distance(beforeOpen.cameraPosition, openState.cameraPosition),
  ).toBeLessThan(0.08);
  expect(openDynoState).toMatchObject({
    phase: "sheet-ready",
    progress: 1,
    sheetLength: DYNO_SHEET_LENGTH,
    vehicleSecured: true,
  });
  expect(openDynoState).toEqual(beforeOpenDynoState);

  await page.keyboard.down("s");
  await page.waitForTimeout(500);
  await page.keyboard.up("s");

  const afterBlockedInput = await readWorldSnapshot(page, "Blocked-input");
  const afterBlockedDynoState = await readRequiredDynoState(
    page,
    "Blocked-input",
  );

  expect(
    planarDistance(
      openState.activeFlagshipPosition,
      afterBlockedInput.activeFlagshipPosition,
    ),
  ).toBeLessThan(0.02);
  expect(afterBlockedDynoState).toEqual(openDynoState);

  return openState;
}

async function expectSourceLinkPreservesDossier(page: Page, dossier: Locator) {
  const sourceLink = dossier
    .getByRole("link", {
      name: /Independent Eval Lab · Agent Bench v2 results/,
    })
    .first();
  const popupPromise = page.waitForEvent("popup");
  await sourceLink.click();
  const popup = await popupPromise;
  await expect.poll(() => popup.url()).toBe(SHARED_SOURCE.url);
  await popup.close();
  await expect(dossier).toBeVisible();
  await expect(dossier).toContainText("91.4");
}

async function closeAndExpectRetraction(
  page: Page,
  dossier: Locator,
  openState: WorldSnapshot,
) {
  await dossier
    .getByRole("button", {
      name: "Close Model Dossier and return to driving",
    })
    .click();
  await expect(dossier).toHaveAttribute("data-phase", "closing");
  await expect
    .poll(async () => (await readDynoState(page))?.phase)
    .toBe("releasing");

  const retractingDynoState = await readRequiredDynoState(page, "Retracting");
  expect(retractingDynoState.vehicleSecured).toBe(true);
  expect(retractingDynoState.sheetLength).toBeGreaterThan(
    DYNO_SHEET_RETRACTED_LENGTH,
  );

  await page.keyboard.down("s");
  await page.waitForTimeout(180);
  await page.keyboard.up("s");
  const whileRetracting = await readWorldSnapshot(page, "Retracting-dossier");
  expect(
    planarDistance(
      openState.activeFlagshipPosition,
      whileRetracting.activeFlagshipPosition,
    ),
  ).toBeLessThan(0.02);

  await expect(dossier).toBeHidden({ timeout: 3_000 });
  await expect
    .poll(async () => (await readDynoState(page))?.phase)
    .toBe("released");
  const releasedDynoState = await readRequiredDynoState(page, "Released");
  expect(releasedDynoState.vehicleSecured).toBe(false);
  expect(releasedDynoState.sheetLength).toBeLessThanOrEqual(
    DYNO_SHEET_RETRACTED_LENGTH,
  );

  return readWorldSnapshot(page, "Post-dossier");
}

async function expectDrivingResumed(
  page: Page,
  releasedPosition: WorldSnapshot["activeFlagshipPosition"],
) {
  await page.keyboard.down("s");
  await expect
    .poll(async () => (await readDossierState(page))?.activeFlagshipPosition?.z)
    .toBeGreaterThan(releasedPosition.z + 0.35);
  await page.keyboard.up("s");
}

test("a pulled Dyno Sheet opens comparable evidence for a non-first Active Flagship and returns to driving", async ({
  page,
}) => {
  await installDossierFixture(page, COMPARABLE_LINEUP, "gpt-meridian");
  await runDyno(page);
  await page.waitForTimeout(450);

  const beforeOpen = await readWorldSnapshot(page, "Pre-dossier");
  const beforeOpenDynoState = await readRequiredDynoState(page, "Pre-dossier");
  await pullDynoSheet(page);
  const dossier = page.getByRole("dialog", {
    name: "GPT Meridian",
  });
  await expectComparableEvidence(dossier);
  const openState = await expectWorldSuspended(
    page,
    beforeOpen,
    beforeOpenDynoState,
  );
  await expectSourceLinkPreservesDossier(page, dossier);
  const afterClose = await closeAndExpectRetraction(page, dossier, openState);

  expect(
    planarDistance(
      beforeOpen.activeFlagshipPosition,
      afterClose.activeFlagshipPosition,
    ),
  ).toBeLessThan(0.03);
  expect(
    distance(beforeOpen.cameraPosition, afterClose.cameraPosition),
  ).toBeLessThan(0.2);
  await expectDrivingResumed(page, afterClose.activeFlagshipPosition);
});

test("non-comparable rival evidence stays out of the Active Flagship dossier", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await installDossierFixture(page, SOLO_LINEUP, "gpt-solo");
  await runDyno(page);
  await pullDynoSheet(page);

  const dossier = page.getByRole("dialog", { name: "GPT Solo" });
  await expect(dossier).toContainText(
    "Active Flagship only · no Comparable Benchmark evidence",
  );
  await expect(dossier).toContainText("83.6");
  await expect(dossier).not.toContainText("Rival Unmatched");
  await expect(dossier).not.toContainText("96.1");
  await expect(dossier).not.toContainText(/overall score/i);
  await expect(dossier.getByRole("article")).toHaveCount(1);
});
