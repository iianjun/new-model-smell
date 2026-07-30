# 09 — Desktop QA report

**Date:** 2026-07-29

**Manual environment:** macOS 26.5.2, Mac14,13 with 12 CPU cores and 32 GB memory, Google Chrome 150.0.7871.187 and Playwright's headed Google Chrome for Testing, production preview, 1280×720 viewport

**Automated environment:** Chromium desktop profile, development server and production preview, 1280×720 viewport

**Result:** Pass for the desktop vertical-slice scope

## Evidence

- An agent-operated Chrome pass against the production build covered loading, the audio toggle, Cart movement, collision bounce and recovery, Showroom reveal and readability, Valet entry and transfer, Active Flagship wake-up, and manual Drive-Out. A second headed production pass used public keyboard input to reach the printed Dyno Sheet, then used a manual screen-coordinate drag to open the Dossier and a manual button click to return to the same Active Flagship at the Dyno.
- `tests/vertical-slice-journey.spec.ts` completes Inspector Cart → Showroom → Valet Transfer → Drive-Out → Dyno → Dyno Sheet → Model Dossier → return to driving using public keyboard, visible status, and rendered-pixel pointer input. The clean case starts without runtime fixtures and waits for the complete opening; a three-model case begins on the physical Showroom approach lane, deliberately parks in the non-first center bay, and proves that the visibly selected identity survives the remaining loop. Neither case reads or mutates internal journey state.
- Both public-input journeys pass with one WebGL worker. The fixture-free clean journey also passed in 2.0 minutes against the production preview rather than the development server.
- `tests/vertical-slice-visual.spec.ts` covers six named checkpoints with a fixed date, desktop viewport, OS-independent snapshot paths, a deterministic real opening timestamp, and a 1.5% maximum differing-pixel budget.
- The six checked-in baselines under `tests/__screenshots__/vertical-slice-visual.spec.ts/` passed after visual inspection at native aspect ratio.
- The optional Dyno synthesis takes its output gain and two oscillator frequencies from the same run-progress signal as the wheels, rollers, fans, gauges, vibration, and pixel effects. A browser regression verifies both oscillators start from the explicit audio-toggle gesture, gain and frequency targets rise with visible progress, output gain returns to zero when the accelerator is released, and resuming the run raises it again.
- Runtime asset provenance and source/runtime separation are recorded in `docs/design/asset-manifest.md`.
- `pnpm validate` passed Biome over 62 files, TypeScript, the production build, and all 32 Chromium tests.

## Desktop exploratory pass

| Area | Method and observation | Result |
| --- | --- | --- |
| Driving feel | In production Chrome, drove the Cart, hit solid scenery, observed bounce and recovery, entered the Valet intake, completed the transfer, and drove the Flagship out. | Pass — acceleration, braking, collision recovery, transfer, and Drive-Out remained controllable without a debug shortcut. |
| Camera comfort | Reviewed the opening, live Cart chase camera, Showroom transition, Valet staging, and Flagship Drive-Out in production Chrome. | Pass — the elevated chase view retained road context, transitions stayed legible, and required status surfaces remained unobscured. |
| Building readability | Inspected the live Showroom and the six native-aspect visual checkpoints. | Pass — cutaway walls, safety-orange equipment, signage, vehicle silhouettes, and road guidance stayed distinguishable at 1280×720. |
| Navigation | Followed the visible destination, distance, and steering guidance; the Showroom target resolves to a physical Valet bay rather than the building center. | Pass — the clean and three-model journeys each reached Showroom and Dyno using only public guidance and input, including the non-first center bay. |
| Pointer tolerance | In the headed production pass, public keyboard input stopped at the printed sheet and an agent manually dragged the visible orange tab by screen coordinates. The public-input journey independently detects the tab from rendered pixels, while the visual suite holds it at an intermediate pull. | Pass — the manual pull and both automated partial/completed pulls worked without injecting a projected handle coordinate. |
| Dyno synchronization | Observed the headed production run and sheet-ready state; visual checkpoints cover a 62% pause, the printed sheet, partial pull, and final Dossier. The optional audio regression verifies two running oscillators, increasing output gain and frequency targets during visible run progress, zero gain on release, and raised gain when the run continues. A human listener heard the current React build through the fixture-seeded manual Dyno entry after the synthesis fix. | Pass — clamp state, progress, machinery, sustained sound, sheet, and Dossier share or follow the coordinated run signal; the listener confirmed that the replacement Dyno sound was clearly audible. |
| Visual language | Inspected all six baselines together. | Pass — warm ivory, charcoal, safety orange, faded green, and pale blue remain consistent; machinery is matte and DOM interfaces remain crisp. |
| Audio resilience | Toggled audio in production Chrome and ran the rejected-playback regression with both media playback and Web Audio construction denied. | Pass — autoplay permission and Web Audio availability never block loading, control, or state progression. |

The agent-operated passes supplied direct visual and pointer inspection for driving, camera, visual readability, pointer tolerance, and the physical-to-Dossier transition. Public keyboard automation supplied the simultaneous steering needed to reach the later manual Dyno inspection because the desktop-control surface could not hold two non-modifier keys; no product state was injected into the fixture-free production journey. Automatic audio evidence covers oscillator startup, coordinated gain and frequency targets, zero gain on release, toggle behavior, and rejected-playback resilience; a human listener supplied the final audible judgment in the temporary fixture-seeded React QA entry on 2026-07-30.

## Performance sample

A headed Chromium production-preview run sampled 240 consecutive `requestAnimationFrame` intervals after loading, entering the drivable world, and allowing a three-second warm-up:

| Metric | Result |
| --- | ---: |
| Median frame interval | 16.7 ms |
| 95th percentile frame interval | 17.8 ms |
| Worst sampled frame interval | 18.7 ms |
| Frames over 100 ms | 0 / 240 |
| Loaded resource entries | 22 |
| Encoded response bytes | 1.61 MB |
| Transferred response bytes | 1.61 MB |

This headed production sample held approximately 60 fps at the median and showed no stall-length frame. Its largest emitted chunks were Rapier at 2,237.29 kB (842.59 kB gzip) and `MotorTownCanvas` at 643.91 kB (175.84 kB gzip); Vite reports its advisory chunk-size warning without failing the build.

## Visual checkpoints

1. `reveal.png` — deterministic mid-sneeze camera reveal from the real opening
2. `showroom.png` — OpenAI cutaway Showroom and Flagship directory
3. `valet-transfer.png` — secured Valet clamps
4. `dyno-escalation.png` — throttle-driven Dyno run paused at 62%
5. `paper-to-dossier.png` — printed sheet held at an intermediate pull
6. `model-dossier.png` — final evidence Dossier

Touch input, mobile layout and performance, Drive-In content, additional Dealerships, and commissioned final art were not exercised because they remain outside Ticket 09.
