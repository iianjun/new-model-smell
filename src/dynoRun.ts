import { MathUtils } from "three";
import {
  DYNO_CLAMP_SECONDS,
  DYNO_RUN_SECONDS,
  DYNO_SHEET_LENGTH,
  DYNO_SHEET_PRINT_READY_LENGTH,
  DYNO_SHEET_RETRACTED_LENGTH,
  type DynoAlignment,
  type DynoRunPhase,
  getDynoPhaseDefinition,
} from "./dyno";

export type DynoRunSnapshot = {
  phase: DynoRunPhase;
  phaseStartedAt: number;
  progress: number;
  sheetLength: number;
};

export type DynoRunFrameInput = {
  acceleratorHeld: boolean;
  activeFlagshipAvailable: boolean;
  alignment: DynoAlignment | null;
  cartNear: boolean;
  dossierSheetRetracting: boolean;
  elapsedDelta: number;
  now: number;
};

export type DynoRunFrameResult = {
  alignmentError: number;
  containment: "locked" | "settling" | null;
  retractionCompleted: boolean;
  snapshot: DynoRunSnapshot;
};

export function createInitialDynoRunSnapshot(now: number): DynoRunSnapshot {
  return {
    phase: "standby",
    phaseStartedAt: now,
    progress: 0,
    sheetLength: 0,
  };
}

function transitionPhase(
  snapshot: DynoRunSnapshot,
  phase: DynoRunPhase,
  now: number,
) {
  return snapshot.phase === phase
    ? snapshot
    : {
        ...snapshot,
        phase,
        phaseStartedAt: now,
      };
}

function frameResult(
  snapshot: DynoRunSnapshot,
  alignmentError: number,
  retractionCompleted = false,
): DynoRunFrameResult {
  const vehicleSecured = getDynoPhaseDefinition(snapshot.phase).vehicleSecured;
  const containment =
    snapshot.phase === "clamping"
      ? "settling"
      : vehicleSecured
        ? "locked"
        : null;

  return {
    alignmentError: vehicleSecured ? 0 : alignmentError,
    containment,
    retractionCompleted,
    snapshot,
  };
}

export function isDynoSheetPullReady(snapshot: DynoRunSnapshot) {
  return (
    snapshot.phase === "sheet-ready" &&
    snapshot.sheetLength === DYNO_SHEET_LENGTH
  );
}

export function advanceDynoRun(
  current: DynoRunSnapshot,
  input: DynoRunFrameInput,
): DynoRunFrameResult {
  if (!input.activeFlagshipAvailable || !input.alignment) {
    return frameResult(
      {
        phase: input.cartNear ? "cart-rejected" : "standby",
        phaseStartedAt:
          current.phase === (input.cartNear ? "cart-rejected" : "standby")
            ? current.phaseStartedAt
            : input.now,
        progress: 0,
        sheetLength: 0,
      },
      1,
    );
  }

  const { alignment } = input;
  let snapshot = { ...current };

  if (snapshot.phase === "sheet-ready" && input.dossierSheetRetracting) {
    snapshot = transitionPhase(snapshot, "releasing", input.now);
  }

  if (snapshot.phase === "released") {
    if (!alignment.inApproachZone) {
      snapshot = transitionPhase(snapshot, "standby", input.now);
    }

    return frameResult(
      {
        ...snapshot,
        sheetLength: 0,
      },
      alignment.alignmentError,
    );
  }

  if (!getDynoPhaseDefinition(snapshot.phase).vehicleSecured) {
    snapshot = transitionPhase(
      snapshot,
      alignment.aligned
        ? "clamping"
        : alignment.inApproachZone
          ? "approach"
          : "standby",
      input.now,
    );
  }

  if (snapshot.phase === "releasing") {
    const sheetLength = MathUtils.damp(
      snapshot.sheetLength,
      0,
      8,
      input.elapsedDelta,
    );

    if (sheetLength <= DYNO_SHEET_RETRACTED_LENGTH) {
      return frameResult(
        {
          ...transitionPhase(snapshot, "released", input.now),
          progress: 0,
          sheetLength: 0,
        },
        alignment.alignmentError,
        true,
      );
    }

    return frameResult(
      {
        ...snapshot,
        progress: 0,
        sheetLength,
      },
      alignment.alignmentError,
    );
  }

  if (
    snapshot.phase === "clamping" &&
    (input.now - snapshot.phaseStartedAt) / 1_000 >= DYNO_CLAMP_SECONDS
  ) {
    snapshot = transitionPhase(snapshot, "ready", input.now);
  }

  if (
    (snapshot.phase === "ready" || snapshot.phase === "paused") &&
    input.acceleratorHeld
  ) {
    snapshot = transitionPhase(snapshot, "running", input.now);
  } else if (snapshot.phase === "running" && !input.acceleratorHeld) {
    snapshot = transitionPhase(snapshot, "paused", input.now);
  }

  if (snapshot.phase === "running") {
    snapshot.progress = Math.min(
      1,
      snapshot.progress + input.elapsedDelta / DYNO_RUN_SECONDS,
    );

    if (snapshot.progress >= 1) {
      snapshot = transitionPhase(snapshot, "sheet-printing", input.now);
    }
  }

  if (snapshot.phase === "sheet-printing") {
    snapshot.sheetLength = MathUtils.damp(
      snapshot.sheetLength,
      DYNO_SHEET_LENGTH,
      3.4,
      input.elapsedDelta,
    );

    if (snapshot.sheetLength >= DYNO_SHEET_PRINT_READY_LENGTH) {
      snapshot = {
        ...transitionPhase(snapshot, "sheet-ready", input.now),
        sheetLength: DYNO_SHEET_LENGTH,
      };
    }
  } else if (snapshot.phase === "sheet-ready") {
    snapshot.sheetLength = DYNO_SHEET_LENGTH;
  } else {
    snapshot.sheetLength = MathUtils.damp(
      snapshot.sheetLength,
      0,
      8,
      input.elapsedDelta,
    );
  }

  return frameResult(snapshot, alignment.alignmentError);
}
