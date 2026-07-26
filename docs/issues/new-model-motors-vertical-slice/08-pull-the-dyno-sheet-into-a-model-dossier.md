# 08 — Pull the Dyno Sheet into a Model Dossier

**What to build:** Complete the information loop by letting a visitor grab the printed Dyno Sheet and pull it from the physical world into a crisp Model Dossier. The dossier must present trustworthy benchmark evidence for the Active Flagship, compare rivals only when the evidence is genuinely comparable, and retract back into the Dyno before returning the visitor to the same vehicle and location.

**Blocked by:** 07 — Run the Active Flagship at the Dyno Lab.

**Status:** ready-for-agent

- [ ] The exposed Dyno Sheet has a generous pointer hit area and drag tolerance suitable for mouse and trackpad use.
- [ ] Pull distance visibly unfolds the paper toward the camera and opens the dossier only after a clear completion threshold.
- [ ] The Model Dossier is rendered as sharp React DOM content rather than pixelated 3D text.
- [ ] The dossier identifies the Active Flagship, its Public Availability Date, and its current Release Age.
- [ ] Every Benchmark Record includes benchmark name and version, score and unit, evaluator, evaluation date, source link, provenance, and relevant caveats.
- [ ] Rival results appear as direct comparisons only when evaluation source, version, and conditions match.
- [ ] When comparable rival evidence is unavailable, the Active Flagship appears alone without a synthetic overall score.
- [ ] Performing the Dyno run never changes the curated benchmark values shown in the dossier.
- [ ] Source links are usable from the dossier without corrupting the preserved world state.
- [ ] While the dossier is open, vehicle controls are suspended and the Active Flagship, vehicle transform, Dyno state, and camera context are preserved.
- [ ] Closing the dossier folds and retracts the paper into the Dyno and resumes the same Active Flagship at the same location.
- [ ] Browser tests cover a comparable fixture, a solo non-comparable fixture, a non-first Active Flagship, and successful return to driving.
