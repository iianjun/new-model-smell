import { expect, test } from "@playwright/test";
import { getInspectorCartWheelGroundClearance } from "../src/inspectorCartGeometry.js";

test("Inspector Cart wheels rest on top of the physical ground", () => {
  expect(getInspectorCartWheelGroundClearance()).toBeCloseTo(0);
});
