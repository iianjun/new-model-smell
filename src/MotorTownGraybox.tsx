import {
  CuboidCollider,
  CylinderCollider,
  type RapierRigidBody,
  RigidBody,
} from "@react-three/rapier";
import { COLLISION_SURFACE } from "./driving";
import type { ValetTransferController } from "./experience";
import type { FlagshipModel } from "./flagshipLineup";
import { OpenAiDealership } from "./OpenAiDealership";
import {
  TOWN_BUILDING_KIT,
  type TownBuildingTransform,
  TownPropKit,
  type TownRoadSegment,
  type TownTreeTransform,
} from "./TownPropKit";
import { MOTOR_TOWN_PALETTE } from "./visualLanguage";

type GroundPoint = readonly [x: number, z: number];

const {
  charcoal: CHARCOAL,
  fadedGreen: FADED_GREEN,
  paleBlue: PALE_BLUE,
  safetyOrange: SAFETY_ORANGE,
  warmIvory: WARM_IVORY,
} = MOTOR_TOWN_PALETTE;
const TOWN_POINTS = {
  left: [-8.4, -3.5] as GroundPoint,
  right: [8.4, -3.5] as GroundPoint,
  start: [0, 8.5] as GroundPoint,
};

const ROAD_CLOSURES: readonly {
  position: [number, number, number];
  rotation: number;
}[] = [
  { position: [0, 0, -8.25], rotation: 0 },
  { position: [-12.25, 0, -6.15], rotation: -Math.PI / 3 },
  { position: [12.25, 0, -6.15], rotation: Math.PI / 3 },
];

const ROADS: readonly TownRoadSegment[] = [
  { start: TOWN_POINTS.start, end: TOWN_POINTS.left },
  { start: TOWN_POINTS.left, end: TOWN_POINTS.right },
  { start: TOWN_POINTS.right, end: TOWN_POINTS.start },
  { start: [0, -3.5], end: [0, -9], width: 3.4 },
  { start: TOWN_POINTS.left, end: [-13, -6.6], width: 3.4 },
  { start: TOWN_POINTS.right, end: [13, -6.6], width: 3.4 },
];

type BoundaryWallProps = {
  length: number;
  position: [number, number, number];
  rotation?: number;
};

function BoundaryWall({ length, position, rotation = 0 }: BoundaryWallProps) {
  return (
    <RigidBody
      colliders={false}
      name={COLLISION_SURFACE.townBoundary}
      position={position}
      rotation={[0, rotation, 0]}
      type="fixed"
    >
      <CuboidCollider args={[length / 2, 0.45, 0.28]} restitution={0.9} />
      <mesh castShadow receiveShadow>
        <boxGeometry args={[length, 0.9, 0.56]} />
        <meshStandardMaterial color={WARM_IVORY} flatShading roughness={1} />
      </mesh>
      <mesh position={[0, 0.28, 0.29]}>
        <boxGeometry args={[length * 0.96, 0.12, 0.03]} />
        <meshStandardMaterial color={SAFETY_ORANGE} flatShading roughness={1} />
      </mesh>
    </RigidBody>
  );
}

type BarrierProps = {
  position: [number, number, number];
  rotation?: number;
};

function BlockedRoadBarrier({ position, rotation = 0 }: BarrierProps) {
  return (
    <RigidBody
      colliders={false}
      name={COLLISION_SURFACE.townBoundary}
      position={position}
      rotation={[0, rotation, 0]}
      type="fixed"
    >
      <CuboidCollider args={[1.9, 0.65, 0.25]} restitution={1.05} />
    </RigidBody>
  );
}

function CentralLandmarkPlot() {
  return (
    <RigidBody
      colliders={false}
      name={COLLISION_SURFACE.centralLandmark}
      position={[0, 0, 0.1]}
      type="fixed"
    >
      <CylinderCollider args={[0.75, 2.25]} restitution={1.05} />
      <group>
        <mesh receiveShadow position={[0, 0.18, 0]}>
          <cylinderGeometry args={[2.6, 2.85, 0.36, 12]} />
          <meshStandardMaterial color="#c7b994" flatShading roughness={1} />
        </mesh>
        <mesh castShadow receiveShadow position={[0, 0.48, 0]}>
          <cylinderGeometry args={[1.8, 2.15, 0.38, 12]} />
          <meshStandardMaterial color={CHARCOAL} flatShading roughness={1} />
        </mesh>
      </group>
    </RigidBody>
  );
}

function TreeCollider({
  position,
  scale,
}: Pick<TownTreeTransform, "position" | "scale">) {
  return (
    <RigidBody
      colliders={false}
      name={COLLISION_SURFACE.solidEnvironment}
      position={position}
      type="fixed"
    >
      <CylinderCollider
        args={[1.15 * scale, 0.7 * scale]}
        position={[0, 1.15 * scale, 0]}
        restitution={0.9}
      />
    </RigidBody>
  );
}

function StartMarking() {
  return (
    <group position={[0, 0.13, 7.2]}>
      {[-0.8, -0.4, 0, 0.4, 0.8].map((z) => (
        <mesh key={z} position={[0, 0, z]}>
          <boxGeometry args={[2.35, 0.02, 0.16]} />
          <meshStandardMaterial
            color={z === 0 ? SAFETY_ORANGE : WARM_IVORY}
            flatShading
            roughness={1}
          />
        </mesh>
      ))}
    </group>
  );
}

const BACKGROUND_BUILDINGS: readonly TownBuildingTransform[] = [
  {
    kind: "building-a",
    position: [-10, 0, -10.5],
    rotation: 0,
    scale: 3.2,
  },
  {
    kind: "building-b",
    position: [-5.8, 0, -10.5],
    rotation: 0,
    scale: 3,
  },
  {
    kind: "building-a",
    position: [5.6, 0, -10.5],
    rotation: Math.PI,
    scale: 3.5,
  },
  {
    kind: "building-b",
    position: [10.2, 0, -10.5],
    rotation: Math.PI,
    scale: 3.2,
  },
];

function getTownBuildingDimensions({
  kind,
  scale,
}: Pick<TownBuildingTransform, "kind" | "scale">) {
  const [unitWidth, unitHeight, unitDepth] =
    TOWN_BUILDING_KIT[kind].colliderSize;

  return {
    depth: unitDepth * scale,
    height: unitHeight * scale,
    width: unitWidth * scale,
  };
}

const TOWN_TREES: readonly TownTreeTransform[] = [
  {
    kind: "large",
    position: [-12.1, 0, 9.2],
    rotation: 0.2,
    scale: 4.4,
  },
  {
    kind: "small",
    position: [-8.7, 0, 9.8],
    rotation: -0.5,
    scale: 3.8,
  },
  {
    kind: "large",
    position: [13, 0, 9.5],
    rotation: -0.25,
    scale: 4.2,
  },
  {
    kind: "small",
    position: [11.6, 0, 10.4],
    rotation: 0.8,
    scale: 3.6,
  },
  {
    kind: "small",
    position: [-4.8, 0, -8.6],
    rotation: -0.7,
    scale: 4,
  },
  {
    kind: "large",
    position: [4.9, 0, -8.8],
    rotation: 0.4,
    scale: 4.3,
  },
];

function DistantBuildingColliders() {
  return (
    <group>
      {BACKGROUND_BUILDINGS.map(({ kind, position, scale }) => {
        const { depth, height, width } = getTownBuildingDimensions({
          kind,
          scale,
        });

        return (
          <RigidBody
            colliders={false}
            key={position[0]}
            name={COLLISION_SURFACE.solidEnvironment}
            position={position}
            type="fixed"
          >
            <CuboidCollider
              args={[width / 2, height / 2, depth / 2]}
              position={[0, height / 2, 0]}
              restitution={0.9}
            />
          </RigidBody>
        );
      })}
    </group>
  );
}

function DistantDealershipSilhouettes() {
  return (
    <group name="distant-dealership-silhouettes">
      {BACKGROUND_BUILDINGS.map(({ kind, position, scale }, index) => {
        const { depth, height, width } = getTownBuildingDimensions({
          kind,
          scale,
        });
        const townFacingZ = position[2] + depth / 2 + 0.1;
        const accent = index % 2 === 0 ? SAFETY_ORANGE : PALE_BLUE;

        return (
          <group key={`dealership-${position[0]}`}>
            <mesh
              castShadow
              position={[position[0], height * 0.58, townFacingZ]}
            >
              <boxGeometry args={[width * 0.7, 0.34, 0.2]} />
              <meshStandardMaterial
                color={WARM_IVORY}
                flatShading
                roughness={1}
              />
            </mesh>
            <mesh position={[position[0], height * 0.58, townFacingZ + 0.11]}>
              <boxGeometry args={[width * 0.44, 0.08, 0.04]} />
              <meshStandardMaterial color={accent} flatShading roughness={1} />
            </mesh>
            <group
              position={[position[0] + width * 0.48, 0, townFacingZ + 0.32]}
            >
              <mesh castShadow position={[0, 1.25, 0]}>
                <boxGeometry args={[0.16, 2.5, 0.16]} />
                <meshStandardMaterial
                  color={CHARCOAL}
                  flatShading
                  roughness={1}
                />
              </mesh>
              <mesh castShadow position={[0, 2.55, 0]}>
                <boxGeometry args={[0.76, 0.58, 0.18]} />
                <meshStandardMaterial
                  color={accent}
                  flatShading
                  roughness={1}
                />
              </mesh>
              <mesh position={[0, 2.55, 0.1]}>
                <boxGeometry args={[0.38, 0.08, 0.04]} />
                <meshStandardMaterial
                  color={WARM_IVORY}
                  flatShading
                  roughness={1}
                />
              </mesh>
            </group>
          </group>
        );
      })}
    </group>
  );
}

type MotorTownGrayboxProps = {
  activeFlagshipBody: React.RefObject<RapierRigidBody | null>;
  inspectorCartBody: React.RefObject<RapierRigidBody | null>;
  onShowroomVisibilityChange: (visible: boolean) => void;
  openAiFlagshipLineup: readonly FlagshipModel[];
  valetTransfer: ValetTransferController;
};

export function MotorTownGraybox({
  activeFlagshipBody,
  inspectorCartBody,
  onShowroomVisibilityChange,
  openAiFlagshipLineup,
  valetTransfer,
}: MotorTownGrayboxProps) {
  return (
    <>
      <color attach="background" args={[PALE_BLUE]} />
      <fog attach="fog" args={[PALE_BLUE, 22, 42]} />

      <RigidBody colliders={false} type="fixed">
        <CuboidCollider
          args={[17, 0.25, 14]}
          friction={0.32}
          position={[0, -0.25, 0]}
        />
        <mesh receiveShadow position={[0, -0.25, 0]}>
          <boxGeometry args={[34, 0.5, 28]} />
          <meshStandardMaterial color={FADED_GREEN} flatShading roughness={1} />
        </mesh>
      </RigidBody>

      <StartMarking />
      <OpenAiDealership
        activeFlagshipBody={activeFlagshipBody}
        inspectorCartBody={inspectorCartBody}
        lineup={openAiFlagshipLineup}
        onRevealActiveChange={onShowroomVisibilityChange}
        valetTransfer={valetTransfer}
      />
      <CentralLandmarkPlot />
      <TownPropKit
        buildings={BACKGROUND_BUILDINGS}
        roadClosures={ROAD_CLOSURES}
        roads={ROADS}
        trees={TOWN_TREES}
      />
      <DistantDealershipSilhouettes />

      {ROAD_CLOSURES.map(({ position, rotation }) => (
        <BlockedRoadBarrier
          key={`${position[0]}-${position[2]}`}
          position={[...position]}
          rotation={rotation}
        />
      ))}

      <BoundaryWall length={27} position={[0, 0.45, 12]} />
      <BoundaryWall length={27} position={[0, 0.45, -11.5]} />
      <BoundaryWall
        length={23.5}
        position={[-14.2, 0.45, 0.25]}
        rotation={Math.PI / 2}
      />
      <BoundaryWall
        length={23.5}
        position={[14.2, 0.45, 0.25]}
        rotation={Math.PI / 2}
      />

      <DistantBuildingColliders />

      {TOWN_TREES.map(({ position, scale }) => (
        <TreeCollider
          key={`${position[0]}-${position[2]}`}
          position={position}
          scale={scale / 4}
        />
      ))}
    </>
  );
}
