import type { Page } from "@playwright/test";
import type {
  RuntimeFixtures,
  RuntimeFlagshipModelFixture,
} from "../../src/runtimeFixtures.js";

export const MULTI_MODEL_FLAGSHIP_LINEUP = [
  {
    id: "gpt-atlas",
    name: "GPT Atlas",
    provenance: {
      label: "OpenAI Atlas launch post",
      url: "https://openai.com/atlas",
    },
    publicAvailabilityDate: "2026-07-18",
  },
  {
    id: "gpt-meridian",
    name: "GPT Meridian",
    provenance: {
      label: "OpenAI Meridian launch post",
      url: "https://openai.com/meridian",
    },
    publicAvailabilityDate: "2026-07-08",
  },
  {
    id: "gpt-zenith",
    name: "GPT Zenith",
    provenance: {
      label: "OpenAI Zenith launch post",
      url: "https://openai.com/zenith",
    },
    publicAvailabilityDate: "2026-06-28",
  },
] as const satisfies readonly RuntimeFlagshipModelFixture[];

export const loadingSurface = (page: Page) =>
  page.getByRole("status", {
    name: "Loading New Model Motors",
  });

export async function installRuntimeFixtures(
  page: Page,
  fixtures: RuntimeFixtures,
) {
  await page.addInitScript((runtimeFixtures) => {
    window.__NEW_MODEL_MOTORS_TEST_FIXTURES__ = runtimeFixtures;
  }, fixtures);
}
