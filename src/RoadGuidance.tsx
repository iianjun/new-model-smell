import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  CanvasTexture,
  LinearFilter,
  MathUtils,
  type MeshBasicMaterial,
  SRGBColorSpace,
} from "three";

type RoadGuidanceProps = {
  visible: boolean;
};

export function RoadGuidance({ visible }: RoadGuidanceProps) {
  const material = useRef<MeshBasicMaterial>(null);
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 256;

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Road guidance requires a canvas context.");
    }

    context.fillStyle = "#ef6d32";
    context.fillRect(16, 16, canvas.width - 32, canvas.height - 32);
    context.lineWidth = 16;
    context.strokeStyle = "#f2e7d2";
    context.strokeRect(16, 16, canvas.width - 32, canvas.height - 32);
    context.fillStyle = "#252723";
    context.font =
      "900 64px Inter, ui-sans-serif, system-ui, -apple-system, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(
      "WASD — BEGIN INSPECTION",
      canvas.width / 2,
      canvas.height / 2 + 3,
    );

    const roadTexture = new CanvasTexture(canvas);
    roadTexture.colorSpace = SRGBColorSpace;
    roadTexture.magFilter = LinearFilter;
    roadTexture.minFilter = LinearFilter;
    roadTexture.anisotropy = 8;

    return roadTexture;
  }, []);

  useEffect(() => () => texture.dispose(), [texture]);

  useFrame((_, frameDelta) => {
    if (!material.current) {
      return;
    }

    material.current.opacity = MathUtils.damp(
      material.current.opacity,
      visible ? 1 : 0,
      8,
      Math.min(frameDelta, 0.05),
    );
  });

  return (
    <group
      name="road-guidance"
      position={[2.2, 0.145, 5.35]}
      rotation={[0, 2.53, 0]}
    >
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.55, 1.05]} />
        <meshBasicMaterial
          depthWrite={false}
          map={texture}
          opacity={0}
          polygonOffset
          polygonOffsetFactor={-2}
          ref={material}
          toneMapped={false}
          transparent
        />
      </mesh>
    </group>
  );
}
