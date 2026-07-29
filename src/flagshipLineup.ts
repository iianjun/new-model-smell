import { type BenchmarkRecord, parseBenchmarkRecords } from "./benchmark";
import { formatDateOnly, parseDateOnly } from "./dateOnly";
import type {
  RuntimeFlagshipModelFixture,
  RuntimeWorldPosition,
} from "./runtimeFixtures";
import {
  getShowroomDisplayPositions,
  getValetBayWorldPosition,
} from "./showroomLayout";

export type {
  RuntimeFixtures,
  RuntimeFlagshipModelFixture,
  RuntimeTrackedCompanyFixture,
  RuntimeWorldPosition,
} from "./runtimeFixtures";

declare const publicAvailabilityDateBrand: unique symbol;

export type PublicAvailabilityDate = string & {
  readonly [publicAvailabilityDateBrand]: true;
};

export type CompanyTrim = {
  body: string;
  light: string;
};

export type FlagshipModel = {
  benchmarkRecords: readonly BenchmarkRecord[];
  id: string;
  name: string;
  provenance: {
    label: string;
    url: string;
  };
  publicAvailabilityDate: PublicAvailabilityDate;
};

export type WorldPosition = RuntimeWorldPosition;

export type TrackedCompany = {
  dealershipPosition: WorldPosition;
  flagshipLineup: readonly FlagshipModel[];
  id: string;
  name: string;
};

const DEFAULT_INSPECTOR_CART_POSITION = {
  x: 0,
  y: 0.72,
  z: 7.2,
} as const;

export const OPENAI_COMPANY_TRIM = {
  body: "#ef6d32",
  light: "#f5c85e",
} as const satisfies CompanyTrim;

export const OPENAI_DEALERSHIP_POSITION = {
  x: -9.2,
  y: 0,
  z: -4.25,
} as const satisfies WorldPosition;

export function toPublicAvailabilityDate(value: string) {
  return parseDateOnly(
    value,
    "Public Availability Date",
  ) as PublicAvailabilityDate;
}

// Curated 2026-07-28 from OpenAI's general-availability launch post. The post
// identifies Sol as the flagship, Terra as lower-cost, and Luna as the most
// affordable tier; only Sol meets this project's Flagship Model definition.
export const OPENAI_FLAGSHIP_LINEUP = [
  {
    benchmarkRecords: parseBenchmarkRecords([
      {
        benchmark: {
          name: "Artificial Analysis Intelligence Index",
          version: "v4.1",
        },
        caveats: [
          "Aggregate index; interpret only under the published evaluation conditions",
          "Published launch-table result; consult the linked source for methodology notes",
        ],
        conditions:
          "GPT-5.6 Sol at max reasoning under the published v4.1 index configuration",
        evaluationDate: "2026-07-09",
        evaluator: "Artificial Analysis",
        provenance:
          "OpenAI GPT-5.6 general-availability launch table reporting the independent index result",
        score: 58.9,
        source: {
          label: "OpenAI · GPT-5.6 launch benchmark table",
          url: "https://openai.com/index/gpt-5-6/",
        },
        subject: {
          id: "gpt-5-6-sol",
          name: "GPT-5.6 Sol",
        },
        unit: "index score",
      },
    ]),
    id: "gpt-5-6-sol",
    name: "GPT-5.6 Sol",
    provenance: {
      label: "OpenAI GPT-5.6 launch post",
      url: "https://openai.com/index/gpt-5-6/",
    },
    publicAvailabilityDate: toPublicAvailabilityDate("2026-07-09"),
  },
] as const satisfies readonly FlagshipModel[];

function getRuntimeFixtures() {
  return import.meta.env.DEV
    ? window.__NEW_MODEL_MOTORS_TEST_FIXTURES__
    : undefined;
}

function parseRuntimeLineup(lineup: readonly RuntimeFlagshipModelFixture[]) {
  return lineup.map((model) => ({
    ...model,
    benchmarkRecords: parseBenchmarkRecords(model.benchmarkRecords ?? []),
    publicAvailabilityDate: toPublicAvailabilityDate(
      model.publicAvailabilityDate,
    ),
  }));
}

export function getInitialCartPosition(
  lineup: readonly FlagshipModel[] = OPENAI_FLAGSHIP_LINEUP,
): WorldPosition {
  const fixtures = getRuntimeFixtures();
  const initialCartPosition = fixtures?.initialCartPosition;

  if (initialCartPosition) {
    return { ...initialCartPosition };
  }

  if (fixtures?.initialCartValetBayIndex !== undefined) {
    const displayX = getShowroomDisplayPositions(lineup.length)[
      fixtures.initialCartValetBayIndex
    ];

    if (displayX === undefined) {
      throw new Error("Initial Cart Valet Bay index is outside the lineup");
    }

    return getValetBayWorldPosition(displayX);
  }

  return { ...DEFAULT_INSPECTOR_CART_POSITION };
}

export function getInitialActiveFlagshipPosition(
  fallback: WorldPosition,
): WorldPosition {
  const position = getRuntimeFixtures()?.initialActiveFlagshipPosition;

  return position ? { ...position } : fallback;
}

export function getInitialActiveFlagshipYaw(fallback: number) {
  return getRuntimeFixtures()?.initialActiveFlagshipYaw ?? fallback;
}

export function getInitialDriveOutFlagshipId() {
  return getRuntimeFixtures()?.initialDriveOutFlagshipId;
}

export function getOpenAiFlagshipLineup(): readonly FlagshipModel[] {
  const fixtureLineup = getRuntimeFixtures()?.openAiFlagshipLineup;

  return fixtureLineup
    ? parseRuntimeLineup(fixtureLineup)
    : OPENAI_FLAGSHIP_LINEUP;
}

export function getTrackedCompanies(): readonly TrackedCompany[] {
  const fixtureCompanies = getRuntimeFixtures()?.trackedCompanies;

  if (fixtureCompanies) {
    return fixtureCompanies.map((company) => ({
      ...company,
      dealershipPosition: { ...company.dealershipPosition },
      flagshipLineup: parseRuntimeLineup(company.flagshipLineup),
    }));
  }

  return [
    {
      dealershipPosition: { ...OPENAI_DEALERSHIP_POSITION },
      flagshipLineup: getOpenAiFlagshipLineup(),
      id: "openai",
      name: "OpenAI",
    },
  ];
}

export function getReleaseAgeInDays(
  publicAvailabilityDate: PublicAvailabilityDate,
  now = new Date(),
) {
  const releaseDate = new Date(`${publicAvailabilityDate}T00:00:00.000Z`);
  const today = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );

  return Math.max(
    0,
    Math.floor((today - releaseDate.getTime()) / (24 * 60 * 60 * 1_000)),
  );
}

export function formatPublicAvailabilityDate(
  publicAvailabilityDate: PublicAvailabilityDate,
) {
  return formatDateOnly(publicAvailabilityDate);
}

export function formatReleaseAge(ageInDays: number) {
  return `${ageInDays} ${ageInDays === 1 ? "day" : "days"}`;
}

export function isInOpenAiShowroomRevealZone(position: WorldPosition) {
  return (
    position.x >= -13.4 &&
    position.x <= -5.2 &&
    position.z >= -7.6 &&
    position.z <= -0.8
  );
}
