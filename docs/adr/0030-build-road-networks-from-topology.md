# Build road networks from topology instead of overlapping meshes

Motor Town roads will be authored as centerline segments and compiled into a
topology-aware render layout. The road-network module finds centerline
intersections, splits crossing segments, trims straight modules before their
shared nodes, and gives every node one explicitly layered junction surface.
The module rejects overlapping collinear centerlines and any generated
straight modules that still overlap on the same plane.

This replaces direct rendering of one full-length GLB per authored segment.
That approach placed eight pairs of road surfaces on the same depth plane,
with individual overlaps ranging from roughly 0.56 to 8.07 square metres.
Small camera movements changed which textured triangle won the depth test, so
black fragments appeared and disappeared even though the world geometry had
not moved. Correcting the source asset's long axis fixed its orientation but
could not fix those junction overlaps.

Road junctions use separate curb, edge, and surface layers with explicit
vertical ordering. Arbitrary per-segment height offsets and material
`polygonOffset` are not substitutes for topology: they choose a deterministic
winner while leaving malformed intersections and hidden overlaps in place.

The road-network interface is the test seam. Layout tests exercise the actual
Motor Town graph and its rejection rules, while a browser regression projects
fixed world points into several nearby camera positions and verifies that
their rendered luminance remains stable. Runtime GLB validation separately
rejects duplicate triangles inside individual assets.
