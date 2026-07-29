export const DYNO_SHEET_DRAG_TOLERANCE_PX = 12;
export const DYNO_SHEET_PULL_DISTANCE_PX = 180;
export const DYNO_SHEET_OPEN_THRESHOLD = 0.72;

export type DossierPhase = "closed" | "closing" | "open" | "opening";

export type DossierController = {
  completeRetraction: () => void;
  open: () => void;
  phase: DossierPhase;
};

export type DossierAction =
  | "close-requested"
  | "open-requested"
  | "opening-finished"
  | "retraction-finished";

type DossierPhaseBehavior = {
  controlsSuspended: boolean;
  interactive: boolean;
  mounted: boolean;
  sheetPullEnabled: boolean;
  sheetRetracting: boolean;
};

const DOSSIER_PHASE_BEHAVIORS = {
  closed: {
    controlsSuspended: false,
    interactive: false,
    mounted: false,
    sheetPullEnabled: true,
    sheetRetracting: false,
  },
  closing: {
    controlsSuspended: true,
    interactive: false,
    mounted: true,
    sheetPullEnabled: false,
    sheetRetracting: true,
  },
  open: {
    controlsSuspended: true,
    interactive: true,
    mounted: true,
    sheetPullEnabled: false,
    sheetRetracting: false,
  },
  opening: {
    controlsSuspended: true,
    interactive: false,
    mounted: true,
    sheetPullEnabled: false,
    sheetRetracting: false,
  },
} as const satisfies Record<DossierPhase, DossierPhaseBehavior>;

const DOSSIER_TRANSITIONS: Record<
  DossierAction,
  Partial<Record<DossierPhase, DossierPhase>>
> = {
  "close-requested": {
    open: "closing",
  },
  "open-requested": {
    closed: "opening",
  },
  "opening-finished": {
    opening: "open",
  },
  "retraction-finished": {
    closing: "closed",
  },
};

export function getDossierPhaseBehavior(phase: DossierPhase) {
  return DOSSIER_PHASE_BEHAVIORS[phase];
}

export function dossierReducer(
  phase: DossierPhase,
  action: DossierAction,
): DossierPhase {
  return DOSSIER_TRANSITIONS[action][phase] ?? phase;
}
