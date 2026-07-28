export type DrivingState =
  | "bounce"
  | "driving"
  | "handbrake"
  | "ready"
  | "recovery";

export type ArcadeVehicleTuning = {
  accelerationRate: number;
  coastingRate: number;
  forwardSpeed: number;
  handbrakeGrip: number;
  handbrakeSpeedScale: number;
  handbrakeSteering: number;
  lateralGrip: number;
  minimumSteeringAuthority: number;
  recoveryDelayMs: number;
  reverseSpeed: number;
  steeringRate: number;
  steeringSpeedDivisor: number;
};

export const COLLISION_SURFACE = {
  centralLandmark: "central-landmark",
  solidEnvironment: "solid-environment",
  townBoundary: "drive-boundary",
} as const;

export const INSPECTOR_CART_TUNING = {
  accelerationRate: 3.4,
  coastingRate: 2.4,
  forwardSpeed: 5.4,
  handbrakeGrip: 0.8,
  handbrakeSpeedScale: 0.32,
  handbrakeSteering: 1.3,
  lateralGrip: 8.5,
  minimumSteeringAuthority: 0.28,
  recoveryDelayMs: 900,
  reverseSpeed: 3.25,
  steeringRate: 1.75,
  steeringSpeedDivisor: 2.4,
} as const satisfies ArcadeVehicleTuning;

export const FLAGSHIP_TUNING = {
  accelerationRate: 2.25,
  coastingRate: 1.35,
  forwardSpeed: 9.2,
  handbrakeGrip: 1.15,
  handbrakeSpeedScale: 0.48,
  handbrakeSteering: 1.42,
  lateralGrip: 4.4,
  minimumSteeringAuthority: 0.18,
  recoveryDelayMs: 1_150,
  reverseSpeed: 4.1,
  steeringRate: 0.92,
  steeringSpeedDivisor: 4.6,
} as const satisfies ArcadeVehicleTuning;

export type DrivingTelemetry = {
  state: DrivingState;
};

export type HeadingBasis = {
  forwardX: number;
  forwardZ: number;
  rightX: number;
  rightZ: number;
};

export const INITIAL_DRIVING_TELEMETRY: DrivingTelemetry = {
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
    name === COLLISION_SURFACE.centralLandmark ||
    name === COLLISION_SURFACE.solidEnvironment
  );
}
