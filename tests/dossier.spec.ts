import { expect, type Locator, type Page, test } from "@playwright/test";
import { DYNO_ALIGNMENT_POSITION, DYNO_ALIGNMENT_YAW } from "../src/dyno.js";
import {
  completeDynoRunToSheet,
  openDynoSheetDossier,
} from "./support/dynoDossier.js";
import { installRuntimeFixtures, loadingSurface } from "./support/runtime.js";

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
  await installRuntimeFixtures(page, {
    initialActiveFlagshipPosition: DYNO_ALIGNMENT_POSITION,
    initialActiveFlagshipYaw: DYNO_ALIGNMENT_YAW,
    initialDriveOutFlagshipId: activeFlagshipId,
    openAiFlagshipLineup: lineup,
  });
}

async function runDyno(page: Page) {
  await page.goto("/");
  await expect(loadingSurface(page)).toBeHidden();
  await completeDynoRunToSheet(page);
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

async function closeAndExpectDrivingAtDyno(
  page: Page,
  dossier: Locator,
  modelName: string,
) {
  await dossier
    .getByRole("button", {
      name: "Close Model Dossier and return to driving",
    })
    .click();
  await expect(dossier).toHaveAttribute("data-phase", "closing");

  const drivingState = page.getByTestId("driving-state");
  await expect(drivingState).toContainText("Dyno Sheet retracting");
  await expect(dossier).toBeHidden({ timeout: 3_000 });
  await expect(page.getByTestId("dyno-state")).toBeHidden({ timeout: 5_000 });
  await expect(drivingState).toContainText(`Active Flagship · ${modelName}`);
  await expect(drivingState).not.toContainText("Valet Transfer");

  const navigationGuide = page.getByTestId("navigation-guide");
  await expect(navigationGuide).toBeVisible();
  const navigationText = (await navigationGuide.textContent())?.trim() ?? "";
  const match = /^Dyno Lab · (\d+) m ·/.exec(navigationText);

  expect(
    match,
    `Unexpected Dyno navigation: "${navigationText}"`,
  ).not.toBeNull();
  expect(Number(match?.[1])).toBeLessThanOrEqual(2);

  const canvas = page.locator("canvas");
  const beforeDriving = await canvas.screenshot();
  await page.keyboard.down("s");
  await page.waitForTimeout(650);
  await page.keyboard.up("s");
  await page.waitForTimeout(150);
  const afterDriving = await canvas.screenshot();

  expect(afterDriving.equals(beforeDriving)).toBe(false);
  await expect(drivingState).toContainText(`Active Flagship · ${modelName}`);
}

test("a pulled Dyno Sheet opens comparable evidence for a non-first Active Flagship and returns to driving", async ({
  page,
}) => {
  await installDossierFixture(page, COMPARABLE_LINEUP, "gpt-meridian");
  await runDyno(page);
  await openDynoSheetDossier(page);

  const dossier = page.getByRole("dialog", {
    name: "GPT Meridian",
  });
  await expectComparableEvidence(dossier);

  await page.keyboard.down("s");
  await page.waitForTimeout(500);
  await page.keyboard.up("s");
  await expect(dossier).toContainText("GPT Meridian");

  await expectSourceLinkPreservesDossier(page, dossier);
  await closeAndExpectDrivingAtDyno(page, dossier, "GPT Meridian");
});

test("non-comparable rival evidence stays out of the Active Flagship dossier", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await installDossierFixture(page, SOLO_LINEUP, "gpt-solo");
  await runDyno(page);
  await openDynoSheetDossier(page);

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
