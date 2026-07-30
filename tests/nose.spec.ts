import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import type {
  RuntimeTrackedCompanyFixture,
  RuntimeWorldPosition,
} from "../src/runtimeFixtures.js";

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

async function observeFreshnessDirection(
  browser: import("@playwright/test").Browser,
  companies: readonly RuntimeTrackedCompanyFixture[],
) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.clock.setFixedTime(new Date("2026-07-29T12:00:00.000Z"));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await installNoseFixture(page, companies);
  await page.goto("/");
  await expect(
    page.getByRole("status", { name: "Loading New Model Motors" }),
  ).toBeHidden();
  await expect(page.getByTestId("driving-state")).toContainText(
    "Ready to inspect",
  );
  const freshnessText = await page.getByTestId("nose-freshness").textContent();
  const canvas = await page.locator("canvas").screenshot();
  await context.close();

  return { canvas, freshnessText };
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

  expect(left.freshnessText).toContain("OpenAI");
  expect(left.freshnessText).toContain("openai-flagship");
  expect(left.freshnessText).toContain("NEW MODEL SMELL REMAINING 98%");
  expect(right.freshnessText).toContain("Right Labs");
  expect(right.freshnessText).toContain("right-labs-flagship");
  expect(right.freshnessText).toContain("NEW MODEL SMELL REMAINING 98%");
  expect(left.canvas.equals(right.canvas)).toBe(false);
});

test("The Nose has no live visitor-tracking controller after the opening", async () => {
  const openingSource = await readFile(
    new URL("../src/OpeningSequence.tsx", import.meta.url),
    "utf8",
  );

  expect(openingSource).not.toContain("LiveNoseController");
  expect(openingSource).not.toContain("trackedVehicleBody");
});
