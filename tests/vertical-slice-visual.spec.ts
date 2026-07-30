import { expect, type Page, test } from "@playwright/test";
import { DYNO_ALIGNMENT_POSITION, DYNO_ALIGNMENT_YAW } from "../src/dyno.js";
import {
  beginDynoSheetPull,
  completeDynoRunToSheet,
  openDynoSheetDossier,
} from "./support/dynoDossier.js";
import { installRuntimeFixtures, loadingSurface } from "./support/runtime.js";

const ACTIVE_FLAGSHIP_ID = "gpt-5-6-sol";
const SNAPSHOT_OPTIONS = {
  maxDiffPixelRatio: 0.015,
  threshold: 0.2,
} as const;

test.use({ viewport: { height: 720, width: 1280 } });
test.describe.configure({ mode: "serial" });

async function installFixedDate(page: Page) {
  await page.clock.setFixedTime(new Date("2026-07-29T12:00:00.000Z"));
}

async function installCartPosition(
  page: Page,
  initialCartPosition: { x: number; y: number; z: number },
) {
  await installRuntimeFixtures(page, {
    initialCartPosition,
    visualCamera: {
      position: { x: -5, y: 9.52, z: 7.9 },
      target: { x: -9.2, y: 1.12, z: -4.2 },
    },
  });
}

async function installValetBay(page: Page) {
  await installRuntimeFixtures(page, {
    initialCartValetBayIndex: 0,
    visualCamera: {
      position: { x: -6.65, y: 9.52, z: 6.43 },
      target: { x: -10.85, y: 1.12, z: -5.67 },
    },
  });
}

async function installDyno(page: Page) {
  await installRuntimeFixtures(page, {
    initialActiveFlagshipPosition: DYNO_ALIGNMENT_POSITION,
    initialActiveFlagshipYaw: DYNO_ALIGNMENT_YAW,
    initialDriveOutFlagshipId: ACTIVE_FLAGSHIP_ID,
    visualCamera: {
      position: { x: 13.4, y: 9, z: 6.45 },
      target: { x: 9.2, y: 0.6, z: -5.65 },
    },
  });
}

async function loadRuntime(page: Page, skipOpening = true) {
  await page.goto("/");
  await expect(loadingSurface(page)).toBeHidden();

  if (skipOpening) {
    await page.keyboard.press("x");
  }
}

async function expectCheckpoint(page: Page, name: string) {
  const screenshot = await page.screenshot({
    animations: "disabled",
    scale: "css",
  });

  expect(screenshot).toMatchSnapshot(name, SNAPSHOT_OPTIONS);
}

test("reveal checkpoint", async ({ page }) => {
  await installFixedDate(page);
  await installRuntimeFixtures(page, {
    openingElapsedSeconds: 2.83,
  });
  await loadRuntime(page, false);
  await expect(page.getByText("Sneeze reveal in progress")).toBeVisible({
    timeout: 20_000,
  });

  await expectCheckpoint(page, "reveal.png");
});

test("cutaway Showroom checkpoint", async ({ page }) => {
  await installFixedDate(page);
  await installCartPosition(page, { x: -9.2, y: 0.72, z: -1.6 });
  await loadRuntime(page);
  await expect(
    page.getByRole("region", { name: "OpenAI Flagship Showroom" }),
  ).toBeVisible();
  await page.waitForTimeout(300);

  await expectCheckpoint(page, "showroom.png");
});

test("Valet Transfer checkpoint", async ({ page }) => {
  await installFixedDate(page);
  await installValetBay(page);
  await loadRuntime(page);
  await expect(page.getByTestId("driving-state")).toContainText(
    "Valet clamps secured",
  );

  await expectCheckpoint(page, "valet-transfer.png");
});

test("Dyno escalation checkpoint", async ({ page }) => {
  await installFixedDate(page);
  await installDyno(page);
  await loadRuntime(page);
  const dynoState = page.getByTestId("dyno-state");
  await expect(dynoState).toHaveAttribute("data-phase", "ready", {
    timeout: 8_000,
  });

  await page.keyboard.down("w");
  await expect
    .poll(async () => {
      const progress = await dynoState.locator("strong").textContent();

      return Number.parseInt(progress ?? "0", 10);
    })
    .toBeGreaterThan(52);
  await page.keyboard.up("w");
  await expect(dynoState).toHaveAttribute("data-phase", "paused");

  await expectCheckpoint(page, "dyno-escalation.png");
});

test("paper-to-dossier transition checkpoint", async ({ page }) => {
  await installFixedDate(page);
  await installDyno(page);
  await loadRuntime(page);
  await completeDynoRunToSheet(page);
  const pull = await beginDynoSheetPull(page);
  await pull.moveToPartial();

  await expectCheckpoint(page, "paper-to-dossier.png");
  await pull.release();
});

test("final Model Dossier checkpoint", async ({ page }) => {
  await installFixedDate(page);
  await installDyno(page);
  await loadRuntime(page);
  await completeDynoRunToSheet(page);
  await openDynoSheetDossier(page);

  await expectCheckpoint(page, "model-dossier.png");
});
