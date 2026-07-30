import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { type Group, MathUtils, Vector3 } from "three";
import type { TrackedCompany } from "./flagshipLineup";
import { getNewestFlagshipLaunchFreshness } from "./modelFreshness";
import {
  animateNoseInhaleParticles,
  NoseLandmark,
  useNoseLandmarkHandles,
} from "./NoseLandmark";
import {
  getNoseSneezeTransform,
  NOSE_SNEEZE_MOTION_SECONDS,
  type OpeningEntry,
  type OpeningStage,
} from "./opening";

const FINAL_CAMERA_POSITION = new Vector3(4.2, 9.52, 16.7);
const FINAL_CAMERA_TARGET = new Vector3(0, 1.12, 4.6);
const CLOSE_CAMERA_POSITION = new Vector3(0, 2.9, 4.15);
const CLOSE_CAMERA_TARGET = new Vector3(0, 1.72, 0.72);
const SNEEZE_CAMERA_POSITION = new Vector3(4.8, 11.25, 19.4);
const SNEEZE_CAMERA_TARGET = new Vector3(0, 0.9, 3.8);
const NOSE_TURNTABLE_PIVOT = new Vector3(0, 0, 0.1);
const UP = new Vector3(0, 1, 0);

const FULL_TIMING = {
  detected: 1.65,
  sneeze: 2.55,
  wake: 3.72,
  complete: 5.05,
} as const;

const REDUCED_COMPLETE_SECONDS = 1.15;

type OpeningSequenceProps = {
  active: boolean;
  entry: OpeningEntry;
  isDriving: boolean;
  onComplete: () => void;
  onStage: (stage: OpeningStage) => void;
  skipRequested: boolean;
  trackedCompanies: readonly TrackedCompany[];
};

type OpeningCamera = {
  closePosition: Vector3;
  closeTarget: Vector3;
  sneezePosition: Vector3;
  sneezeTarget: Vector3;
};

function easeOutCubic(value: number) {
  return 1 - (1 - value) ** 3;
}

function smoothstep(value: number) {
  return value * value * (3 - 2 * value);
}

function orientOpeningPoint(point: Vector3, yaw: number) {
  return point
    .clone()
    .sub(NOSE_TURNTABLE_PIVOT)
    .applyAxisAngle(UP, yaw)
    .add(NOSE_TURNTABLE_PIVOT);
}

function getOpeningCamera(yaw: number): OpeningCamera {
  return {
    closePosition: orientOpeningPoint(CLOSE_CAMERA_POSITION, yaw),
    closeTarget: orientOpeningPoint(CLOSE_CAMERA_TARGET, yaw),
    sneezePosition: orientOpeningPoint(SNEEZE_CAMERA_POSITION, yaw),
    sneezeTarget: orientOpeningPoint(SNEEZE_CAMERA_TARGET, yaw),
  };
}

function InspectorCartCover({
  cover,
}: {
  cover: React.RefObject<Group | null>;
}) {
  return (
    <group position={[0, 1.26, 7.2]} ref={cover}>
      <mesh castShadow>
        <boxGeometry args={[1.72, 1.9, 2.25]} />
        <meshStandardMaterial color="#d8c8a8" flatShading roughness={1} />
      </mesh>
      <mesh castShadow position={[0, 0.98, 0]}>
        <boxGeometry args={[1.88, 0.18, 2.42]} />
        <meshStandardMaterial color="#ef6d32" flatShading roughness={1} />
      </mesh>
      <mesh position={[0, 0.1, 1.14]}>
        <boxGeometry args={[1.3, 0.18, 0.035]} />
        <meshStandardMaterial color="#252723" flatShading roughness={1} />
      </mesh>
    </group>
  );
}

export function OpeningSequence({
  active,
  entry,
  isDriving,
  onComplete,
  onStage,
  skipRequested,
  trackedCompanies,
}: OpeningSequenceProps) {
  const { camera } = useThree();
  const freshness = useMemo(
    () => getNewestFlagshipLaunchFreshness(trackedCompanies),
    [trackedCompanies],
  );
  const openingCamera = useMemo(
    () => getOpeningCamera(freshness.dealershipYaw),
    [freshness.dealershipYaw],
  );
  const freshnessNeedleRotation =
    1.05 - (freshness.smellRemainingPercent / 100) * 2.1;
  const elapsed = useRef(0);
  const completed = useRef(false);
  const currentStage = useRef<OpeningStage>("inhale");
  const noseHandles = useNoseLandmarkHandles();
  const { gaugeNeedle, nose, particles } = noseHandles;
  const cover = useRef<Group>(null);
  const finalCameraPosition = useRef(new Vector3());
  const finalCameraTarget = useRef(new Vector3());

  useEffect(() => {
    if (!active) {
      return;
    }

    elapsed.current = 0;
    completed.current = false;
    currentStage.current = "inhale";
    onStage("inhale");
  }, [active, onStage]);

  useFrame((_, frameDelta) => {
    const coverGroup = cover.current;
    const noseGroup = nose.current;
    const needleGroup = gaugeNeedle.current;
    const particleGroup = particles.current;

    if (!active && !isDriving) {
      camera.position.copy(
        entry === "reduced"
          ? FINAL_CAMERA_POSITION
          : openingCamera.closePosition,
      );
      camera.lookAt(
        entry === "reduced" ? FINAL_CAMERA_TARGET : openingCamera.closeTarget,
      );
      return;
    }

    if (isDriving || completed.current) {
      return;
    }

    const complete = () => {
      camera.position.copy(FINAL_CAMERA_POSITION);
      camera.lookAt(FINAL_CAMERA_TARGET);

      if (coverGroup) {
        coverGroup.visible = false;
      }

      if (particleGroup) {
        particleGroup.visible = false;
      }

      if (noseGroup) {
        const transform = getNoseSneezeTransform(
          entry === "full" ? NOSE_SNEEZE_MOTION_SECONDS : 0,
        );
        noseGroup.position.set(0, transform.positionY, transform.positionZ);
        noseGroup.rotation.set(transform.rotationX, 0, 0);
        noseGroup.scale.set(...transform.scale);
      }

      if (needleGroup) {
        needleGroup.rotation.z = freshnessNeedleRotation;
      }

      currentStage.current = "wake";
      onStage("wake");
      completed.current = true;
      onComplete();
    };

    if (skipRequested) {
      complete();
      return;
    }

    const fixtureElapsed = import.meta.env.DEV
      ? window.__NEW_MODEL_MOTORS_TEST_FIXTURES__?.openingElapsedSeconds
      : undefined;

    if (fixtureElapsed === undefined) {
      elapsed.current += Math.min(frameDelta, 0.05);
    } else {
      elapsed.current = fixtureElapsed;
    }

    const time = elapsed.current;

    if (entry === "reduced") {
      camera.position.copy(FINAL_CAMERA_POSITION);
      camera.lookAt(FINAL_CAMERA_TARGET);

      if (particleGroup) {
        particleGroup.visible = false;
      }

      if (needleGroup) {
        needleGroup.rotation.z = freshnessNeedleRotation;
      }

      if (coverGroup) {
        const lift = smoothstep(
          MathUtils.clamp(time / REDUCED_COMPLETE_SECONDS, 0, 1),
        );
        coverGroup.position.set(0, 1.26 + lift * 0.7, 7.2 + lift * 0.18);
        coverGroup.scale.setScalar(1 - lift * 0.08);
        coverGroup.visible = lift < 0.92;
      }

      if (time >= 0.45 && currentStage.current !== "wake") {
        currentStage.current = "wake";
        onStage("wake");
      }

      if (time >= REDUCED_COMPLETE_SECONDS) {
        complete();
      }

      return;
    }

    const gaugeProgress = MathUtils.clamp(time / FULL_TIMING.detected, 0, 1);

    if (needleGroup) {
      needleGroup.rotation.z = 1.05 - gaugeProgress * 2.1;
    }

    if (particleGroup) {
      particleGroup.visible = time < FULL_TIMING.sneeze;
      animateNoseInhaleParticles(particleGroup, time, frameDelta);
    }

    if (noseGroup) {
      const inhale = Math.sin(Math.min(time, FULL_TIMING.sneeze) * 8) * 0.018;
      noseGroup.scale.set(1 + inhale, 1 - inhale * 0.55, 1 + inhale * 0.4);

      if (time >= FULL_TIMING.sneeze) {
        const sneezeAge = time - FULL_TIMING.sneeze;
        const transform = getNoseSneezeTransform(sneezeAge);
        noseGroup.position.y = transform.positionY;
        noseGroup.position.z = transform.positionZ;
        noseGroup.rotation.x = transform.rotationX;
        noseGroup.scale.set(...transform.scale);
      }
    }

    if (time < FULL_TIMING.sneeze) {
      camera.position.copy(openingCamera.closePosition);
      camera.position.y += Math.sin(time * 1.9) * 0.025;
      camera.lookAt(openingCamera.closeTarget);
    } else {
      const sneezeProgress = MathUtils.clamp(
        (time - FULL_TIMING.sneeze) / 1.1,
        0,
        1,
      );
      const settleProgress = MathUtils.clamp(
        (time - FULL_TIMING.wake) / (FULL_TIMING.complete - FULL_TIMING.wake),
        0,
        1,
      );

      if (settleProgress === 0) {
        const impulse = easeOutCubic(sneezeProgress);
        camera.position.lerpVectors(
          openingCamera.closePosition,
          openingCamera.sneezePosition,
          impulse,
        );
        finalCameraTarget.current.lerpVectors(
          openingCamera.closeTarget,
          openingCamera.sneezeTarget,
          impulse,
        );
      } else {
        const settle = smoothstep(settleProgress);
        finalCameraPosition.current.lerpVectors(
          openingCamera.sneezePosition,
          FINAL_CAMERA_POSITION,
          settle,
        );
        camera.position.copy(finalCameraPosition.current);
        finalCameraTarget.current.lerpVectors(
          openingCamera.sneezeTarget,
          FINAL_CAMERA_TARGET,
          settle,
        );
      }

      camera.lookAt(finalCameraTarget.current);
    }

    if (coverGroup) {
      const coverProgress = easeOutCubic(
        MathUtils.clamp(
          (time - FULL_TIMING.sneeze) /
            (FULL_TIMING.wake - FULL_TIMING.sneeze + 0.25),
          0,
          1,
        ),
      );
      coverGroup.position.set(
        coverProgress * 4.8,
        1.26 + coverProgress * 5.8,
        7.2 + coverProgress * 2.4,
      );
      coverGroup.rotation.set(
        coverProgress * 0.7,
        coverProgress * 1.15,
        coverProgress * -1.4,
      );
      coverGroup.visible = coverProgress < 0.96;
    }

    let nextStage: OpeningStage = "inhale";

    if (time >= FULL_TIMING.wake) {
      nextStage = "wake";
    } else if (time >= FULL_TIMING.sneeze) {
      nextStage = "sneeze";
    } else if (time >= FULL_TIMING.detected) {
      nextStage = "detected";
    }

    if (nextStage !== currentStage.current) {
      currentStage.current = nextStage;
      onStage(nextStage);
    }

    if (time >= FULL_TIMING.complete) {
      complete();
    }
  });

  return (
    <>
      <NoseLandmark
        companyName={freshness.company.name}
        handles={noseHandles}
        orientationYaw={freshness.dealershipYaw}
        smellRemainingPercent={freshness.smellRemainingPercent}
      />
      <InspectorCartCover cover={cover} />
    </>
  );
}
