import { lazy, Suspense, useCallback, useState } from "react";
import "./App.css";

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

function RuntimeInterface() {
  return (
    <div className="runtime-interface">
      <header className="title-lockup">
        <p>Motor Town · Runtime 01</p>
        <h1>New Model Motors</h1>
      </header>

      <aside className="runtime-card" aria-label="Runtime status">
        <span className="status-light" aria-hidden="true" />
        <div>
          <p>Inspection floor</p>
          <strong>Physics online</strong>
        </div>
      </aside>

      <p className="runtime-caption">
        Physical handling check
        <span>01</span>
      </p>
    </div>
  );
}

function App() {
  const [isReady, setIsReady] = useState(false);
  const markRuntimeReady = useCallback(() => setIsReady(true), []);

  return (
    <main className="app-shell">
      <div className="world-canvas" aria-hidden="true">
        <Suspense fallback={null}>
          <MotorTownCanvas onReady={markRuntimeReady} />
        </Suspense>
      </div>

      {isReady ? <RuntimeInterface /> : <LoadingSurface />}
    </main>
  );
}

export default App;
