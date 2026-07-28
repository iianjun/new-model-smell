import { useEffect, useMemo, useRef } from "react";
import {
  CanvasTexture,
  type Group,
  LinearFilter,
  MathUtils,
  SRGBColorSpace,
} from "three";
import { NOSE_REST_POSITION_Y } from "./opening";

export const NOSE_GAUGE_LABEL = "NEW MODEL SMELL REMAINING";

const SCENT_PARTICLES = Array.from({ length: 18 }, (_, index) => ({
  offset: index / 18,
  side: index % 2 === 0 ? -1 : 1,
  size: 0.07 + (index % 3) * 0.025,
}));

export type NoseLandmarkHandles = {
  gaugeNeedle: React.RefObject<Group | null>;
  nose: React.RefObject<Group | null>;
  particles: React.RefObject<Group | null>;
  turntable: React.RefObject<Group | null>;
};

type NoseLandmarkProps = {
  companyName: string;
  handles: NoseLandmarkHandles;
  orientationYaw: number;
  smellRemainingPercent: number;
};

function smoothstep(value: number) {
  return value * value * (3 - 2 * value);
}

export function useNoseLandmarkHandles(): NoseLandmarkHandles {
  const gaugeNeedle = useRef<Group>(null);
  const nose = useRef<Group>(null);
  const particles = useRef<Group>(null);
  const turntable = useRef<Group>(null);

  return useMemo(() => ({ gaugeNeedle, nose, particles, turntable }), []);
}

function useFreshnessGaugeTexture(
  companyName: string,
  smellRemainingPercent: number,
) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1_024;
    canvas.height = 256;
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Unable to create The Nose freshness gauge");
    }

    context.fillStyle = "#252723";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#f2e7d2";
    context.font = "800 54px ui-sans-serif, system-ui, sans-serif";
    context.textAlign = "center";
    context.fillText(NOSE_GAUGE_LABEL, 512, 94);
    context.fillStyle = "#ef6d32";
    context.font = "900 70px ui-monospace, monospace";
    context.fillText(
      `${smellRemainingPercent}% · ${companyName.toUpperCase()}`,
      512,
      190,
    );

    const nextTexture = new CanvasTexture(canvas);
    nextTexture.colorSpace = SRGBColorSpace;
    nextTexture.minFilter = LinearFilter;

    return nextTexture;
  }, [companyName, smellRemainingPercent]);

  useEffect(() => () => texture.dispose(), [texture]);

  return texture;
}

function PhysicalFreshnessGauge({
  companyName,
  needle,
  smellRemainingPercent,
}: {
  companyName: string;
  needle: React.RefObject<Group | null>;
  smellRemainingPercent: number;
}) {
  const texture = useFreshnessGaugeTexture(companyName, smellRemainingPercent);

  return (
    <group
      name="nose-freshness-gauge"
      position={[0, 0.92, 1.86]}
      rotation={[-0.12, 0, 0]}
      userData={{
        companyName,
        label: NOSE_GAUGE_LABEL,
        smellRemainingPercent,
      }}
    >
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
      <mesh position={[0, -0.235, 0.135]}>
        <planeGeometry args={[1.28, 0.28]} />
        <meshStandardMaterial map={texture} roughness={1} />
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
    <group name="nose-scent-particles" ref={particles}>
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

export function NoseLandmark({
  companyName,
  handles,
  orientationYaw,
  smellRemainingPercent,
}: NoseLandmarkProps) {
  const { gaugeNeedle, nose, particles, turntable } = handles;

  return (
    <group
      name="the-nose-turntable"
      position={[0, 0, 0.1]}
      ref={turntable}
      rotation={[0, orientationYaw, 0]}
    >
      <mesh castShadow position={[0, 1.52, 0]}>
        <cylinderGeometry args={[0.46, 0.68, 1.75, 7]} />
        <meshStandardMaterial color="#f2e7d2" flatShading roughness={1} />
      </mesh>
      <group name="the-nose" position={[0, NOSE_REST_POSITION_Y, 0]} ref={nose}>
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
      <PhysicalFreshnessGauge
        companyName={companyName}
        needle={gaugeNeedle}
        smellRemainingPercent={smellRemainingPercent}
      />
      <ScentParticles particles={particles} />
    </group>
  );
}

export function animateNoseInhaleParticles(
  particleGroup: Group,
  time: number,
  frameDelta: number,
) {
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
      MathUtils.lerp(1.4 + particleDefinition.offset * 1.7, 1.52, easedCycle),
      MathUtils.lerp(4.8 + particleDefinition.offset * 1.8, 1.34, easedCycle),
    );
    particle.rotation.x += frameDelta * (1.4 + index * 0.03);
    particle.rotation.y += frameDelta * (2.1 + index * 0.04);
    particle.scale.setScalar(particleDefinition.size * (1 - easedCycle * 0.58));
  }
}

export function animateNoseSneezeParticles(
  particleGroup: Group,
  progress: number,
  frameDelta: number,
) {
  for (const [index, particle] of particleGroup.children.entries()) {
    const particleDefinition = SCENT_PARTICLES[index];
    const stagger = MathUtils.clamp(
      progress * 1.45 - particleDefinition.offset * 0.45,
      0,
      1,
    );
    const spread = smoothstep(stagger);

    particle.position.set(
      particleDefinition.side * (0.29 + spread * (0.8 + index * 0.035)),
      1.5 + Math.sin(index * 1.7) * 0.18 + spread * 0.35,
      1.34 + spread * (2.6 + particleDefinition.offset * 1.4),
    );
    particle.rotation.x += frameDelta * (4 + index * 0.08);
    particle.rotation.y += frameDelta * (5 + index * 0.06);
    particle.scale.setScalar(particleDefinition.size * (1.25 - spread * 0.55));
  }
}
