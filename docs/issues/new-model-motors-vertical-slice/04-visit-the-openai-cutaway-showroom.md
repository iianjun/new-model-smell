# 04 — Visit the OpenAI cutaway Showroom

**What to build:** Make the left destination plot a seamless OpenAI Dealership containing the current OpenAI Flagship Lineup. A visitor drives the Inspector Cart into the building without a scene or camera change, sees the roof and camera-facing walls move out of the way, and can identify every displayed Flagship Model and its independently calculated Release Age.

**Blocked by:** 02 — Drive the Inspector Cart through graybox Motor Town.

**Status:** ready-for-agent

- [ ] Current OpenAI Flagship Models are curated from primary sources according to the project's Flagship Model and Public Availability Date rules.
- [ ] Mini, budget, specialized, private-preview, announcement-only, and minor point-update models are excluded.
- [ ] Every included Flagship Model records its Public Availability Date and source provenance.
- [ ] Release Age is derived from Public Availability Date at runtime rather than maintained as static age copy.
- [ ] A Flagship Lineup may contain multiple coequal models, each represented by its own displayed Model Vehicle.
- [ ] Temporary Model Vehicles share the broad, angular 1990s concept grand-tourer silhouette and driving footprint while remaining individually identifiable.
- [ ] Real OpenAI identification is restrained to the name, necessary marks, labels, and wayfinding; architecture and vehicles remain New Model Motors designs.
- [ ] The Dealership and Showroom remain in the same loaded world as Motor Town.
- [ ] Approaching or entering fades or removes the roof and camera-facing wall sections without changing to a separate interior camera.
- [ ] Interior lanes, display positions, and entrances are readable and wide enough for the Inspector Cart and future Model Vehicle.
- [ ] Leaving the Showroom restores the appropriate building sections without trapping the camera or vehicle.
- [ ] Browser coverage uses a multi-model fixture and verifies that each displayed model exposes its own identity, date, and Release Age.
