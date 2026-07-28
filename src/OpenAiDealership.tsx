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
  type FlagshipModel,
  formatPublicAvailabilityDate,
  formatReleaseAge,
  getReleaseAgeInDays,
  isInOpenAiShowroomRevealZone,
  OPENAI_COMPANY_TRIM,
} from "./flagshipLineup";

const CHARCOAL = "#252723";
const FLOOR = "#d8c8a8";
const GLASS = "#719498";
const SAFETY_ORANGE = "#ef6d32";
const WARM_IVORY = "#f2e7d2";
const SHOWROOM_POSITION = [-9.2, 0, -4.25] as const;
const LIGHT_SIGNATURE_POSITIONS = {
  1: [0],
  2: [-0.17, 0.17],
  3: [-0.34, 0, 0.34],
} as const;
const LIGHT_SIGNATURES = [1, 2, 3] as const;
const WHEEL_POSITIONS = [-0.68, 0.75].flatMap((z) =>
  [-0.91, 0.91].map((x) => ({ x, z })),
);

type LightSignature = keyof typeof LIGHT_SIGNATURE_POSITIONS;

type OpenAiDealershipProps = {
  inspectorCartBody: React.RefObject<RapierRigidBody | null>;
  lineup: readonly FlagshipModel[];
  onRevealActiveChange: (active: boolean) => void;
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

function VehicleDisplayLabel({ model }: { model: FlagshipModel }) {
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
      <planeGeometry args={[2.5, 0.78]} />
      <meshStandardMaterial map={texture} roughness={0.92} />
    </mesh>
  );
}

function ModelVehicle({
  displayX,
  model,
  signature,
}: {
  displayX: number;
  model: FlagshipModel;
  signature: LightSignature;
}) {
  return (
    <group position={[displayX, 0, -1.05]}>
      <mesh receiveShadow position={[0, 0.13, 0]}>
        <cylinderGeometry args={[1.35, 1.48, 0.26, 8]} />
        <meshStandardMaterial color={FLOOR} flatShading roughness={1} />
      </mesh>
      <mesh receiveShadow position={[0, 0.28, 0]}>
        <cylinderGeometry args={[1.05, 1.2, 0.1, 8]} />
        <meshStandardMaterial color={CHARCOAL} flatShading roughness={1} />
      </mesh>

      <group position={[0, 0.37, 0.15]}>
        <mesh castShadow receiveShadow position={[0, 0.42, 0]}>
          <boxGeometry args={[1.72, 0.42, 2.42]} />
          <meshStandardMaterial
            color={OPENAI_COMPANY_TRIM.body}
            flatShading
            roughness={0.82}
          />
        </mesh>
        <mesh castShadow position={[0, 0.39, 1.2]} rotation={[0.12, 0, 0]}>
          <boxGeometry args={[1.64, 0.2, 0.72]} />
          <meshStandardMaterial
            color={OPENAI_COMPANY_TRIM.body}
            flatShading
            roughness={0.82}
          />
        </mesh>
        <mesh castShadow position={[0, 0.72, -0.28]}>
          <boxGeometry args={[1.36, 0.46, 1.1]} />
          <meshStandardMaterial
            color={GLASS}
            emissive="#456064"
            emissiveIntensity={0.08}
            flatShading
            roughness={0.55}
          />
        </mesh>
        {WHEEL_POSITIONS.map(({ x, z }) => (
          <mesh
            castShadow
            key={`${x}-${z}`}
            position={[x, 0.27, z]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <cylinderGeometry args={[0.36, 0.36, 0.24, 10]} />
            <meshStandardMaterial color={CHARCOAL} flatShading roughness={1} />
          </mesh>
        ))}
        {LIGHT_SIGNATURE_POSITIONS[signature].map((x) => (
          <mesh key={`light-${x}`} position={[x, 0.46, 1.57]}>
            <boxGeometry args={[0.25, 0.1, 0.04]} />
            <meshStandardMaterial
              color={OPENAI_COMPANY_TRIM.light}
              emissive={OPENAI_COMPANY_TRIM.light}
              emissiveIntensity={1.2}
              flatShading
              roughness={0.7}
            />
          </mesh>
        ))}
        <mesh position={[0, 0.54, -1.23]}>
          <boxGeometry args={[1.2, 0.08, 0.035]} />
          <meshStandardMaterial
            color={OPENAI_COMPANY_TRIM.light}
            emissive={OPENAI_COMPANY_TRIM.light}
            emissiveIntensity={0.9}
            flatShading
            roughness={0.7}
          />
        </mesh>
      </group>

      <VehicleDisplayLabel model={model} />
    </group>
  );
}

function getDisplayPositions(modelCount: number) {
  if (modelCount <= 1) {
    return [-1.65];
  }

  const left = -1.85;
  const right = 1.85;

  return Array.from({ length: modelCount }, (_, index) =>
    MathUtils.lerp(left, right, index / (modelCount - 1)),
  );
}

function CutawayShell({
  inspectorCartBody,
  onRevealActiveChange,
}: Pick<OpenAiDealershipProps, "inspectorCartBody" | "onRevealActiveChange">) {
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
    const position = inspectorCartBody.current?.translation();

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
        <boxGeometry args={[7.45, 0.36, 6.35]} />
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
        position={[-3.48, 2, -0.05]}
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
        position={[3.48, 2, -0.05]}
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
        <boxGeometry args={[7.1, 2.6, 0.3]} />
        <meshStandardMaterial
          color={WARM_IVORY}
          flatShading
          ref={backWallMaterial}
          roughness={1}
          transparent
        />
      </mesh>
      <group ref={frontCanopy}>
        {[-2.84, 2.84].map((x) => (
          <mesh castShadow key={x} position={[x, 2, 2.86]} receiveShadow>
            <boxGeometry args={[1.28, 2.6, 0.3]} />
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
  inspectorCartBody,
  lineup,
  onRevealActiveChange,
}: OpenAiDealershipProps) {
  const displayPositions = getDisplayPositions(lineup.length);

  return (
    <RigidBody
      colliders={false}
      name={COLLISION_SURFACE.solidEnvironment}
      position={SHOWROOM_POSITION}
      type="fixed"
    >
      <CuboidCollider args={[3.45, 0.35, 0.18]} position={[0, 0.35, -2.95]} />
      <CuboidCollider
        args={[0.18, 0.35, 2.95]}
        position={[-3.48, 0.35, -0.05]}
      />
      <CuboidCollider
        args={[0.18, 0.35, 2.95]}
        position={[3.48, 0.35, -0.05]}
      />
      <CuboidCollider
        args={[0.64, 0.35, 0.18]}
        position={[-2.84, 0.35, 2.86]}
      />
      <CuboidCollider args={[0.64, 0.35, 0.18]} position={[2.84, 0.35, 2.86]} />
      {lineup.map((model, index) => (
        <CuboidCollider
          args={[0.95, 0.52, 1.4]}
          key={model.id}
          position={[displayPositions[index], 0.74, -0.9]}
          restitution={0.72}
        />
      ))}

      <mesh receiveShadow position={[0, 0.1, -0.05]}>
        <cylinderGeometry args={[4.15, 4.15, 0.2, 8]} />
        <meshStandardMaterial color={FLOOR} flatShading roughness={1} />
      </mesh>
      <mesh receiveShadow position={[0, 0.23, -0.05]}>
        <boxGeometry args={[7.1, 0.24, 5.85]} />
        <meshStandardMaterial color={WARM_IVORY} flatShading roughness={1} />
      </mesh>
      <mesh castShadow position={[0, 0.35, -2.95]} receiveShadow>
        <boxGeometry args={[7.1, 0.7, 0.3]} />
        <meshStandardMaterial color={WARM_IVORY} flatShading roughness={1} />
      </mesh>
      {[-3.48, 3.48].map((x) => (
        <mesh castShadow key={x} position={[x, 0.35, -0.05]} receiveShadow>
          <boxGeometry args={[0.3, 0.7, 5.95]} />
          <meshStandardMaterial color={WARM_IVORY} flatShading roughness={1} />
        </mesh>
      ))}
      {[-2.84, 2.84].map((x) => (
        <mesh castShadow key={x} position={[x, 0.35, 2.86]} receiveShadow>
          <boxGeometry args={[1.28, 0.7, 0.3]} />
          <meshStandardMaterial color={WARM_IVORY} flatShading roughness={1} />
        </mesh>
      ))}
      <CutawayShell
        inspectorCartBody={inspectorCartBody}
        onRevealActiveChange={onRevealActiveChange}
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

      {lineup.map((model, index) => (
        <ModelVehicle
          displayX={displayPositions[index]}
          key={model.id}
          model={model}
          signature={LIGHT_SIGNATURES[index % LIGHT_SIGNATURES.length]}
        />
      ))}
    </RigidBody>
  );
}
