# 0003 — Polish desktop driving and Dyno behavior

**What to change:** Remove five distracting runtime rough edges found during the
desktop playtest without changing the first-visit journey or curated benchmark
records.

**Status:** complete

- [x] A topology-aware road-network module aligns the source asset's actual
  long axis, splits crossings, trims straight modules, and owns explicitly
  layered junctions so camera movement cannot expose coplanar overlaps.
- [x] Both Dyno instruction lines sit above the roof occluder and remain visible.
- [x] The Inspector Cart and Active Flagship reverse silently at their respective
  forward top speeds.
- [x] Dyno synthesis winds down after the run reaches 100% instead of cutting to
  silence immediately.
- [x] The Nose stops reacting to and tracking the visitor after the opening; its
  orientation continues to represent the newest Flagship Launch.
- [x] Layout, runtime-asset, and moving-camera browser regressions cover the
  geometry failures in addition to the other four playtest findings.
