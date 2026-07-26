import { lazy, Suspense, useCallback, useState } from "react";
import "./App.css";
import { type DrivingTelemetry, INITIAL_DRIVING_TELEMETRY } from "./driving";

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

function RuntimeInterface({ telemetry }: { telemetry: DrivingTelemetry }) {
  const drivingLabel = {
    bounce: "Bounced clear",
    driving: "Cart in motion",
    handbrake: "Short handbrake",
    ready: "Ready to inspect",
    recovery: "Recovery complete",
  }[telemetry.state];

  return (
    <div className="runtime-interface">
      <header className="title-lockup">
        <p>Motor Town · Runtime 02</p>
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
          <strong>{drivingLabel}</strong>
        </div>
      </aside>

      <aside className="driving-guide" aria-label="Driving controls">
        <p>Drive</p>
        <strong>WASD · Arrows</strong>
        <span>Short handbrake · Space</span>
      </aside>

      <p className="runtime-caption">
        Graybox handling route
        <span>02</span>
      </p>
    </div>
  );
}

function App() {
  const [isReady, setIsReady] = useState(false);
  const [telemetry, setTelemetry] = useState<DrivingTelemetry>(
    INITIAL_DRIVING_TELEMETRY,
  );
  const markRuntimeReady = useCallback(() => setIsReady(true), []);
  const updateTelemetry = useCallback(
    (nextTelemetry: DrivingTelemetry) => setTelemetry(nextTelemetry),
    [],
  );

  return (
    <main className="app-shell">
      <div className="world-canvas" aria-hidden="true">
        <Suspense fallback={null}>
          <MotorTownCanvas
            onReady={markRuntimeReady}
            onTelemetry={updateTelemetry}
          />
        </Suspense>
      </div>

      {isReady ? (
        <RuntimeInterface telemetry={telemetry} />
      ) : (
        <LoadingSurface />
      )}
    </main>
  );
}

export default App;
