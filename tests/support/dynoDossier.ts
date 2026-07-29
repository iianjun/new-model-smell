import { expect, type Page } from "@playwright/test";
import { findVisibleDynoSheetHandles } from "./visibleDynoSheet.js";

const COMPLETED_PULL_DISTANCE_PX = 180;
const PARTIAL_PULL_DISTANCE_PX = 82;

export async function completeDynoRunToSheet(page: Page) {
  const dynoState = page.getByTestId("dyno-state");
  await expect(dynoState).toHaveAttribute("data-phase", /^(paused|ready)$/, {
    timeout: 8_000,
  });

  await page.keyboard.down("w");
  try {
    await expect(dynoState).toHaveAttribute("data-phase", "sheet-ready", {
      timeout: 8_000,
    });
  } finally {
    await page.keyboard.up("w");
  }

  await expect(dynoState).toContainText("100%");
  await expect(dynoState).toContainText("Physical Dyno Sheet printed");
}

export type DynoSheetPullDriver = {
  complete: () => Promise<void>;
  moveToPartial: () => Promise<void>;
  release: () => Promise<void>;
};

function getPullDirection(page: Page, handle: { x: number; y: number }) {
  const viewport = page.viewportSize();

  return !viewport ||
    handle.x + COMPLETED_PULL_DISTANCE_PX < viewport.width - 16
    ? 1
    : -1;
}

async function beginPullAt(
  page: Page,
  handle: { x: number; y: number },
): Promise<DynoSheetPullDriver> {
  const direction = getPullDirection(page, handle);
  let released = false;

  await page.mouse.move(handle.x, handle.y);
  await page.mouse.down();

  const release = async () => {
    if (!released) {
      released = true;
      await page.mouse.up();
    }
  };

  return {
    complete: async () => {
      await page.mouse.move(
        handle.x + direction * COMPLETED_PULL_DISTANCE_PX,
        handle.y,
        { steps: 8 },
      );
      await release();
    },
    moveToPartial: async () => {
      await page.mouse.move(
        handle.x + direction * PARTIAL_PULL_DISTANCE_PX,
        handle.y,
        { steps: 6 },
      );
      await page.waitForTimeout(150);
    },
    release,
  };
}

export async function beginDynoSheetPull(
  page: Page,
): Promise<DynoSheetPullDriver> {
  const handles = await findVisibleDynoSheetHandles(page);
  const handle = handles[0];

  if (!handle) {
    throw new Error("Rendered Dyno Sheet handle is unavailable");
  }

  return beginPullAt(page, handle);
}

export async function openDynoSheetDossier(page: Page) {
  const dossier = page.getByRole("dialog");
  const handles = await findVisibleDynoSheetHandles(page);

  expect(handles.length).toBeGreaterThan(0);

  for (const handle of handles) {
    const pull = await beginPullAt(page, handle);
    await pull.complete();

    if (await dossier.isVisible()) {
      break;
    }
  }

  await expect(dossier).toBeVisible();
  await expect(dossier).toHaveAttribute("data-phase", "open");
}
