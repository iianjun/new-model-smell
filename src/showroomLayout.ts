import type { WorldPosition } from "./flagshipLineup.js";

export const SHOWROOM_POSITION = [-9.2, 0, -4.25] as const;
export const MODEL_DISPLAY_LOCAL_Z = -1.05;
export const VALET_BAY_LOCAL_Z = 1.18;
const DENSE_LINEUP_SPACING = 2.35;
const VALET_NAVIGATION_WAYPOINT_RADIUS = 0.8;
const VALET_CAPTURE_TOLERANCE = {
  halfDepth: 0.64,
  halfWidth: 0.52,
  maximumSpeed: 0.7,
  maximumYawError: 0.34,
} as const;

export function getShowroomDisplayPositions(modelCount: number) {
  if (modelCount <= 1) {
    return [-1.65];
  }

  if (modelCount === 2) {
    return [-1.85, 1.85];
  }

  const lineupWidth = (modelCount - 1) * DENSE_LINEUP_SPACING;

  return Array.from(
    { length: modelCount },
    (_, index) => index * DENSE_LINEUP_SPACING - lineupWidth / 2,
  );
}

export function getShowroomHalfWidth(modelCount: number) {
  const displayPositions = getShowroomDisplayPositions(modelCount);
  const outerDisplayX = Math.max(...displayPositions.map(Math.abs));

  return Math.max(3.55, outerDisplayX + 1.45);
}

export function getValetBayWorldPosition(displayX: number): WorldPosition {
  return {
    x: SHOWROOM_POSITION[0] + displayX,
    y: 0.72,
    z: SHOWROOM_POSITION[2] + VALET_BAY_LOCAL_Z,
  };
}

function getValetNavigationRoute(displayX: number) {
  const bay = getValetBayWorldPosition(displayX);

  return [
    { x: bay.x, y: bay.y, z: 1.2 },
    { x: bay.x, y: bay.y, z: -1.15 },
    bay,
  ] as const;
}

export function getInitialValetNavigationWaypointIndex(
  position: { x: number; z: number },
  displayX: number,
) {
  const route = getValetNavigationRoute(displayX);
  const bay = route[route.length - 1];

  return Math.hypot(position.x - bay.x, position.z - bay.z) <= 1.5
    ? route.length - 1
    : 0;
}

export function getValetNavigationWaypoint(
  position: { x: number; z: number },
  displayX: number,
  currentIndex: number,
) {
  const route = getValetNavigationRoute(displayX);
  let nextIndex = Math.min(Math.max(0, currentIndex), route.length - 1);

  while (
    nextIndex < route.length - 1 &&
    Math.hypot(
      position.x - route[nextIndex].x,
      position.z - route[nextIndex].z,
    ) <= VALET_NAVIGATION_WAYPOINT_RADIUS
  ) {
    nextIndex += 1;
  }

  return {
    index: nextIndex,
    targetPosition: route[nextIndex],
  };
}

export function getFlagshipDisplayWorldPosition(
  displayX: number,
): WorldPosition {
  return {
    x: SHOWROOM_POSITION[0] + displayX,
    y: 0.38,
    z: SHOWROOM_POSITION[2] + MODEL_DISPLAY_LOCAL_Z,
  };
}

export function getFlagshipTrunkWorldPosition(displayX: number): WorldPosition {
  const flagship = getFlagshipDisplayWorldPosition(displayX);

  return {
    x: flagship.x,
    y: 0.48,
    z: flagship.z + 0.72,
  };
}

export function getYawFromQuaternion(rotation: {
  w: number;
  x: number;
  y: number;
  z: number;
}) {
  return Math.atan2(
    2 * (rotation.w * rotation.y + rotation.x * rotation.z),
    1 - 2 * (rotation.y * rotation.y + rotation.z * rotation.z),
  );
}

function isCartAlignedWithValetBay(
  cartPosition: WorldPosition,
  cartYaw: number,
  planarSpeed: number,
  displayX: number,
) {
  const bay = getValetBayWorldPosition(displayX);
  const alignedYaw = Math.atan2(Math.sin(cartYaw), Math.cos(cartYaw));

  return (
    Math.abs(cartPosition.x - bay.x) <= VALET_CAPTURE_TOLERANCE.halfWidth &&
    Math.abs(cartPosition.z - bay.z) <= VALET_CAPTURE_TOLERANCE.halfDepth &&
    Math.abs(alignedYaw) <= VALET_CAPTURE_TOLERANCE.maximumYawError &&
    planarSpeed <= VALET_CAPTURE_TOLERANCE.maximumSpeed
  );
}

export function findAlignedValetBayIndex(
  cartPosition: WorldPosition,
  cartYaw: number,
  planarSpeed: number,
  displayPositions: readonly number[],
) {
  const nearestIndex = displayPositions.reduce((nearest, displayX, index) => {
    const nearestDistance = Math.abs(
      cartPosition.x - getValetBayWorldPosition(displayPositions[nearest]).x,
    );
    const distance = Math.abs(
      cartPosition.x - getValetBayWorldPosition(displayX).x,
    );

    return distance < nearestDistance ? index : nearest;
  }, 0);

  return isCartAlignedWithValetBay(
    cartPosition,
    cartYaw,
    planarSpeed,
    displayPositions[nearestIndex],
  )
    ? nearestIndex
    : -1;
}
