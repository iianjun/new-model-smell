export type DrivingState = "ready" | "driving" | "handbrake";

export type DrivingTelemetry = {
  distanceMeters: number;
  recoveryUsed: boolean;
  state: DrivingState;
};

export const INITIAL_DRIVING_TELEMETRY: DrivingTelemetry = {
  distanceMeters: 0,
  recoveryUsed: false,
  state: "ready",
};
