import { useFrame, useThree } from "@react-three/fiber";
import type { RapierRigidBody } from "@react-three/rapier";
import { type RefObject, useRef } from "react";
import { Vector3 } from "three";
import { getHeadingBasis } from "./driving";

type ChaseCameraProps = {
  body: RefObject<RapierRigidBody | null>;
  yaw: RefObject<number>;
};

export function ChaseCamera({ body, yaw }: ChaseCameraProps) {
  const cameraTarget = useRef(new Vector3());
  const desiredCameraPosition = useRef(new Vector3());
  const { camera } = useThree();

  useFrame((_, frameDelta) => {
    const rigidBody = body.current;

    if (!rigidBody) {
      return;
    }

    const delta = Math.min(frameDelta, 0.05);
    const position = rigidBody.translation();
    const heading = getHeadingBasis(yaw.current);

    desiredCameraPosition.current.set(
      position.x - heading.forwardX * 9.5 + heading.rightX * 4.2,
      position.y + 8.8,
      position.z - heading.forwardZ * 9.5 + heading.rightZ * 4.2,
    );
    cameraTarget.current.set(
      position.x + heading.forwardX * 2.6,
      position.y + 0.4,
      position.z + heading.forwardZ * 2.6,
    );

    const cameraBlend = 1 - Math.exp(-4.2 * delta);
    camera.position.lerp(desiredCameraPosition.current, cameraBlend);
    camera.lookAt(cameraTarget.current);
  });

  return null;
}
