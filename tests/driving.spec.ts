import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { FLAGSHIP_TUNING, INSPECTOR_CART_TUNING } from "../src/driving.js";

test("both vehicles reverse at the same top speed as they drive forward", () => {
  expect(INSPECTOR_CART_TUNING.reverseSpeed).toBe(
    INSPECTOR_CART_TUNING.forwardSpeed,
  );
  expect(FLAGSHIP_TUNING.reverseSpeed).toBe(FLAGSHIP_TUNING.forwardSpeed);
});

test("driving input contains no reverse-alarm audio path", async () => {
  const drivingInputSource = await readFile(
    new URL("../src/useDrivingInput.ts", import.meta.url),
    "utf8",
  );

  expect(drivingInputSource).not.toContain("reverseAlarm");
  expect(drivingInputSource).not.toContain("soundReverseAlarm");
});
