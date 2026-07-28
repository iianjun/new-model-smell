import { useFrame } from "@react-three/fiber";
import type { RapierRigidBody } from "@react-three/rapier";
import { useEffect, useMemo, useRef } from "react";
import {
  CanvasTexture,
  LinearFilter,
  MathUtils,
  type Mesh,
  SRGBColorSpace,
} from "three";
import {
  type ExperiencePhase,
  isTransferPhase,
  type TransferPhase,
  type ValetTransferController,
} from "./experience";
import type { FlagshipModel, WorldPosition } from "./flagshipLineup";
import {
  getFlagshipTrunkWorldPosition,
  getValetBayWorldPosition,
  getYawFromQuaternion,
  isCartAlignedWithValetBay,
  MODEL_DISPLAY_LOCAL_Z,
  VALET_BAY_LOCAL_Z,
} from "./showroomLayout";
import { quaternionFromYaw } from "./useArcadeVehicle";

const CHARCOAL = "#252723";
const FLOOR = "#d8c8a8";
const SAFETY_ORANGE = "#ef6d32";
const WARM_IVORY = "#f2e7d2";
const PHASE_DURATION_MS: Record<TransferPhase, number> = {
  "flagship-waking": 780,
  "valet-aligning": 620,
  "valet-clamping": 520,
  "valet-stowing": 1_180,
};

type ValetTransferSystemProps = {
  controller: ValetTransferController;
  displayPositions: readonly number[];
  inspectorCartBody: React.RefObject<RapierRigidBody | null>;
  lineup: readonly FlagshipModel[];
};

function useBayTexture(modelName: string) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 768;
    canvas.height = 512;
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Unable to create a Valet Transfer Bay marking");
    }

    context.fillStyle = FLOOR;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = SAFETY_ORANGE;
    context.lineWidth = 34;
    context.strokeRect(24, 24, canvas.width - 48, canvas.height - 48);
    context.fillStyle = CHARCOAL;
    context.font = "900 54px ui-sans-serif, system-ui, sans-serif";
    context.textAlign = "center";
    context.fillText("VALET TRANSFER", canvas.width / 2, 112);
    context.font = "800 34px ui-monospace, monospace";
    context.fillText(modelName.toUpperCase(), canvas.width / 2, 174);
    context.fillStyle = SAFETY_ORANGE;
    context.beginPath();
    context.moveTo(canvas.width / 2, 236);
    context.lineTo(canvas.width / 2 - 86, 344);
    context.lineTo(canvas.width / 2 - 28, 344);
    context.lineTo(canvas.width / 2 - 28, 432);
    context.lineTo(canvas.width / 2 + 28, 432);
    context.lineTo(canvas.width / 2 + 28, 344);
    context.lineTo(canvas.width / 2 + 86, 344);
    context.closePath();
    context.fill();

    const nextTexture = new CanvasTexture(canvas);
    nextTexture.colorSpace = SRGBColorSpace;
    nextTexture.minFilter = LinearFilter;

    return nextTexture;
  }, [modelName]);

  useEffect(() => () => texture.dispose(), [texture]);

  return texture;
}

function ValetTransferBay({
  displayX,
  model,
  selected,
  phase,
}: {
  displayX: number;
  model: FlagshipModel;
  phase: ExperiencePhase;
  selected: boolean;
}) {
  const leftClamp = useRef<Mesh>(null);
  const rightClamp = useRef<Mesh>(null);
  const lift = useRef<Mesh>(null);
  const texture = useBayTexture(model.name);

  useFrame((_, delta) => {
    const clampsEngaged =
      selected &&
      (phase === "valet-aligning" ||
        phase === "valet-clamping" ||
        phase === "valet-stowing" ||
        phase === "flagship-waking");
    const clampDistance = clampsEngaged ? 0.54 : 0.82;

    if (leftClamp.current) {
      leftClamp.current.position.x = MathUtils.damp(
        leftClamp.current.position.x,
        -clampDistance,
        9,
        delta,
      );
    }

    if (rightClamp.current) {
      rightClamp.current.position.x = MathUtils.damp(
        rightClamp.current.position.x,
        clampDistance,
        9,
        delta,
      );
    }

    if (lift.current) {
      const liftRaised =
        selected && (phase === "valet-stowing" || phase === "flagship-waking");
      lift.current.position.y = MathUtils.damp(
        lift.current.position.y,
        liftRaised ? 1.72 : 0.48,
        5.5,
        delta,
      );
    }
  });

  return (
    <group position={[displayX, 0, VALET_BAY_LOCAL_Z]}>
      <mesh
        receiveShadow
        position={[0, 0.365, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[1.58, 1.86]} />
        <meshStandardMaterial map={texture} roughness={1} />
      </mesh>
      {[-0.62, 0.62].map((x) => (
        <mesh key={x} position={[x, 0.43, 0]}>
          <boxGeometry args={[0.08, 0.08, 1.65]} />
          <meshStandardMaterial
            color={SAFETY_ORANGE}
            emissive={SAFETY_ORANGE}
            emissiveIntensity={selected ? 0.55 : 0.08}
            flatShading
            roughness={1}
          />
        </mesh>
      ))}
      <mesh position={[-0.82, 0.55, 0]} ref={leftClamp}>
        <boxGeometry args={[0.24, 0.3, 0.58]} />
        <meshStandardMaterial color={CHARCOAL} flatShading roughness={1} />
      </mesh>
      <mesh position={[0.82, 0.55, 0]} ref={rightClamp}>
        <boxGeometry args={[0.24, 0.3, 0.58]} />
        <meshStandardMaterial color={CHARCOAL} flatShading roughness={1} />
      </mesh>
      <mesh position={[0, 0.48, -0.25]} ref={lift}>
        <boxGeometry args={[1.35, 0.16, 0.35]} />
        <meshStandardMaterial color={WARM_IVORY} flatShading roughness={1} />
      </mesh>
      <mesh
        position={[0, 1.82, (MODEL_DISPLAY_LOCAL_Z - VALET_BAY_LOCAL_Z) / 2]}
      >
        <boxGeometry
          args={[0.16, 0.16, VALET_BAY_LOCAL_Z - MODEL_DISPLAY_LOCAL_Z]}
        />
        <meshStandardMaterial color={CHARCOAL} flatShading roughness={1} />
      </mesh>
    </group>
  );
}

function interpolatePosition(
  start: WorldPosition,
  end: WorldPosition,
  progress: number,
  lift = 0,
) {
  return {
    x: MathUtils.lerp(start.x, end.x, progress),
    y:
      MathUtils.lerp(start.y, end.y, progress) +
      Math.sin(progress * Math.PI) * lift,
    z: MathUtils.lerp(start.z, end.z, progress),
  };
}

export function ValetTransferSystem({
  controller,
  displayPositions,
  inspectorCartBody,
  lineup,
}: ValetTransferSystemProps) {
  const { activeFlagshipId, onPhaseComplete, onStart, phase } = controller;
  const phaseStartedAt = useRef(performance.now());
  const phaseStartPosition = useRef<WorldPosition | null>(null);
  const phaseCompleteSent = useRef(false);

  useEffect(() => {
    phaseStartedAt.current = performance.now();
    phaseCompleteSent.current = false;
    const position = isTransferPhase(phase)
      ? inspectorCartBody.current?.translation()
      : null;
    phaseStartPosition.current = position ? { ...position } : null;
  }, [inspectorCartBody, phase]);

  useFrame(() => {
    const cart = inspectorCartBody.current;

    if (!cart) {
      return;
    }

    if (phase === "inspector-driving") {
      const position = cart.translation();
      const velocity = cart.linvel();
      const yaw = getYawFromQuaternion(cart.rotation());
      const alignedIndex = displayPositions.findIndex((displayX) =>
        isCartAlignedWithValetBay(
          position,
          yaw,
          Math.hypot(velocity.x, velocity.z),
          displayX,
        ),
      );

      if (alignedIndex >= 0) {
        onStart(lineup[alignedIndex].id);
      }

      return;
    }

    if (!activeFlagshipId || !isTransferPhase(phase)) {
      return;
    }

    const selectedIndex = lineup.findIndex(
      (model) => model.id === activeFlagshipId,
    );

    if (selectedIndex < 0) {
      return;
    }

    const displayX = displayPositions[selectedIndex];
    const bay = getValetBayWorldPosition(displayX);
    const trunk = getFlagshipTrunkWorldPosition(displayX);
    const duration = PHASE_DURATION_MS[phase];
    const progress = MathUtils.clamp(
      (performance.now() - phaseStartedAt.current) / duration,
      0,
      1,
    );
    const start = phaseStartPosition.current ?? bay;
    const target =
      phase === "valet-aligning"
        ? interpolatePosition(start, bay, progress)
        : phase === "valet-stowing"
          ? interpolatePosition(bay, trunk, progress, 1.25)
          : phase === "flagship-waking"
            ? trunk
            : bay;

    cart.setTranslation(target, true);
    cart.setRotation(quaternionFromYaw(0), true);
    cart.setLinvel({ x: 0, y: 0, z: 0 }, true);
    cart.setAngvel({ x: 0, y: 0, z: 0 }, true);

    if (progress >= 1 && !phaseCompleteSent.current) {
      phaseCompleteSent.current = true;
      onPhaseComplete(phase);
    }
  });

  return (
    <>
      {lineup.map((model, index) => (
        <ValetTransferBay
          displayX={displayPositions[index]}
          key={model.id}
          model={model}
          phase={phase}
          selected={activeFlagshipId === model.id}
        />
      ))}
    </>
  );
}
