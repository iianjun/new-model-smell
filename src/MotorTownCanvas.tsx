import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { Suspense, useEffect } from "react";
import type { DrivingTelemetry } from "./driving";
import { InspectorCart } from "./InspectorCart";
import { MotorTownGraybox } from "./MotorTownGraybox";
import { OpeningSequence } from "./OpeningSequence";
import type { OpeningEntry, OpeningStage } from "./opening";
import { RoadGuidance } from "./RoadGuidance";

type MotorTownCanvasProps = {
  isDriving: boolean;
  onOpeningComplete: () => void;
  onOpeningStage: (stage: OpeningStage) => void;
  onReady: () => void;
  onTelemetry: (telemetry: DrivingTelemetry) => void;
  openingActive: boolean;
  openingEntry: OpeningEntry;
  openingStage: OpeningStage;
  skipRequested: boolean;
};

function RuntimeReady({ onReady }: Pick<MotorTownCanvasProps, "onReady">) {
  useEffect(() => {
    const frame = window.requestAnimationFrame(onReady);

    return () => window.cancelAnimationFrame(frame);
  }, [onReady]);

  return null;
}

function MotorTownWorld({
  isDriving,
  onOpeningComplete,
  onOpeningStage,
  onReady,
  onTelemetry,
  openingActive,
  openingEntry,
  openingStage,
  skipRequested,
}: MotorTownCanvasProps) {
  return (
    <>
      <ambientLight intensity={1.8} />
      <hemisphereLight color="#f7f0df" groundColor="#718654" intensity={1.2} />
      <directionalLight
        castShadow
        intensity={2.65}
        position={[-8, 15, 10]}
        shadow-bias={-0.00035}
        shadow-camera-bottom={-18}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={18}
        shadow-mapSize-height={1024}
        shadow-mapSize-width={1024}
      />

      <Suspense fallback={null}>
        <Physics colliders={false} gravity={[0, -13, 0]}>
          <MotorTownGraybox />
          <InspectorCart
            awake={isDriving || openingStage === "wake"}
            cameraEnabled={isDriving}
            controlsEnabled={isDriving}
            onTelemetry={onTelemetry}
          />
          <OpeningSequence
            active={openingActive}
            entry={openingEntry}
            isDriving={isDriving}
            onComplete={onOpeningComplete}
            onStage={onOpeningStage}
            skipRequested={skipRequested}
          />
          <RoadGuidance visible={isDriving} />
          <RuntimeReady onReady={onReady} />
        </Physics>
      </Suspense>
    </>
  );
}

export default function MotorTownCanvas(props: MotorTownCanvasProps) {
  return (
    <Canvas
      camera={{
        far: 70,
        fov: 46,
        near: 0.1,
        position: [4.2, 9.5, 18],
      }}
      dpr={[1, 2]}
      gl={{
        antialias: true,
        powerPreference: "high-performance",
      }}
      shadows
    >
      <MotorTownWorld {...props} />
    </Canvas>
  );
}
