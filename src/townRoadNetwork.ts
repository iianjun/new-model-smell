export type TownRoadPoint = readonly [x: number, z: number];

export type TownRoadSegment = {
  end: TownRoadPoint;
  start: TownRoadPoint;
  width?: number;
};

const MOTOR_TOWN_POINTS = {
  left: [-8.4, -3.5] as TownRoadPoint,
  right: [8.4, -3.5] as TownRoadPoint,
  start: [0, 8.5] as TownRoadPoint,
};

export const MOTOR_TOWN_ROADS: readonly TownRoadSegment[] = [
  { start: MOTOR_TOWN_POINTS.start, end: MOTOR_TOWN_POINTS.left },
  { start: MOTOR_TOWN_POINTS.left, end: MOTOR_TOWN_POINTS.right },
  { start: MOTOR_TOWN_POINTS.right, end: MOTOR_TOWN_POINTS.start },
  { start: [0, -3.5], end: [0, -9], width: 3.4 },
  { start: MOTOR_TOWN_POINTS.left, end: [-13, -6.6], width: 3.4 },
  { start: MOTOR_TOWN_POINTS.right, end: [13, -6.6], width: 3.4 },
];

export type TownRoadLayoutSegment = {
  end: TownRoadPoint;
  key: string;
  position: readonly [x: number, y: number, z: number];
  rotation: number;
  scale: readonly [length: number, y: number, width: number];
  start: TownRoadPoint;
  width: number;
};

export type TownRoadJunction = {
  curbVertices: readonly TownRoadPoint[];
  edgeVertices: readonly TownRoadPoint[];
  key: string;
  position: readonly [x: number, y: number, z: number];
  surfaceVertices: readonly TownRoadPoint[];
};

export type TownRoadNetworkLayout = {
  junctions: readonly TownRoadJunction[];
  segments: readonly TownRoadLayoutSegment[];
};

type NormalizedRoadSegment = {
  end: TownRoadPoint;
  index: number;
  start: TownRoadPoint;
  width: number;
};

type AtomicRoadSegment = {
  end: TownRoadPoint;
  key: string;
  start: TownRoadPoint;
  width: number;
};

type IncidentRoad = {
  direction: TownRoadPoint;
  end: TownRoadPoint;
  key: string;
  length: number;
  start: TownRoadPoint;
  width: number;
};

type RoadNode = {
  incidents: IncidentRoad[];
  point: TownRoadPoint;
};

const DEFAULT_ROAD_WIDTH = 4.1;
const GEOMETRY_EPSILON = 1e-6;
const JUNCTION_CLEARANCE = 0.08;
const ROAD_ASSET_POSITION_Y = 0.035;
const ROAD_ASSET_TOP_Y = ROAD_ASSET_POSITION_Y + 0.02;
const ROAD_JUNCTION_SURFACE_Y = ROAD_ASSET_TOP_Y + 0.004;

function subtract(left: TownRoadPoint, right: TownRoadPoint): TownRoadPoint {
  return [left[0] - right[0], left[1] - right[1]];
}

function add(left: TownRoadPoint, right: TownRoadPoint): TownRoadPoint {
  return [left[0] + right[0], left[1] + right[1]];
}

function scale(point: TownRoadPoint, scalar: number): TownRoadPoint {
  return [point[0] * scalar, point[1] * scalar];
}

function cross(left: TownRoadPoint, right: TownRoadPoint) {
  return left[0] * right[1] - left[1] * right[0];
}

function dot(left: TownRoadPoint, right: TownRoadPoint) {
  return left[0] * right[0] + left[1] * right[1];
}

function distance(left: TownRoadPoint, right: TownRoadPoint) {
  return Math.hypot(left[0] - right[0], left[1] - right[1]);
}

function normalize(vector: TownRoadPoint): TownRoadPoint {
  const length = Math.hypot(vector[0], vector[1]);

  if (length <= GEOMETRY_EPSILON) {
    throw new Error("Town road segments must have a non-zero length");
  }

  return [vector[0] / length, vector[1] / length];
}

function pointAt(
  segment: Pick<NormalizedRoadSegment, "end" | "start">,
  progress: number,
): TownRoadPoint {
  return [
    segment.start[0] + (segment.end[0] - segment.start[0]) * progress,
    segment.start[1] + (segment.end[1] - segment.start[1]) * progress,
  ];
}

function pointKey(point: TownRoadPoint) {
  return `${Math.round(point[0] * 1_000_000)}:${Math.round(point[1] * 1_000_000)}`;
}

function uniqueSorted(values: readonly number[]) {
  return [...values]
    .sort((left, right) => left - right)
    .filter(
      (value, index, sorted) =>
        index === 0 ||
        Math.abs(value - (sorted[index - 1] ?? value)) > GEOMETRY_EPSILON,
    );
}

function addSplit(splits: number[][], segmentIndex: number, progress: number) {
  splits[segmentIndex]?.push(Math.min(1, Math.max(0, progress)));
}

function findCenterlineIntersections(
  segments: readonly NormalizedRoadSegment[],
) {
  const splits = segments.map(() => [0, 1]);

  for (let leftIndex = 0; leftIndex < segments.length; leftIndex += 1) {
    const left = segments[leftIndex];

    if (!left) {
      continue;
    }

    const leftVector = subtract(left.end, left.start);

    for (
      let rightIndex = leftIndex + 1;
      rightIndex < segments.length;
      rightIndex += 1
    ) {
      const right = segments[rightIndex];

      if (!right) {
        continue;
      }

      const rightVector = subtract(right.end, right.start);
      const denominator = cross(leftVector, rightVector);
      const offset = subtract(right.start, left.start);

      if (Math.abs(denominator) <= GEOMETRY_EPSILON) {
        if (Math.abs(cross(offset, leftVector)) > GEOMETRY_EPSILON) {
          continue;
        }

        const leftLengthSquared = dot(leftVector, leftVector);
        const overlapStart = dot(offset, leftVector) / leftLengthSquared;
        const overlapEnd =
          overlapStart + dot(rightVector, leftVector) / leftLengthSquared;
        const overlapMinimum = Math.max(0, Math.min(overlapStart, overlapEnd));
        const overlapMaximum = Math.min(1, Math.max(overlapStart, overlapEnd));

        if (overlapMaximum - overlapMinimum > GEOMETRY_EPSILON) {
          throw new Error(
            `Town road centerlines overlap between segments ${left.index} and ${right.index}`,
          );
        }

        continue;
      }

      const leftProgress = cross(offset, rightVector) / denominator;
      const rightProgress = cross(offset, leftVector) / denominator;

      if (
        leftProgress >= -GEOMETRY_EPSILON &&
        leftProgress <= 1 + GEOMETRY_EPSILON &&
        rightProgress >= -GEOMETRY_EPSILON &&
        rightProgress <= 1 + GEOMETRY_EPSILON
      ) {
        addSplit(splits, leftIndex, leftProgress);
        addSplit(splits, rightIndex, rightProgress);
      }
    }
  }

  return splits.map(uniqueSorted);
}

function splitIntoAtomicSegments(
  segments: readonly NormalizedRoadSegment[],
  splits: readonly (readonly number[])[],
) {
  return segments.flatMap((segment, segmentIndex) => {
    const segmentSplits = splits[segmentIndex] ?? [0, 1];

    return segmentSplits.slice(0, -1).flatMap((startProgress, partIndex) => {
      const endProgress = segmentSplits[partIndex + 1];

      if (
        endProgress === undefined ||
        endProgress - startProgress <= GEOMETRY_EPSILON
      ) {
        return [];
      }

      return [
        {
          end: pointAt(segment, endProgress),
          key: `${segment.index}:${partIndex}`,
          start: pointAt(segment, startProgress),
          width: segment.width,
        },
      ];
    });
  });
}

function buildNodes(segments: readonly AtomicRoadSegment[]) {
  const nodes = new Map<string, RoadNode>();

  function addIncident(
    point: TownRoadPoint,
    other: TownRoadPoint,
    segment: AtomicRoadSegment,
  ) {
    const key = pointKey(point);
    const node = nodes.get(key) ?? { incidents: [], point };
    const length = distance(point, other);

    node.incidents.push({
      direction: normalize(subtract(other, point)),
      end: segment.end,
      key: segment.key,
      length,
      start: segment.start,
      width: segment.width,
    });
    nodes.set(key, node);
  }

  for (const segment of segments) {
    addIncident(segment.start, segment.end, segment);
    addIncident(segment.end, segment.start, segment);
  }

  return nodes;
}

function roadFootprint(
  start: TownRoadPoint,
  end: TownRoadPoint,
  width: number,
) {
  const direction = normalize(subtract(end, start));
  const side = scale([-direction[1], direction[0]], width / 2);

  return [
    add(start, side),
    add(end, side),
    subtract(end, side),
    subtract(start, side),
  ];
}

function isInsideClipEdge(
  point: TownRoadPoint,
  edgeStart: TownRoadPoint,
  edgeEnd: TownRoadPoint,
) {
  return (
    cross(subtract(edgeEnd, edgeStart), subtract(point, edgeStart)) <=
    GEOMETRY_EPSILON
  );
}

function lineIntersection(
  start: TownRoadPoint,
  end: TownRoadPoint,
  clipStart: TownRoadPoint,
  clipEnd: TownRoadPoint,
): TownRoadPoint {
  const segment = subtract(end, start);
  const clip = subtract(clipEnd, clipStart);
  const denominator = cross(segment, clip);

  if (Math.abs(denominator) <= GEOMETRY_EPSILON) {
    return end;
  }

  const progress = cross(subtract(clipStart, start), clip) / denominator;

  return add(start, scale(segment, progress));
}

function intersectConvexPolygons(
  subject: readonly TownRoadPoint[],
  clip: readonly TownRoadPoint[],
) {
  let output = [...subject];

  for (let clipIndex = 0; clipIndex < clip.length; clipIndex += 1) {
    const clipStart = clip[clipIndex];
    const clipEnd = clip[(clipIndex + 1) % clip.length];

    if (!clipStart || !clipEnd) {
      continue;
    }

    const input = output;
    output = [];

    for (let index = 0; index < input.length; index += 1) {
      const start = input[index];
      const end = input[(index + 1) % input.length];

      if (!start || !end) {
        continue;
      }

      const startInside = isInsideClipEdge(start, clipStart, clipEnd);
      const endInside = isInsideClipEdge(end, clipStart, clipEnd);

      if (endInside) {
        if (!startInside) {
          output.push(lineIntersection(start, end, clipStart, clipEnd));
        }
        output.push(end);
      } else if (startInside) {
        output.push(lineIntersection(start, end, clipStart, clipEnd));
      }
    }
  }

  return output;
}

function polygonArea(points: readonly TownRoadPoint[]) {
  if (points.length < 3) {
    return 0;
  }

  return Math.abs(
    points.reduce((area, point, index) => {
      const next = points[(index + 1) % points.length];

      return next ? area + point[0] * next[1] - next[0] * point[1] : area;
    }, 0) / 2,
  );
}

function isStraightContinuation(node: RoadNode) {
  if (node.incidents.length !== 2) {
    return false;
  }

  const [left, right] = node.incidents;

  return Boolean(
    left &&
      right &&
      Math.abs(cross(left.direction, right.direction)) <= GEOMETRY_EPSILON &&
      dot(left.direction, right.direction) < -1 + GEOMETRY_EPSILON &&
      Math.abs(left.width - right.width) <= GEOMETRY_EPSILON,
  );
}

function getJunctionRadius(node: RoadNode) {
  let radius = 0;

  for (let leftIndex = 0; leftIndex < node.incidents.length; leftIndex += 1) {
    const left = node.incidents[leftIndex];

    if (!left) {
      continue;
    }

    const leftFootprint = roadFootprint(
      node.point,
      add(node.point, scale(left.direction, left.length)),
      left.width,
    );

    for (
      let rightIndex = leftIndex + 1;
      rightIndex < node.incidents.length;
      rightIndex += 1
    ) {
      const right = node.incidents[rightIndex];

      if (!right) {
        continue;
      }

      const rightFootprint = roadFootprint(
        node.point,
        add(node.point, scale(right.direction, right.length)),
        right.width,
      );
      const overlap = intersectConvexPolygons(leftFootprint, rightFootprint);

      for (const point of overlap) {
        radius = Math.max(radius, distance(node.point, point));
      }
    }
  }

  return radius + JUNCTION_CLEARANCE;
}

function convexHull(points: readonly TownRoadPoint[]) {
  const sorted = [...points].sort(
    (left, right) => left[0] - right[0] || left[1] - right[1],
  );

  if (sorted.length <= 2) {
    return sorted;
  }

  const buildHalf = (input: readonly TownRoadPoint[]) => {
    const half: TownRoadPoint[] = [];

    for (const point of input) {
      while (
        half.length >= 2 &&
        cross(
          subtract(
            half[half.length - 1] ?? point,
            half[half.length - 2] ?? point,
          ),
          subtract(point, half[half.length - 1] ?? point),
        ) <= GEOMETRY_EPSILON
      ) {
        half.pop();
      }
      half.push(point);
    }

    return half;
  };
  const lower = buildHalf(sorted);
  const upper = buildHalf([...sorted].reverse());

  lower.pop();
  upper.pop();

  return [...lower, ...upper];
}

function createJunctionVertices(
  node: RoadNode,
  radius: number,
  widthScale: number,
) {
  const crossSections = node.incidents.flatMap((incident) => {
    const center = add(node.point, scale(incident.direction, radius));
    const side = scale(
      [-incident.direction[1], incident.direction[0]],
      (incident.width / 2) * widthScale,
    );

    return [add(center, side), subtract(center, side)].map(
      (point) =>
        [point[0] - node.point[0], point[1] - node.point[1]] as TownRoadPoint,
    );
  });

  return convexHull(crossSections);
}

function createJunction(node: RoadNode, radius: number): TownRoadJunction {
  return {
    curbVertices: createJunctionVertices(node, radius, 1),
    edgeVertices: createJunctionVertices(node, radius, 0.8),
    key: pointKey(node.point),
    position: [node.point[0], ROAD_JUNCTION_SURFACE_Y, node.point[1]],
    surfaceVertices: createJunctionVertices(node, radius, 0.6),
  };
}

function assertSegmentsDoNotOverlap(
  segments: readonly TownRoadLayoutSegment[],
) {
  for (let leftIndex = 0; leftIndex < segments.length; leftIndex += 1) {
    const left = segments[leftIndex];

    if (!left) {
      continue;
    }

    for (
      let rightIndex = leftIndex + 1;
      rightIndex < segments.length;
      rightIndex += 1
    ) {
      const right = segments[rightIndex];

      if (!right) {
        continue;
      }

      const overlapArea = polygonArea(
        intersectConvexPolygons(
          roadFootprint(left.start, left.end, left.width),
          roadFootprint(right.start, right.end, right.width),
        ),
      );

      if (overlapArea > GEOMETRY_EPSILON) {
        throw new Error(
          `Town road layout left ${overlapArea.toFixed(6)}m² of coplanar overlap between ${left.key} and ${right.key}`,
        );
      }
    }
  }
}

export function createTownRoadNetworkLayout(
  roads: readonly TownRoadSegment[],
): TownRoadNetworkLayout {
  const normalized = roads.map(
    ({ end, start, width = DEFAULT_ROAD_WIDTH }, index) => {
      if (width <= 0) {
        throw new Error(
          `Town road segment ${index} must have a positive width`,
        );
      }
      normalize(subtract(end, start));

      return { end, index, start, width };
    },
  );
  const atomicSegments = splitIntoAtomicSegments(
    normalized,
    findCenterlineIntersections(normalized),
  );
  const nodes = buildNodes(atomicSegments);
  const junctionRadii = new Map<string, number>();

  for (const [key, node] of nodes) {
    if (node.incidents.length > 1 && !isStraightContinuation(node)) {
      junctionRadii.set(key, getJunctionRadius(node));
    }
  }

  const segments: TownRoadLayoutSegment[] = atomicSegments.map((segment) => {
    const direction = normalize(subtract(segment.end, segment.start));
    const length = distance(segment.start, segment.end);
    const startCutback = junctionRadii.get(pointKey(segment.start)) ?? 0;
    const endCutback = junctionRadii.get(pointKey(segment.end)) ?? 0;
    const visibleLength = length - startCutback - endCutback;

    if (visibleLength <= GEOMETRY_EPSILON) {
      throw new Error(
        `Town road segment ${segment.key} is too short for its junction geometry`,
      );
    }

    const start = add(segment.start, scale(direction, startCutback));
    const end = subtract(segment.end, scale(direction, endCutback));

    return {
      end,
      key: segment.key,
      position: [
        (start[0] + end[0]) / 2,
        ROAD_ASSET_POSITION_Y,
        (start[1] + end[1]) / 2,
      ],
      rotation: Math.atan2(-(end[1] - start[1]), end[0] - start[0]),
      scale: [visibleLength, 1, segment.width],
      start,
      width: segment.width,
    };
  });
  const junctions = [...junctionRadii].map(([key, radius]) => {
    const node = nodes.get(key);

    if (!node) {
      throw new Error(`Town road junction ${key} has no matching node`);
    }

    return createJunction(node, radius);
  });

  assertSegmentsDoNotOverlap(segments);

  return { junctions, segments };
}
