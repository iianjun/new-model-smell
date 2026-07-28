declare const publicAvailabilityDateBrand: unique symbol;

export type PublicAvailabilityDate = string & {
  readonly [publicAvailabilityDateBrand]: true;
};

export type CompanyTrim = {
  body: string;
  light: string;
};

export type FlagshipModel = {
  id: string;
  name: string;
  provenance: {
    label: string;
    url: string;
  };
  publicAvailabilityDate: PublicAvailabilityDate;
};

export type WorldPosition = {
  x: number;
  y: number;
  z: number;
};

type RuntimeFixtures = {
  initialCartPosition?: WorldPosition;
  openAiFlagshipLineup?: readonly (Omit<
    FlagshipModel,
    "publicAvailabilityDate"
  > & {
    publicAvailabilityDate: string;
  })[];
};

declare global {
  interface Window {
    __NEW_MODEL_MOTORS_TEST_FIXTURES__?: RuntimeFixtures;
  }
}

const DEFAULT_INSPECTOR_CART_POSITION = {
  x: 0,
  y: 0.72,
  z: 7.2,
} as const;

export const OPENAI_COMPANY_TRIM = {
  body: "#ef6d32",
  light: "#f5c85e",
} as const satisfies CompanyTrim;

export function toPublicAvailabilityDate(value: string) {
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const parsedDate = new Date(`${value}T00:00:00.000Z`);
  const isRealCalendarDate =
    !Number.isNaN(parsedDate.getTime()) &&
    parsedDate.toISOString().slice(0, 10) === value;

  if (!isDateOnly || !isRealCalendarDate) {
    throw new Error(`Invalid Public Availability Date: ${value}`);
  }

  return value as PublicAvailabilityDate;
}

// Curated 2026-07-28 from OpenAI's general-availability launch post. The post
// identifies Sol as the flagship, Terra as lower-cost, and Luna as the most
// affordable tier; only Sol meets this project's Flagship Model definition.
export const OPENAI_FLAGSHIP_LINEUP = [
  {
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

export function getInitialCartPosition(): WorldPosition {
  const initialCartPosition = getRuntimeFixtures()?.initialCartPosition;

  return initialCartPosition
    ? { ...initialCartPosition }
    : { ...DEFAULT_INSPECTOR_CART_POSITION };
}

export function getOpenAiFlagshipLineup(): readonly FlagshipModel[] {
  const fixtureLineup = getRuntimeFixtures()?.openAiFlagshipLineup;

  return fixtureLineup
    ? fixtureLineup.map((model) => ({
        ...model,
        publicAvailabilityDate: toPublicAvailabilityDate(
          model.publicAvailabilityDate,
        ),
      }))
    : OPENAI_FLAGSHIP_LINEUP;
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
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(`${publicAvailabilityDate}T00:00:00.000Z`));
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
