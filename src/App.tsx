import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import "./App.css";
import {
  type DossierController,
  dossierReducer,
  getDossierPhaseBehavior,
} from "./dossier";
import { type DrivingTelemetry, INITIAL_DRIVING_TELEMETRY } from "./driving";
import {
  type DynoRuntimeState,
  getDynoPhaseDefinition,
  getDynoStatusLabel,
  INITIAL_DYNO_RUNTIME_STATE,
} from "./dyno";
import {
  type ExperienceState,
  experienceReducer,
  getExperiencePhaseBehavior,
  INITIAL_EXPERIENCE_STATE,
  type TransferPhase,
} from "./experience";
import {
  type FlagshipModel,
  getInitialCartPosition,
  getInitialDriveOutFlagshipId,
  getTrackedCompanies,
  isInOpenAiShowroomRevealZone,
  type TrackedCompany,
  type WorldPosition,
} from "./flagshipLineup";
import { GraphicsQualitySettings } from "./GraphicsQualitySettings";
import {
  type GraphicsQualityId,
  getGraphicsQualityPreset,
  readGraphicsQualityPreference,
  writeGraphicsQualityPreference,
} from "./graphicsQuality";
import { ModelDossier } from "./ModelDossier";
import {
  type FlagshipLaunchFreshness,
  getNewestFlagshipLaunchFreshness,
} from "./modelFreshness";
import {
  INITIAL_OPENING_STAGE,
  type OpeningEntry,
  type OpeningStage,
} from "./opening";
import { ShowroomDirectory } from "./ShowroomDirectory";
import { useProgressiveAudio } from "./useProgressiveAudio";

const MotorTownCanvas = lazy(() => import("./MotorTownCanvas"));

function LoadingSurface() {
  return (
    <section
      className="loading-surface"
      role="status"
      aria-label="Loading New Model Motors"
    >
      <div className="loading-mark" aria-hidden="true">
        <span>N</span>
        <span>M</span>
        <span>M</span>
      </div>
      <p className="loading-kicker">New Model Motors</p>
      <h1>Preparing the inspection floor</h1>
      <div className="loading-meter" aria-hidden="true">
        <span />
      </div>
      <p className="loading-detail">Renderer online · warming physics</p>
    </section>
  );
}

type RuntimeInterfaceProps = {
  activeFlagship: FlagshipModel | null;
  audioEnabled: boolean;
  dynoState: DynoRuntimeState;
  experience: ExperienceState;
  graphicsQuality: GraphicsQualityId;
  onGraphicsQualityChange: (quality: GraphicsQualityId) => void;
  openingEntry: OpeningEntry;
  openingStage: OpeningStage;
  noseFreshness: FlagshipLaunchFreshness;
  openAiFlagshipLineup: readonly FlagshipModel[];
  showroomVisible: boolean;
  telemetry: DrivingTelemetry;
  toggleAudio: () => void;
};

function RuntimeInterface({
  activeFlagship,
  audioEnabled,
  dynoState,
  experience,
  graphicsQuality,
  onGraphicsQualityChange,
  openingEntry,
  openingStage,
  noseFreshness,
  openAiFlagshipLineup,
  showroomVisible,
  telemetry,
  toggleAudio,
}: RuntimeInterfaceProps) {
  const inspectorDrivingLabel = {
    bounce: "Bounced clear",
    driving: "Cart in motion",
    handbrake: "Short handbrake",
    ready: "Ready to inspect",
    recovery: "Recovery complete",
  }[telemetry.state];
  const flagshipDrivingLabel = experience.driveOutComplete
    ? "Drive-Out complete"
    : {
        bounce: "Bounced clear",
        driving: "Flagship in motion",
        handbrake: "Controlled drift",
        ready: "Ready for Drive-Out",
        recovery: "Recovery complete",
      }[telemetry.state];
  const phaseBehavior = getExperiencePhaseBehavior(experience.phase);
  const transferLabel = phaseBehavior.statusLabel;
  const openingActive = !phaseBehavior.openingCompleted;
  const inspectorDriving = phaseBehavior.controlledVehicle === "inspector-cart";
  const flagshipDriving = phaseBehavior.controlledVehicle === "active-flagship";
  const transferActive = Boolean(transferLabel);
  const dynoPhase = getDynoPhaseDefinition(dynoState.phase);
  const dynoActive = dynoPhase.active;
  const statusTitle = dynoActive
    ? dynoPhase.statusSubject === "inspector-cart"
      ? "Dyno Lab · Flagship only"
      : `Dyno Lab · ${activeFlagship?.name ?? "Pending"}`
    : flagshipDriving
      ? `Active Flagship · ${activeFlagship?.name ?? "Pending"}`
      : transferActive
        ? `Valet Transfer · ${activeFlagship?.name ?? "Pending"}`
        : "Inspector Cart";
  const statusLabel = openingActive
    ? "Opening owns controls"
    : dynoActive
      ? getDynoStatusLabel(dynoState)
      : inspectorDriving
        ? inspectorDrivingLabel
        : flagshipDriving
          ? flagshipDrivingLabel
          : transferLabel;
  const showFreshnessEvent =
    openingEntry === "full" &&
    (openingStage === "detected" || openingStage === "sneeze");
  const openingLabel = {
    detected: "Freshness gauge at event state",
    inhale: "The Nose is sampling Model Freshness",
    sneeze: "Sneeze reveal in progress",
    wake: "Inspector Cart waking",
  }[openingStage];
  const navigationLabel =
    !openingActive &&
    !dynoState.vehicleSecured &&
    (inspectorDriving || flagshipDriving) &&
    telemetry.navigation
      ? `${telemetry.navigation.target === "showroom" ? "Showroom" : "Dyno Lab"} · ${
          telemetry.navigation.distanceMeters
        } m · ${
          telemetry.navigation.direction === "ahead"
            ? "straight ahead"
            : `steer ${telemetry.navigation.direction}`
        }`
      : null;

  return (
    <div className="runtime-interface">
      <p className="visually-hidden" data-testid="nose-freshness">
        The Nose Model Freshness target · {noseFreshness.company.name} ·{" "}
        {noseFreshness.model.name} · NEW MODEL SMELL REMAINING{" "}
        {noseFreshness.smellRemainingPercent}%
      </p>
      <header className="title-lockup">
        <p>Motor Town · Runtime 09</p>
        <h1>New Model Motors</h1>
      </header>

      <div className="runtime-controls">
        <button
          aria-label={`${audioEnabled ? "Disable" : "Enable"} Motor Town audio`}
          aria-pressed={audioEnabled}
          className="audio-control"
          onClick={(event) => {
            toggleAudio();
            event.currentTarget.blur();
          }}
          type="button"
        >
          <span aria-hidden="true">{audioEnabled ? "◖))" : "◖×"}</span>
          Audio {audioEnabled ? "on" : "off"}
        </button>
        <GraphicsQualitySettings
          onChange={onGraphicsQualityChange}
          selectedQuality={graphicsQuality}
        />
      </div>

      <aside
        aria-label={
          dynoActive
            ? "Dyno Lab status"
            : flagshipDriving
              ? "Active Flagship status"
              : transferActive
                ? "Valet Transfer status"
                : "Inspector Cart status"
        }
        aria-live="polite"
        className="runtime-card"
        data-phase={experience.phase}
        data-testid="driving-state"
        role="status"
      >
        <span className="status-light" aria-hidden="true" />
        <div>
          <p>{statusTitle}</p>
          <strong>{statusLabel}</strong>
          {navigationLabel ? (
            <small data-testid="navigation-guide">{navigationLabel}</small>
          ) : null}
        </div>
      </aside>

      {!openingActive ? (
        <>
          <ShowroomDirectory
            lineup={openAiFlagshipLineup}
            visible={showroomVisible}
          />
          {inspectorDriving || flagshipDriving ? (
            <aside className="driving-guide" aria-label="Driving controls">
              <p>
                {dynoState.vehicleSecured
                  ? "Dyno run"
                  : flagshipDriving
                    ? "Drive-Out"
                    : "Drive"}
              </p>
              <strong>WASD · Arrows</strong>
              <span>Short handbrake · Space</span>
            </aside>
          ) : null}
          {dynoState.vehicleSecured ? (
            <aside
              aria-label="Dyno run progress"
              className="dyno-readout"
              data-phase={dynoState.phase}
              data-testid="dyno-state"
            >
              <p>Player-operated Dyno</p>
              <strong>{Math.round(dynoState.progress * 100)}%</strong>
              <progress max={1} value={dynoState.progress}>
                {Math.round(dynoState.progress * 100)}%
              </progress>
              <span>{dynoPhase.readoutLabel}</span>
            </aside>
          ) : null}
          {inspectorDriving ? (
            <p className="visually-hidden" role="status">
              WASD — BEGIN INSPECTION
            </p>
          ) : null}
        </>
      ) : (
        <>
          <p className="opening-stage" role="status">
            {openingLabel}
          </p>
          <p className="opening-skip">Press any key to skip</p>
          {openingEntry === "reduced" ? (
            <section className="opening-announcement calm-reveal">
              <p>Reduced motion</p>
              <strong>Calm Motor Town reveal</strong>
            </section>
          ) : null}
          {showFreshnessEvent ? (
            <section className="opening-announcement freshness-event">
              <span aria-hidden="true" />
              <div>
                <p>The Nose · physical gauge 100%</p>
                <strong>FRESHNESS EVENT DETECTED</strong>
              </div>
            </section>
          ) : null}
        </>
      )}

      <p className="runtime-caption">
        Dyno Sheet Dossier
        <span>09</span>
      </p>
    </div>
  );
}

function getOpeningEntry(): OpeningEntry {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "reduced"
    : "full";
}

function App() {
  const {
    enabled: audioEnabled,
    playCue,
    setDynoRunIntensity,
    toggle: toggleAudio,
  } = useProgressiveAudio();
  const [graphicsQuality, setGraphicsQuality] = useState<GraphicsQualityId>(
    readGraphicsQualityPreference,
  );
  const graphicsQualityPreset = getGraphicsQualityPreset(graphicsQuality);
  const [trackedCompanies] =
    useState<readonly TrackedCompany[]>(getTrackedCompanies);
  const noseFreshness = useMemo(
    () => getNewestFlagshipLaunchFreshness(trackedCompanies),
    [trackedCompanies],
  );
  const openAiFlagshipLineup = useMemo(() => {
    const openAi = trackedCompanies.find((company) => company.id === "openai");

    if (!openAi) {
      throw new Error("OpenAI must be present in the loaded Tracked Companies");
    }

    return openAi.flagshipLineup;
  }, [trackedCompanies]);
  const [initialCartPosition] = useState<WorldPosition>(() =>
    getInitialCartPosition(openAiFlagshipLineup),
  );
  const [initialExperience] = useState<ExperienceState>(() => {
    const driveOutFlagshipId = getInitialDriveOutFlagshipId();

    if (!driveOutFlagshipId) {
      return INITIAL_EXPERIENCE_STATE;
    }

    if (
      !openAiFlagshipLineup.some((model) => model.id === driveOutFlagshipId)
    ) {
      throw new Error(
        "Initial Drive-Out Flagship fixture is outside the loaded lineup",
      );
    }

    return {
      activeFlagshipId: driveOutFlagshipId,
      driveOutComplete: true,
      phase: "flagship-driving",
    };
  });
  const [experience, dispatchExperience] = useReducer(
    experienceReducer,
    initialExperience,
  );
  const experienceBehavior = getExperiencePhaseBehavior(experience.phase);
  const activeFlagship = useMemo(
    () =>
      openAiFlagshipLineup.find(
        (model) => model.id === experience.activeFlagshipId,
      ) ?? null,
    [experience.activeFlagshipId, openAiFlagshipLineup],
  );
  const isReadyRef = useRef(false);
  const openingCompletedRef = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const [openingEntry, setOpeningEntry] =
    useState<OpeningEntry>(getOpeningEntry);
  const [openingStage, setOpeningStage] = useState<OpeningStage>(
    INITIAL_OPENING_STAGE,
  );
  const [skipRequested, setSkipRequested] = useState(false);
  const [telemetry, setTelemetry] = useState<DrivingTelemetry>(
    INITIAL_DRIVING_TELEMETRY,
  );
  const [dynoState, setDynoState] = useState<DynoRuntimeState>(
    INITIAL_DYNO_RUNTIME_STATE,
  );
  const [dossierPhase, dispatchDossier] = useReducer(dossierReducer, "closed");
  const dossierBehavior = getDossierPhaseBehavior(dossierPhase);
  const [showroomVisible, setShowroomVisible] = useState(() =>
    isInOpenAiShowroomRevealZone(initialCartPosition),
  );
  const changeGraphicsQuality = useCallback((quality: GraphicsQualityId) => {
    setGraphicsQuality(quality);
    writeGraphicsQualityPreference(quality);
  }, []);
  const markRuntimeReady = useCallback(() => {
    isReadyRef.current = true;
    setIsReady(true);
  }, []);
  const finishOpening = useCallback(() => {
    playCue("reveal");
    openingCompletedRef.current = true;
    dispatchExperience({ type: "opening-completed" });
    setSkipRequested(false);
  }, [playCue]);
  const startValetTransfer = useCallback(
    (flagshipId: string) => {
      playCue("transfer");
      dispatchExperience({ flagshipId, type: "valet-transfer-started" });
    },
    [playCue],
  );
  const completeValetPhase = useCallback((phase: TransferPhase) => {
    dispatchExperience({ phase, type: "valet-phase-completed" });
  }, []);
  const completeDriveOut = useCallback(() => {
    playCue("reveal");
    dispatchExperience({ type: "drive-out-completed" });
  }, [playCue]);
  const updateTelemetry = useCallback(
    (nextTelemetry: DrivingTelemetry) => setTelemetry(nextTelemetry),
    [],
  );
  const openDossier = useCallback(() => {
    playCue("dossier");
    dispatchDossier("open-requested");
  }, [playCue]);
  const closeDossier = useCallback(() => {
    dispatchDossier("close-requested");
  }, []);
  const completeDossierOpening = useCallback(() => {
    dispatchDossier("opening-finished");
  }, []);
  const completeDossierRetraction = useCallback(() => {
    dispatchDossier("retraction-finished");
  }, []);
  const dossier = useMemo<DossierController>(
    () => ({
      completeRetraction: completeDossierRetraction,
      open: openDossier,
      phase: dossierPhase,
    }),
    [completeDossierRetraction, dossierPhase, openDossier],
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateOpeningEntry = () => {
      if (!experienceBehavior.openingCompleted) {
        setOpeningEntry(mediaQuery.matches ? "reduced" : "full");
      }
    };

    updateOpeningEntry();
    mediaQuery.addEventListener("change", updateOpeningEntry);

    return () => mediaQuery.removeEventListener("change", updateOpeningEntry);
  }, [experienceBehavior.openingCompleted]);

  useEffect(() => {
    const skipOpening = (event: KeyboardEvent) => {
      if (event.repeat || !isReadyRef.current || openingCompletedRef.current) {
        return;
      }

      event.preventDefault();
      setSkipRequested(true);
    };

    window.addEventListener("keydown", skipOpening, { passive: false });

    return () => window.removeEventListener("keydown", skipOpening);
  }, []);

  const previousDrivingState = useRef(telemetry.state);

  useEffect(() => {
    if (previousDrivingState.current !== telemetry.state) {
      if (telemetry.state === "bounce") {
        playCue("collision");
      } else if (telemetry.state === "handbrake") {
        playCue("tire");
      }
    }

    previousDrivingState.current = telemetry.state;
  }, [playCue, telemetry.state]);

  const previousDynoPhase = useRef(dynoState.phase);

  useEffect(() => {
    setDynoRunIntensity(dynoState.phase === "running", dynoState.progress);
  }, [dynoState.phase, dynoState.progress, setDynoRunIntensity]);

  useEffect(() => {
    if (
      previousDynoPhase.current !== dynoState.phase &&
      (dynoState.phase === "clamping" || dynoState.phase === "sheet-ready")
    ) {
      playCue("dyno");
    }

    previousDynoPhase.current = dynoState.phase;
  }, [dynoState.phase, playCue]);

  return (
    <main className="app-shell">
      <div
        className="world-canvas"
        aria-hidden="true"
        data-graphics-quality={graphicsQuality}
      >
        <Suspense fallback={null}>
          <MotorTownCanvas
            activeFlagship={activeFlagship}
            dossier={dossier}
            experience={experience}
            graphicsDpr={graphicsQualityPreset.dpr}
            initialCartPosition={initialCartPosition}
            onDriveOutComplete={completeDriveOut}
            onDynoStateChange={setDynoState}
            onOpeningComplete={finishOpening}
            onOpeningStage={setOpeningStage}
            onReady={markRuntimeReady}
            onShowroomVisibilityChange={setShowroomVisible}
            onTelemetry={updateTelemetry}
            onTransferPhaseComplete={completeValetPhase}
            onTransferStart={startValetTransfer}
            openAiFlagshipLineup={openAiFlagshipLineup}
            openingActive={isReady && !experienceBehavior.openingCompleted}
            openingEntry={openingEntry}
            openingStage={openingStage}
            skipRequested={skipRequested}
            trackedCompanies={trackedCompanies}
          />
        </Suspense>
      </div>

      {isReady ? (
        <>
          <RuntimeInterface
            activeFlagship={activeFlagship}
            audioEnabled={audioEnabled}
            dynoState={dynoState}
            experience={experience}
            graphicsQuality={graphicsQuality}
            noseFreshness={noseFreshness}
            onGraphicsQualityChange={changeGraphicsQuality}
            openingEntry={openingEntry}
            openingStage={openingStage}
            openAiFlagshipLineup={openAiFlagshipLineup}
            showroomVisible={showroomVisible}
            telemetry={telemetry}
            toggleAudio={toggleAudio}
          />
          {activeFlagship && dossierBehavior.mounted ? (
            <ModelDossier
              activeFlagship={activeFlagship}
              onClose={closeDossier}
              onOpeningComplete={completeDossierOpening}
              phase={dossierPhase}
            />
          ) : null}
        </>
      ) : (
        <LoadingSurface />
      )}
    </main>
  );
}

export default App;
