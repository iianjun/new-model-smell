# 04 — Visit the OpenAI cutaway Showroom

**What to build:** Make the left destination plot a seamless OpenAI Dealership containing the current OpenAI Flagship Lineup. A visitor drives the Inspector Cart into the building without a scene or camera change, sees the roof and camera-facing walls move out of the way, and can identify every displayed Flagship Model and its independently calculated Release Age.

**Blocked by:** 02 — Drive the Inspector Cart through graybox Motor Town.

**Status:** complete

- [x] Current OpenAI Flagship Models are curated from primary sources according to the project's Flagship Model and Public Availability Date rules.
- [x] Mini, budget, specialized, private-preview, announcement-only, and minor point-update models are excluded.
- [x] Every included Flagship Model records its Public Availability Date and source provenance.
- [x] Release Age is derived from Public Availability Date at runtime rather than maintained as static age copy.
- [x] A Flagship Lineup may contain multiple coequal models, each represented by its own displayed Model Vehicle.
- [x] Temporary Model Vehicles share the broad, angular 1990s concept grand-tourer silhouette and driving footprint while remaining individually identifiable.
- [x] Real OpenAI identification is restrained to the name, necessary marks, labels, and wayfinding; architecture and vehicles remain New Model Motors designs.
- [x] The Dealership and Showroom remain in the same loaded world as Motor Town.
- [x] Approaching or entering fades or removes the roof and camera-facing wall sections without changing to a separate interior camera.
- [x] Interior lanes, display positions, and entrances are readable and wide enough for the Inspector Cart and future Model Vehicle.
- [x] Leaving the Showroom restores the appropriate building sections without trapping the camera or vehicle.
- [x] Browser coverage uses a multi-model fixture and verifies that each displayed model exposes its own identity, date, and Release Age.

## Curation record

As of 2026-07-28, the Flagship Lineup contains GPT-5.6 Sol with a Public Availability Date of 2026-07-09. OpenAI's [general-availability launch post](https://openai.com/index/gpt-5-6/) identifies Sol as the flagship, Terra as a lower-cost tier, and Luna as the most affordable tier. Terra and Luna therefore do not meet this project's Flagship Model rule. Sol Pro is not represented as another vehicle because the same post describes it as a selectable highest-quality mode for Sol rather than a coequal model tier. The earlier [limited preview](https://openai.com/index/previewing-gpt-5-6-sol/) did not establish Public Availability because access was restricted to a small trusted group.
