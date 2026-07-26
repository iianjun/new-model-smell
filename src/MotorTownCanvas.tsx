import { Canvas } from "@react-three/fiber";
import { CuboidCollider, Physics, RigidBody } from "@react-three/rapier";
import { Suspense, useEffect } from "react";

type MotorTownCanvasProps = {
  onReady: () => void;
};

function RuntimeReady({ onReady }: MotorTownCanvasProps) {
  useEffect(() => {
    const frame = window.requestAnimationFrame(onReady);

    return () => window.cancelAnimationFrame(frame);
  }, [onReady]);

  return null;
}

function InspectionCrate() {
  return (
    <RigidBody
      angularDamping={0.65}
      colliders={false}
      linearDamping={0.35}
      position={[0, 4.75, 0]}
      rotation={[0.22, 0.3, 0.16]}
    >
      <CuboidCollider
        args={[0.7, 0.7, 0.7]}
        friction={0.9}
        restitution={0.08}
      />
      <group>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.4, 1.4, 1.4]} />
          <meshStandardMaterial color="#ef6d32" roughness={0.82} />
        </mesh>
        <mesh castShadow position={[0, 0, 0.706]}>
          <boxGeometry args={[1.06, 0.24, 0.035]} />
          <meshStandardMaterial color="#f2e7d2" roughness={0.9} />
        </mesh>
        <mesh
          castShadow
          position={[0.706, 0, 0]}
          rotation={[0, Math.PI / 2, 0]}
        >
          <boxGeometry args={[1.06, 0.24, 0.035]} />
          <meshStandardMaterial color="#252723" roughness={0.9} />
        </mesh>
      </group>
    </RigidBody>
  );
}

function InspectionFloor() {
  return (
    <RigidBody colliders={false} type="fixed">
      <CuboidCollider
        args={[6, 0.25, 6]}
        friction={1}
        position={[0, -0.25, 0]}
      />
      <mesh receiveShadow position={[0, -0.25, 0]}>
        <boxGeometry args={[12, 0.5, 12]} />
        <meshStandardMaterial color="#f2e7d2" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.25, 2.34, 48]} />
        <meshStandardMaterial color="#ef6d32" roughness={0.88} />
      </mesh>
      <mesh position={[0, 0.014, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.8, 3.86, 48]} />
        <meshStandardMaterial color="#9aaa68" roughness={0.88} />
      </mesh>
    </RigidBody>
  );
}

function WorkshopBackdrop() {
  return (
    <group position={[0, 0, -3.8]}>
      <mesh castShadow position={[-3.6, 1.2, 0]}>
        <boxGeometry args={[2.6, 2.4, 1.4]} />
        <meshStandardMaterial color="#d9c9aa" roughness={0.94} />
      </mesh>
      <mesh castShadow position={[3.6, 0.8, 0.1]}>
        <boxGeometry args={[2.1, 1.6, 1.2]} />
        <meshStandardMaterial color="#a9b86e" roughness={0.94} />
      </mesh>
      <mesh castShadow position={[-3.6, 2.72, 0]}>
        <coneGeometry args={[1.85, 0.7, 4]} />
        <meshStandardMaterial color="#b95b37" roughness={0.92} />
      </mesh>
      <mesh castShadow position={[3.6, 1.86, 0.1]}>
        <coneGeometry args={[1.5, 0.55, 4]} />
        <meshStandardMaterial color="#768758" roughness={0.92} />
      </mesh>
      <mesh castShadow position={[0, 1.7, -0.35]}>
        <boxGeometry args={[2.2, 3.4, 0.7]} />
        <meshStandardMaterial color="#454943" roughness={0.96} />
      </mesh>
      <mesh position={[0, 1.7, 0.01]}>
        <boxGeometry args={[1.35, 1.8, 0.08]} />
        <meshStandardMaterial
          color="#80a9ad"
          emissive="#80a9ad"
          emissiveIntensity={0.12}
          roughness={0.7}
        />
      </mesh>
    </group>
  );
}

function MotorTownWorld({ onReady }: MotorTownCanvasProps) {
  return (
    <>
      <color attach="background" args={["#b9d8dc"]} />
      <fog attach="fog" args={["#b9d8dc", 10, 22]} />
      <ambientLight intensity={1.7} />
      <directionalLight
        castShadow
        intensity={2.8}
        position={[-4, 8, 6]}
        shadow-mapSize-height={1024}
        shadow-mapSize-width={1024}
      />

      <WorkshopBackdrop />

      <Suspense fallback={null}>
        <Physics colliders={false} gravity={[0, -9.81, 0]}>
          <InspectionFloor />
          <InspectionCrate />
          <RuntimeReady onReady={onReady} />
        </Physics>
      </Suspense>
    </>
  );
}

export default function MotorTownCanvas({ onReady }: MotorTownCanvasProps) {
  return (
    <Canvas
      camera={{
        fov: 42,
        position: [0, 4.2, 9.5],
        rotation: [-0.3, 0, 0],
      }}
      dpr={[1, 1.5]}
      gl={{ antialias: false, powerPreference: "high-performance" }}
      shadows
    >
      <MotorTownWorld onReady={onReady} />
    </Canvas>
  );
}
