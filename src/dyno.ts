export const DYNO_ALIGNMENT_POSITION = {
  x: 9.2,
  y: 0.2,
  z: -3.05,
} as const;

export const DYNO_ALIGNMENT_YAW = 0;
export const DYNO_APPROACH_RADIUS = 4.5;
const DYNO_NAVIGATION_FINAL_RADIUS = 1.75;
const DYNO_NAVIGATION_ROUTE = [
  {
    hasPassed: (position: { x: number; z: number }) =>
      position.x <= -4.5 && position.z >= 5.4,
    targetPosition: { x: -6, y: 0.2, z: 6.8 },
  },
  {
    hasPassed: (position: { x: number; z: number }) =>
      position.x >= 4.6 && position.z >= 5,
    targetPosition: { x: 6, y: 0.2, z: 6.8 },
  },
  {
    hasPassed: (position: { x: number; z: number }) =>
      position.x >= 8.2 && position.z <= 3.4,
    targetPosition: { x: 9.2, y: 0.2, z: 2 },
  },
  {
    hasPassed: (position: { x: number; z: number }) =>
      Math.abs(position.x - DYNO_ALIGNMENT_POSITION.x) <= 0.5 &&
      position.z <= -0.35 &&
      position.z >= -1.4,
    targetPosition: { x: 9.2, y: 0.2, z: -0.8 },
  },
  {
    hasPassed: () => false,
    targetPosition: DYNO_ALIGNMENT_POSITION,
  },
] as const;
const DYNO_CAPTURE_TOLERANCE = {
  halfDepth: 0.62,
  halfWidth: 0.48,
  maximumSpeed: 0.75,
  maximumYawError: 0.3,
} as const;
export const DYNO_CLAMP_SECONDS = 0.78;
export const DYNO_RUN_SECONDS = 3.6;
export const DYNO_SHEET_LENGTH = 5.8;
export const DYNO_SHEET_PRINT_READY_LENGTH = DYNO_SHEET_LENGTH - 0.02;
export const DYNO_SHEET_RETRACTED_LENGTH = 0.03;

export type DynoRunPhase =
  | "approach"
  | "cart-rejected"
  | "clamping"
  | "paused"
  | "ready"
  | "released"
  | "releasing"
  | "running"
  | "sheet-printing"
  | "sheet-ready"
  | "standby";

export type DynoRuntimeState = {
  alignmentError: number;
  phase: DynoRunPhase;
  progress: number;
  sheetLength: number;
  vehicleSecured: boolean;
};

type DynoPhaseDefinition = {
  active: boolean;
  alert: boolean;
  readoutLabel: string | null;
  runIntensity: (progress: number) => number;
  statusLabel: (progress: number) => string;
  statusSubject: "active-flagship" | "inspector-cart";
  vehicleSecured: boolean;
};

export const INITIAL_DYNO_RUNTIME_STATE: DynoRuntimeState = {
  alignmentError: 1,
  phase: "standby",
  progress: 0,
  sheetLength: 0,
  vehicleSecured: false,
};

const HOLD_ACCELERATOR = "Hold accelerator · release to pause";
const NO_RUN_INTENSITY = () => 0;

const DYNO_PHASE_DEFINITIONS = {
  approach: {
    active: true,
    alert: false,
    readoutLabel: null,
    runIntensity: NO_RUN_INTENSITY,
    statusLabel: () => "Align Flagship with orange rollers",
    statusSubject: "active-flagship",
    vehicleSecured: false,
  },
  "cart-rejected": {
    active: true,
    alert: true,
    readoutLabel: null,
    runIntensity: NO_RUN_INTENSITY,
    statusLabel: () => "Inspector Cart refused · Active Flagship required",
    statusSubject: "inspector-cart",
    vehicleSecured: false,
  },
  clamping: {
    active: true,
    alert: false,
    readoutLabel: HOLD_ACCELERATOR,
    runIntensity: () => 0.1,
    statusLabel: () => "Wheel clamps securing Active Flagship",
    statusSubject: "active-flagship",
    vehicleSecured: true,
  },
  paused: {
    active: true,
    alert: false,
    readoutLabel: HOLD_ACCELERATOR,
    runIntensity: NO_RUN_INTENSITY,
    statusLabel: (progress) =>
      `Dyno paused at ${Math.round(progress * 100)}% · hold accelerator`,
    statusSubject: "active-flagship",
    vehicleSecured: true,
  },
  ready: {
    active: true,
    alert: false,
    readoutLabel: HOLD_ACCELERATOR,
    runIntensity: NO_RUN_INTENSITY,
    statusLabel: () => "Wheel clamps secured · hold accelerator",
    statusSubject: "active-flagship",
    vehicleSecured: true,
  },
  released: {
    active: false,
    alert: false,
    readoutLabel: null,
    runIntensity: NO_RUN_INTENSITY,
    statusLabel: () => "Dyno released · resume driving",
    statusSubject: "active-flagship",
    vehicleSecured: false,
  },
  releasing: {
    active: true,
    alert: false,
    readoutLabel: "Folding Dyno Sheet · releasing wheel clamps",
    runIntensity: NO_RUN_INTENSITY,
    statusLabel: () => "Dyno Sheet retracting",
    statusSubject: "active-flagship",
    vehicleSecured: true,
  },
  running: {
    active: true,
    alert: false,
    readoutLabel: HOLD_ACCELERATOR,
    runIntensity: (progress) => 0.16 + progress * 0.84,
    statusLabel: (progress) => `Dyno run ${Math.round(progress * 100)}%`,
    statusSubject: "active-flagship",
    vehicleSecured: true,
  },
  "sheet-printing": {
    active: true,
    alert: false,
    readoutLabel: "Printing physical Dyno Sheet",
    runIntensity: () => 0.14,
    statusLabel: () => "Dyno Sheet printing",
    statusSubject: "active-flagship",
    vehicleSecured: true,
  },
  "sheet-ready": {
    active: true,
    alert: false,
    readoutLabel: "Physical Dyno Sheet printed · grab orange tab and pull",
    runIntensity: () => 0.14,
    statusLabel: () => "Dyno Sheet ready",
    statusSubject: "active-flagship",
    vehicleSecured: true,
  },
  standby: {
    active: false,
    alert: false,
    readoutLabel: null,
    runIntensity: NO_RUN_INTENSITY,
    statusLabel: () => "Dyno standing by",
    statusSubject: "active-flagship",
    vehicleSecured: false,
  },
} as const satisfies Record<DynoRunPhase, DynoPhaseDefinition>;

export function getDynoPhaseDefinition(phase: DynoRunPhase) {
  return DYNO_PHASE_DEFINITIONS[phase];
}

export type DynoAlignment = {
  aligned: boolean;
  alignmentError: number;
  inApproachZone: boolean;
};

export function getInitialDynoNavigationWaypointIndex(position: {
  x: number;
  z: number;
}) {
  const distanceFromDyno = Math.hypot(
    position.x - DYNO_ALIGNMENT_POSITION.x,
    position.z - DYNO_ALIGNMENT_POSITION.z,
  );

  return distanceFromDyno <= DYNO_APPROACH_RADIUS
    ? DYNO_NAVIGATION_ROUTE.length - 1
    : 0;
}

export function getDynoNavigationWaypoint(
  position: { x: number; z: number },
  currentIndex: number,
) {
  const distanceFromDyno = Math.hypot(
    position.x - DYNO_ALIGNMENT_POSITION.x,
    position.z - DYNO_ALIGNMENT_POSITION.z,
  );
  const finalIndex = DYNO_NAVIGATION_ROUTE.length - 1;

  if (distanceFromDyno <= DYNO_NAVIGATION_FINAL_RADIUS) {
    return {
      index: finalIndex,
      targetPosition: DYNO_NAVIGATION_ROUTE[finalIndex].targetPosition,
    };
  }

  let nextIndex = Math.min(Math.max(0, currentIndex), finalIndex);
  const waypoint = DYNO_NAVIGATION_ROUTE[nextIndex];

  if (waypoint.hasPassed(position)) {
    nextIndex += 1;
  }

  return {
    index: nextIndex,
    targetPosition: DYNO_NAVIGATION_ROUTE[nextIndex].targetPosition,
  };
}

function normalizedAngle(value: number) {
  return Math.atan2(Math.sin(value), Math.cos(value));
}

export function getDynoAlignment(
  position: { x: number; z: number },
  yaw: number,
  planarSpeed: number,
): DynoAlignment {
  const xError = Math.abs(position.x - DYNO_ALIGNMENT_POSITION.x);
  const zError = Math.abs(position.z - DYNO_ALIGNMENT_POSITION.z);
  const yawError = Math.abs(normalizedAngle(yaw - DYNO_ALIGNMENT_YAW));
  const positionError = Math.hypot(xError, zError);
  const alignmentError = Math.min(
    1,
    Math.max(
      xError / DYNO_CAPTURE_TOLERANCE.halfWidth,
      zError / DYNO_CAPTURE_TOLERANCE.halfDepth,
      yawError / DYNO_CAPTURE_TOLERANCE.maximumYawError,
      planarSpeed / DYNO_CAPTURE_TOLERANCE.maximumSpeed,
    ),
  );

  return {
    aligned:
      xError <= DYNO_CAPTURE_TOLERANCE.halfWidth &&
      zError <= DYNO_CAPTURE_TOLERANCE.halfDepth &&
      yawError <= DYNO_CAPTURE_TOLERANCE.maximumYawError &&
      planarSpeed <= DYNO_CAPTURE_TOLERANCE.maximumSpeed,
    alignmentError,
    inApproachZone: positionError <= DYNO_APPROACH_RADIUS,
  };
}

export function getDynoStatusLabel(state: DynoRuntimeState) {
  return getDynoPhaseDefinition(state.phase).statusLabel(state.progress);
}
