import { expect, type Page, test } from "@playwright/test";
import { loadingSurface } from "./support/runtime.js";

const GRAPHICS_QUALITY_STORAGE_KEY = "new-model-motors.graphics-quality";

async function enterDriving(page: Page) {
  await page.goto("/");
  await expect(loadingSurface(page)).toBeHidden();
  await page.keyboard.press("x");
  await expect(page.getByTestId("driving-state")).toContainText(
    "Ready to inspect",
    { timeout: 1_500 },
  );
}

async function readCanvasDensity(page: Page) {
  return page.locator(".world-canvas canvas").evaluate((canvas) => {
    const renderCanvas = canvas as HTMLCanvasElement;
    const bounds = renderCanvas.getBoundingClientRect();

    return renderCanvas.width / bounds.width;
  });
}

test("graphics settings open from the keyboard without interrupting driving", async ({
  browser,
}) => {
  const context = await browser.newContext({
    deviceScaleFactor: 2,
    viewport: { height: 720, width: 1280 },
  });
  const page = await context.newPage();

  try {
    await enterDriving(page);

    await expect.poll(() => readCanvasDensity(page)).toBeCloseTo(2, 1);
    expect(
      await page.locator(".world-canvas canvas").evaluate((canvas) => {
        const renderCanvas = canvas as HTMLCanvasElement;
        const context =
          renderCanvas.getContext("webgl2") ?? renderCanvas.getContext("webgl");

        return context?.getContextAttributes()?.antialias;
      }),
    ).toBe(true);

    const settingsButton = page.getByRole("button", {
      name: "Open graphics settings",
    });
    await settingsButton.focus();
    await page.keyboard.press("Enter");

    const settings = page.getByRole("dialog", {
      name: "Graphics settings",
    });
    await expect(settings).toBeVisible();
    await expect(settings).toContainText("GPU rendering work");
    await expect(settings).toContainText(
      "forms, palette, and materials stay unchanged",
    );
    await expect(page).toHaveScreenshot("graphics-settings.png", {
      animations: "disabled",
      maxDiffPixelRatio: 0.015,
      threshold: 0.2,
    });
    const highQuality = settings.getByRole("radio", {
      name: /High fidelity/,
    });
    const performanceQuality = settings.getByRole("radio", {
      name: /Performance/,
    });
    await expect(highQuality).toBeChecked();
    await expect(page.getByTestId("driving-state")).toContainText(
      "Ready to inspect",
    );

    await highQuality.focus();
    await page.keyboard.press("ArrowDown");
    await expect(performanceQuality).toBeChecked();
    await page.keyboard.press("ArrowUp");
    await expect(highQuality).toBeChecked();

    await page.locator(".settings-control").click();
    await expect(settings).toBeHidden();
    await expect(page.getByTestId("driving-state")).toContainText(
      "Ready to inspect",
    );

    await settingsButton.focus();
    await page.keyboard.press("Enter");
    await expect(settings).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(settings).toBeHidden();
    await expect(settingsButton).not.toBeFocused();

    await page.keyboard.down("w");
    await expect(page.getByTestId("driving-state")).toContainText(
      "Cart in motion",
    );
    await page.keyboard.up("w");
  } finally {
    await context.close();
  }
});

test("performance quality lowers live render density and persists", async ({
  browser,
}) => {
  const context = await browser.newContext({
    deviceScaleFactor: 2,
    viewport: { height: 720, width: 1280 },
  });
  const page = await context.newPage();

  try {
    await enterDriving(page);
    await page.evaluate(() => {
      (
        window as Window & {
          __graphicsQualityCanvas?: HTMLCanvasElement | null;
        }
      ).__graphicsQualityCanvas = document.querySelector(
        ".world-canvas canvas",
      );
    });

    await page.getByRole("button", { name: "Open graphics settings" }).click();
    await page.getByRole("radio", { name: /Performance/ }).check();

    await expect(page.locator(".world-canvas")).toHaveAttribute(
      "data-graphics-quality",
      "performance",
    );
    await expect.poll(() => readCanvasDensity(page)).toBeCloseTo(1, 1);
    await expect(page.getByTestId("driving-state")).toContainText(
      "Ready to inspect",
    );
    expect(
      await page.evaluate(
        () =>
          (
            window as Window & {
              __graphicsQualityCanvas?: HTMLCanvasElement | null;
            }
          ).__graphicsQualityCanvas ===
          document.querySelector(".world-canvas canvas"),
      ),
    ).toBe(true);
    expect(
      await page.evaluate(
        (storageKey) => localStorage.getItem(storageKey),
        GRAPHICS_QUALITY_STORAGE_KEY,
      ),
    ).toBe("performance");

    await page.reload();
    await expect(loadingSurface(page)).toBeHidden();
    await expect(page.locator(".world-canvas")).toHaveAttribute(
      "data-graphics-quality",
      "performance",
    );
    await expect.poll(() => readCanvasDensity(page)).toBeCloseTo(1, 1);
    await page.getByRole("button", { name: "Open graphics settings" }).click();
    await expect(
      page.getByRole("radio", { name: /Performance/ }),
    ).toBeChecked();
  } finally {
    await context.close();
  }
});
