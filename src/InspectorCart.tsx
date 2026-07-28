import { useFrame } from "@react-three/fiber";
import {
  CuboidCollider,
  type RapierRigidBody,
  RigidBody,
} from "@react-three/rapier";
import { type RefObject, useRef } from "react";
import { type Group, MathUtils } from "three";
import { ChaseCamera } from "./ChaseCamera";
import { type DrivingTelemetry, INSPECTOR_CART_TUNING } from "./driving";
import type { CartPresentation } from "./experience";
import type { WorldPosition } from "./flagshipLineup";
import { InspectorCartModel } from "./InspectorCartModel";
import {
  INSPECTOR_CART_COLLIDER_CENTER_Y,
  INSPECTOR_CART_COLLIDER_HALF_HEIGHT,
} from "./inspectorCartGeometry";
import { useArcadeVehicle } from "./useArcadeVehicle";

type InspectorCartProps = {
  awake: boolean;
  body: RefObject<RapierRigidBody | null>;
  cameraEnabled: boolean;
  controlsEnabled: boolean;
  initialPosition: WorldPosition;
  onTelemetry: (telemetry: DrivingTelemetry) => void;
  presentation: CartPresentation;
};

export function InspectorCart({
  awake,
  body,
  cameraEnabled,
  controlsEnabled,
  initialPosition,
  onTelemetry,
  presentation,
}: InspectorCartProps) {
  const packed = presentation === "packing" || presentation === "packed";
  const stowed = presentation === "stowed";
  const transferActive = presentation !== "driving";
  const cartModel = useRef<Group>(null);
  const motion = useArcadeVehicle({
    body,
    controlsEnabled,
    initialPosition,
    onTelemetry,
    tuning: INSPECTOR_CART_TUNING,
  });

  useFrame((_, delta) => {
    if (!cartModel.current) {
      return;
    }

    const scale = MathUtils.damp(
      cartModel.current.scale.x,
      packed ? 0.38 : 1,
      7,
      delta,
    );
    cartModel.current.scale.setScalar(scale);
  });

  return (
    <>
      <RigidBody
        angularDamping={5}
        canSleep={false}
        colliders={false}
        enabledRotations={[false, true, false]}
        friction={0.2}
        linearDamping={0.16}
        mass={1.7}
        name="inspector-cart"
        onCollisionEnter={({ other }) =>
          motion.onCollisionEnter(other.rigidBodyObject?.name)
        }
        onCollisionExit={({ other }) =>
          motion.onCollisionExit(other.rigidBodyObject?.name)
        }
        position={[initialPosition.x, initialPosition.y, initialPosition.z]}
        ref={body}
        restitution={0.92}
        type={transferActive ? "kinematicPosition" : "dynamic"}
      >
        <CuboidCollider
          args={[0.68, INSPECTOR_CART_COLLIDER_HALF_HEIGHT, 0.94]}
          friction={0.2}
          position={[0, INSPECTOR_CART_COLLIDER_CENTER_Y, 0]}
          restitution={0.92}
          sensor={transferActive}
        />
        <group ref={cartModel} visible={!stowed}>
          <InspectorCartModel
            awake={awake}
            input={motion.input}
            speed={motion.speed}
          />
        </group>
      </RigidBody>
      <ChaseCamera active={cameraEnabled} body={body} yaw={motion.yaw} />
    </>
  );
}
