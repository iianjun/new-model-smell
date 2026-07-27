/// <reference lib="dom" />

import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 1400, height: 680 } });

test("road border does not render a black z-fighting seam", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("status", { name: "Loading New Model Motors" }),
  ).toBeHidden();
  await page.waitForTimeout(3_000);

  const screenshot = await page.screenshot();
  const artifactPixels = await page.evaluate(
    async ({ screenshotData, region }) => {
      const image = new Image();
      image.src = `data:image/png;base64,${screenshotData}`;
      await image.decode();

      const canvas = document.createElement("canvas");
      canvas.width = region.width;
      canvas.height = region.height;

      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Unable to inspect the Motor Town screenshot");
      }

      context.drawImage(
        image,
        region.x,
        region.y,
        region.width,
        region.height,
        0,
        0,
        region.width,
        region.height,
      );

      const pixels = context.getImageData(
        0,
        0,
        region.width,
        region.height,
      ).data;
      let nearBlackPixels = 0;

      for (let index = 0; index < pixels.length; index += 4) {
        const red = pixels[index];
        const green = pixels[index + 1];
        const blue = pixels[index + 2];

        if (red < 64 && green < 64 && blue < 64) {
          nearBlackPixels += 1;
        }
      }

      return nearBlackPixels;
    },
    {
      region: { height: 35, width: 120, x: 1080, y: 295 },
      screenshotData: screenshot.toString("base64"),
    },
  );

  expect(
    artifactPixels,
    "near-black pixels in the pale road border",
  ).toBeLessThanOrEqual(5);
});
