# Runtime asset manifest

This manifest records every external asset shipped by the desktop vertical
slice. Generic roads, background buildings, trees, street furniture, a parked
delivery vehicle, and interaction sounds come from the coherent Kenney CC0
family. The Nose, Inspector Cart, Model Vehicle instances, Dyno Lab, Model
Dossier, Dealership shells, and interface graphics remain
repository-authored geometry, canvas textures, CSS, or DOM rather than
third-party identity art.

## Kenney · City Kit (Roads) 2.0

- Creator: Kenney
- Source page: <https://kenney.nl/assets/city-kit-roads>
- Acquisition: direct archive from the source page on 2026-07-29
- Exact license: Creative Commons Zero 1.0 Universal (CC0 1.0);
  upstream text is preserved at
  `assets/source/kenney-city-kit-roads/License.txt`
- Editable source:
  `assets/source/kenney-city-kit-roads/construction-barrier.obj`,
  `construction-barrier.mtl`, `construction-cone.obj`,
  `construction-cone.mtl`, `road-straight.obj`, `road-straight.mtl`, and
  `Textures/colormap.png`
- Runtime assets:
  `public/assets/runtime/town/construction-barrier.glb` and
  `construction-cone.glb`, plus their shared
  `public/assets/runtime/town/Textures/colormap.png`; and
  `public/assets/runtime/town/roads/road-straight.glb` with its adjacent
  `Textures/colormap.png`
- Modifications: the selected upstream GLBs are copied without binary edits.
  The road module's adjacent runtime color map is remapped without dithering to
  the approved Motor Town palette. At runtime the module is scaled to the width
  and length of each route; barriers and cones are scaled into closure groups;
  and their standard materials are forced to flat shading, zero metalness, and
  full roughness.
- Usage: the complete drivable road surface plus generic barriers and cones at
  the three deliberately blocked exits. Repeated modules clone only object
  nodes while sharing the loader's cached geometry and materials.

## Kenney · City Kit (Suburban) 2.0

- Creator: Kenney
- Source page: <https://kenney.nl/assets/city-kit-suburban>
- Acquisition: direct archive from the source page on 2026-07-29
- Exact license: Creative Commons Zero 1.0 Universal (CC0 1.0);
  upstream text is preserved at
  `assets/source/kenney-city-kit-suburban/License.txt`
- Editable source: `building-type-a.obj`, `building-type-b.obj`,
  `tree-large.obj`, and `tree-small.obj`, their adjacent MTL files, and
  `Textures/colormap.png` under
  `assets/source/kenney-city-kit-suburban/`
- Runtime assets: the matching GLBs and shared `Textures/colormap.png` under
  `public/assets/runtime/town/suburban/`
- Modifications: the selected upstream GLBs are copied without binary edits.
  The adjacent runtime color map is remapped without dithering to the approved
  Motor Town palette. Runtime instances are uniformly scaled, rotated,
  shadow-enabled, and normalized to the town's flat, matte material treatment.
- Usage: four generic background building shells and six roadside trees. The
  shells receive repository-authored bands and pylons so they read as distant
  Dealership silhouettes rather than playable interiors. Building and tree
  collision proxies remain repository-authored so asset detail cannot make the
  driving route brittle.

## Kenney · Car Kit 3.1

- Creator: Kenney
- Source page: <https://www.kenney.nl/assets/car-kit>
- Acquisition: direct archive from the source page on 2026-07-29
- Exact license: Creative Commons Zero 1.0 Universal (CC0 1.0);
  upstream text is preserved at `assets/source/kenney-car-kit/License.txt`
- Editable source: `delivery-flat.obj`, `delivery-flat.mtl`, and
  `Textures/colormap.png` under `assets/source/kenney-car-kit/`
- Runtime assets:
  `public/assets/runtime/town/vehicles/delivery-flat.glb` and its adjacent
  `Textures/colormap.png`
- Modifications: the upstream GLB is copied without binary edits. Its adjacent
  runtime color map is remapped without dithering to the approved Motor Town
  palette, then the model is uniformly scaled, rotated, shadow-enabled, and
  normalized to matte materials at runtime.
- Usage: one parked generic delivery vehicle outside the route. It is
  background dressing, not the identity-bearing Inspector Cart or Model
  Vehicle.

## Kenney · UI SFX Set

- Creator: Kenney Vleugels (Kenney)
- Source page: <https://kenney.nl/assets/ui-audio>
- Acquisition: direct archive from the source page on 2026-07-29
- Exact license: Creative Commons Zero 1.0 Universal (CC0 1.0);
  upstream text is preserved at
  `assets/source/kenney-ui-audio/License.txt`
- Runtime assets: `click1.ogg`, `click2.ogg`, `switch1.ogg`, and
  `switch2.ogg` under `public/assets/runtime/audio/`
- Modifications: none; selected OGG files are copied unchanged.
- Usage: opt-in cues for transfer, Dyno, reveal, and Model Dossier transitions.
  Playback rejection or decode failure is intentionally ignored so audio can
  never block the experience.

## Kenney · Impact Sounds

- Creator: Kenney Vleugels (Kenney)
- Source page: <https://kenney.nl/assets/impact-sounds>
- Acquisition: direct archive from the source page on 2026-07-29
- Exact license: Creative Commons Zero 1.0 Universal (CC0 1.0);
  upstream text is preserved at
  `assets/source/kenney-impact-sounds/License.txt`
- Editable source: `impactMetal_medium_000.ogg` and
  `impactSoft_medium_000.ogg` under
  `assets/source/kenney-impact-sounds/`
- Runtime assets: matching OGG files under `public/assets/runtime/audio/`
- Modifications: none; selected OGG files are copied unchanged.
- Usage: opt-in solid-collision and short tire-scrub cues. They follow driving
  telemetry but never participate in physics or state progression.

## Load and lifetime policy

The eight town GLBs and four adjacent color-map dependencies form one required
town-prop load unit. They live under the React Suspense boundary that owns
runtime readiness, so the loading surface stays mounted and the opening cannot
start until every resource resolves. Repeated geometry and materials remain
shared and cached for the lifetime of the town.

Audio is a separate optional load unit. It is created only after the visitor
enables sound, and all elements are paused, detached, and released when the
application unmounts. Unselected files from the upstream archives are not
shipped.

## Validation and measurement

`pnpm assets:validate` runs the official Khronos glTF Validator for every
runtime GLB, including adjacent resources, then compares file size and geometry
statistics with the versioned record at
`assets/runtime-asset-metrics.generated.json`. When a delivery asset changes
intentionally, `pnpm assets:measure` refreshes that record for review. Optional
compression remains deferred until these measurements show a meaningful
delivery problem.
