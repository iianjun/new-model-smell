# New Model Motors: beginner 3D asset pipeline

Date: 2026-07-26

## Recommendation

Start with a **zero-cost CC0 vertical slice**, not a full town and not a custom car commission:

1. Graybox one road, one Dealership, one destination, the Inspector Cart, and one Model Vehicle.
2. Use **Kenney as the main kit** so proportions and style are coherent.
3. Make only the identity-bearing objects custom: Inspector Cart, shared Model Vehicle silhouette, Dealership facades/signs, Dyno Lab, Drive-In, and comic props.
4. Keep `.blend` files as editable masters; publish optimized `.glb` delivery files.
5. Do not buy or commission final art until the camera, driving, collisions, and destination loop work.

This is hybrid kitbashing: ordinary town furniture comes from a kit; the objects users remember belong to New Model Motors.

## Where to source assets

| Need | Start here | License and use |
| --- | --- | --- |
| Prototype cars | [Kenney Car Kit](https://www.kenney.nl/assets/car-kit), [Toy Car Kit](https://kenney.nl/assets/toy-car-kit), [Racing Kit](https://www.kenney.nl/assets/racing-kit) | Each listing is CC0. Kenney confirms its asset-page downloads may be used commercially without attribution. [Official license FAQ](https://www.kenney.nl/support) |
| Roads and town | [City Kit: Roads](https://www.kenney.nl/assets/city-kit-roads), [Commercial](https://kenney.nl/assets/city-kit-commercial), [Suburban](https://www.kenney.nl/assets/city-kit-suburban), [Retro Urban Kit](https://www.kenney.nl/assets/retro-urban-kit) | CC0. Best first choice because one publisher gives a more coherent base style. |
| Optional gap-fill models | [Quaternius Cars](https://quaternius.com/packs/cars.html), [Modular Streets](https://quaternius.com/packs/modularstreets.html), [Simple Buildings](https://quaternius.com/packs/simplebuildings.html) | Quaternius states that its models are CC0, commercially usable, modifiable, and combinable without attribution. [Official FAQ](https://quaternius.com/faq.html) Rework palette and scale before mixing with Kenney. |
| Editable paid source packs | [KayKit City Builder Bits](https://kaylousberg.itch.io/city-builder-bits), [KayKit collection](https://kaylousberg.itch.io/kaykit-complete) | KayKit labels the assets CC0; paid tiers add extra assets and `.blend` source files. Check the current listing and price when purchasing. |
| HDRI and surface textures | [Poly Haven](https://polyhaven.com/license), [ambientCG](https://ambientcg.com/) | Both state that their HDRIs, textures, and models are CC0. For this stylized project, use one resized HDRI for reflections and very few textures—not 8K source files in production. |
| Prototype UI/impact audio | [Kenney Interface Sounds](https://kenney.nl/assets/interface-sounds), [Impact Sounds](https://www.kenney.nl/assets/impact-sounds) | CC0. |
| Richer vehicle/ambient audio | [Sonniss GameAudioGDC](https://sonniss.com/gameaudiogdc/) or [Freesound](https://freesound.org/help/faq/) | Sonniss permits commercial interactive-media use under its bundle license but prohibits AI/ML training. Freesound mixes CC0, CC BY, and CC BY-NC: prefer CC0; CC BY requires credit; avoid BY-NC for a potentially commercial site. Preserve each sound page and license. |
| Paid marketplace models | [Fab](https://www.fab.com/eula), [Sketchfab](https://sketchfab.com/licenses), [Blendkit](https://www.blenderkit.com/docs/licenses/) | Licenses vary. Fab Standard and Sketchfab Standard prohibit standalone redistribution; Blendkit Royalty Free restricts reselling/extractable asset distribution. Since browsers download web GLBs, confirm web delivery is allowed before purchase. CC0 remains the least ambiguous choice. |

### Important exclusion

Do not use Synty assets without written clearance. Its current one-time-purchase EULA prohibits several uses related to generative-AI products and related promotional or marketing material, which may cover this site's subject matter. [Synty current EULA](https://syntystore.com/pages/one-time-purchase-licence)

[CC0](https://creativecommons.org/publicdomain/zero/1.0/) allows copying, modification, and commercial distribution without permission, but it does not waive third-party trademark, patent, privacy, or publicity rights. A CC0 car mesh containing a real car badge is therefore not automatically safe.

## What to source versus make

**Source and adapt**

- road tiles, curbs, sidewalks, trees, lamps, fences, cones, benches;
- generic wall, window, roof, door, and garage modules;
- background parked vehicles;
- HDRI, generic impacts, UI sounds, and ambience.

**Make or substantially customize**

- Inspector Cart;
- one shared Model Vehicle with separate body and wheel objects;
- three Dealership entrance silhouettes, signs, and trim;
- Dyno Lab rollers, gantry, and display;
- Drive-In screen, booth, and parking trigger;
- model badges, destination markings, freshness props, and physical jokes.

The Inspector Cart, Dyno Lab, and Drive-In are good beginner Blender objects because they can be built mostly from boxes and cylinders. Do not model a detailed car from scratch first; reshape or kitbash a CC0 base, then commission a signature Model Vehicle only if the prototype proves the concept.

## Beginner Blender workflow

1. **Keep an untouched download.** Store the original archive and license evidence separately from working files.
2. **Import one asset at a time.** Prefer `.blend` or glTF; use FBX/OBJ only when needed.
3. **Normalize the scene.** Choose one project scale, face vehicle forward consistently, place origins intentionally, and apply rotation/scale before physics. The Three.js glTF guide shows why unapplied parent scale and poor hierarchy make runtime movement difficult. [Three.js guide](https://threejs.org/manual/en/load-gltf.html)
4. **Simplify the visual language.** Use flat shading, a small shared color palette, and very few materials. Linked duplicates are appropriate for repeated wheels and props. [Blender linked duplicates](https://docs.blender.org/manual/en/2.91/scene_layout/object/editing/duplicate_linked.html)
5. **Separate moving parts.** Use predictable names such as `body`, `wheel_fl`, `wheel_fr`, `wheel_rl`, `wheel_rr`, and `badge_anchor`.
6. **Build collision proxies separately.** Vehicles should use a few cuboids/convex shapes rather than the visible mesh; Rapier discourages triangle-mesh colliders on dynamic rigid bodies. [Rapier colliders](https://rapier.rs/docs/user_guides/javascript/colliders/)
7. **Keep a master `.blend`.** Export a clean `.glb`; do not edit the optimized GLB as the source of truth. Khronos defines glTF as a runtime delivery format, not an authoring format. [glTF specification](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html)

## Web export and optimization

- Export logical load units rather than one huge file: `town-core.glb`, one GLB per Dealership, shared vehicles, and destination landmarks.
- Use Blender's glTF exporter with selected/active collections, applied modifiers, and only required materials/animations. glTF supports meshes, metal/rough PBR and unlit materials, textures, lights, and animation. [Blender glTF exporter](https://docs.blender.org/manual/en/3.3/addons/import_export/scene_gltf2.html)
- Use a small palette/gradient atlas where possible. Three.js notes that texture dimensions—not just download size—drive GPU memory; use `NearestFilter` for deliberately hard pixels. [Three.js texture guide](https://threejs.org/manual/en/textures.html)
- Create the screen look at runtime with Three.js [RenderPixelatedPass](https://threejs.org/docs/pages/RenderPixelatedPass.html). Do not bake every model into fake pixel sprites.
- Reuse geometry/materials and instance repeated trees, lamps, fences, and signs.
- Validate every GLB in the official [Khronos glTF Validator](https://github.khronos.org/glTF-Validator/) and view it outside the app before integration.
- Then run [glTF Transform](https://gltf-transform.dev/) on a copy. Start with its documented `optimize` workflow; use Meshopt/Draco or KTX2 only after measuring. Three.js `GLTFLoader` supports Draco, Meshopt, and KTX2, but each requires its matching decoder/loader. [GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html)
- Test low-end mobile hardware and record transfer size, decoded texture memory, draw calls, triangles, and steady driving frame rate. Pixelation is an art treatment, not a substitute for optimization.

## License and provenance checklist

Create one manifest entry per asset:

- original title, creator, stable source URL, original filename, and acquisition date;
- exact license name/version and a saved copy or screenshot of the terms;
- receipt, listing snapshot, seat count, and purchaser for paid items;
- permissions for commercial use, modification, attribution, and web/runtime distribution;
- restrictions involving AI, editorial-only use, real brands, trademarks, or recognizable people;
- original file hash and a short modification history;
- which production GLB/audio file contains it;
- required credit text and where that credit appears;
- embedded third-party textures, fonts, or sounds with separate licenses.

Never treat “free” as a license. Keep paid source files out of a public repository unless their license explicitly permits source redistribution.

## Phased path and budget bands

### Phase 0 — no-cost proof

Use primitives plus Kenney CC0 assets. Build one intersection, one Dealership shell, one Cart, one car, and one destination. Success means driving and re-entry feel good; art completeness is irrelevant.

### Phase 1 — no-cost vertical slice

Kitbash a single finished loop: enter Dealership → swap vehicle → drive out → activate Dyno Lab or Drive-In → close dossier → continue from the same position. Establish the palette, pixel pass, audio, and performance budget.

### Phase 2 — lean asset spend

Only after the slice works, buy one coherent source tier such as KayKit `.blend` files or a clearly licensed marketplace pack. Check current listing prices. Do not buy several unrelated packs; style-normalization time can cost more than the assets.

### Phase 3 — signature commission

Commission only the Inspector Cart and shared Model Vehicle, or those plus three facade/sign kits. Request a written license covering commercial web delivery, editable `.blend` source, separated wheels/body, simple collider meshes, palette materials, GLB export, polygon/texture budgets, revision count, and attribution. Obtain current quotes rather than assuming an hourly or fixed price.

### Phase 4 — optional polish

Buy or commission final engine loops, tire/impact variations, signage, and a few comic props. Avoid expanding the town until first-load time and driving performance remain within budget.

The practical first purchase is **nothing**. The practical first download set is Kenney Car Kit + City Kit Roads + Commercial/Suburban + Interface/Impact Sounds. Spend only after one playable destination proves that the experience is fun.
