import { expect, test } from "@playwright/test";
import {
  getNoseSneezeTransform,
  NOSE_REST_POSITION_Y,
  NOSE_SNEEZE_MOTION_SECONDS,
} from "../src/opening.js";

test.describe.configure({ mode: "serial" });

test("The Nose launches away as one rigid object", () => {
  const atRest = getNoseSneezeTransform(0);
  const airborne = getNoseSneezeTransform(0.31);
  const fartherBack = getNoseSneezeTransform(0.62);
  const finalTransform = getNoseSneezeTransform(NOSE_SNEEZE_MOTION_SECONDS);

  expect(atRest).toEqual({
    positionY: NOSE_REST_POSITION_Y,
    positionZ: 0,
    rotationX: 0,
    scale: [1, 1, 1],
  });
  expect(airborne.positionY).toBeGreaterThan(NOSE_REST_POSITION_Y);
  expect(airborne.positionZ).toBeLessThan(-1.7);
  expect(fartherBack.positionZ).toBeLessThan(airborne.positionZ);
  expect(finalTransform.positionZ).toBeLessThan(-17);
  expect(finalTransform.scale).toEqual([1, 1, 1]);
});

test("opening fades driving guidance into the live scene", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("status", { name: "Loading New Model Motors" }),
  ).toBeHidden();

  await page.evaluate(() => {
    const canvas = document.querySelector("canvas");
    const fiberResource = performance
      .getEntriesByType("resource")
      .find((entry) => entry.name.includes("@react-three_fiber.js"));

    if (!(canvas instanceof HTMLCanvasElement) || !fiberResource) {
      throw new Error("R3F runtime is unavailable");
    }

    return import(fiberResource.name).then((fiber) => {
      const root = fiber._roots.get(canvas);

      if (!root) {
        throw new Error("R3F root is unavailable");
      }

      const testWindow = window as Window & {
        guidanceSamples?: Array<{
          driving: boolean;
          roadOpacity: number;
        }>;
      };
      testWindow.guidanceSamples = [];

      const sample = () => {
        const roadGuidance = root.store
          .getState()
          .scene.getObjectByName("road-guidance");
        const roadMesh = roadGuidance?.children[0] as
          | { material?: { opacity?: number } }
          | undefined;
        const driving =
          document
            .querySelector('[data-testid="driving-state"]')
            ?.textContent?.includes("Ready to inspect") ?? false;

        testWindow.guidanceSamples?.push({
          driving,
          roadOpacity: roadMesh?.material?.opacity ?? 0,
        });
        window.requestAnimationFrame(sample);
      };
      window.requestAnimationFrame(sample);
    });
  });

  await expect(page.getByTestId("driving-state")).toContainText(
    "Ready to inspect",
    { timeout: 15_000 },
  );
  await expect(page.locator(".driving-guide")).toHaveCSS(
    "animation-name",
    "handoff-guide-in",
  );
  await expect(page.locator(".driving-guide")).toHaveCSS(
    "animation-duration",
    "0.45s",
  );
  await page.waitForTimeout(700);

  const guidance = await page.evaluate(() => {
    const samples = (
      window as Window & {
        guidanceSamples?: Array<{
          driving: boolean;
          roadOpacity: number;
        }>;
      }
    ).guidanceSamples;

    if (!samples) {
      throw new Error("Guidance samples are unavailable");
    }

    const handoffIndex = samples.findIndex(({ driving }) => driving);

    if (handoffIndex < 1) {
      throw new Error("Driving handoff was not observed");
    }

    return {
      after: samples.at(-1),
      before: samples[handoffIndex - 1],
      roadFadeStart: samples
        .slice(handoffIndex)
        .find(({ roadOpacity }) => roadOpacity > 0),
    };
  });

  expect(guidance.before?.roadOpacity).toBeCloseTo(0);
  expect(guidance.roadFadeStart?.roadOpacity).toBeLessThan(0.6);
  expect(guidance.after?.roadOpacity).toBeGreaterThan(0.9);
});
