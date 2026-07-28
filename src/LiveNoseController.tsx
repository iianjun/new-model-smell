import { useFrame } from "@react-three/fiber";
import type { RapierRigidBody } from "@react-three/rapier";
import { useRef } from "react";
import { MathUtils } from "three";
import type { FlagshipLaunchFreshness } from "./modelFreshness";
import {
  getPlanarDistanceFromNose,
  getYawToward,
  NOSE_SNEEZE_RANGE,
  NOSE_TRACKING_RANGE,
} from "./modelFreshness";
import {
  animateNoseInhaleParticles,
  animateNoseSneezeParticles,
  NOSE_GAUGE_LABEL,
  type NoseLandmarkHandles,
} from "./NoseLandmark";
import { NOSE_REST_POSITION_Y } from "./opening";
import type { NoseReaction, NoseTrackingMode } from "./runtimeTestState";
import { publishNoseRuntimeTestState } from "./runtimeTestState";

const LIVE_INHALE_CYCLE_SECONDS = 5.4;
const LIVE_INHALE_SECONDS = 2.05;
const LIVE_SNEEZE_SECONDS = 0.82;
const LIVE_SNEEZE_RESET_RANGE = NOSE_SNEEZE_RANGE + 0.75;

type LiveNoseControllerProps = {
  active: boolean;
  freshness: FlagshipLaunchFreshness;
  handles: NoseLandmarkHandles;
  trackedVehicleBody: React.RefObject<RapierRigidBody | null>;
};

function dampAngle(
  current: number,
  target: number,
  smoothing: number,
  delta: number,
) {
  const angleDelta =
    MathUtils.euclideanModulo(target - current + Math.PI, Math.PI * 2) -
    Math.PI;

  return current + angleDelta * (1 - Math.exp(-smoothing * delta));
}

export function LiveNoseController({
  active,
  freshness,
  handles,
  trackedVehicleBody,
}: LiveNoseControllerProps) {
  const elapsed = useRef(0);
  const sneezeStartedAt = useRef<number | null>(null);
  const vehicleWasClose = useRef(false);
  const wasActive = useRef(false);

  useFrame((_, frameDelta) => {
    if (!active) {
      wasActive.current = false;
      return;
    }

    if (!wasActive.current) {
      elapsed.current = 0;
      sneezeStartedAt.current = null;
      vehicleWasClose.current = false;
      wasActive.current = true;
    }

    elapsed.current += Math.min(frameDelta, 0.05);
    const time = elapsed.current;
    const vehiclePosition = trackedVehicleBody.current?.translation();
    const vehicleDistance = vehiclePosition
      ? getPlanarDistanceFromNose(vehiclePosition)
      : Number.POSITIVE_INFINITY;
    const trackingVehicle =
      Boolean(vehiclePosition) && vehicleDistance <= NOSE_TRACKING_RANGE;
    const targetYaw =
      trackingVehicle && vehiclePosition
        ? getYawToward(vehiclePosition)
        : freshness.dealershipYaw;
    const vehicleIsClose =
      Boolean(vehiclePosition) && vehicleDistance <= NOSE_SNEEZE_RANGE;
    const noseGroup = handles.nose.current;
    const needleGroup = handles.gaugeNeedle.current;
    const particleGroup = handles.particles.current;
    const turntableGroup = handles.turntable.current;

    if (vehicleIsClose && !vehicleWasClose.current) {
      vehicleWasClose.current = true;
      sneezeStartedAt.current = time;

      if (noseGroup) {
        noseGroup.userData.sneezeCount =
          (noseGroup.userData.sneezeCount ?? 0) + 1;
      }
    } else if (!vehiclePosition || vehicleDistance > LIVE_SNEEZE_RESET_RANGE) {
      vehicleWasClose.current = false;
    }

    const sneezeAge =
      sneezeStartedAt.current === null ? null : time - sneezeStartedAt.current;
    const sneezeProgress =
      sneezeAge === null
        ? 1
        : MathUtils.clamp(sneezeAge / LIVE_SNEEZE_SECONDS, 0, 1);
    const sneezing = sneezeAge !== null && sneezeProgress < 1;

    if (!sneezing && sneezeStartedAt.current !== null) {
      sneezeStartedAt.current = null;
    }

    const inhaleAge = time % LIVE_INHALE_CYCLE_SECONDS;
    const inhaling = inhaleAge < LIVE_INHALE_SECONDS;
    const reaction: NoseReaction = sneezing
      ? "sneeze"
      : inhaling
        ? "inhale"
        : "idle";
    const mode: NoseTrackingMode = trackingVehicle
      ? "vehicle-tracking"
      : "model-freshness";

    if (turntableGroup) {
      turntableGroup.rotation.y = dampAngle(
        turntableGroup.rotation.y,
        targetYaw,
        trackingVehicle ? 5.2 : 2.3,
        frameDelta,
      );
      turntableGroup.userData.targetCompanyId = freshness.company.id;
      turntableGroup.userData.targetModelId = freshness.model.id;
      turntableGroup.userData.mode = mode;
      turntableGroup.userData.dealershipYaw = freshness.dealershipYaw;
    }

    const recoil = sneezing ? Math.sin(sneezeProgress * Math.PI) : 0;
    const inhalePulse =
      inhaling && !sneezing ? Math.sin(inhaleAge * 7.4) * 0.022 : 0;

    if (noseGroup) {
      noseGroup.position.x = MathUtils.damp(
        noseGroup.position.x,
        0,
        5.5,
        frameDelta,
      );
      noseGroup.position.y = MathUtils.damp(
        noseGroup.position.y,
        NOSE_REST_POSITION_Y + recoil * 0.18,
        5.5,
        frameDelta,
      );
      noseGroup.position.z = MathUtils.damp(
        noseGroup.position.z,
        -recoil * 0.52,
        5.5,
        frameDelta,
      );
      noseGroup.rotation.x = MathUtils.damp(
        noseGroup.rotation.x,
        -recoil * 0.38,
        7,
        frameDelta,
      );
      noseGroup.scale.set(
        1 + inhalePulse + recoil * 0.12,
        1 - inhalePulse * 0.5 - recoil * 0.08,
        1 + inhalePulse * 0.35 + recoil * 0.16,
      );
      noseGroup.userData.reaction = reaction;
    }

    if (needleGroup) {
      needleGroup.rotation.z = MathUtils.damp(
        needleGroup.rotation.z,
        1.05 - (freshness.smellRemainingPercent / 100) * 2.1,
        3.5,
        frameDelta,
      );
    }

    if (particleGroup) {
      particleGroup.visible = reaction !== "idle";
      particleGroup.userData.reaction = reaction;

      if (reaction === "sneeze") {
        animateNoseSneezeParticles(particleGroup, sneezeProgress, frameDelta);
      } else if (reaction === "inhale") {
        animateNoseInhaleParticles(particleGroup, inhaleAge, frameDelta);
      }
    }

    if (import.meta.env.DEV && turntableGroup && noseGroup && particleGroup) {
      publishNoseRuntimeTestState({
        freshness,
        gaugeLabel: NOSE_GAUGE_LABEL,
        mode,
        particlesVisible: particleGroup.visible,
        reaction,
        turntableYaw: turntableGroup.rotation.y,
      });
    }
  });

  return null;
}
