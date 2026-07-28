export type RuntimeWorldPosition = {
  x: number;
  y: number;
  z: number;
};

export type RuntimeFlagshipModelFixture = {
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

export type RuntimeFixtures = {
  initialCartPosition?: RuntimeWorldPosition;
  initialCartValetBayIndex?: number;
  openAiFlagshipLineup?: readonly RuntimeFlagshipModelFixture[];
  trackedCompanies?: readonly RuntimeTrackedCompanyFixture[];
};

declare global {
  interface Window {
    __NEW_MODEL_MOTORS_TEST_FIXTURES__?: RuntimeFixtures;
  }
}
