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
  {
    id: "gpt-zenith",
    name: "GPT Zenith",
    publicAvailabilityDate: "2026-06-28",
    provenance: {
      label: "OpenAI Zenith launch post",
      url: "https://openai.com/zenith",
    },
  },
] as const;

async function installShowroomFixture(
  page: import("@playwright/test").Page,
  initialCart:
    | { initialCartPosition: { x: number; y: number; z: number } }
    | { initialCartValetBayIndex: number },
) {
  await page.addInitScript(
    ({ initialCart, lineup }) => {
      const testWindow = window as Window & {
        __NEW_MODEL_MOTORS_TEST_FIXTURES__?: {
          initialCartPosition?: { x: number; y: number; z: number };
          initialCartValetBayIndex?: number;
          openAiFlagshipLineup: typeof lineup;
        };
      };

      testWindow.__NEW_MODEL_MOTORS_TEST_FIXTURES__ = {
        ...initialCart,
        openAiFlagshipLineup: lineup,
      };
    },
    {
      initialCart,
      lineup: MULTI_MODEL_LINEUP,
    },
  );
}

async function enterDriving(page: import("@playwright/test").Page) {
  await page.goto("/");
  await expect(
    page.getByRole("status", { name: "Loading New Model Motors" }),
  ).toBeHidden();
  await page.keyboard.press("x");
}

test("a Valet Transfer does not begin outside marked bays", async ({
  page,
}) => {
  await installShowroomFixture(page, {
    initialCartPosition: {
      x: -9.2,
      y: 0.72,
      z: -1.6,
    },
  });
  await enterDriving(page);

  const drivingState = page.getByTestId("driving-state");

  await expect(drivingState).toContainText("Inspector Cart");
  await expect(drivingState).toContainText("Ready to inspect");
  await page.waitForTimeout(1_000);
  await expect(drivingState).not.toContainText("Valet Transfer");
});

test("parking in a non-first bay transfers into that Flagship for a manual Drive-Out", async ({
  page,
}) => {
  await installShowroomFixture(page, { initialCartValetBayIndex: 2 });
  await enterDriving(page);

  const drivingState = page.getByTestId("driving-state");

  await expect(drivingState).toContainText("Valet Transfer · GPT Zenith");
  await expect(drivingState).toContainText(
    "Floor guidance and clamps aligning Cart",
  );
  await expect(drivingState).toContainText("Valet clamps secured", {
    timeout: 3_000,
  });
  await expect(drivingState).toContainText("Packing Inspector Cart");
  await expect(drivingState).toContainText("Flagship systems waking");
  await expect(drivingState).toContainText("Active Flagship · GPT Zenith");
  await expect(drivingState).toContainText("Ready for Drive-Out");
  await expect(drivingState).not.toContainText("GPT Atlas");
  await expect(drivingState).not.toContainText("GPT Meridian");
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await page.keyboard.down("w");
  await expect(drivingState).toContainText("Drive-Out complete", {
    timeout: 6_000,
  });
  await page.keyboard.up("w");

  await expect(drivingState).toContainText("Active Flagship · GPT Zenith");
  await expect(drivingState).not.toContainText(/damage|failed|game over/i);
});
