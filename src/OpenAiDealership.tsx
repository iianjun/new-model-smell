import { useFrame, useThree } from "@react-three/fiber";
import {
  CuboidCollider,
  type RapierRigidBody,
  RigidBody,
} from "@react-three/rapier";
import { useEffect, useMemo, useRef } from "react";
import {
  CanvasTexture,
  type Group,
  LinearFilter,
  MathUtils,
  type Mesh,
  type MeshStandardMaterial,
  SRGBColorSpace,
} from "three";
import { COLLISION_SURFACE } from "./driving";
import {
  getExperiencePhaseBehavior,
  type ValetTransferController,
} from "./experience";
import {
  type FlagshipModel,
  formatPublicAvailabilityDate,
  formatReleaseAge,
  getReleaseAgeInDays,
  isInOpenAiShowroomRevealZone,
  OPENAI_COMPANY_TRIM,
} from "./flagshipLineup";
import {
  LIGHT_SIGNATURES,
  type LightSignature,
  ModelVehicleModel,
} from "./ModelVehicleModel";
import {
  getShowroomDisplayPositions,
  getShowroomHalfWidth,
  MODEL_DISPLAY_LOCAL_Z,
  SHOWROOM_POSITION,
} from "./showroomLayout";
import { ValetTransferSystem } from "./ValetTransfer";

const CHARCOAL = "#252723";
const FLOOR = "#d8c8a8";
const SAFETY_ORANGE = "#ef6d32";
const WARM_IVORY = "#f2e7d2";

type OpenAiDealershipProps = {
  activeFlagshipBody: React.RefObject<RapierRigidBody | null>;
  inspectorCartBody: React.RefObject<RapierRigidBody | null>;
  lineup: readonly FlagshipModel[];
  onRevealActiveChange: (active: boolean) => void;
  valetTransfer: ValetTransferController;
};

function useDisplayTexture(
  lines: readonly [primary: string, secondary: string, tertiary: string],
  accent: string,
) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1_024;
    canvas.height = 320;
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Unable to create a Showroom display label");
    }

    context.fillStyle = WARM_IVORY;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = accent;
    context.fillRect(0, 0, 34, canvas.height);
    context.fillStyle = CHARCOAL;
    context.fillRect(68, 52, 866, 4);
    context.font = "900 78px ui-sans-serif, system-ui, sans-serif";
    context.fillText(lines[0].toUpperCase(), 70, 144);
    context.font = "800 34px ui-monospace, monospace";
    context.fillText(lines[1].toUpperCase(), 70, 214);
    context.fillStyle = "#5d625b";
    context.fillText(lines[2].toUpperCase(), 70, 267);

    const nextTexture = new CanvasTexture(canvas);
    nextTexture.colorSpace = SRGBColorSpace;
    nextTexture.minFilter = LinearFilter;

    return nextTexture;
  }, [accent, lines]);

  useEffect(() => () => texture.dispose(), [texture]);

  return texture;
}

function DealershipSign() {
  const lines = useMemo(
    () =>
      [
        "OPENAI",
        "FLAGSHIP SHOWROOM",
        "NEW MODEL MOTORS · DEALERSHIP 01",
      ] as const,
    [],
  );
  const texture = useDisplayTexture(lines, SAFETY_ORANGE);

  return (
    <mesh position={[0, 2.36, 2.83]}>
      <planeGeometry args={[4.45, 1.38]} />
      <meshStandardMaterial map={texture} roughness={0.92} />
    </mesh>
  );
}

function VehicleDisplayLabel({
  compact,
  model,
}: {
  compact: boolean;
  model: FlagshipModel;
}) {
  const age = getReleaseAgeInDays(model.publicAvailabilityDate);
  const lines = useMemo(
    () =>
      [
        model.name,
        `Public ${formatPublicAvailabilityDate(model.publicAvailabilityDate)}`,
        `Release Age ${formatReleaseAge(age)}`,
      ] as const,
    [age, model.name, model.publicAvailabilityDate],
  );
  const texture = useDisplayTexture(lines, OPENAI_COMPANY_TRIM.body);

  return (
    <mesh position={[0, 0.74, -1.63]}>
      <planeGeometry args={[compact ? 1.95 : 2.5, 0.78]} />
      <meshStandardMaterial map={texture} roughness={0.92} />
    </mesh>
  );
}

function ModelVehicle({
  awake,
  compact,
  displayX,
  model,
  signature,
  trunkOpen,
  visible,
}: {
  awake: boolean;
  compact: boolean;
  displayX: number;
  model: FlagshipModel;
  signature: LightSignature;
  trunkOpen: boolean;
  visible: boolean;
}) {
  return (
    <group position={[displayX, 0, MODEL_DISPLAY_LOCAL_Z]} visible={visible}>
      <mesh receiveShadow position={[0, 0.13, 0]}>
        <cylinderGeometry
          args={compact ? [1.02, 1.1, 0.26, 8] : [1.35, 1.48, 0.26, 8]}
        />
        <meshStandardMaterial color={FLOOR} flatShading roughness={1} />
      </mesh>
      <mesh receiveShadow position={[0, 0.28, 0]}>
        <cylinderGeometry
          args={compact ? [0.9, 0.98, 0.1, 8] : [1.05, 1.2, 0.1, 8]}
        />
        <meshStandardMaterial color={CHARCOAL} flatShading roughness={1} />
      </mesh>

      <group position={[0, 0.28, 0]}>
        <ModelVehicleModel
          awake={awake}
          model={model}
          signature={signature}
          trunkOpen={trunkOpen}
        />
      </group>

      <VehicleDisplayLabel compact={compact} model={model} />
    </group>
  );
}

function CutawayShell({
  activeFlagshipBody,
  inspectorCartBody,
  onRevealActiveChange,
  frontPostHalfWidth,
  frontPostX,
  showroomHalfWidth,
}: Pick<
  OpenAiDealershipProps,
  "activeFlagshipBody" | "inspectorCartBody" | "onRevealActiveChange"
> & {
  frontPostHalfWidth: number;
  frontPostX: number;
  showroomHalfWidth: number;
}) {
  const { camera } = useThree();
  const roof = useRef<Mesh>(null);
  const roofMaterial = useRef<MeshStandardMaterial>(null);
  const leftWall = useRef<Mesh>(null);
  const leftWallMaterial = useRef<MeshStandardMaterial>(null);
  const rightWall = useRef<Mesh>(null);
  const rightWallMaterial = useRef<MeshStandardMaterial>(null);
  const backWall = useRef<Mesh>(null);
  const backWallMaterial = useRef<MeshStandardMaterial>(null);
  const frontCanopy = useRef<Group>(null);
  const surfaceOpacity = useRef({
    back: 1,
    front: 1,
    left: 1,
    right: 1,
    roof: 1,
  });
  const lastRevealActive = useRef<boolean | null>(null);

  useFrame((_, delta) => {
    const position = (
      activeFlagshipBody.current ?? inspectorCartBody.current
    )?.translation();

    if (!position) {
      return;
    }

    const isRevealActive = isInOpenAiShowroomRevealZone(position);

    if (lastRevealActive.current !== isRevealActive) {
      lastRevealActive.current = isRevealActive;
      onRevealActiveChange(isRevealActive);
    }

    const cameraX = camera.position.x - SHOWROOM_POSITION[0];
    const cameraZ = camera.position.z - SHOWROOM_POSITION[2];
    const cameraFacing = {
      back: cameraZ < 0,
      front: cameraZ >= 0,
      left: cameraX < 0,
      right: cameraX >= 0,
      roof: true,
    };
    const surfaces = [
      ["roof", roof.current, roofMaterial.current],
      ["left", leftWall.current, leftWallMaterial.current],
      ["right", rightWall.current, rightWallMaterial.current],
      ["back", backWall.current, backWallMaterial.current],
    ] as const;

    for (const [side, mesh, material] of surfaces) {
      if (!mesh || !material) {
        continue;
      }

      const targetOpacity = isRevealActive && cameraFacing[side] ? 0 : 1;
      const opacity = MathUtils.damp(
        surfaceOpacity.current[side],
        targetOpacity,
        targetOpacity === 0 ? 7 : 4.5,
        delta,
      );

      surfaceOpacity.current[side] = opacity;
      material.opacity = opacity;
      mesh.visible = opacity > 0.035;
    }

    if (frontCanopy.current) {
      const targetOpacity = isRevealActive && cameraFacing.front ? 0 : 1;
      surfaceOpacity.current.front = MathUtils.damp(
        surfaceOpacity.current.front,
        targetOpacity,
        targetOpacity === 0 ? 7 : 4.5,
        delta,
      );
      frontCanopy.current.visible = surfaceOpacity.current.front > 0.18;
    }
  });

  return (
    <>
      <mesh castShadow position={[0, 3.38, -0.05]} receiveShadow ref={roof}>
        <boxGeometry args={[showroomHalfWidth * 2 + 0.35, 0.36, 6.35]} />
        <meshStandardMaterial
          color={SAFETY_ORANGE}
          flatShading
          ref={roofMaterial}
          roughness={1}
          transparent
        />
      </mesh>
      <mesh
        castShadow
        position={[-showroomHalfWidth + 0.07, 2, -0.05]}
        receiveShadow
        ref={leftWall}
      >
        <boxGeometry args={[0.3, 2.6, 5.95]} />
        <meshStandardMaterial
          color={WARM_IVORY}
          flatShading
          ref={leftWallMaterial}
          roughness={1}
          transparent
        />
      </mesh>
      <mesh
        castShadow
        position={[showroomHalfWidth - 0.07, 2, -0.05]}
        receiveShadow
        ref={rightWall}
      >
        <boxGeometry args={[0.3, 2.6, 5.95]} />
        <meshStandardMaterial
          color={WARM_IVORY}
          flatShading
          ref={rightWallMaterial}
          roughness={1}
          transparent
        />
      </mesh>
      <mesh castShadow position={[0, 2, -2.95]} receiveShadow ref={backWall}>
        <boxGeometry args={[showroomHalfWidth * 2, 2.6, 0.3]} />
        <meshStandardMaterial
          color={WARM_IVORY}
          flatShading
          ref={backWallMaterial}
          roughness={1}
          transparent
        />
      </mesh>
      <group ref={frontCanopy}>
        {[-frontPostX, frontPostX].map((x) => (
          <mesh castShadow key={x} position={[x, 2, 2.86]} receiveShadow>
            <boxGeometry args={[frontPostHalfWidth * 2, 2.6, 0.3]} />
            <meshStandardMaterial
              color={WARM_IVORY}
              flatShading
              roughness={1}
            />
          </mesh>
        ))}
        <mesh castShadow position={[0, 3.02, 2.86]}>
          <boxGeometry args={[4.4, 0.56, 0.3]} />
          <meshStandardMaterial color={CHARCOAL} flatShading roughness={1} />
        </mesh>
        <DealershipSign />
      </group>
    </>
  );
}

export function OpenAiDealership({
  activeFlagshipBody,
  inspectorCartBody,
  lineup,
  onRevealActiveChange,
  valetTransfer,
}: OpenAiDealershipProps) {
  const displayPositions = getShowroomDisplayPositions(lineup.length);
  const showroomHalfWidth = getShowroomHalfWidth(lineup.length);
  const compactDisplays = lineup.length >= 3;
  const frontPostHalfWidth = compactDisplays ? 0.15 : 0.28;
  const frontPostX = compactDisplays ? showroomHalfWidth - 0.18 : 3.15;
  const { activeFlagshipId, phase } = valetTransfer;
  const flagshipDriving =
    getExperiencePhaseBehavior(phase).controlledVehicle === "active-flagship";

  return (
    <RigidBody
      colliders={false}
      name={COLLISION_SURFACE.solidEnvironment}
      position={SHOWROOM_POSITION}
      type="fixed"
    >
      <CuboidCollider
        args={[showroomHalfWidth - 0.1, 0.35, 0.18]}
        position={[0, 0.35, -2.95]}
      />
      <CuboidCollider
        args={[0.18, 0.35, 2.95]}
        position={[-showroomHalfWidth + 0.07, 0.35, -0.05]}
      />
      <CuboidCollider
        args={[0.18, 0.35, 2.95]}
        position={[showroomHalfWidth - 0.07, 0.35, -0.05]}
      />
      <CuboidCollider
        args={[frontPostHalfWidth, 0.35, 0.18]}
        position={[-frontPostX, 0.35, 2.86]}
      />
      <CuboidCollider
        args={[frontPostHalfWidth, 0.35, 0.18]}
        position={[frontPostX, 0.35, 2.86]}
      />
      {lineup.map((model, index) =>
        model.id === activeFlagshipId && flagshipDriving ? null : (
          <CuboidCollider
            args={[0.95, 0.52, 1.4]}
            key={model.id}
            position={[displayPositions[index], 0.74, MODEL_DISPLAY_LOCAL_Z]}
            restitution={0.72}
          />
        ),
      )}

      <mesh receiveShadow position={[0, 0.1, -0.05]}>
        <cylinderGeometry
          args={[showroomHalfWidth + 0.6, showroomHalfWidth + 0.6, 0.2, 8]}
        />
        <meshStandardMaterial color={FLOOR} flatShading roughness={1} />
      </mesh>
      <mesh receiveShadow position={[0, 0.23, -0.05]}>
        <boxGeometry args={[showroomHalfWidth * 2, 0.24, 5.85]} />
        <meshStandardMaterial color={WARM_IVORY} flatShading roughness={1} />
      </mesh>
      <mesh castShadow position={[0, 0.35, -2.95]} receiveShadow>
        <boxGeometry args={[showroomHalfWidth * 2, 0.7, 0.3]} />
        <meshStandardMaterial color={WARM_IVORY} flatShading roughness={1} />
      </mesh>
      {[-showroomHalfWidth + 0.07, showroomHalfWidth - 0.07].map((x) => (
        <mesh castShadow key={x} position={[x, 0.35, -0.05]} receiveShadow>
          <boxGeometry args={[0.3, 0.7, 5.95]} />
          <meshStandardMaterial color={WARM_IVORY} flatShading roughness={1} />
        </mesh>
      ))}
      {[-frontPostX, frontPostX].map((x) => (
        <mesh castShadow key={x} position={[x, 0.35, 2.86]} receiveShadow>
          <boxGeometry args={[frontPostHalfWidth * 2, 0.7, 0.3]} />
          <meshStandardMaterial color={WARM_IVORY} flatShading roughness={1} />
        </mesh>
      ))}
      <CutawayShell
        activeFlagshipBody={activeFlagshipBody}
        frontPostHalfWidth={frontPostHalfWidth}
        frontPostX={frontPostX}
        inspectorCartBody={inspectorCartBody}
        onRevealActiveChange={onRevealActiveChange}
        showroomHalfWidth={showroomHalfWidth}
      />

      {[-1.18, 1.18].map((x) => (
        <mesh key={x} position={[x, 0.38, 1.38]}>
          <boxGeometry args={[0.09, 0.04, 2.55]} />
          <meshStandardMaterial
            color={SAFETY_ORANGE}
            emissive={SAFETY_ORANGE}
            emissiveIntensity={0.08}
            flatShading
            roughness={1}
          />
        </mesh>
      ))}
      <mesh position={[0, 0.39, 2.48]}>
        <boxGeometry args={[2.45, 0.04, 0.1]} />
        <meshStandardMaterial color={CHARCOAL} flatShading roughness={1} />
      </mesh>

      <ValetTransferSystem
        controller={valetTransfer}
        displayPositions={displayPositions}
        inspectorCartBody={inspectorCartBody}
        lineup={lineup}
      />

      {lineup.map((model, index) => (
        <ModelVehicle
          awake={model.id === activeFlagshipId && phase === "flagship-waking"}
          compact={compactDisplays}
          displayX={displayPositions[index]}
          key={model.id}
          model={model}
          signature={LIGHT_SIGNATURES[index % LIGHT_SIGNATURES.length]}
          trunkOpen={model.id === activeFlagshipId && phase === "valet-stowing"}
          visible={!(model.id === activeFlagshipId && flagshipDriving)}
        />
      ))}
    </RigidBody>
  );
}
