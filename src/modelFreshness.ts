import type {
  FlagshipModel,
  TrackedCompany,
  WorldPosition,
} from "./flagshipLineup";
import { getReleaseAgeInDays } from "./flagshipLineup";

export const NEW_MODEL_SMELL_WINDOW_DAYS = 60;
export const NOSE_TRACKING_RANGE = 6.2;
export const NOSE_SNEEZE_RANGE = 3.85;

export type FlagshipLaunchFreshness = {
  company: TrackedCompany;
  dealershipYaw: number;
  model: FlagshipModel;
  releaseAgeInDays: number;
  smellRemainingPercent: number;
};

export function getYawToward(
  target: Pick<WorldPosition, "x" | "z">,
  origin: Pick<WorldPosition, "x" | "z"> = { x: 0, z: 0.1 },
) {
  return Math.atan2(target.x - origin.x, target.z - origin.z);
}

export function getModelSmellRemainingPercent(releaseAgeInDays: number) {
  const remaining =
    1 - Math.max(0, releaseAgeInDays) / NEW_MODEL_SMELL_WINDOW_DAYS;

  return Math.round(Math.max(0, Math.min(1, remaining)) * 100);
}

export function getNewestFlagshipLaunchFreshness(
  trackedCompanies: readonly TrackedCompany[],
  now = new Date(),
): FlagshipLaunchFreshness {
  let newestLaunch:
    | {
        company: TrackedCompany;
        model: FlagshipModel;
      }
    | undefined;

  for (const company of trackedCompanies) {
    for (const model of company.flagshipLineup) {
      if (
        !newestLaunch ||
        model.publicAvailabilityDate > newestLaunch.model.publicAvailabilityDate
      ) {
        newestLaunch = { company, model };
      }
    }
  }

  if (!newestLaunch) {
    throw new Error(
      "The Nose requires at least one Tracked Company Flagship Launch",
    );
  }

  const releaseAgeInDays = getReleaseAgeInDays(
    newestLaunch.model.publicAvailabilityDate,
    now,
  );

  return {
    ...newestLaunch,
    dealershipYaw: getYawToward(newestLaunch.company.dealershipPosition),
    releaseAgeInDays,
    smellRemainingPercent: getModelSmellRemainingPercent(releaseAgeInDays),
  };
}

export function getPlanarDistanceFromNose(
  position: Pick<WorldPosition, "x" | "z">,
) {
  return Math.hypot(position.x, position.z - 0.1);
}
