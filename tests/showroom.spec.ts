import { expect, test } from "@playwright/test";

const MULTI_MODEL_LINEUP = [
  {
    id: "gpt-atlas",
    name: "GPT Atlas",
    publicAvailabilityDate: "2026-07-18",
    provenance: {
      label: "OpenAI Atlas launch post",
      url: "https://openai.com/atlas",
    },
  },
  {
    id: "gpt-meridian",
    name: "GPT Meridian",
    publicAvailabilityDate: "2026-07-08",
    provenance: {
      label: "OpenAI Meridian launch post",
      url: "https://openai.com/meridian",
    },
  },
] as const;

test("multi-model Showroom exposes each Flagship Model identity, date, and Release Age", async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date("2026-07-28T12:00:00.000Z"));
  await page.addInitScript((lineup) => {
    const testWindow = window as Window & {
      __NEW_MODEL_MOTORS_TEST_FIXTURES__?: {
        initialCartPosition: { x: number; y: number; z: number };
        openAiFlagshipLineup: typeof lineup;
      };
    };

    testWindow.__NEW_MODEL_MOTORS_TEST_FIXTURES__ = {
      initialCartPosition: { x: -9.2, y: 0.72, z: -1.6 },
      openAiFlagshipLineup: lineup,
    };
  }, MULTI_MODEL_LINEUP);

  await page.goto("/");
  await expect(
    page.getByRole("status", { name: "Loading New Model Motors" }),
  ).toBeHidden();
  await page.keyboard.press("x");

  const showroom = page.getByRole("region", {
    name: "OpenAI Flagship Showroom",
  });

  await expect(showroom).toBeVisible();
  await expect(showroom.getByRole("article")).toHaveCount(2);

  const atlas = showroom.getByRole("article", { name: "GPT Atlas" });
  await expect(atlas).toContainText("Public availability · Jul 18, 2026");
  await expect(atlas).toContainText("Release Age · 10 days");
  await expect(
    atlas.getByRole("link", { name: "OpenAI Atlas launch post" }),
  ).toHaveAttribute("href", "https://openai.com/atlas");

  const meridian = showroom.getByRole("article", {
    name: "GPT Meridian",
  });
  await expect(meridian).toContainText("Public availability · Jul 8, 2026");
  await expect(meridian).toContainText("Release Age · 20 days");
  await expect(
    meridian.getByRole("link", { name: "OpenAI Meridian launch post" }),
  ).toHaveAttribute("href", "https://openai.com/meridian");

  await page.keyboard.down("s");
  await expect(showroom).toBeHidden({ timeout: 8_000 });
  await page.keyboard.up("s");
  await expect(page.getByTestId("driving-state")).toContainText(
    /Cart in motion|Ready to inspect/,
  );
});
