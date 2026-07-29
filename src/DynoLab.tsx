import { useFrame } from "@react-three/fiber";
import type { RapierRigidBody } from "@react-three/rapier";
import { useCallback, useRef } from "react";
import { MathUtils } from "three";
import {
  DYNO_PIXEL_EFFECTS,
  DynoLabRig,
  type DynoRigHandles,
  type DynoSheetInteraction,
  useDynoRigHandles,
} from "./DynoLabRig";
import { type DossierController, getDossierPhaseBehavior } from "./dossier";
import {
  DYNO_ALIGNMENT_POSITION,
  DYNO_ALIGNMENT_YAW,
  DYNO_SHEET_LENGTH,
  DYNO_SHEET_RETRACTED_LENGTH,
  type DynoRuntimeState,
  getDynoAlignment,
  getDynoPhaseDefinition,
  INITIAL_DYNO_RUNTIME_STATE,
} from "./dyno";
import {
  advanceDynoRun,
  createInitialDynoRunSnapshot,
  type DynoRunSnapshot,
  isDynoSheetPullReady,
} from "./dynoRun";
import {
  publishDossierRuntimeTestState,
  publishDynoRuntimeTestState,
} from "./runtimeTestState";
import { getYawFromQuaternion } from "./showroomLayout";
import { quaternionFromYaw } from "./useArcadeVehicle";
import type { DrivingInput } from "./useDrivingInput";

const CART_REJECTION_RANGE = 2.8;

type DynoLabProps = {
  activeFlagshipAvailable: boolean;
  activeFlagshipBody: React.RefObject<RapierRigidBody | null>;
  dossier: DossierController;
  input: React.RefObject<DrivingInput>;
  inspectorCartBody: React.RefObject<RapierRigidBody | null>;
  onStateChange: (state: DynoRuntimeState) => void;
  runIntensity: React.RefObject<number>;
};

type DynoStateHandles = {
  lastPublishedState: React.RefObject<DynoRuntimeState>;
  run: React.RefObject<DynoRunSnapshot>;
};

function runtimeStateChanged(
  previous: DynoRuntimeState,
  next: DynoRuntimeState,
) {
  return (
    previous.phase !== next.phase ||
    previous.progress !== next.progress ||
    previous.sheetLength !== next.sheetLength ||
    previous.vehicleSecured !== next.vehicleSecured ||
    previous.alignmentError !== next.alignmentError
  );
}

function isInspectorCartNearDyno(body: RapierRigidBody | null) {
  const position = body?.translation();

  return Boolean(
    position &&
      Math.hypot(
        position.x - DYNO_ALIGNMENT_POSITION.x,
        position.z - DYNO_ALIGNMENT_POSITION.z,
      ) <= CART_REJECTION_RANGE,
  );
}

function getFlagshipAlignment(body: RapierRigidBody | null) {
  if (!body) {
    return null;
  }

  const position = body.translation();
  const velocity = body.linvel();

  return getDynoAlignment(
    position,
    getYawFromQuaternion(body.rotation()),
    Math.hypot(velocity.x, velocity.z),
  );
}

function containFlagship(
  body: RapierRigidBody,
  mode: "locked" | "settling",
  delta: number,
) {
  const position = body.translation();
  const targetPosition =
    mode === "locked"
      ? DYNO_ALIGNMENT_POSITION
      : {
          x: MathUtils.damp(position.x, DYNO_ALIGNMENT_POSITION.x, 8, delta),
          y: MathUtils.damp(position.y, DYNO_ALIGNMENT_POSITION.y, 8, delta),
          z: MathUtils.damp(position.z, DYNO_ALIGNMENT_POSITION.z, 8, delta),
        };

  body.setTranslation(targetPosition, true);
  body.setRotation(quaternionFromYaw(DYNO_ALIGNMENT_YAW), true);
  body.setLinvel({ x: 0, y: 0, z: 0 }, true);
  body.setAngvel({ x: 0, y: 0, z: 0 }, true);
}

function animateDynoRig({
  alert,
  delta,
  elapsedTime,
  intensity,
  pullProgress,
  rig,
  secured,
  sheetLength,
}: {
  alert: boolean;
  delta: number;
  elapsedTime: number;
  intensity: number;
  pullProgress: number;
  rig: DynoRigHandles;
  secured: boolean;
  sheetLength: number;
}) {
  const clampDistance = secured ? 0.98 : 1.32;

  for (const [index, clamp] of rig.clamps.current.entries()) {
    const side = index % 2 === 0 ? -1 : 1;
    clamp.position.x = MathUtils.damp(
      clamp.position.x,
      side * clampDistance,
      9,
      delta,
    );
  }

  for (const roller of rig.rollers.current) {
    roller.rotation.y += delta * intensity * 18;
  }

  for (const fan of rig.fans.current) {
    fan.rotation.z -= delta * intensity * 22;
  }

  if (rig.gaugeNeedle.current) {
    rig.gaugeNeedle.current.rotation.z = MathUtils.damp(
      rig.gaugeNeedle.current.rotation.z,
      -1.05 + intensity * 2.1,
      5,
      delta,
    );
  }

  if (rig.machine.current) {
    rig.machine.current.position.y =
      Math.sin(elapsedTime * 44) * intensity * 0.035;
  }

  if (rig.particles.current) {
    rig.particles.current.visible = intensity > 0.06;

    if (rig.particles.current.visible) {
      for (const [
        index,
        particle,
      ] of rig.particles.current.children.entries()) {
        const definition = DYNO_PIXEL_EFFECTS[index];
        particle.position.x =
          Math.cos(definition.angle + elapsedTime * 1.4) * definition.radius;
        particle.position.y =
          0.68 + ((elapsedTime * (0.7 + intensity) + definition.angle) % 1.7);
        particle.position.z =
          Math.sin(definition.angle + elapsedTime * 1.4) * definition.radius;
        particle.rotation.x += delta * (2 + intensity * 5);
        particle.rotation.y += delta * (3 + intensity * 6);
        particle.scale.setScalar(definition.size * (0.45 + intensity * 1.35));
      }
    }
  }

  if (rig.statusMaterial.current) {
    rig.statusMaterial.current.emissiveIntensity = alert
      ? 0.9
      : 0.08 + intensity * 1.8 + (secured ? 0.18 : 0);
  }

  if (rig.sheet.current) {
    rig.sheet.current.visible = sheetLength > DYNO_SHEET_RETRACTED_LENGTH;
    rig.sheet.current.scale.z = sheetLength / DYNO_SHEET_LENGTH;
    rig.sheet.current.position.y = MathUtils.damp(
      rig.sheet.current.position.y,
      1.62 + pullProgress * 0.88,
      9,
      delta,
    );
    rig.sheet.current.position.z = MathUtils.damp(
      rig.sheet.current.position.z,
      -2.14 + pullProgress * 2.55,
      9,
      delta,
    );
    rig.sheet.current.rotation.x = MathUtils.damp(
      rig.sheet.current.rotation.x,
      -pullProgress * 0.22,
      9,
      delta,
    );
  }
}

function publishRuntimeState({
  alignmentError,
  handles,
  onStateChange,
}: {
  alignmentError: number;
  handles: DynoStateHandles;
  onStateChange: (state: DynoRuntimeState) => void;
}) {
  const snapshot = handles.run.current;
  const runtimeState: DynoRuntimeState = {
    alignmentError: Math.round(alignmentError * 20) / 20,
    phase: snapshot.phase,
    progress: Math.round(snapshot.progress * 50) / 50,
    sheetLength: Math.round(snapshot.sheetLength * 100) / 100,
    vehicleSecured: getDynoPhaseDefinition(snapshot.phase).vehicleSecured,
  };

  if (!runtimeStateChanged(handles.lastPublishedState.current, runtimeState)) {
    return;
  }

  handles.lastPublishedState.current = runtimeState;
  onStateChange(runtimeState);

  if (import.meta.env.DEV) {
    publishDynoRuntimeTestState(runtimeState);
  }
}

export function DynoLab({
  activeFlagshipAvailable,
  activeFlagshipBody,
  dossier,
  input,
  inspectorCartBody,
  onStateChange,
  runIntensity,
}: DynoLabProps) {
  const run = useRef(createInitialDynoRunSnapshot(performance.now()));
  const lastPublishedState = useRef(INITIAL_DYNO_RUNTIME_STATE);
  const sheetPullProgress = useRef(0);
  const rig = useDynoRigHandles();
  const dossierBehavior = getDossierPhaseBehavior(dossier.phase);
  const handles = {
    lastPublishedState,
    run,
  };
  const canPullSheet = useCallback(
    () => isDynoSheetPullReady(run.current) && dossierBehavior.sheetPullEnabled,
    [dossierBehavior.sheetPullEnabled],
  );
  const updatePullProgress = useCallback((nextProgress: number) => {
    sheetPullProgress.current = nextProgress;

    if (import.meta.env.DEV) {
      publishDossierRuntimeTestState({
        pullProgress: Math.round(nextProgress * 100) / 100,
      });
    }
  }, []);

  useFrame((state, frameDelta) => {
    const delta = Math.min(frameDelta, 0.05);
    const elapsedDelta = Math.min(frameDelta, 0.25);
    const flagshipBody = activeFlagshipBody.current;
    const result = advanceDynoRun(run.current, {
      acceleratorHeld: input.current.throttle > 0.1,
      activeFlagshipAvailable: activeFlagshipAvailable && Boolean(flagshipBody),
      alignment: getFlagshipAlignment(flagshipBody),
      cartNear: isInspectorCartNearDyno(inspectorCartBody.current),
      dossierSheetRetracting: dossierBehavior.sheetRetracting,
      elapsedDelta,
      now: performance.now(),
    });
    run.current = result.snapshot;

    if (result.containment && flagshipBody) {
      containFlagship(flagshipBody, result.containment, delta);
    }

    const phaseDefinition = getDynoPhaseDefinition(result.snapshot.phase);
    const intensityTarget = phaseDefinition.runIntensity(
      result.snapshot.progress,
    );
    runIntensity.current = MathUtils.damp(
      runIntensity.current,
      intensityTarget,
      4.8,
      delta,
    );

    if (dossierBehavior.sheetRetracting) {
      sheetPullProgress.current = MathUtils.damp(
        sheetPullProgress.current,
        0,
        8,
        delta,
      );
    } else if (result.snapshot.phase === "released") {
      sheetPullProgress.current = 0;
    }

    if (result.retractionCompleted) {
      sheetPullProgress.current = 0;
      dossier.completeRetraction();
    }

    animateDynoRig({
      alert: phaseDefinition.alert,
      delta,
      elapsedTime: state.clock.elapsedTime,
      intensity: runIntensity.current,
      pullProgress: sheetPullProgress.current,
      rig,
      secured: phaseDefinition.vehicleSecured,
      sheetLength: result.snapshot.sheetLength,
    });
    publishRuntimeState({
      alignmentError: result.alignmentError,
      handles,
      onStateChange,
    });
  });

  const sheetInteraction: DynoSheetInteraction = {
    canPull: canPullSheet,
    onOpenDossier: dossier.open,
    onPullProgress: updatePullProgress,
  };

  return <DynoLabRig handles={rig} sheetInteraction={sheetInteraction} />;
}
