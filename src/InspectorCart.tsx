import { useFrame, useThree } from "@react-three/fiber";
import {
  CuboidCollider,
  type RapierRigidBody,
  RigidBody,
} from "@react-three/rapier";
import { type RefObject, useRef } from "react";
import { type Group, MathUtils, type Object3D, Vector3 } from "three";
import type { DrivingTelemetry } from "./driving";
import { type DrivingInput, useDrivingInput } from "./useDrivingInput";

const START_POSITION = { x: 0, y: 0.72, z: 7.2 };
const MAX_FORWARD_SPEED = 5.4;
const MAX_REVERSE_SPEED = 3.25;
const RECOVERY_DELAY_MS = 900;

type InspectorCartProps = {
  onTelemetry: (telemetry: DrivingTelemetry) => void;
};

function quaternionFromYaw(yaw: number) {
  const halfYaw = yaw / 2;

  return {
    w: Math.cos(halfYaw),
    x: 0,
    y: Math.sin(halfYaw),
    z: 0,
  };
}

function InspectorCartModel({
  input,
  speed,
}: {
  input: RefObject<DrivingInput>;
  speed: RefObject<number>;
}) {
  const cartBody = useRef<Group>(null);
  const clipboard = useRef<Object3D>(null);
  const smellDetector = useRef<Group>(null);

  useFrame(({ clock }, delta) => {
    const body = cartBody.current;
    const detector = smellDetector.current;
    const clipboardMesh = clipboard.current;
    const currentSpeed = speed.current;
    const movement = Math.min(Math.abs(currentSpeed) / MAX_FORWARD_SPEED, 1);

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

export function InspectorCart({ onTelemetry }: InspectorCartProps) {
  const body = useRef<RapierRigidBody>(null);
  const speed = useRef(0);
  const yaw = useRef(0);
  const input = useDrivingInput();
  const collisionStartedAt = useRef(0);
  const bounceUntil = useRef(0);
  const recoveryArmed = useRef(true);
  const recoveryUsed = useRef(false);
  const distance = useRef(0);
  const previousPosition = useRef(START_POSITION);
  const safePosition = useRef(START_POSITION);
  const lastTelemetryAt = useRef(0);
  const lastTelemetry = useRef<DrivingTelemetry | null>(null);
  const cameraPosition = useRef(new Vector3());
  const cameraTarget = useRef(new Vector3());
  const desiredCameraPosition = useRef(new Vector3());
  const { camera } = useThree();

  useFrame((_, frameDelta) => {
    const rigidBody = body.current;

    if (!rigidBody) {
      return;
    }

    const now = performance.now();
    const delta = Math.min(frameDelta, 0.05);
    const controls = input.current;
    const position = rigidBody.translation();
    const velocity = rigidBody.linvel();
    const forwardX = -Math.sin(yaw.current);
    const forwardZ = -Math.cos(yaw.current);
    const rightX = Math.cos(yaw.current);
    const rightZ = -Math.sin(yaw.current);
    let forwardSpeed = velocity.x * forwardX + velocity.z * forwardZ;

    if (now >= bounceUntil.current) {
      const targetSpeed =
        controls.throttle > 0
          ? MAX_FORWARD_SPEED
          : controls.throttle < 0
            ? -MAX_REVERSE_SPEED
            : 0;
      const handbrakeScale = controls.handbrake ? 0.32 : 1;
      const accelerationRate = controls.throttle === 0 ? 2.4 : 3.4;
      const accelerationBlend = 1 - Math.exp(-accelerationRate * delta);
      forwardSpeed = MathUtils.lerp(
        forwardSpeed,
        targetSpeed * handbrakeScale,
        accelerationBlend,
      );

      const lateralSpeed = velocity.x * rightX + velocity.z * rightZ;
      const lateralGrip = controls.handbrake ? 0.8 : 8.5;
      const retainedLateralSpeed =
        lateralSpeed * Math.exp(-lateralGrip * delta);

      if (Math.abs(forwardSpeed) > 0.12 && controls.steer !== 0) {
        const direction = Math.sign(forwardSpeed);
        const steeringAuthority = MathUtils.clamp(
          Math.abs(forwardSpeed) / 2.4,
          0.28,
          1,
        );
        const handbrakeSteering = controls.handbrake ? 1.3 : 1;
        yaw.current +=
          controls.steer *
          direction *
          steeringAuthority *
          handbrakeSteering *
          1.75 *
          delta;
        rigidBody.setRotation(quaternionFromYaw(yaw.current), true);
      }

      const nextForwardX = -Math.sin(yaw.current);
      const nextForwardZ = -Math.cos(yaw.current);
      const nextRightX = Math.cos(yaw.current);
      const nextRightZ = -Math.sin(yaw.current);

      rigidBody.setLinvel(
        {
          x: nextForwardX * forwardSpeed + nextRightX * retainedLateralSpeed,
          y: velocity.y,
          z: nextForwardZ * forwardSpeed + nextRightZ * retainedLateralSpeed,
        },
        true,
      );
    }

    speed.current = forwardSpeed;

    const moved = Math.hypot(
      position.x - previousPosition.current.x,
      position.z - previousPosition.current.z,
    );

    if (moved < 0.75) {
      distance.current += moved;
    }

    previousPosition.current = {
      x: position.x,
      y: position.y,
      z: position.z,
    };

    const isClearOfLandmark = Math.hypot(position.x, position.z) > 4.25;
    const isInsideTown =
      Math.abs(position.x) < 12.5 && position.z > -9.5 && position.z < 10.2;

    if (
      collisionStartedAt.current > 0 &&
      controls.throttle === 0 &&
      now - collisionStartedAt.current > 320
    ) {
      collisionStartedAt.current = 0;
    }

    if (collisionStartedAt.current === 0 && isClearOfLandmark && isInsideTown) {
      safePosition.current = {
        x: position.x,
        y: Math.max(position.y, START_POSITION.y),
        z: position.z,
      };
    }

    const requiresRecovery =
      position.y < -2 ||
      (collisionStartedAt.current > 0 &&
        now - collisionStartedAt.current >= RECOVERY_DELAY_MS &&
        controls.throttle !== 0);

    if (requiresRecovery && recoveryArmed.current) {
      const safe = safePosition.current;
      const safeRadius = Math.hypot(safe.x, safe.z);
      const recoveryScale =
        safeRadius > 0 && safeRadius < 5.6 ? 5.6 / safeRadius : 1;
      const recoveryPosition = {
        x: safe.x * recoveryScale,
        y: START_POSITION.y + 0.18,
        z: safe.z * recoveryScale,
      };

      rigidBody.setTranslation(recoveryPosition, true);
      rigidBody.setRotation(quaternionFromYaw(yaw.current), true);
      rigidBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
      rigidBody.setAngvel({ x: 0, y: 0, z: 0 }, true);
      previousPosition.current = recoveryPosition;
      collisionStartedAt.current = 0;
      bounceUntil.current = now + 180;
      recoveryArmed.current = false;
      recoveryUsed.current = true;
    }

    if (controls.throttle === 0 && collisionStartedAt.current === 0) {
      recoveryArmed.current = true;
    }

    const currentPosition = rigidBody.translation();
    const cameraForwardX = -Math.sin(yaw.current);
    const cameraForwardZ = -Math.cos(yaw.current);
    const cameraRightX = Math.cos(yaw.current);
    const cameraRightZ = -Math.sin(yaw.current);

    desiredCameraPosition.current.set(
      currentPosition.x - cameraForwardX * 9.5 + cameraRightX * 4.2,
      currentPosition.y + 8.8,
      currentPosition.z - cameraForwardZ * 9.5 + cameraRightZ * 4.2,
    );
    cameraTarget.current.set(
      currentPosition.x + cameraForwardX * 2.6,
      currentPosition.y + 0.4,
      currentPosition.z + cameraForwardZ * 2.6,
    );

    const cameraBlend = 1 - Math.exp(-4.2 * delta);
    cameraPosition.current
      .copy(camera.position)
      .lerp(desiredCameraPosition.current, cameraBlend);
    camera.position.copy(cameraPosition.current);
    camera.lookAt(cameraTarget.current);

    const telemetry: DrivingTelemetry = {
      distanceMeters: Math.floor(distance.current),
      recoveryUsed: recoveryUsed.current,
      state: controls.handbrake
        ? "handbrake"
        : Math.abs(forwardSpeed) > 0.18 || controls.throttle !== 0
          ? "driving"
          : "ready",
    };
    const previousTelemetry = lastTelemetry.current;
    const telemetryChanged =
      !previousTelemetry ||
      previousTelemetry.distanceMeters !== telemetry.distanceMeters ||
      previousTelemetry.recoveryUsed !== telemetry.recoveryUsed ||
      previousTelemetry.state !== telemetry.state;

    if (telemetryChanged && now - lastTelemetryAt.current >= 80) {
      lastTelemetry.current = telemetry;
      lastTelemetryAt.current = now;
      onTelemetry(telemetry);
    }
  });

  return (
    <RigidBody
      angularDamping={5}
      canSleep={false}
      colliders={false}
      enabledRotations={[false, true, false]}
      friction={0.2}
      linearDamping={0.16}
      mass={1.7}
      name="inspector-cart"
      onCollisionEnter={({ other }) => {
        const colliderName = other.rigidBodyObject?.name;

        if (
          colliderName !== "drive-boundary" &&
          colliderName !== "central-landmark"
        ) {
          return;
        }

        const rigidBody = body.current;

        if (!rigidBody) {
          return;
        }

        const now = performance.now();
        const velocity = rigidBody.linvel();

        if (collisionStartedAt.current === 0) {
          collisionStartedAt.current = now;
        }

        bounceUntil.current = now + 260;
        rigidBody.setLinvel(
          {
            x: -velocity.x * 0.62,
            y: Math.max(velocity.y, 0.55),
            z: -velocity.z * 0.62,
          },
          true,
        );
      }}
      position={[START_POSITION.x, START_POSITION.y, START_POSITION.z]}
      ref={body}
      restitution={0.92}
    >
      <CuboidCollider
        args={[0.68, 0.5, 0.94]}
        friction={0.2}
        position={[0, 0.18, 0]}
        restitution={0.92}
      />
      <InspectorCartModel input={input} speed={speed} />
    </RigidBody>
  );
}
