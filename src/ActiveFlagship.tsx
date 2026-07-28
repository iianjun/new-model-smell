import { useFrame } from "@react-three/fiber";
import {
  CuboidCollider,
  type RapierRigidBody,
  RigidBody,
} from "@react-three/rapier";
import { type RefObject, useRef } from "react";
import { ChaseCamera } from "./ChaseCamera";
import { type DrivingTelemetry, FLAGSHIP_TUNING } from "./driving";
import type { FlagshipModel, WorldPosition } from "./flagshipLineup";
import { type LightSignature, ModelVehicleModel } from "./ModelVehicleModel";
import { useArcadeVehicle } from "./useArcadeVehicle";
import type { DrivingInput } from "./useDrivingInput";

const DRIVE_OUT_EXIT_Z = -0.78;
export const FLAGSHIP_INITIAL_YAW = Math.PI;

type ActiveFlagshipProps = {
  body: RefObject<RapierRigidBody | null>;
  controlsEnabled: boolean;
  dynoRunIntensity: RefObject<number>;
  initialYaw: number;
  initialPosition: WorldPosition;
  input: RefObject<DrivingInput>;
  model: FlagshipModel;
  movementEnabled: boolean;
  onDriveOutComplete: () => void;
  onTelemetry: (telemetry: DrivingTelemetry) => void;
  signature: LightSignature;
};

export function ActiveFlagship({
  body,
  controlsEnabled,
  dynoRunIntensity,
  initialYaw,
  initialPosition,
  input,
  model,
  movementEnabled,
  onDriveOutComplete,
  onTelemetry,
  signature,
}: ActiveFlagshipProps) {
  const driveOutReported = useRef(false);
  const motion = useArcadeVehicle({
    body,
    controlsEnabled,
    initialPosition,
    initialYaw,
    input,
    movementEnabled,
    onTelemetry,
    tuning: FLAGSHIP_TUNING,
  });

  useFrame(() => {
    const position = body.current?.translation();

    if (
      !controlsEnabled ||
      driveOutReported.current ||
      !position ||
      position.z < DRIVE_OUT_EXIT_Z
    ) {
      return;
    }

    driveOutReported.current = true;
    onDriveOutComplete();
  });

  return (
    <>
      <RigidBody
        angularDamping={5.8}
        canSleep={false}
        colliders={false}
        enabledRotations={[false, true, false]}
        friction={0.18}
        linearDamping={0.1}
        mass={4.8}
        name="active-flagship"
        onCollisionEnter={({ other }) =>
          motion.onCollisionEnter(other.rigidBodyObject?.name)
        }
        onCollisionExit={({ other }) =>
          motion.onCollisionExit(other.rigidBodyObject?.name)
        }
        position={[initialPosition.x, initialPosition.y, initialPosition.z]}
        ref={body}
        restitution={0.82}
        rotation={[0, initialYaw, 0]}
      >
        <CuboidCollider
          args={[0.94, 0.42, 1.42]}
          friction={0.18}
          position={[0, 0.48, 0]}
          restitution={0.82}
        />
        <ModelVehicleModel
          awake
          dynoRunIntensity={dynoRunIntensity}
          input={motion.input}
          model={model}
          signature={signature}
          speed={motion.speed}
        />
      </RigidBody>
      <ChaseCamera active body={body} yaw={motion.yaw} />
    </>
  );
}
