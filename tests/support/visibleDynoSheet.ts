import type { Page } from "@playwright/test";

export async function findVisibleDynoSheetHandles(page: Page) {
  const bounds = await page.locator("canvas").boundingBox();

  if (!bounds) {
    return [];
  }

  const screenshot = await page.screenshot({ clip: bounds });

  return page.evaluate(
    async ({ bounds, imageBase64 }) => {
      const width = Math.round(bounds.width);
      const height = Math.round(bounds.height);
      const image = new Image();
      image.src = `data:image/png;base64,${imageBase64}`;
      await image.decode();
      const buffer = document.createElement("canvas");
      buffer.width = width;
      buffer.height = height;
      const context = buffer.getContext("2d", { willReadFrequently: true });

      if (!context) {
        return [];
      }

      context.drawImage(image, 0, 0, width, height);
      const pixels = context.getImageData(0, 0, width, height).data;
      const mask = new Uint8Array(width * height);
      const startY = Math.floor(height * 0.52);

      for (let y = startY; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const pixelIndex = (y * width + x) * 4;
          const red = pixels[pixelIndex];
          const green = pixels[pixelIndex + 1];
          const blue = pixels[pixelIndex + 2];

          if (
            red > 185 &&
            red > green * 1.32 &&
            green > 55 &&
            green < 195 &&
            blue < 140
          ) {
            mask[y * width + x] = 1;
          }
        }
      }

      const stack: number[] = [];
      const candidates: {
        count: number;
        maxX: number;
        maxY: number;
        minX: number;
        minY: number;
      }[] = [];

      for (let y = startY; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const origin = y * width + x;

          if (mask[origin] === 0) {
            continue;
          }

          mask[origin] = 0;
          stack.push(origin);
          let count = 0;
          let minX = x;
          let maxX = x;
          let minY = y;
          let maxY = y;

          while (stack.length > 0) {
            const current = stack.pop();

            if (current === undefined) {
              break;
            }

            const currentX = current % width;
            const currentY = Math.floor(current / width);
            count += 1;
            minX = Math.min(minX, currentX);
            maxX = Math.max(maxX, currentX);
            minY = Math.min(minY, currentY);
            maxY = Math.max(maxY, currentY);

            for (const neighbor of [
              current - 1,
              current + 1,
              current - width,
              current + width,
            ]) {
              const neighborX = neighbor % width;

              if (
                neighbor < startY * width ||
                neighbor >= width * height ||
                Math.abs(neighborX - currentX) > 1 ||
                mask[neighbor] === 0
              ) {
                continue;
              }

              mask[neighbor] = 0;
              stack.push(neighbor);
            }
          }

          const componentWidth = maxX - minX + 1;
          const componentHeight = maxY - minY + 1;
          const candidate =
            count >= 100 &&
            componentWidth >= 35 &&
            componentWidth <= 180 &&
            componentHeight >= 8 &&
            componentHeight <= 110 &&
            maxX < width - 8 &&
            maxY < height - 8;

          if (candidate) {
            candidates.push({ count, maxX, maxY, minX, minY });
          }
        }
      }

      return candidates
        .sort(
          (left, right) => right.maxY - left.maxY || right.count - left.count,
        )
        .slice(0, 10)
        .map((candidate) => ({
          x: bounds.x + (candidate.minX + candidate.maxX) / 2,
          y: bounds.y + (candidate.minY + candidate.maxY) / 2,
        }));
    },
    {
      bounds,
      imageBase64: screenshot.toString("base64"),
    },
  );
}
