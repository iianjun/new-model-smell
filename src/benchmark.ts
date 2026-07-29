import { formatDateOnly, parseDateOnly } from "./dateOnly.js";

declare const evaluationDateBrand: unique symbol;

export type EvaluationDate = string & {
  readonly [evaluationDateBrand]: true;
};

export type BenchmarkIdentity = {
  name: string;
  version: string;
};

export type BenchmarkRecord = {
  benchmark: BenchmarkIdentity;
  caveats: readonly string[];
  conditions: string;
  evaluationDate: EvaluationDate;
  evaluator: string;
  provenance: string;
  score: number;
  source: {
    label: string;
    url: string;
  };
  subject: {
    id: string;
    name: string;
  };
  unit: string;
};

export type RuntimeBenchmarkRecordFixture = Omit<
  BenchmarkRecord,
  "evaluationDate"
> & {
  evaluationDate: string;
};

export type BenchmarkComparison = {
  active: BenchmarkRecord;
  rivals: readonly BenchmarkRecord[];
};

function toEvaluationDate(value: string) {
  return parseDateOnly(value, "benchmark evaluation date") as EvaluationDate;
}

function validateSourceUrl(value: string) {
  const url = new URL(value);

  if (url.protocol !== "https:") {
    throw new Error(`Benchmark source must use HTTPS: ${value}`);
  }

  return value;
}

export function parseBenchmarkRecords(
  records: readonly RuntimeBenchmarkRecordFixture[],
): readonly BenchmarkRecord[] {
  return records.map((record) => ({
    ...record,
    benchmark: { ...record.benchmark },
    caveats: [...record.caveats],
    evaluationDate: toEvaluationDate(record.evaluationDate),
    source: {
      ...record.source,
      url: validateSourceUrl(record.source.url),
    },
    subject: { ...record.subject },
  }));
}

function hasComparableEvidence(
  active: BenchmarkRecord,
  candidate: BenchmarkRecord,
) {
  return (
    candidate.subject.id !== active.subject.id &&
    candidate.benchmark.name === active.benchmark.name &&
    candidate.benchmark.version === active.benchmark.version &&
    candidate.source.url === active.source.url &&
    candidate.conditions === active.conditions &&
    candidate.evaluator === active.evaluator
  );
}

export function getBenchmarkComparisons(
  activeFlagshipId: string,
  records: readonly BenchmarkRecord[],
): readonly BenchmarkComparison[] {
  return records
    .filter((record) => record.subject.id === activeFlagshipId)
    .map((active) => ({
      active,
      rivals: records.filter((candidate) =>
        hasComparableEvidence(active, candidate),
      ),
    }));
}

export function formatEvaluationDate(evaluationDate: EvaluationDate) {
  return formatDateOnly(evaluationDate);
}
