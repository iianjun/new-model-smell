import {
  CuboidCollider,
  CylinderCollider,
  type RapierRigidBody,
  RigidBody,
} from "@react-three/rapier";
import { COLLISION_SURFACE } from "./driving";
import type { FlagshipModel } from "./flagshipLineup";
import { OpenAiDealership } from "./OpenAiDealership";

type GroundPoint = readonly [x: number, z: number];

const ASPHALT = "#343834";
const CHARCOAL = "#252723";
const FADED_GREEN = "#8fa263";
const PALE_BLUE = "#b9d8dc";
const SAFETY_ORANGE = "#ef6d32";
const WARM_IVORY = "#f2e7d2";
const ROAD_SURFACE_WIDTH_INSET = 0.04;

const TOWN_POINTS = {
  left: [-8.4, -3.5] as GroundPoint,
  right: [8.4, -3.5] as GroundPoint,
  start: [0, 8.5] as GroundPoint,
};

type RoadSegmentProps = {
  end: GroundPoint;
  start: GroundPoint;
  width?: number;
};

function RoadSegment({ end, start, width = 4.1 }: RoadSegmentProps) {
  const deltaX = end[0] - start[0];
  const deltaZ = end[1] - start[1];
  const length = Math.hypot(deltaX, deltaZ);
  const midpointX = (start[0] + end[0]) / 2;
  const midpointZ = (start[1] + end[1]) / 2;
  const rotation = Math.atan2(deltaX, deltaZ);

  return (
    <group position={[midpointX, 0, midpointZ]} rotation={[0, rotation, 0]}>
      <mesh
        receiveShadow
        position={[0, 0.09, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[width - ROAD_SURFACE_WIDTH_INSET, length]} />
        <meshStandardMaterial color={ASPHALT} flatShading roughness={1} />
      </mesh>
      <mesh position={[0, 0.101, 0]}>
        <boxGeometry args={[0.1, 0.01, length * 0.86]} />
        <meshStandardMaterial color={WARM_IVORY} flatShading roughness={1} />
      </mesh>
      <mesh position={[-width / 2 + 0.14, 0.12, 0]}>
        <boxGeometry args={[0.28, 0.22, length]} />
        <meshStandardMaterial color="#d8c8a8" flatShading roughness={1} />
      </mesh>
      <mesh position={[width / 2 - 0.14, 0.12, 0]}>
        <boxGeometry args={[0.28, 0.22, length]} />
        <meshStandardMaterial color="#d8c8a8" flatShading roughness={1} />
      </mesh>
    </group>
  );
}

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
      <group>
        <mesh castShadow position={[0, 0.65, 0]}>
          <boxGeometry args={[3.8, 0.48, 0.42]} />
          <meshStandardMaterial
            color={SAFETY_ORANGE}
            flatShading
            roughness={1}
          />
        </mesh>
        {[-1.15, 0, 1.15].map((x) => (
          <mesh key={x} position={[x, 0.65, 0.215]}>
            <boxGeometry args={[0.54, 0.5, 0.03]} />
            <meshStandardMaterial
              color={WARM_IVORY}
              flatShading
              roughness={1}
            />
          </mesh>
        ))}
        {[-1.45, 1.45].map((x) => (
          <mesh castShadow key={x} position={[x, 0.1, 0]}>
            <boxGeometry args={[0.22, 1.35, 0.22]} />
            <meshStandardMaterial color={CHARCOAL} flatShading roughness={1} />
          </mesh>
        ))}
      </group>
    </RigidBody>
  );
}

type DestinationPlotProps = {
  accent: string;
  position: [number, number, number];
  roofHeight: number;
};

function DestinationPlot({
  accent,
  position,
  roofHeight,
}: DestinationPlotProps) {
  return (
    <RigidBody
      colliders={false}
      name={COLLISION_SURFACE.solidEnvironment}
      position={position}
      type="fixed"
    >
      <CylinderCollider args={[0.12, 3.15]} position={[0, 0.12, 0]} />
      <CuboidCollider
        args={[2.4, roofHeight / 2, 1.75]}
        position={[0, roofHeight / 2, -0.45]}
        restitution={0.9}
      />
      <CuboidCollider
        args={[2.6, 0.28, 1.95]}
        position={[0, roofHeight + 0.28, -0.45]}
      />
      <CuboidCollider args={[1.65, 0.09, 0.17]} position={[0, 0.54, 1.47]} />
      <mesh receiveShadow position={[0, 0.12, 0]}>
        <cylinderGeometry args={[3.15, 3.15, 0.24, 6]} />
        <meshStandardMaterial color="#c7b994" flatShading roughness={1} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, roofHeight / 2, -0.45]}>
        <boxGeometry args={[4.8, roofHeight, 3.5]} />
        <meshStandardMaterial color={WARM_IVORY} flatShading roughness={1} />
      </mesh>
      <mesh castShadow position={[0, roofHeight + 0.28, -0.45]}>
        <boxGeometry args={[5.2, 0.56, 3.9]} />
        <meshStandardMaterial color={accent} flatShading roughness={1} />
      </mesh>
      <mesh position={[0, 1.05, 1.32]}>
        <boxGeometry args={[2.65, 1.8, 0.08]} />
        <meshStandardMaterial
          color="#719498"
          emissive="#719498"
          emissiveIntensity={0.08}
          flatShading
          roughness={0.9}
        />
      </mesh>
      <mesh castShadow position={[0, 0.54, 1.47]}>
        <boxGeometry args={[3.3, 0.18, 0.34]} />
        <meshStandardMaterial color={accent} flatShading roughness={1} />
      </mesh>
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

type TreeProps = {
  position: [number, number, number];
  scale?: number;
};

function GrayboxTree({ position, scale = 1 }: TreeProps) {
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
      <group scale={scale}>
        <mesh castShadow position={[0, 0.55, 0]}>
          <boxGeometry args={[0.3, 1.1, 0.3]} />
          <meshStandardMaterial color="#66533b" flatShading roughness={1} />
        </mesh>
        <mesh castShadow position={[0, 1.4, 0]}>
          <coneGeometry args={[0.78, 1.8, 5]} />
          <meshStandardMaterial color={FADED_GREEN} flatShading roughness={1} />
        </mesh>
      </group>
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

function DistantSilhouettes() {
  return (
    <group position={[0, 0, -10.5]}>
      {[
        [-10, 1.4, 2.4],
        [-5.8, 2.1, 3.8],
        [5.6, 1.7, 3],
        [10.2, 2.4, 4.4],
      ].map(([x, height, width]) => (
        <RigidBody
          colliders={false}
          key={x}
          name={COLLISION_SURFACE.solidEnvironment}
          position={[x, 0, 0]}
          type="fixed"
        >
          <CuboidCollider
            args={[width / 2, height / 2, 1]}
            position={[0, height / 2, 0]}
            restitution={0.9}
          />
          <mesh castShadow position={[0, height / 2, 0]}>
            <boxGeometry args={[width, height, 2]} />
            <meshStandardMaterial color="#d8c8a8" flatShading roughness={1} />
          </mesh>
        </RigidBody>
      ))}
    </group>
  );
}

type MotorTownGrayboxProps = {
  inspectorCartBody: React.RefObject<RapierRigidBody | null>;
  onShowroomVisibilityChange: (visible: boolean) => void;
  openAiFlagshipLineup: readonly FlagshipModel[];
};

export function MotorTownGraybox({
  inspectorCartBody,
  onShowroomVisibilityChange,
  openAiFlagshipLineup,
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

      <RoadSegment start={TOWN_POINTS.start} end={TOWN_POINTS.left} />
      <RoadSegment start={TOWN_POINTS.left} end={TOWN_POINTS.right} />
      <RoadSegment start={TOWN_POINTS.right} end={TOWN_POINTS.start} />
      <RoadSegment start={[0, -3.5]} end={[0, -9]} width={3.4} />
      <RoadSegment start={TOWN_POINTS.left} end={[-13, -6.6]} width={3.4} />
      <RoadSegment start={TOWN_POINTS.right} end={[13, -6.6]} width={3.4} />

      <StartMarking />
      <OpenAiDealership
        inspectorCartBody={inspectorCartBody}
        lineup={openAiFlagshipLineup}
        onRevealActiveChange={onShowroomVisibilityChange}
      />
      <DestinationPlot
        accent="#718654"
        position={[9.2, 0, -4.25]}
        roofHeight={2}
      />
      <CentralLandmarkPlot />

      <BlockedRoadBarrier position={[0, 0, -8.25]} />
      <BlockedRoadBarrier
        position={[-12.25, 0, -6.15]}
        rotation={-Math.PI / 3}
      />
      <BlockedRoadBarrier position={[12.25, 0, -6.15]} rotation={Math.PI / 3} />

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

      <DistantSilhouettes />

      {[
        [-12.1, 0, 7.7, 1.1],
        [-9.4, 0, 6, 0.8],
        [11.8, 0, 7.1, 1.05],
        [8.9, 0, 7.7, 0.75],
        [-4.8, 0, -8.6, 0.9],
        [4.9, 0, -8.8, 1.1],
      ].map(([x, y, z, scale]) => (
        <GrayboxTree key={`${x}-${z}`} position={[x, y, z]} scale={scale} />
      ))}
    </>
  );
}
