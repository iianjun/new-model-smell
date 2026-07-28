export const DYNO_ALIGNMENT_POSITION = {
  x: 9.2,
  y: 0.2,
  z: -3.05,
} as const;

export const DYNO_ALIGNMENT_YAW = 0;
export const DYNO_CLAMP_SECONDS = 0.78;
export const DYNO_RUN_SECONDS = 3.6;

export type DynoRunPhase =
  | "approach"
  | "cart-rejected"
  | "clamping"
  | "paused"
  | "ready"
  | "running"
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
  running: {
    active: true,
    alert: false,
    readoutLabel: HOLD_ACCELERATOR,
    runIntensity: (progress) => 0.16 + progress * 0.84,
    statusLabel: (progress) => `Dyno run ${Math.round(progress * 100)}%`,
    statusSubject: "active-flagship",
    vehicleSecured: true,
  },
  "sheet-ready": {
    active: true,
    alert: false,
    readoutLabel: "Physical Dyno Sheet printed",
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

function normalizedAngle(value: number) {
  return Math.atan2(Math.sin(value), Math.cos(value));
}

export function getDynoAlignment(
  position: { x: number; z: number },
  yaw: number,
  planarSpeed: number,
) {
  const xError = Math.abs(position.x - DYNO_ALIGNMENT_POSITION.x);
  const zError = Math.abs(position.z - DYNO_ALIGNMENT_POSITION.z);
  const yawError = Math.abs(normalizedAngle(yaw - DYNO_ALIGNMENT_YAW));
  const positionError = Math.hypot(xError, zError);
  const alignmentError = Math.min(
    1,
    xError / 0.48 + zError / 0.62 + yawError / 0.3 + planarSpeed / 0.75,
  );

  return {
    aligned:
      xError <= 0.48 &&
      zError <= 0.62 &&
      yawError <= 0.3 &&
      planarSpeed <= 0.75,
    alignmentError,
    inApproachZone: positionError <= 3.2,
  };
}

export function getDynoStatusLabel(state: DynoRuntimeState) {
  return getDynoPhaseDefinition(state.phase).statusLabel(state.progress);
}
