import { type AnimationEvent, useEffect, useMemo, useRef } from "react";
import {
  type BenchmarkRecord,
  formatEvaluationDate,
  getBenchmarkComparisons,
} from "./benchmark";
import { type DossierPhase, getDossierPhaseBehavior } from "./dossier";
import {
  type FlagshipModel,
  formatPublicAvailabilityDate,
  formatReleaseAge,
  getReleaseAgeInDays,
} from "./flagshipLineup";

type BenchmarkRecordCardProps = {
  active: boolean;
  record: BenchmarkRecord;
};

function BenchmarkRecordCard({ active, record }: BenchmarkRecordCardProps) {
  return (
    <article
      aria-label={`${record.subject.name} · ${record.benchmark.name} ${record.benchmark.version}`}
      className={active ? "benchmark-record active-record" : "benchmark-record"}
    >
      <header>
        <p>{active ? "Active Flagship" : "Comparable rival"}</p>
        <h4>{record.subject.name}</h4>
      </header>
      <p className="benchmark-score">
        <strong>{record.score}</strong>
        <span>{record.unit}</span>
      </p>
      <dl>
        <div>
          <dt>Evaluator</dt>
          <dd>{record.evaluator}</dd>
        </div>
        <div>
          <dt>Evaluation date</dt>
          <dd>{formatEvaluationDate(record.evaluationDate)}</dd>
        </div>
        <div>
          <dt>Provenance</dt>
          <dd>{record.provenance}</dd>
        </div>
        <div>
          <dt>Caveats</dt>
          <dd>{record.caveats.join(" · ")}</dd>
        </div>
      </dl>
      <a
        className="benchmark-source"
        href={record.source.url}
        rel="noreferrer"
        target="_blank"
      >
        {record.source.label}
        <span aria-hidden="true"> ↗</span>
      </a>
    </article>
  );
}

type ModelDossierProps = {
  activeFlagship: FlagshipModel;
  onClose: () => void;
  onOpeningComplete: () => void;
  phase: DossierPhase;
};

export function ModelDossier({
  activeFlagship,
  onClose,
  onOpeningComplete,
  phase,
}: ModelDossierProps) {
  const closeButton = useRef<HTMLButtonElement>(null);
  const phaseBehavior = getDossierPhaseBehavior(phase);
  const comparisons = useMemo(
    () =>
      getBenchmarkComparisons(
        activeFlagship.id,
        activeFlagship.benchmarkRecords,
      ),
    [activeFlagship],
  );
  const releaseAge = getReleaseAgeInDays(activeFlagship.publicAvailabilityDate);
  const completeOpening = (event: AnimationEvent<HTMLDivElement>) => {
    if (
      phase === "opening" &&
      event.currentTarget === event.target &&
      event.animationName === "dossier-resolve"
    ) {
      onOpeningComplete();
    }
  };

  useEffect(() => {
    if (phaseBehavior.interactive) {
      closeButton.current?.focus();
    }
  }, [phaseBehavior.interactive]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !phaseBehavior.interactive) {
        return;
      }

      event.preventDefault();
      onClose();
    };

    window.addEventListener("keydown", closeOnEscape);

    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose, phaseBehavior.interactive]);

  return (
    <section
      aria-labelledby="model-dossier-title"
      aria-modal="true"
      className="dossier-overlay"
      data-phase={phase}
      data-testid="model-dossier"
      role="dialog"
    >
      <div className="dossier-paper" onAnimationEnd={completeOpening}>
        <header className="dossier-header">
          <div>
            <p>Dyno Lab · Curated evidence</p>
            <h2 className="dossier-title" id="model-dossier-title">
              {activeFlagship.name}
            </h2>
          </div>
          <button
            aria-label="Close Model Dossier and return to driving"
            disabled={!phaseBehavior.interactive}
            onClick={onClose}
            ref={closeButton}
            type="button"
          >
            Close dossier
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <dl className="dossier-identity">
          <div>
            <dt>Active Flagship</dt>
            <dd>{activeFlagship.name}</dd>
          </div>
          <div>
            <dt>Public Availability Date</dt>
            <dd>
              {formatPublicAvailabilityDate(
                activeFlagship.publicAvailabilityDate,
              )}
            </dd>
          </div>
          <div>
            <dt>Current Release Age</dt>
            <dd>{formatReleaseAge(releaseAge)}</dd>
          </div>
        </dl>

        <div className="dossier-evidence">
          {comparisons.length > 0 ? (
            comparisons.map(({ active, rivals }) => (
              <section
                className="benchmark-comparison"
                data-comparison={rivals.length > 0 ? "direct" : "solo"}
                key={`${active.benchmark.name}-${active.benchmark.version}`}
              >
                <header>
                  <div>
                    <p>Benchmark Record</p>
                    <h3 className="benchmark-title">
                      {active.benchmark.name}
                      <span>{active.benchmark.version}</span>
                    </h3>
                  </div>
                  <p className="benchmark-conditions">{active.conditions}</p>
                </header>
                {rivals.length === 0 ? (
                  <p className="comparison-policy">
                    Active Flagship only · no Comparable Benchmark evidence
                  </p>
                ) : (
                  <p className="comparison-policy">
                    Direct comparison · source, version, evaluator, and
                    conditions match
                  </p>
                )}
                <div className="benchmark-records">
                  <BenchmarkRecordCard active record={active} />
                  {rivals.map((rival) => (
                    <BenchmarkRecordCard
                      active={false}
                      key={rival.subject.id}
                      record={rival}
                    />
                  ))}
                </div>
              </section>
            ))
          ) : (
            <section className="dossier-empty">
              <p>Evidence bay</p>
              <h3 className="dossier-empty-title">
                No curated Benchmark Records available
              </h3>
              <span>
                This dossier shows only curated Benchmark Records with published
                evidence.
              </span>
            </section>
          )}
        </div>

        <footer className="dossier-footer">
          <p>
            Dyno performance is presentation only. Curated values remain
            unchanged.
          </p>
          <span>New Model Motors · Model Dossier 08</span>
        </footer>
      </div>
    </section>
  );
}
