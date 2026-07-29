import type { DossierPhase } from "./dossier.js";
import type { DynoRuntimeState } from "./dyno.js";

type RuntimeVector3 = {
  x: number;
  y: number;
  z: number;
};

export type DossierRuntimeTestState = {
  activeFlagshipPosition?: RuntimeVector3;
  cameraPosition?: RuntimeVector3;
  phase?: DossierPhase;
  pullProgress?: number;
  sheetHandle?: {
    x: number;
    y: number;
  };
};

export type NoseReaction = "idle" | "inhale" | "sneeze";

export type NoseTrackingMode = "model-freshness" | "vehicle-tracking";

export type NoseRuntimeTestState = {
  dealershipYaw: number;
  gaugeLabel: string;
  mode: NoseTrackingMode;
  particlesVisible: boolean;
  reaction: NoseReaction;
  smellRemainingPercent: number;
  targetCompanyId: string;
  turntableYaw: number;
};

export type RuntimeTestState = {
  dossier?: DossierRuntimeTestState;
  dyno?: DynoRuntimeState;
  nose?: NoseRuntimeTestState;
};

export function publishDossierRuntimeTestState(
  update: Partial<DossierRuntimeTestState>,
) {
  window.__NEW_MODEL_MOTORS_TEST_STATE__ = {
    ...window.__NEW_MODEL_MOTORS_TEST_STATE__,
    dossier: {
      ...window.__NEW_MODEL_MOTORS_TEST_STATE__?.dossier,
      ...update,
    },
  };
}

export function publishDynoRuntimeTestState(state: DynoRuntimeState) {
  window.__NEW_MODEL_MOTORS_TEST_STATE__ = {
    ...window.__NEW_MODEL_MOTORS_TEST_STATE__,
    dyno: state,
  };
}

type NoseRuntimeObservation = {
  freshness: {
    company: { id: string };
    dealershipYaw: number;
    smellRemainingPercent: number;
  };
  gaugeLabel: string;
  mode: NoseTrackingMode;
  particlesVisible: boolean;
  reaction: NoseReaction;
  turntableYaw: number;
};

export function publishNoseRuntimeTestState({
  freshness,
  gaugeLabel,
  mode,
  particlesVisible,
  reaction,
  turntableYaw,
}: NoseRuntimeObservation) {
  const state: NoseRuntimeTestState = {
    dealershipYaw: freshness.dealershipYaw,
    gaugeLabel,
    mode,
    particlesVisible,
    reaction,
    smellRemainingPercent: freshness.smellRemainingPercent,
    targetCompanyId: freshness.company.id,
    turntableYaw,
  };

  window.__NEW_MODEL_MOTORS_TEST_STATE__ = {
    ...window.__NEW_MODEL_MOTORS_TEST_STATE__,
    nose: state,
  };
}

declare global {
  interface Window {
    __NEW_MODEL_MOTORS_TEST_STATE__?: RuntimeTestState;
  }
}
