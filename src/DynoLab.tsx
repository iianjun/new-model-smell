import { useFrame } from "@react-three/fiber";
import type { RapierRigidBody } from "@react-three/rapier";
import { useRef } from "react";
import { MathUtils } from "three";
import {
  DYNO_PIXEL_EFFECTS,
  DYNO_SHEET_LENGTH,
  DynoLabRig,
  type DynoRigHandles,
  useDynoRigHandles,
} from "./DynoLabRig";
import {
  DYNO_ALIGNMENT_POSITION,
  DYNO_ALIGNMENT_YAW,
  DYNO_CLAMP_SECONDS,
  DYNO_RUN_SECONDS,
  type DynoRunPhase,
  type DynoRuntimeState,
  getDynoAlignment,
  getDynoPhaseDefinition,
  INITIAL_DYNO_RUNTIME_STATE,
} from "./dyno";
import { publishDynoRuntimeTestState } from "./runtimeTestState";
import { getYawFromQuaternion } from "./showroomLayout";
import { quaternionFromYaw } from "./useArcadeVehicle";
import type { DrivingInput } from "./useDrivingInput";

const CART_REJECTION_RANGE = 2.8;

type DynoLabProps = {
  activeFlagshipAvailable: boolean;
  activeFlagshipBody: React.RefObject<RapierRigidBody | null>;
  input: React.RefObject<DrivingInput>;
  inspectorCartBody: React.RefObject<RapierRigidBody | null>;
  onStateChange: (state: DynoRuntimeState) => void;
  runIntensity: React.RefObject<number>;
};

type DynoStateHandles = {
  lastPublishedState: React.RefObject<DynoRuntimeState>;
  phase: React.RefObject<DynoRunPhase>;
  phaseStartedAt: React.RefObject<number>;
  progress: React.RefObject<number>;
  sheetLength: React.RefObject<number>;
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

function transitionDynoPhase(
  handles: DynoStateHandles,
  nextPhase: DynoRunPhase,
  now: number,
) {
  if (handles.phase.current === nextPhase) {
    return;
  }

  handles.phase.current = nextPhase;
  handles.phaseStartedAt.current = now;
}

function advanceDynoRun({
  activeFlagshipAvailable,
  delta,
  flagshipBody,
  handles,
  inspectorCartBody,
  throttle,
}: {
  activeFlagshipAvailable: boolean;
  delta: number;
  flagshipBody: RapierRigidBody | null;
  handles: DynoStateHandles;
  inspectorCartBody: RapierRigidBody | null;
  throttle: number;
}) {
  const now = performance.now();

  if (!activeFlagshipAvailable || !flagshipBody) {
    handles.progress.current = 0;
    handles.sheetLength.current = 0;
    const cartPosition = inspectorCartBody?.translation();
    const cartNear =
      cartPosition &&
      Math.hypot(
        cartPosition.x - DYNO_ALIGNMENT_POSITION.x,
        cartPosition.z - DYNO_ALIGNMENT_POSITION.z,
      ) <= CART_REJECTION_RANGE;

    transitionDynoPhase(handles, cartNear ? "cart-rejected" : "standby", now);
    return 1;
  }

  const position = flagshipBody.translation();
  const velocity = flagshipBody.linvel();
  const alignment = getDynoAlignment(
    position,
    getYawFromQuaternion(flagshipBody.rotation()),
    Math.hypot(velocity.x, velocity.z),
  );

  if (!getDynoPhaseDefinition(handles.phase.current).vehicleSecured) {
    transitionDynoPhase(
      handles,
      alignment.aligned
        ? "clamping"
        : alignment.inApproachZone
          ? "approach"
          : "standby",
      now,
    );
  }

  if (getDynoPhaseDefinition(handles.phase.current).vehicleSecured) {
    flagshipBody.setTranslation(
      {
        x: MathUtils.damp(position.x, DYNO_ALIGNMENT_POSITION.x, 8, delta),
        y: MathUtils.damp(position.y, DYNO_ALIGNMENT_POSITION.y, 8, delta),
        z: MathUtils.damp(position.z, DYNO_ALIGNMENT_POSITION.z, 8, delta),
      },
      true,
    );
    flagshipBody.setRotation(quaternionFromYaw(DYNO_ALIGNMENT_YAW), true);
    flagshipBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
    flagshipBody.setAngvel({ x: 0, y: 0, z: 0 }, true);
  }

  if (
    handles.phase.current === "clamping" &&
    (now - handles.phaseStartedAt.current) / 1_000 >= DYNO_CLAMP_SECONDS
  ) {
    transitionDynoPhase(handles, "ready", now);
  }

  const acceleratorHeld = throttle > 0.1;

  if (
    (handles.phase.current === "ready" || handles.phase.current === "paused") &&
    acceleratorHeld
  ) {
    transitionDynoPhase(handles, "running", now);
  } else if (handles.phase.current === "running" && !acceleratorHeld) {
    transitionDynoPhase(handles, "paused", now);
  }

  if (handles.phase.current === "running") {
    handles.progress.current = Math.min(
      1,
      handles.progress.current + delta / DYNO_RUN_SECONDS,
    );

    if (handles.progress.current >= 1) {
      transitionDynoPhase(handles, "sheet-ready", now);
    }
  }

  return getDynoPhaseDefinition(handles.phase.current).vehicleSecured
    ? 0
    : alignment.alignmentError;
}

function animateDynoRig({
  alert,
  delta,
  elapsedTime,
  intensity,
  rig,
  secured,
  sheetLength,
}: {
  alert: boolean;
  delta: number;
  elapsedTime: number;
  intensity: number;
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
    rig.sheet.current.visible = sheetLength > 0.03;
    rig.sheet.current.scale.z = sheetLength / DYNO_SHEET_LENGTH;
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
  const runtimeState: DynoRuntimeState = {
    alignmentError: Math.round(alignmentError * 20) / 20,
    phase: handles.phase.current,
    progress: Math.round(handles.progress.current * 50) / 50,
    sheetLength: Math.round(handles.sheetLength.current * 10) / 10,
    vehicleSecured: getDynoPhaseDefinition(handles.phase.current)
      .vehicleSecured,
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
  input,
  inspectorCartBody,
  onStateChange,
  runIntensity,
}: DynoLabProps) {
  const phase = useRef<DynoRunPhase>("standby");
  const phaseStartedAt = useRef(performance.now());
  const progress = useRef(0);
  const sheetLength = useRef(0);
  const lastPublishedState = useRef(INITIAL_DYNO_RUNTIME_STATE);
  const rig = useDynoRigHandles();
  const handles = {
    lastPublishedState,
    phase,
    phaseStartedAt,
    progress,
    sheetLength,
  };

  useFrame((state, frameDelta) => {
    const delta = Math.min(frameDelta, 0.05);
    const alignmentError = advanceDynoRun({
      activeFlagshipAvailable,
      delta,
      flagshipBody: activeFlagshipBody.current,
      handles,
      inspectorCartBody: inspectorCartBody.current,
      throttle: input.current.throttle,
    });
    const phaseDefinition = getDynoPhaseDefinition(handles.phase.current);
    const secured = phaseDefinition.vehicleSecured;
    const intensityTarget = phaseDefinition.runIntensity(
      handles.progress.current,
    );
    runIntensity.current = MathUtils.damp(
      runIntensity.current,
      intensityTarget,
      4.8,
      delta,
    );

    handles.sheetLength.current =
      handles.phase.current === "sheet-ready"
        ? MathUtils.damp(
            handles.sheetLength.current,
            DYNO_SHEET_LENGTH,
            3.4,
            delta,
          )
        : MathUtils.damp(handles.sheetLength.current, 0, 8, delta);

    animateDynoRig({
      alert: phaseDefinition.alert,
      delta,
      elapsedTime: state.clock.elapsedTime,
      intensity: runIntensity.current,
      rig,
      secured,
      sheetLength: handles.sheetLength.current,
    });
    publishRuntimeState({ alignmentError, handles, onStateChange });
  });

  return <DynoLabRig handles={rig} />;
}
