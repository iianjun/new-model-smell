import { useFrame } from "@react-three/fiber";
import { type RefObject, useRef } from "react";
import { type Group, MathUtils, type Object3D } from "three";
import { INSPECTOR_CART_TUNING } from "./driving";
import type { DrivingInput } from "./useDrivingInput";

type InspectorCartModelProps = {
  input: RefObject<DrivingInput>;
  speed: RefObject<number>;
};

export function InspectorCartModel({ input, speed }: InspectorCartModelProps) {
  const cartBody = useRef<Group>(null);
  const clipboard = useRef<Object3D>(null);
  const smellDetector = useRef<Group>(null);

  useFrame(({ clock }, delta) => {
    const body = cartBody.current;
    const detector = smellDetector.current;
    const clipboardMesh = clipboard.current;
    const currentSpeed = speed.current;
    const movement = Math.min(
      Math.abs(currentSpeed) / INSPECTOR_CART_TUNING.forwardSpeed,
      1,
    );

    if (body) {
      const wobble = Math.sin(clock.elapsedTime * 10) * 0.035 * movement;
      body.rotation.z = MathUtils.damp(body.rotation.z, wobble, 9, delta);
      body.rotation.x = MathUtils.damp(
        body.rotation.x,
        input.current.throttle * -0.035 + Math.abs(input.current.steer) * 0.018,
        8,
        delta,
      );
    }

    if (detector) {
      detector.rotation.y += delta * (1.4 + movement * 3.2);
    }

    if (clipboardMesh) {
      clipboardMesh.rotation.z =
        -0.12 + Math.sin(clock.elapsedTime * 7) * 0.055 * movement;
    }
  });

  return (
    <group ref={cartBody}>
      <mesh castShadow receiveShadow position={[0, 0.05, 0]}>
        <boxGeometry args={[1.35, 0.62, 1.85]} />
        <meshStandardMaterial color="#f2e7d2" flatShading roughness={1} />
      </mesh>
      <mesh castShadow position={[0, 0.43, 0.28]}>
        <boxGeometry args={[1.12, 0.34, 0.9]} />
        <meshStandardMaterial color="#ef6d32" flatShading roughness={1} />
      </mesh>
      <mesh castShadow position={[0, 0.88, 0.22]}>
        <boxGeometry args={[1.08, 0.56, 0.72]} />
        <meshStandardMaterial color="#343834" flatShading roughness={1} />
      </mesh>
      <mesh castShadow position={[0, 1.28, 0.16]}>
        <boxGeometry args={[1.4, 0.14, 1.12]} />
        <meshStandardMaterial color="#f2e7d2" flatShading roughness={1} />
      </mesh>

      {[-0.57, 0.57].flatMap((x) =>
        [-0.62, 0.62].map((z) => (
          <mesh
            castShadow
            key={`${x}-${z}`}
            position={[x, -0.27, z]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <cylinderGeometry args={[0.3, 0.3, 0.24, 8]} />
            <meshStandardMaterial color="#252723" flatShading roughness={1} />
          </mesh>
        )),
      )}

      {[-0.55, 0.55].flatMap((x) =>
        [-0.25, 0.7].map((z) => (
          <mesh castShadow key={`${x}-${z}`} position={[x, 0.86, z]}>
            <boxGeometry args={[0.1, 0.9, 0.1]} />
            <meshStandardMaterial color="#ef6d32" flatShading roughness={1} />
          </mesh>
        )),
      )}

      <group ref={smellDetector} position={[0, 1.58, 0.1]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.09, 0.09, 0.58, 8]} />
          <meshStandardMaterial color="#252723" flatShading roughness={1} />
        </mesh>
        <mesh castShadow position={[0, 0.36, 0]}>
          <coneGeometry args={[0.28, 0.4, 6]} />
          <meshStandardMaterial color="#ef6d32" flatShading roughness={1} />
        </mesh>
        <mesh castShadow position={[0, 0.55, 0]}>
          <sphereGeometry args={[0.13, 8, 6]} />
          <meshStandardMaterial
            color="#f5c85e"
            emissive="#ef6d32"
            emissiveIntensity={0.28}
            flatShading
            roughness={1}
          />
        </mesh>
      </group>

      <mesh castShadow position={[0, 0.1, -0.98]} rotation={[0, 0, 0]}>
        <boxGeometry args={[1.18, 0.32, 0.12]} />
        <meshStandardMaterial color="#ef6d32" flatShading roughness={1} />
      </mesh>
      <mesh
        castShadow
        position={[0.73, 0.46, -0.15]}
        ref={clipboard}
        rotation={[0.08, 0.12, -0.12]}
      >
        <boxGeometry args={[0.06, 0.62, 0.48]} />
        <meshStandardMaterial color="#d8c8a8" flatShading roughness={1} />
      </mesh>
    </group>
  );
}
