import { expect, test } from "@playwright/test";
import {
  createTownRoadNetworkLayout,
  MOTOR_TOWN_ROADS,
} from "../src/townRoadNetwork.js";

test("the Motor Town road graph owns intersections instead of overlapping modules", () => {
  const layout = createTownRoadNetworkLayout(MOTOR_TOWN_ROADS);

  expect(layout.segments).toHaveLength(7);
  expect(layout.junctions).toHaveLength(4);
  expect(
    layout.junctions.map(({ position }) => [position[0], position[2]]).sort(),
  ).toEqual(
    [
      [-8.4, -3.5],
      [0, -3.5],
      [0, 8.5],
      [8.4, -3.5],
    ].sort(),
  );

  for (const segment of layout.segments) {
    const deltaX = segment.end[0] - segment.start[0];
    const deltaZ = segment.end[1] - segment.start[1];
    const length = Math.hypot(deltaX, deltaZ);

    expect(segment.scale[0]).toBeCloseTo(length, 6);
    expect(Math.cos(segment.rotation)).toBeCloseTo(deltaX / length, 6);
    expect(-Math.sin(segment.rotation)).toBeCloseTo(deltaZ / length, 6);
  }

  for (const junction of layout.junctions) {
    expect(junction.curbVertices.length).toBeGreaterThanOrEqual(3);
    expect(junction.edgeVertices.length).toBeGreaterThanOrEqual(3);
    expect(junction.surfaceVertices.length).toBeGreaterThanOrEqual(3);
    expect(junction.position[1]).toBeGreaterThan(
      layout.segments[0]?.position[1] ?? 0,
    );
  }
});

test("overlapping collinear centerlines fail before they can reach WebGL", () => {
  expect(() =>
    createTownRoadNetworkLayout([
      { start: [0, 0], end: [5, 0] },
      { start: [2, 0], end: [7, 0] },
    ]),
  ).toThrow(/centerlines overlap/);
});
