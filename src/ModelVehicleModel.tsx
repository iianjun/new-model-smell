import { useFrame } from "@react-three/fiber";
import { type RefObject, useRef } from "react";
import {
  type Group,
  MathUtils,
  type Mesh,
  type MeshStandardMaterial,
} from "three";
import { FLAGSHIP_TUNING } from "./driving";
import type { FlagshipModel } from "./flagshipLineup";
import { OPENAI_COMPANY_TRIM } from "./flagshipLineup";
import type { DrivingInput } from "./useDrivingInput";

const CHARCOAL = "#252723";
const GLASS = "#719498";
export const LIGHT_SIGNATURE_POSITIONS = {
  1: [0],
  2: [-0.17, 0.17],
  3: [-0.34, 0, 0.34],
} as const;
export const LIGHT_SIGNATURES = [1, 2, 3] as const;
const WHEEL_POSITIONS = [-0.68, 0.75].flatMap((z) =>
  [-0.91, 0.91].map((x) => ({ x, z })),
);

export type LightSignature = keyof typeof LIGHT_SIGNATURE_POSITIONS;

type ModelVehicleModelProps = {
  awake: boolean;
  input?: RefObject<DrivingInput>;
  model: FlagshipModel;
  signature: LightSignature;
  speed?: RefObject<number>;
  trunkOpen?: boolean;
};

export function ModelVehicleModel({
  awake,
  input,
  model,
  signature,
  speed,
  trunkOpen = false,
}: ModelVehicleModelProps) {
  const body = useRef<Group>(null);
  const frontLights = useRef<MeshStandardMaterial[]>([]);
  const rearLight = useRef<MeshStandardMaterial>(null);
  const trunkLid = useRef<Group>(null);
  const wheels = useRef<Mesh[]>([]);
  const wakeProgress = useRef(0);

  useFrame((_, delta) => {
    wakeProgress.current = MathUtils.damp(
      wakeProgress.current,
      awake ? 1 : 0,
      6.5,
      delta,
    );
    const wake = wakeProgress.current;
    const currentSpeed = speed?.current ?? 0;
    const drivingAmount = Math.min(
      Math.abs(currentSpeed) / FLAGSHIP_TUNING.forwardSpeed,
      1,
    );

    for (const material of frontLights.current) {
      material.emissiveIntensity = 0.15 + wake * 2.85;
    }

    if (rearLight.current) {
      rearLight.current.emissiveIntensity = 0.12 + wake * 1.65;
    }

    if (trunkLid.current) {
      trunkLid.current.rotation.x = MathUtils.damp(
        trunkLid.current.rotation.x,
        trunkOpen ? 1.05 : 0,
        6,
        delta,
      );
    }

    for (const wheel of wheels.current) {
      wheel.rotation.x -= currentSpeed * delta * 1.8;
    }

    if (body.current) {
      body.current.rotation.z = MathUtils.damp(
        body.current.rotation.z,
        (input?.current.steer ?? 0) * -0.025 * drivingAmount,
        6,
        delta,
      );
      body.current.rotation.x = MathUtils.damp(
        body.current.rotation.x,
        (input?.current.throttle ?? 0) * -0.018,
        5,
        delta,
      );
    }
  });

  return (
    <group name={`model-vehicle-${model.id}`} ref={body}>
      <mesh castShadow receiveShadow position={[0, 0.58, 0]}>
        <boxGeometry args={[1.72, 0.42, 2.42]} />
        <meshStandardMaterial
          color={OPENAI_COMPANY_TRIM.body}
          flatShading
          roughness={0.82}
        />
      </mesh>
      <mesh castShadow position={[0, 0.55, -1.2]} rotation={[-0.12, 0, 0]}>
        <boxGeometry args={[1.64, 0.2, 0.72]} />
        <meshStandardMaterial
          color={OPENAI_COMPANY_TRIM.body}
          flatShading
          roughness={0.82}
        />
      </mesh>
      <mesh castShadow position={[0, 0.88, 0.28]}>
        <boxGeometry args={[1.36, 0.46, 1.1]} />
        <meshStandardMaterial
          color={GLASS}
          emissive="#456064"
          emissiveIntensity={0.08}
          flatShading
          roughness={0.55}
        />
      </mesh>
      <mesh position={[0, 0.9, 0.74]}>
        <boxGeometry args={[1.5, 0.34, 1.1]} />
        <meshStandardMaterial color={CHARCOAL} flatShading roughness={1} />
      </mesh>
      <group position={[0, 1.05, 1.25]} ref={trunkLid}>
        <mesh castShadow position={[0, 0, -0.5]}>
          <boxGeometry args={[1.56, 0.12, 1]} />
          <meshStandardMaterial
            color={OPENAI_COMPANY_TRIM.body}
            flatShading
            roughness={0.82}
          />
        </mesh>
        <mesh position={[0, 0.065, -0.5]}>
          <boxGeometry args={[1.32, 0.02, 0.76]} />
          <meshStandardMaterial color={CHARCOAL} flatShading roughness={1} />
        </mesh>
      </group>
      {WHEEL_POSITIONS.map(({ x, z }, index) => (
        <mesh
          castShadow
          key={`${x}-${z}`}
          position={[x, 0.36, z]}
          ref={(wheel) => {
            if (wheel) {
              wheels.current[index] = wheel;
            }
          }}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[0.36, 0.36, 0.24, 10]} />
          <meshStandardMaterial color={CHARCOAL} flatShading roughness={1} />
        </mesh>
      ))}
      {LIGHT_SIGNATURE_POSITIONS[signature].map((x, index) => (
        <mesh key={`light-${x}`} position={[x, 0.62, -1.57]}>
          <boxGeometry args={[0.25, 0.1, 0.04]} />
          <meshStandardMaterial
            color={OPENAI_COMPANY_TRIM.light}
            emissive={OPENAI_COMPANY_TRIM.light}
            emissiveIntensity={0.15}
            flatShading
            ref={(material) => {
              if (material) {
                frontLights.current[index] = material;
              }
            }}
            roughness={0.7}
          />
        </mesh>
      ))}
      <mesh position={[0, 0.7, 1.23]}>
        <boxGeometry args={[1.2, 0.08, 0.035]} />
        <meshStandardMaterial
          color={OPENAI_COMPANY_TRIM.light}
          emissive={OPENAI_COMPANY_TRIM.light}
          emissiveIntensity={0.12}
          flatShading
          ref={rearLight}
          roughness={0.7}
        />
      </mesh>
    </group>
  );
}
