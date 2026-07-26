import { useFrame } from "@react-three/fiber";
import {
  CuboidCollider,
  type RapierRigidBody,
  RigidBody,
} from "@react-three/rapier";
import { useRef } from "react";
import { MathUtils } from "three";
import { ChaseCamera } from "./ChaseCamera";
import {
  type DrivingTelemetry,
  getHeadingBasis,
  INSPECTOR_CART_TUNING,
  isCartCollisionSurface,
} from "./driving";
import { InspectorCartModel } from "./InspectorCartModel";
import { useDrivingInput } from "./useDrivingInput";

const START_POSITION = { x: 0, y: 0.72, z: 7.2 };
const COLLISION_GRACE_MS = 650;
const TRAPPED_SPEED = 0.85;

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

export function InspectorCart({ onTelemetry }: InspectorCartProps) {
  const body = useRef<RapierRigidBody>(null);
  const speed = useRef(0);
  const yaw = useRef(0);
  const input = useDrivingInput();
  const collisionPressureStartedAt = useRef(0);
  const lastCollisionAt = useRef(0);
  const activeCollisionContacts = useRef(0);
  const bounceUntil = useRef(0);
  const recoveryUntil = useRef(0);
  const recoveryArmed = useRef(true);
  const safePosition = useRef(START_POSITION);
  const lastTelemetryAt = useRef(0);
  const lastTelemetry = useRef<DrivingTelemetry | null>(null);

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
    const heading = getHeadingBasis(yaw.current);
    let forwardSpeed =
      velocity.x * heading.forwardX + velocity.z * heading.forwardZ;

    if (now >= bounceUntil.current) {
      const targetSpeed =
        controls.throttle > 0
          ? INSPECTOR_CART_TUNING.forwardSpeed
          : controls.throttle < 0
            ? -INSPECTOR_CART_TUNING.reverseSpeed
            : 0;
      const handbrakeScale = controls.handbrake ? 0.32 : 1;
      const accelerationRate = controls.throttle === 0 ? 2.4 : 3.4;
      const accelerationBlend = 1 - Math.exp(-accelerationRate * delta);
      forwardSpeed = MathUtils.lerp(
        forwardSpeed,
        targetSpeed * handbrakeScale,
        accelerationBlend,
      );

      const lateralSpeed =
        velocity.x * heading.rightX + velocity.z * heading.rightZ;
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

      const nextHeading = getHeadingBasis(yaw.current);

      rigidBody.setLinvel(
        {
          x:
            nextHeading.forwardX * forwardSpeed +
            nextHeading.rightX * retainedLateralSpeed,
          y: velocity.y,
          z:
            nextHeading.forwardZ * forwardSpeed +
            nextHeading.rightZ * retainedLateralSpeed,
        },
        true,
      );
    }

    speed.current = forwardSpeed;

    const collisionPressureExpired =
      activeCollisionContacts.current === 0 &&
      lastCollisionAt.current > 0 &&
      now - lastCollisionAt.current > COLLISION_GRACE_MS;

    if (controls.throttle === 0 || collisionPressureExpired) {
      collisionPressureStartedAt.current = 0;
    } else if (
      activeCollisionContacts.current > 0 &&
      collisionPressureStartedAt.current === 0
    ) {
      collisionPressureStartedAt.current = now;
    }

    const isClearOfLandmark = Math.hypot(position.x, position.z) > 4.25;
    const isInsideTown =
      Math.abs(position.x) < 12.5 && position.z > -9.5 && position.z < 10.2;

    if (
      activeCollisionContacts.current === 0 &&
      isClearOfLandmark &&
      isInsideTown
    ) {
      safePosition.current = {
        x: position.x,
        y: Math.max(position.y, START_POSITION.y),
        z: position.z,
      };
    }

    const planarSpeed = Math.hypot(velocity.x, velocity.z);
    const isTrapped =
      collisionPressureStartedAt.current > 0 &&
      now - collisionPressureStartedAt.current >=
        INSPECTOR_CART_TUNING.recoveryDelayMs &&
      activeCollisionContacts.current > 0 &&
      planarSpeed < TRAPPED_SPEED &&
      controls.throttle !== 0;
    const requiresRecovery = position.y < -2 || isTrapped;

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
      collisionPressureStartedAt.current = 0;
      lastCollisionAt.current = 0;
      activeCollisionContacts.current = 0;
      bounceUntil.current = now + 180;
      recoveryUntil.current = now + 720;
      recoveryArmed.current = false;
    }

    if (controls.throttle === 0 && activeCollisionContacts.current === 0) {
      recoveryArmed.current = true;
    }

    const telemetry: DrivingTelemetry = {
      state: controls.handbrake
        ? "handbrake"
        : now < recoveryUntil.current
          ? "recovery"
          : now < bounceUntil.current
            ? "bounce"
            : Math.abs(forwardSpeed) > 0.18 || controls.throttle !== 0
              ? "driving"
              : "ready",
    };
    const previousTelemetry = lastTelemetry.current;
    const telemetryChanged =
      !previousTelemetry || previousTelemetry.state !== telemetry.state;

    if (telemetryChanged && now - lastTelemetryAt.current >= 80) {
      lastTelemetry.current = telemetry;
      lastTelemetryAt.current = now;
      onTelemetry(telemetry);
    }
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
        onCollisionEnter={({ other }) => {
          if (!isCartCollisionSurface(other.rigidBodyObject?.name)) {
            return;
          }

          const rigidBody = body.current;

          if (!rigidBody) {
            return;
          }

          const now = performance.now();
          const velocity = rigidBody.linvel();

          activeCollisionContacts.current += 1;
          lastCollisionAt.current = now;

          if (collisionPressureStartedAt.current === 0) {
            collisionPressureStartedAt.current = now;
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
        onCollisionExit={({ other }) => {
          if (!isCartCollisionSurface(other.rigidBodyObject?.name)) {
            return;
          }

          activeCollisionContacts.current = Math.max(
            0,
            activeCollisionContacts.current - 1,
          );
          lastCollisionAt.current = performance.now();
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
      <ChaseCamera body={body} yaw={yaw} />
    </>
  );
}
