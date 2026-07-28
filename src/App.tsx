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
import { type DrivingTelemetry, INITIAL_DRIVING_TELEMETRY } from "./driving";
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
  getTrackedCompanies,
  isInOpenAiShowroomRevealZone,
  type TrackedCompany,
  type WorldPosition,
} from "./flagshipLineup";
import {
  INITIAL_OPENING_STAGE,
  type OpeningEntry,
  type OpeningStage,
} from "./opening";
import { ShowroomDirectory } from "./ShowroomDirectory";

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
  experience: ExperienceState;
  openingEntry: OpeningEntry;
  openingStage: OpeningStage;
  openAiFlagshipLineup: readonly FlagshipModel[];
  showroomVisible: boolean;
  telemetry: DrivingTelemetry;
};

function RuntimeInterface({
  activeFlagship,
  experience,
  openingEntry,
  openingStage,
  openAiFlagshipLineup,
  showroomVisible,
  telemetry,
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
  const statusTitle = flagshipDriving
    ? `Active Flagship · ${activeFlagship?.name ?? "Pending"}`
    : transferActive
      ? `Valet Transfer · ${activeFlagship?.name ?? "Pending"}`
      : "Inspector Cart";
  const statusLabel = openingActive
    ? "Opening owns controls"
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

  return (
    <div className="runtime-interface">
      <header className="title-lockup">
        <p>Motor Town · Runtime 06</p>
        <h1>New Model Motors</h1>
      </header>

      <aside
        aria-label={
          flagshipDriving
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
              <p>{flagshipDriving ? "Drive-Out" : "Drive"}</p>
              <strong>WASD · Arrows</strong>
              <span>Short handbrake · Space</span>
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
        Live Model Freshness
        <span>06</span>
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
  const [trackedCompanies] =
    useState<readonly TrackedCompany[]>(getTrackedCompanies);
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
  const [experience, dispatchExperience] = useReducer(
    experienceReducer,
    INITIAL_EXPERIENCE_STATE,
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
  const [showroomVisible, setShowroomVisible] = useState(() =>
    isInOpenAiShowroomRevealZone(initialCartPosition),
  );
  const markRuntimeReady = useCallback(() => {
    isReadyRef.current = true;
    setIsReady(true);
  }, []);
  const finishOpening = useCallback(() => {
    openingCompletedRef.current = true;
    dispatchExperience({ type: "opening-completed" });
    setSkipRequested(false);
  }, []);
  const startValetTransfer = useCallback((flagshipId: string) => {
    dispatchExperience({ flagshipId, type: "valet-transfer-started" });
  }, []);
  const completeValetPhase = useCallback((phase: TransferPhase) => {
    dispatchExperience({ phase, type: "valet-phase-completed" });
  }, []);
  const completeDriveOut = useCallback(() => {
    dispatchExperience({ type: "drive-out-completed" });
  }, []);
  const updateTelemetry = useCallback(
    (nextTelemetry: DrivingTelemetry) => setTelemetry(nextTelemetry),
    [],
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

  return (
    <main className="app-shell">
      <div className="world-canvas" aria-hidden="true">
        <Suspense fallback={null}>
          <MotorTownCanvas
            activeFlagship={activeFlagship}
            experience={experience}
            initialCartPosition={initialCartPosition}
            onDriveOutComplete={completeDriveOut}
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
        <RuntimeInterface
          activeFlagship={activeFlagship}
          experience={experience}
          openingEntry={openingEntry}
          openingStage={openingStage}
          openAiFlagshipLineup={openAiFlagshipLineup}
          showroomVisible={showroomVisible}
          telemetry={telemetry}
        />
      ) : (
        <LoadingSurface />
      )}
    </main>
  );
}

export default App;
