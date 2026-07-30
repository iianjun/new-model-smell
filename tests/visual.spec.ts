/// <reference lib="dom" />

import { expect, test } from "@playwright/test";
import { PerspectiveCamera, Vector3 } from "three";
import type { RuntimeVisualCameraFixture } from "../src/runtimeFixtures.js";
import { installRuntimeFixtures } from "./support/runtime.js";

test.use({ viewport: { height: 680, width: 1400 } });

const ROAD_TEST_VIEWPORT = { height: 900, width: 1440 };
const ROAD_INTERSECTION_CAMERA: RuntimeVisualCameraFixture = {
  position: { x: 4.2, y: 9.5, z: 14 },
  target: { x: 0, y: 0.05, z: -3.5 },
};
const ROAD_INTERSECTION_PROBES = [
  [-1.3, 0.056, -3.5],
  [-1.15, 0.056, -3.5],
  [1.15, 0.056, -3.5],
  [1.3, 0.056, -3.5],
] as const;

function projectWorldPoint(
  point: (typeof ROAD_INTERSECTION_PROBES)[number],
  fixture: RuntimeVisualCameraFixture,
) {
  const camera = new PerspectiveCamera(
    46,
    ROAD_TEST_VIEWPORT.width / ROAD_TEST_VIEWPORT.height,
    0.1,
    70,
  );
  camera.position.set(
    fixture.position.x,
    fixture.position.y,
    fixture.position.z,
  );
  camera.lookAt(fixture.target.x, fixture.target.y, fixture.target.z);
  camera.updateMatrixWorld();
  camera.updateProjectionMatrix();
  const projected = new Vector3(...point).project(camera);

  return {
    x: ((projected.x + 1) / 2) * ROAD_TEST_VIEWPORT.width,
    y: ((1 - projected.y) / 2) * ROAD_TEST_VIEWPORT.height,
  };
}

test.describe("road intersection stability", () => {
  test.use({ viewport: ROAD_TEST_VIEWPORT });

  test("keeps each world surface the same color while the camera moves", async ({
    page,
  }) => {
    await installRuntimeFixtures(page, {
      openingElapsedSeconds: 30,
      visualCamera: ROAD_INTERSECTION_CAMERA,
    });
    await page.goto("/");
    await expect(
      page.getByRole("status", { name: "Loading New Model Motors" }),
    ).toBeHidden();
    await page.waitForTimeout(300);

    const luminanceByProbe = ROAD_INTERSECTION_PROBES.map(() => [] as number[]);

    for (const offset of [-0.04, -0.02, 0, 0.02, 0.04]) {
      const visualCamera = {
        ...ROAD_INTERSECTION_CAMERA,
        position: {
          ...ROAD_INTERSECTION_CAMERA.position,
          x: ROAD_INTERSECTION_CAMERA.position.x + offset,
        },
      };
      await page.evaluate((fixture) => {
        window.__NEW_MODEL_MOTORS_TEST_FIXTURES__ = {
          ...window.__NEW_MODEL_MOTORS_TEST_FIXTURES__,
          visualCamera: fixture,
        };
      }, visualCamera);
      await page.waitForTimeout(80);

      const screenshot = await page.screenshot();
      const samples = await page.evaluate(
        async ({ points, screenshotData }) => {
          const image = new Image();
          image.src = `data:image/png;base64,${screenshotData}`;
          await image.decode();
          const canvas = document.createElement("canvas");
          canvas.width = image.width;
          canvas.height = image.height;
          const context = canvas.getContext("2d");

          if (!context) {
            throw new Error("Unable to inspect the Motor Town screenshot");
          }

          context.drawImage(image, 0, 0);

          return points.map(({ x, y }) => {
            const [red, green, blue] = context.getImageData(
              Math.round(x),
              Math.round(y),
              1,
              1,
            ).data;

            return red * 0.2126 + green * 0.7152 + blue * 0.0722;
          });
        },
        {
          points: ROAD_INTERSECTION_PROBES.map((point) =>
            projectWorldPoint(point, visualCamera),
          ),
          screenshotData: screenshot.toString("base64"),
        },
      );

      samples.forEach((luminance, probeIndex) => {
        luminanceByProbe[probeIndex]?.push(luminance);
      });
    }

    for (const [probeIndex, readings] of luminanceByProbe.entries()) {
      const spread = Math.max(...readings) - Math.min(...readings);

      expect(
        spread,
        `road probe ${probeIndex} changed luminance across camera positions: ${readings.join(", ")}`,
      ).toBeLessThanOrEqual(12);
    }
  });
});

test.describe("road surface ends", () => {
  test.use({ viewport: { height: 720, width: 1280 } });

  test("do not expose a dark side above the grass", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("status", { name: "Loading New Model Motors" }),
    ).toBeHidden();
    await page.keyboard.press("x");
    await expect(page.getByTestId("driving-state")).toContainText(
      "Ready to inspect",
      { timeout: 1_500 },
    );
    await page.waitForTimeout(250);

    const screenshot = await page.screenshot();
    const hasDarkRoadSidePixel = await page.evaluate(async (screenshotData) => {
      const image = new Image();
      image.src = `data:image/png;base64,${screenshotData}`;
      await image.decode();

      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Unable to inspect the Motor Town screenshot");
      }

      context.drawImage(image, 0, 0);
      const [red, green, blue] = context.getImageData(460, 566, 1, 1).data;

      return red < 64 && green < 64 && blue < 64;
    }, screenshot.toString("base64"));

    expect(
      hasDarkRoadSidePixel,
      "dark road side pixel exposed above the grass",
    ).toBe(false);
  });
});
