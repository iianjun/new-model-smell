# Rendering surface convention

Every visible surface must have one owner at a given depth. Do not compose
roads, floors, decals, panels, or imported assets by placing differently
colored faces on the same plane.

- Model connected surfaces as topology. Intersections and joins own their
  geometry; adjacent modules stop at that seam.
- When layers are intentional, name their ordering and separate them by an
  explicit world-space depth. A coincident face plus `polygonOffset` is not a
  structural fix.
- Reject invalid geometry before it reaches WebGL. Runtime assets must not
  contain duplicate triangles, and generated layouts must assert their
  non-overlap invariants.
- Verify camera-dependent surfaces dynamically. A single screenshot can miss
  z-fighting; sample fixed world points across nearby camera positions or use
  an equivalent moving-camera regression.

The Motor Town implementation and rationale are recorded in
[ADR 0030](../adr/0030-build-road-networks-from-topology.md).
