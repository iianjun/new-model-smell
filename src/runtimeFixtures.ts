import type { RuntimeBenchmarkRecordFixture } from "./benchmark.js";

export type RuntimeWorldPosition = {
  x: number;
  y: number;
  z: number;
};

export type RuntimeFlagshipModelFixture = {
  benchmarkRecords?: readonly RuntimeBenchmarkRecordFixture[];
  id: string;
  name: string;
  provenance: {
    label: string;
    url: string;
  };
  publicAvailabilityDate: string;
};

export type RuntimeTrackedCompanyFixture = {
  dealershipPosition: RuntimeWorldPosition;
  flagshipLineup: readonly RuntimeFlagshipModelFixture[];
  id: string;
  name: string;
};

export type RuntimeVisualCameraFixture = {
  position: RuntimeWorldPosition;
  target: RuntimeWorldPosition;
};

export type RuntimeFixtures = {
  initialActiveFlagshipPosition?: RuntimeWorldPosition;
  initialActiveFlagshipYaw?: number;
  initialCartPosition?: RuntimeWorldPosition;
  initialCartValetBayIndex?: number;
  initialDriveOutFlagshipId?: string;
  openingElapsedSeconds?: number;
  openAiFlagshipLineup?: readonly RuntimeFlagshipModelFixture[];
  trackedCompanies?: readonly RuntimeTrackedCompanyFixture[];
  visualCamera?: RuntimeVisualCameraFixture;
};

declare global {
  interface Window {
    __NEW_MODEL_MOTORS_TEST_FIXTURES__?: RuntimeFixtures;
  }
}
