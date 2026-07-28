import { useFrame } from "@react-three/fiber";
import type { RapierRigidBody } from "@react-three/rapier";
import { type RefObject, useRef } from "react";
import { MathUtils } from "three";
import {
  type ArcadeVehicleTuning,
  type DrivingTelemetry,
  getHeadingBasis,
  isCartCollisionSurface,
} from "./driving";
import type { WorldPosition } from "./flagshipLineup";
import { useDrivingInput } from "./useDrivingInput";

const COLLISION_GRACE_MS = 650;
const TRAPPED_SPEED = 0.85;

export function quaternionFromYaw(yaw: number) {
  const halfYaw = yaw / 2;

  return {
    w: Math.cos(halfYaw),
    x: 0,
    y: Math.sin(halfYaw),
    z: 0,
  };
}

type ArcadeVehicleMotionProps = {
  body: RefObject<RapierRigidBody | null>;
  controlsEnabled: boolean;
  initialPosition: WorldPosition;
  initialYaw?: number;
  onTelemetry: (telemetry: DrivingTelemetry) => void;
  tuning: ArcadeVehicleTuning;
};

export function useArcadeVehicle({
  body,
  controlsEnabled,
  initialPosition,
  initialYaw = 0,
  onTelemetry,
  tuning,
}: ArcadeVehicleMotionProps) {
  const speed = useRef(0);
  const yaw = useRef(initialYaw);
  const input = useDrivingInput(controlsEnabled);
  const collisionPressureStartedAt = useRef(0);
  const lastCollisionAt = useRef(0);
  const activeCollisionContacts = useRef(0);
  const bounceUntil = useRef(0);
  const recoveryUntil = useRef(0);
  const recoveryArmed = useRef(true);
  const safePosition = useRef(initialPosition);
  const lastTelemetryAt = useRef(0);
  const lastTelemetry = useRef<DrivingTelemetry | null>(null);

  useFrame((_, frameDelta) => {
    if (!controlsEnabled) {
      speed.current = 0;
      return;
    }

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
          ? tuning.forwardSpeed
          : controls.throttle < 0
            ? -tuning.reverseSpeed
            : 0;
      const handbrakeScale = controls.handbrake
        ? tuning.handbrakeSpeedScale
        : 1;
      const accelerationRate =
        controls.throttle === 0 ? tuning.coastingRate : tuning.accelerationRate;
      const accelerationBlend = 1 - Math.exp(-accelerationRate * delta);
      forwardSpeed = MathUtils.lerp(
        forwardSpeed,
        targetSpeed * handbrakeScale,
        accelerationBlend,
      );

      const lateralSpeed =
        velocity.x * heading.rightX + velocity.z * heading.rightZ;
      const lateralGrip = controls.handbrake
        ? tuning.handbrakeGrip
        : tuning.lateralGrip;
      const retainedLateralSpeed =
        lateralSpeed * Math.exp(-lateralGrip * delta);

      if (Math.abs(forwardSpeed) > 0.12 && controls.steer !== 0) {
        const direction = Math.sign(forwardSpeed);
        const steeringAuthority = MathUtils.clamp(
          Math.abs(forwardSpeed) / tuning.steeringSpeedDivisor,
          tuning.minimumSteeringAuthority,
          1,
        );
        const handbrakeSteering = controls.handbrake
          ? tuning.handbrakeSteering
          : 1;
        yaw.current +=
          controls.steer *
          direction *
          steeringAuthority *
          handbrakeSteering *
          tuning.steeringRate *
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
        y: Math.max(position.y, initialPosition.y),
        z: position.z,
      };
    }

    const planarSpeed = Math.hypot(velocity.x, velocity.z);
    const isTrapped =
      collisionPressureStartedAt.current > 0 &&
      now - collisionPressureStartedAt.current >= tuning.recoveryDelayMs &&
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
        y: initialPosition.y + 0.18,
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

  const onCollisionEnter = (otherName: string | undefined) => {
    if (!controlsEnabled || !isCartCollisionSurface(otherName)) {
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
  };

  const onCollisionExit = (otherName: string | undefined) => {
    if (!controlsEnabled || !isCartCollisionSurface(otherName)) {
      return;
    }

    activeCollisionContacts.current = Math.max(
      0,
      activeCollisionContacts.current - 1,
    );
    lastCollisionAt.current = performance.now();
  };

  return {
    input,
    onCollisionEnter,
    onCollisionExit,
    speed,
    yaw,
  };
}
