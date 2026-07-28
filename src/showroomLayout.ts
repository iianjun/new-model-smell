import type { WorldPosition } from "./flagshipLineup";

export const SHOWROOM_POSITION = [-9.2, 0, -4.25] as const;
export const MODEL_DISPLAY_LOCAL_Z = -1.05;
export const VALET_BAY_LOCAL_Z = 1.18;
const DENSE_LINEUP_SPACING = 2.35;

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

export function isCartAlignedWithValetBay(
  cartPosition: WorldPosition,
  cartYaw: number,
  planarSpeed: number,
  displayX: number,
) {
  const bay = getValetBayWorldPosition(displayX);
  const alignedYaw = Math.atan2(Math.sin(cartYaw), Math.cos(cartYaw));

  return (
    Math.abs(cartPosition.x - bay.x) <= 0.52 &&
    Math.abs(cartPosition.z - bay.z) <= 0.64 &&
    Math.abs(alignedYaw) <= 0.34 &&
    planarSpeed <= 0.7
  );
}
