import { Canvas } from "@react-three/fiber";
import { Physics, type RapierRigidBody } from "@react-three/rapier";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { ActiveFlagship, FLAGSHIP_INITIAL_YAW } from "./ActiveFlagship";
import { DynoLab } from "./DynoLab";
import type { DrivingTelemetry } from "./driving";
import { type DynoRuntimeState, INITIAL_DYNO_RUNTIME_STATE } from "./dyno";
import {
  type ExperienceState,
  getExperiencePhaseBehavior,
  type TransferPhase,
  type ValetTransferController,
} from "./experience";
import type {
  FlagshipModel,
  TrackedCompany,
  WorldPosition,
} from "./flagshipLineup";
import {
  getInitialActiveFlagshipPosition,
  getInitialActiveFlagshipYaw,
} from "./flagshipLineup";
import { InspectorCart } from "./InspectorCart";
import { LIGHT_SIGNATURES } from "./ModelVehicleModel";
import { MotorTownGraybox } from "./MotorTownGraybox";
import { OpeningSequence } from "./OpeningSequence";
import type { OpeningEntry, OpeningStage } from "./opening";
import { RoadGuidance } from "./RoadGuidance";
import {
  getFlagshipDisplayWorldPosition,
  getShowroomDisplayPositions,
} from "./showroomLayout";
import { useDrivingInput } from "./useDrivingInput";

type MotorTownCanvasProps = {
  activeFlagship: FlagshipModel | null;
  experience: ExperienceState;
  initialCartPosition: WorldPosition;
  onDriveOutComplete: () => void;
  onDynoStateChange: (state: DynoRuntimeState) => void;
  onOpeningComplete: () => void;
  onOpeningStage: (stage: OpeningStage) => void;
  onReady: () => void;
  onShowroomVisibilityChange: (visible: boolean) => void;
  onTelemetry: (telemetry: DrivingTelemetry) => void;
  onTransferPhaseComplete: (phase: TransferPhase) => void;
  onTransferStart: (flagshipId: string) => void;
  openAiFlagshipLineup: readonly FlagshipModel[];
  openingActive: boolean;
  openingEntry: OpeningEntry;
  openingStage: OpeningStage;
  skipRequested: boolean;
  trackedCompanies: readonly TrackedCompany[];
};

function RuntimeReady({ onReady }: Pick<MotorTownCanvasProps, "onReady">) {
  useEffect(() => {
    const frame = window.requestAnimationFrame(onReady);

    return () => window.cancelAnimationFrame(frame);
  }, [onReady]);

  return null;
}

function MotorTownWorld({
  activeFlagship,
  experience,
  initialCartPosition,
  onDriveOutComplete,
  onDynoStateChange,
  onOpeningComplete,
  onOpeningStage,
  onReady,
  onShowroomVisibilityChange,
  onTelemetry,
  onTransferPhaseComplete,
  onTransferStart,
  openAiFlagshipLineup,
  openingActive,
  openingEntry,
  openingStage,
  skipRequested,
  trackedCompanies,
}: MotorTownCanvasProps) {
  const inspectorCartBody = useRef<RapierRigidBody>(null);
  const activeFlagshipBody = useRef<RapierRigidBody>(null);
  const dynoRunIntensity = useRef(0);
  const [dynoState, setDynoState] = useState(INITIAL_DYNO_RUNTIME_STATE);
  const phaseBehavior = getExperiencePhaseBehavior(experience.phase);
  const openingCompleted = phaseBehavior.openingCompleted;
  const inspectorControlsEnabled =
    phaseBehavior.controlledVehicle === "inspector-cart";
  const flagshipControlsEnabled =
    phaseBehavior.controlledVehicle === "active-flagship";
  const flagshipInput = useDrivingInput(flagshipControlsEnabled);
  const updateDynoState = useCallback(
    (state: DynoRuntimeState) => {
      setDynoState(state);
      onDynoStateChange(state);
    },
    [onDynoStateChange],
  );
  const valetTransfer: ValetTransferController = {
    activeFlagshipId: experience.activeFlagshipId,
    onPhaseComplete: onTransferPhaseComplete,
    onStart: onTransferStart,
    phase: experience.phase,
  };
  const activeFlagshipIndex = activeFlagship
    ? openAiFlagshipLineup.findIndex((model) => model.id === activeFlagship.id)
    : -1;
  const displayPositions = getShowroomDisplayPositions(
    openAiFlagshipLineup.length,
  );
  const defaultActiveFlagshipPosition = getFlagshipDisplayWorldPosition(
    activeFlagshipIndex >= 0 ? displayPositions[activeFlagshipIndex] : 0,
  );
  const activeFlagshipPosition = getInitialActiveFlagshipPosition(
    defaultActiveFlagshipPosition,
  );
  const activeFlagshipYaw = getInitialActiveFlagshipYaw(FLAGSHIP_INITIAL_YAW);

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
          <MotorTownGraybox
            activeFlagshipBody={activeFlagshipBody}
            inspectorCartBody={inspectorCartBody}
            onShowroomVisibilityChange={onShowroomVisibilityChange}
            openAiFlagshipLineup={openAiFlagshipLineup}
            valetTransfer={valetTransfer}
          />
          <InspectorCart
            awake={openingCompleted || openingStage === "wake"}
            body={inspectorCartBody}
            cameraEnabled={inspectorControlsEnabled}
            controlsEnabled={inspectorControlsEnabled}
            initialPosition={initialCartPosition}
            onTelemetry={onTelemetry}
            presentation={phaseBehavior.cartPresentation}
          />
          {activeFlagship && flagshipControlsEnabled ? (
            <ActiveFlagship
              body={activeFlagshipBody}
              controlsEnabled
              dynoRunIntensity={dynoRunIntensity}
              initialYaw={activeFlagshipYaw}
              initialPosition={activeFlagshipPosition}
              input={flagshipInput}
              model={activeFlagship}
              movementEnabled={!dynoState.vehicleSecured}
              onDriveOutComplete={onDriveOutComplete}
              onTelemetry={onTelemetry}
              signature={
                LIGHT_SIGNATURES[
                  Math.max(0, activeFlagshipIndex) % LIGHT_SIGNATURES.length
                ]
              }
            />
          ) : null}
          <DynoLab
            activeFlagshipAvailable={Boolean(
              activeFlagship && experience.driveOutComplete,
            )}
            activeFlagshipBody={activeFlagshipBody}
            input={flagshipInput}
            inspectorCartBody={inspectorCartBody}
            onStateChange={updateDynoState}
            runIntensity={dynoRunIntensity}
          />
          <OpeningSequence
            active={openingActive}
            entry={openingEntry}
            isDriving={openingCompleted}
            onComplete={onOpeningComplete}
            onStage={onOpeningStage}
            skipRequested={skipRequested}
            trackedCompanies={trackedCompanies}
            trackedVehicleBody={
              flagshipControlsEnabled ? activeFlagshipBody : inspectorCartBody
            }
          />
          <RoadGuidance visible={inspectorControlsEnabled} />
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
