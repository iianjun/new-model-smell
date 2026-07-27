import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import "./App.css";
import { type DrivingTelemetry, INITIAL_DRIVING_TELEMETRY } from "./driving";
import {
  INITIAL_OPENING_STAGE,
  type OpeningEntry,
  type OpeningStage,
} from "./opening";

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
  isDriving: boolean;
  openingEntry: OpeningEntry;
  openingStage: OpeningStage;
  telemetry: DrivingTelemetry;
};

function RuntimeInterface({
  isDriving,
  openingEntry,
  openingStage,
  telemetry,
}: RuntimeInterfaceProps) {
  const drivingLabel = {
    bounce: "Bounced clear",
    driving: "Cart in motion",
    handbrake: "Short handbrake",
    ready: "Ready to inspect",
    recovery: "Recovery complete",
  }[telemetry.state];
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
        <p>Motor Town · Runtime 03</p>
        <h1>New Model Motors</h1>
      </header>

      <aside
        aria-label="Inspector Cart status"
        aria-live="polite"
        className="runtime-card"
        data-testid="driving-state"
        role="status"
      >
        <span className="status-light" aria-hidden="true" />
        <div>
          <p>Inspector Cart</p>
          <strong>{isDriving ? drivingLabel : "Opening owns controls"}</strong>
        </div>
      </aside>

      {isDriving ? (
        <>
          <aside className="driving-guide" aria-label="Driving controls">
            <p>Drive</p>
            <strong>WASD · Arrows</strong>
            <span>Short handbrake · Space</span>
          </aside>
          <p className="visually-hidden" role="status">
            WASD — BEGIN INSPECTION
          </p>
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
        Live Motor Town opening
        <span>03</span>
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
  const isReadyRef = useRef(false);
  const isDrivingRef = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const [isDriving, setIsDriving] = useState(false);
  const [openingEntry, setOpeningEntry] =
    useState<OpeningEntry>(getOpeningEntry);
  const [openingStage, setOpeningStage] = useState<OpeningStage>(
    INITIAL_OPENING_STAGE,
  );
  const [skipRequested, setSkipRequested] = useState(false);
  const [telemetry, setTelemetry] = useState<DrivingTelemetry>(
    INITIAL_DRIVING_TELEMETRY,
  );
  const markRuntimeReady = useCallback(() => {
    isReadyRef.current = true;
    setIsReady(true);
  }, []);
  const finishOpening = useCallback(() => {
    isDrivingRef.current = true;
    setIsDriving(true);
    setSkipRequested(false);
  }, []);
  const updateTelemetry = useCallback(
    (nextTelemetry: DrivingTelemetry) => setTelemetry(nextTelemetry),
    [],
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateOpeningEntry = () => {
      if (!isDriving) {
        setOpeningEntry(mediaQuery.matches ? "reduced" : "full");
      }
    };

    updateOpeningEntry();
    mediaQuery.addEventListener("change", updateOpeningEntry);

    return () => mediaQuery.removeEventListener("change", updateOpeningEntry);
  }, [isDriving]);

  useEffect(() => {
    const skipOpening = (event: KeyboardEvent) => {
      if (event.repeat || !isReadyRef.current || isDrivingRef.current) {
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
            isDriving={isDriving}
            onOpeningComplete={finishOpening}
            onOpeningStage={setOpeningStage}
            onReady={markRuntimeReady}
            onTelemetry={updateTelemetry}
            openingActive={isReady && !isDriving}
            openingEntry={openingEntry}
            openingStage={openingStage}
            skipRequested={skipRequested}
          />
        </Suspense>
      </div>

      {isReady ? (
        <RuntimeInterface
          isDriving={isDriving}
          openingEntry={openingEntry}
          openingStage={openingStage}
          telemetry={telemetry}
        />
      ) : (
        <LoadingSurface />
      )}
    </main>
  );
}

export default App;
