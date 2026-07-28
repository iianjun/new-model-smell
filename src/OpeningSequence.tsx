import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { type Group, MathUtils, Vector3 } from "three";
import {
  getNoseSneezeTransform,
  NOSE_REST_POSITION_Y,
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

const FULL_TIMING = {
  detected: 1.65,
  sneeze: 2.55,
  wake: 3.72,
  complete: 5.05,
} as const;

const REDUCED_COMPLETE_SECONDS = 1.15;

const SCENT_PARTICLES = Array.from({ length: 18 }, (_, index) => ({
  offset: index / 18,
  side: index % 2 === 0 ? -1 : 1,
  size: 0.07 + (index % 3) * 0.025,
}));

type OpeningSequenceProps = {
  active: boolean;
  entry: OpeningEntry;
  isDriving: boolean;
  onComplete: () => void;
  onStage: (stage: OpeningStage) => void;
  skipRequested: boolean;
};

function easeOutCubic(value: number) {
  return 1 - (1 - value) ** 3;
}

function smoothstep(value: number) {
  return value * value * (3 - 2 * value);
}

function PhysicalFreshnessGauge({
  needle,
}: {
  needle: React.RefObject<Group | null>;
}) {
  return (
    <group position={[0, 0.92, 1.86]} rotation={[-0.12, 0, 0]}>
      <mesh castShadow>
        <boxGeometry args={[1.62, 0.78, 0.16]} />
        <meshStandardMaterial color="#f2e7d2" flatShading roughness={1} />
      </mesh>
      <mesh position={[0, 0, 0.09]}>
        <boxGeometry args={[1.38, 0.55, 0.035]} />
        <meshStandardMaterial color="#252723" flatShading roughness={1} />
      </mesh>
      {[-0.5, -0.25, 0, 0.25, 0.5].map((x, index) => (
        <mesh key={x} position={[x, 0.13, 0.12]}>
          <boxGeometry args={[0.07, 0.22 + index * 0.025, 0.035]} />
          <meshStandardMaterial
            color={index > 2 ? "#ef6d32" : "#a9b86e"}
            emissive={index > 2 ? "#ef6d32" : "#a9b86e"}
            emissiveIntensity={0.12}
            flatShading
            roughness={1}
          />
        </mesh>
      ))}
      <group position={[0, -0.17, 0.14]} ref={needle}>
        <mesh position={[0, 0.24, 0]}>
          <boxGeometry args={[0.065, 0.48, 0.055]} />
          <meshStandardMaterial color="#ef6d32" flatShading roughness={1} />
        </mesh>
        <mesh>
          <cylinderGeometry args={[0.12, 0.12, 0.07, 8]} />
          <meshStandardMaterial color="#d8c8a8" flatShading roughness={1} />
        </mesh>
      </group>
    </group>
  );
}

function TheNose({
  gaugeNeedle,
  nose,
}: {
  gaugeNeedle: React.RefObject<Group | null>;
  nose: React.RefObject<Group | null>;
}) {
  return (
    <group position={[0, 0, 0.1]}>
      <mesh castShadow position={[0, 1.52, 0]}>
        <cylinderGeometry args={[0.46, 0.68, 1.75, 7]} />
        <meshStandardMaterial color="#f2e7d2" flatShading roughness={1} />
      </mesh>
      <group position={[0, NOSE_REST_POSITION_Y, 0]} ref={nose}>
        <mesh
          castShadow
          position={[0, 0.55, 0.32]}
          rotation={[-0.2, 0, 0]}
          scale={[0.78, 1.28, 0.9]}
        >
          <dodecahedronGeometry args={[0.72, 0]} />
          <meshStandardMaterial color="#ef6d32" flatShading roughness={1} />
        </mesh>
        <mesh castShadow position={[0, 0.08, 0.78]} scale={[1.1, 0.68, 0.9]}>
          <dodecahedronGeometry args={[0.6, 0]} />
          <meshStandardMaterial color="#ef6d32" flatShading roughness={1} />
        </mesh>
        {[-0.29, 0.29].map((x) => (
          <mesh
            key={x}
            position={[x, -0.03, 1.25]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[1, 0.42, 1]}
          >
            <cylinderGeometry args={[0.17, 0.2, 0.08, 8]} />
            <meshStandardMaterial color="#252723" flatShading roughness={1} />
          </mesh>
        ))}
      </group>
      <PhysicalFreshnessGauge needle={gaugeNeedle} />
    </group>
  );
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

function ScentParticles({
  particles,
}: {
  particles: React.RefObject<Group | null>;
}) {
  return (
    <group ref={particles}>
      {SCENT_PARTICLES.map(({ offset, side, size }, index) => (
        <mesh
          key={`${offset}-${side}`}
          position={[
            side * (0.6 + offset * 1.5),
            1.45 + offset,
            1.5 + offset * 3,
          ]}
          scale={size}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color={index % 3 === 0 ? "#f5c85e" : "#f2e7d2"}
            emissive={index % 3 === 0 ? "#ef6d32" : "#f2e7d2"}
            emissiveIntensity={0.24}
            flatShading
            roughness={1}
          />
        </mesh>
      ))}
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
}: OpeningSequenceProps) {
  const { camera } = useThree();
  const elapsed = useRef(0);
  const completed = useRef(false);
  const currentStage = useRef<OpeningStage>("inhale");
  const nose = useRef<Group>(null);
  const gaugeNeedle = useRef<Group>(null);
  const particles = useRef<Group>(null);
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
        entry === "reduced" ? FINAL_CAMERA_POSITION : CLOSE_CAMERA_POSITION,
      );
      camera.lookAt(
        entry === "reduced" ? FINAL_CAMERA_TARGET : CLOSE_CAMERA_TARGET,
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
        needleGroup.rotation.z = -1.05;
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

    elapsed.current += Math.min(frameDelta, 0.05);
    const time = elapsed.current;

    if (entry === "reduced") {
      camera.position.copy(FINAL_CAMERA_POSITION);
      camera.lookAt(FINAL_CAMERA_TARGET);

      if (particleGroup) {
        particleGroup.visible = false;
      }

      if (needleGroup) {
        needleGroup.rotation.z = -1.05;
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

      for (const [index, particle] of particleGroup.children.entries()) {
        const particleDefinition = SCENT_PARTICLES[index];
        const cycle = (time * 0.46 + particleDefinition.offset) % 1;
        const easedCycle = smoothstep(cycle);
        const nostrilX = particleDefinition.side * 0.29;
        const startX =
          particleDefinition.side * (0.85 + particleDefinition.offset * 1.8);

        particle.position.set(
          MathUtils.lerp(startX, nostrilX, easedCycle) +
            Math.sin(time * 4 + index) * 0.08 * (1 - easedCycle),
          MathUtils.lerp(
            1.4 + particleDefinition.offset * 1.7,
            1.52,
            easedCycle,
          ),
          MathUtils.lerp(
            4.8 + particleDefinition.offset * 1.8,
            1.34,
            easedCycle,
          ),
        );
        particle.rotation.x += frameDelta * (1.4 + index * 0.03);
        particle.rotation.y += frameDelta * (2.1 + index * 0.04);
        particle.scale.setScalar(
          particleDefinition.size * (1 - easedCycle * 0.58),
        );
      }
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
      camera.position.copy(CLOSE_CAMERA_POSITION);
      camera.position.y += Math.sin(time * 1.9) * 0.025;
      camera.lookAt(CLOSE_CAMERA_TARGET);
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
          CLOSE_CAMERA_POSITION,
          SNEEZE_CAMERA_POSITION,
          impulse,
        );
        finalCameraTarget.current.lerpVectors(
          CLOSE_CAMERA_TARGET,
          SNEEZE_CAMERA_TARGET,
          impulse,
        );
      } else {
        const settle = smoothstep(settleProgress);
        finalCameraPosition.current.lerpVectors(
          SNEEZE_CAMERA_POSITION,
          FINAL_CAMERA_POSITION,
          settle,
        );
        camera.position.copy(finalCameraPosition.current);
        finalCameraTarget.current.lerpVectors(
          SNEEZE_CAMERA_TARGET,
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
      <TheNose gaugeNeedle={gaugeNeedle} nose={nose} />
      <ScentParticles particles={particles} />
      <InspectorCartCover cover={cover} />
    </>
  );
}
