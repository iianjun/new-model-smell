export type ExperiencePhase =
  | "opening"
  | "inspector-driving"
  | "valet-aligning"
  | "valet-clamping"
  | "valet-stowing"
  | "flagship-waking"
  | "flagship-driving";

export type ExperienceState = {
  activeFlagshipId: string | null;
  driveOutComplete: boolean;
  phase: ExperiencePhase;
};

export type ExperienceEvent =
  | { type: "opening-completed" }
  | { flagshipId: string; type: "valet-transfer-started" }
  | { phase: TransferPhase; type: "valet-phase-completed" }
  | { type: "drive-out-completed" };

export type TransferPhase = Extract<
  ExperiencePhase,
  "flagship-waking" | "valet-aligning" | "valet-clamping" | "valet-stowing"
>;

export type ValetTransferController = {
  activeFlagshipId: string | null;
  onPhaseComplete: (phase: TransferPhase) => void;
  onStart: (flagshipId: string) => void;
  phase: ExperiencePhase;
};

export type CartPresentation =
  | "clamped"
  | "driving"
  | "packing"
  | "packed"
  | "stowed"
  | "transferring";

export type ExperiencePhaseBehavior = {
  cartPresentation: CartPresentation;
  controlledVehicle: "active-flagship" | "inspector-cart" | null;
  openingCompleted: boolean;
  statusLabel?: string;
};

export const INITIAL_EXPERIENCE_STATE: ExperienceState = {
  activeFlagshipId: null,
  driveOutComplete: false,
  phase: "opening",
};

const NEXT_TRANSFER_PHASE: Record<TransferPhase, ExperiencePhase> = {
  "flagship-waking": "flagship-driving",
  "valet-aligning": "valet-clamping",
  "valet-clamping": "valet-stowing",
  "valet-stowing": "flagship-waking",
};

const EXPERIENCE_PHASE_BEHAVIOR: Record<
  ExperiencePhase,
  ExperiencePhaseBehavior
> = {
  "flagship-driving": {
    cartPresentation: "stowed",
    controlledVehicle: "active-flagship",
    openingCompleted: true,
  },
  "flagship-waking": {
    cartPresentation: "packed",
    controlledVehicle: null,
    openingCompleted: true,
    statusLabel: "Flagship systems waking",
  },
  "inspector-driving": {
    cartPresentation: "driving",
    controlledVehicle: "inspector-cart",
    openingCompleted: true,
  },
  opening: {
    cartPresentation: "driving",
    controlledVehicle: null,
    openingCompleted: false,
  },
  "valet-aligning": {
    cartPresentation: "transferring",
    controlledVehicle: null,
    openingCompleted: true,
    statusLabel: "Floor guidance and clamps aligning Cart",
  },
  "valet-clamping": {
    cartPresentation: "clamped",
    controlledVehicle: null,
    openingCompleted: true,
    statusLabel: "Valet clamps secured",
  },
  "valet-stowing": {
    cartPresentation: "packing",
    controlledVehicle: null,
    openingCompleted: true,
    statusLabel: "Packing Inspector Cart",
  },
};

export function getExperiencePhaseBehavior(phase: ExperiencePhase) {
  return EXPERIENCE_PHASE_BEHAVIOR[phase];
}

export function isTransferPhase(
  phase: ExperiencePhase,
): phase is TransferPhase {
  return phase in NEXT_TRANSFER_PHASE;
}

export function experienceReducer(
  state: ExperienceState,
  event: ExperienceEvent,
): ExperienceState {
  switch (event.type) {
    case "opening-completed":
      return state.phase === "opening"
        ? { ...state, phase: "inspector-driving" }
        : state;
    case "valet-transfer-started":
      return state.phase === "inspector-driving"
        ? {
            activeFlagshipId: event.flagshipId,
            driveOutComplete: false,
            phase: "valet-aligning",
          }
        : state;
    case "valet-phase-completed":
      return state.phase === event.phase
        ? { ...state, phase: NEXT_TRANSFER_PHASE[event.phase] }
        : state;
    case "drive-out-completed":
      return state.phase === "flagship-driving"
        ? { ...state, driveOutComplete: true }
        : state;
  }
}
