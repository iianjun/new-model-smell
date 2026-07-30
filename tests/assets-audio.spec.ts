import { expect, test } from "@playwright/test";
import { AUDIO_RUNTIME_ASSETS } from "../src/assetCatalog.js";
import { DYNO_ALIGNMENT_POSITION, DYNO_ALIGNMENT_YAW } from "../src/dyno.js";
import { installRuntimeFixtures, loadingSurface } from "./support/runtime.js";

test("every progressive audio cue resolves from the runtime catalog", async ({
  request,
}) => {
  for (const source of Object.values(AUDIO_RUNTIME_ASSETS)) {
    const response = await request.get(source);
    expect(response.ok(), `${source} should resolve`).toBe(true);
  }
});

test("required town assets resolve before the opening can start", async ({
  page,
}) => {
  let releaseBarrier = () => {};
  let observeBarrierRequest = () => {};
  const barrierRequested = new Promise<void>((resolve) => {
    observeBarrierRequest = resolve;
  });
  const barrierReleased = new Promise<void>((resolve) => {
    releaseBarrier = resolve;
  });

  await page.route(
    "**/assets/runtime/town/construction-barrier.glb",
    async (route) => {
      observeBarrierRequest();
      await barrierReleased;
      await route.continue();
    },
  );

  const navigation = page.goto("/");
  await barrierRequested;

  await expect(loadingSurface(page)).toBeVisible();
  await expect(page.getByText("FRESHNESS EVENT DETECTED")).toBeHidden();

  releaseBarrier();
  await navigation;
  await expect(loadingSurface(page)).toBeHidden();

  const loadedTownAssets = await page.evaluate(() =>
    [
      ...new Set(
        performance
          .getEntriesByType("resource")
          .map((entry) => entry.name)
          .filter((name) => name.includes("/assets/runtime/town/"))
          .map((name) => new URL(name).pathname),
      ),
    ].sort(),
  );

  expect(loadedTownAssets).toEqual([
    "/assets/runtime/town/Textures/colormap.png",
    "/assets/runtime/town/construction-barrier.glb",
    "/assets/runtime/town/construction-cone.glb",
    "/assets/runtime/town/roads/Textures/colormap.png",
    "/assets/runtime/town/roads/road-straight.glb",
    "/assets/runtime/town/suburban/Textures/colormap.png",
    "/assets/runtime/town/suburban/building-type-a.glb",
    "/assets/runtime/town/suburban/building-type-b.glb",
    "/assets/runtime/town/suburban/tree-large.glb",
    "/assets/runtime/town/suburban/tree-small.glb",
    "/assets/runtime/town/vehicles/Textures/colormap.png",
    "/assets/runtime/town/vehicles/delivery-flat.glb",
  ]);
});

test("rejected audio playback stays optional and never blocks state progress", async ({
  page,
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await installRuntimeFixtures(page, {
    initialActiveFlagshipPosition: DYNO_ALIGNMENT_POSITION,
    initialActiveFlagshipYaw: DYNO_ALIGNMENT_YAW,
    initialDriveOutFlagshipId: "gpt-audio",
    openAiFlagshipLineup: [
      {
        id: "gpt-audio",
        name: "GPT Audio",
        provenance: {
          label: "OpenAI audio launch post",
          url: "https://openai.com/audio",
        },
        publicAvailabilityDate: "2026-07-18",
      },
    ],
  });
  await page.addInitScript(() => {
    HTMLMediaElement.prototype.play = () =>
      Promise.reject(new DOMException("Autoplay denied", "NotAllowedError"));
    window.AudioContext = class UnavailableAudioContext {
      constructor() {
        throw new DOMException("Web Audio denied", "NotAllowedError");
      }
    } as unknown as typeof AudioContext;
  });

  await page.goto("/");
  await expect(loadingSurface(page)).toBeHidden();

  const audioControl = page.getByRole("button", {
    name: "Enable Motor Town audio",
  });
  await audioControl.click();
  const enabledAudioControl = page.getByRole("button", {
    name: "Disable Motor Town audio",
  });
  await expect(enabledAudioControl).toHaveAttribute("aria-pressed", "true");
  await expect(enabledAudioControl).not.toBeFocused();

  await page.keyboard.press("x");
  const dynoState = page.getByTestId("dyno-state");
  await expect(dynoState).toHaveAttribute("data-phase", "ready", {
    timeout: 8_000,
  });

  await page.keyboard.down("w");
  await expect
    .poll(async () =>
      Number.parseInt(
        (await dynoState.locator("strong").textContent()) ?? "0",
        10,
      ),
    )
    .toBeGreaterThan(0);
  await page.keyboard.up("w");
  await expect(dynoState).toHaveAttribute("data-phase", "paused", {
    timeout: 1_500,
  });
  expect(pageErrors).toEqual([]);
});
