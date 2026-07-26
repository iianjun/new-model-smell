export type DrivingState = "bounce" | "driving" | "handbrake" | "ready";

export const COLLISION_SURFACE = {
  centralLandmark: "central-landmark",
  townBoundary: "drive-boundary",
} as const;

export const INSPECTOR_CART_TUNING = {
  forwardSpeed: 5.4,
  recoveryDelayMs: 900,
  reverseSpeed: 3.25,
} as const;

export type DrivingTelemetry = {
  distanceMeters: number;
  recoveryUsed: boolean;
  state: DrivingState;
};

export type HeadingBasis = {
  forwardX: number;
  forwardZ: number;
  rightX: number;
  rightZ: number;
};

export const INITIAL_DRIVING_TELEMETRY: DrivingTelemetry = {
  distanceMeters: 0,
  recoveryUsed: false,
  state: "ready",
};

export function getHeadingBasis(yaw: number): HeadingBasis {
  return {
    forwardX: -Math.sin(yaw),
    forwardZ: -Math.cos(yaw),
    rightX: Math.cos(yaw),
    rightZ: -Math.sin(yaw),
  };
}

export function isCartCollisionSurface(
  name: string | undefined,
): name is (typeof COLLISION_SURFACE)[keyof typeof COLLISION_SURFACE] {
  return (
    name === COLLISION_SURFACE.townBoundary ||
    name === COLLISION_SURFACE.centralLandmark
  );
}
