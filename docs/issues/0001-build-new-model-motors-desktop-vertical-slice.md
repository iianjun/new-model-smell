# Build the New Model Motors desktop vertical slice

Status: `ready-for-agent`

## Problem Statement

New Model Smell currently contains only the default Vite starter and does not communicate its purpose: showing how long it has been since AI companies publicly released their Flagship Models.

The desired experience is not a conventional model table, scrolling clock, or decorative 3D landing page. A visitor should enter an immersive, dryly comic automotive world, drive to a company, choose a Flagship Model as a vehicle, and physically take that vehicle to information about the model. The first implementation must prove that this continuous driving loop is understandable, enjoyable, and capable of presenting trustworthy benchmark evidence before the project invests in a complete Motor Town or final custom assets.

## Solution

Build a desktop-only playable vertical slice of New Model Motors using the existing Vite, React, and TypeScript application, with React Three Fiber as the React renderer for a Three.js world.

The slice begins with a short real-time reveal of a compact triangular portion of Motor Town. The visitor receives control of an Inspector Cart, drives into a seamless cutaway OpenAI Dealership, parks behind a desired Model Vehicle in its Valet Transfer Bay, and watches the Cart get packed into the Flagship before manually performing the Drive-Out.

The visitor can then drive the Active Flagship to the Dyno Lab, align it on the rollers, and hold the normal accelerator to run an exaggerated physical test. The Dyno prints a paper Dyno Sheet. Pulling the sheet with the pointer transforms it into a crisp, readable Model Dossier containing manually curated Benchmark Records. Closing the dossier returns the visitor to the same vehicle and location.

The complete experience uses forgiving arcade physics, one consistent high three-quarter chase camera, low-poly objects rendered with stable late-1990s arcade-style pixelation, and a bright painted inspection-town palette. Generic prototype assets come from a coherent CC0 kit family; identity-bearing objects remain primitives or custom work until the interaction loop has proven successful.

## User Stories

1. As a first-time visitor, I want the site to reveal an unusual automotive world immediately, so that I understand this is an interactive experience rather than a conventional AI news page.
2. As a first-time visitor, I want the opening to use the actual world and its objects, so that control feels continuous when the reveal ends.
3. As a returning visitor, I want to skip the opening with any key, so that I can resume driving without waiting.
4. As a visitor who requests reduced motion, I want a calm abbreviated reveal, so that I can enter without the large sneeze-driven camera movement.
5. As a visitor, I want to see The Nose inhale pixel scent particles, so that the title “New Model Smell” becomes a physical joke.
6. As a visitor, I want `FRESHNESS EVENT DETECTED` to appear during the opening, so that the purpose of The Nose is legible.
7. As a visitor, I want The Nose's sneeze to reveal Motor Town and uncover the Inspector Cart, so that the opening hands control to me through an object-led transition.
8. As a keyboard user, I want `WASD` and the arrow keys to control the vehicle, so that I can use familiar driving inputs.
9. As a keyboard user, I want `Space` to apply a short handbrake, so that I can make playful turns without learning a simulation.
10. As a visitor, I want the road to show `WASD — BEGIN INSPECTION`, so that the first required action is clear without a separate tutorial panel.
11. As a visitor, I want the Inspector Cart to accelerate modestly and turn tightly, so that exploring the compact slice is easy.
12. As a visitor, I want the Inspector Cart to wobble and sound unnecessarily industrial, so that it has a comic identity distinct from a Flagship.
13. As a visitor, I want collisions to bounce without damage or failure, so that mistakes remain playful.
14. As a visitor, I want an overturned or trapped vehicle to recover automatically, so that driving mistakes cannot block access to the information.
15. As a visitor, I want one consistent high three-quarter chase camera, so that nearby roads, buildings, and destinations remain understandable.
16. As a visitor, I want the camera to follow the Inspector Cart and every Model Vehicle using the same visual language, so that changing vehicles does not require relearning navigation.
17. As a visitor, I want a compact triangular road loop, so that the OpenAI Dealership and Dyno Lab feel like places in a town rather than adjacent menu buttons.
18. As a visitor, I want blocked road stubs and distant Dealership silhouettes, so that the slice suggests a larger Motor Town without presenting unfinished playable areas.
19. As a visitor, I want The Nose to act as the center landmark, so that I can orient myself while driving.
20. As a visitor, I want The Nose to point toward the Dealership containing the newest Flagship Launch represented in the available data, so that Model Freshness has a spatial expression.
21. As a visitor, I want The Nose to track nearby vehicles and occasionally sneeze, so that the world reacts to my movement.
22. As a visitor, I want to drive directly into the OpenAI Dealership, so that visiting a Tracked Company is a physical action.
23. As a visitor, I want the Dealership roof and camera-facing walls to fade as I approach or enter, so that I can read the Showroom without a camera or scene change.
24. As a visitor, I want the Showroom entrance and interior lanes to accommodate both vehicle types, so that the physical route remains obvious.
25. As a visitor, I want each current OpenAI Flagship Model represented by its own Model Vehicle, so that a Flagship Lineup may contain more than one coequal model.
26. As a visitor, I want each displayed Flagship Model to retain its own name, Public Availability Date, and Release Age, so that parallel Flagship Models are not collapsed into one company age.
27. As a visitor, I want mini, budget, specialized, private-preview, and minor point-update models excluded, so that the Showroom remains about the Flagship Lineup.
28. As a visitor, I want an openly available preview to qualify only when it is publicly usable and positioned as a Flagship Model, so that Release Age starts from meaningful access.
29. As a visitor, I want each Model Vehicle to share one recognizable concept-car silhouette, so that New Model Motors has an ownable hero object.
30. As a visitor, I want Company Trim details to identify the Tracked Company without imitating a real production car brand, so that the information is clear without suggesting an official automotive product.
31. As a visitor, I want real company identification used sparingly on the Dealership and interface, so that I know whose models I am viewing without mistaking the experience for an official company site.
32. As a visitor, I want the Model Vehicle to look like a broad, angular 1990s concept grand tourer, so that it reads as prestigious and fast from the high camera.
33. As a visitor, I want the Inspector Cart to look like a tiny airport tug or golf cart, so that transferring to the broad, low Model Vehicle feels significant.
34. As a visitor, I want to choose a Flagship by physically parking behind it, so that selection stays inside the world rather than opening a model menu.
35. As a visitor, I want the Valet Transfer Bay to align and clamp the Inspector Cart, so that successful selection is unmistakable.
36. As a visitor, I want the transfer machinery to pack the tiny Inspector Cart into the Flagship's trunk, so that the control transfer has a memorable physical joke.
37. As a visitor, I want the selected Flagship to wake up before control transfers, so that I receive clear audiovisual confirmation of the Active Flagship.
38. As a visitor, I want to steer the Active Flagship out of the Showroom myself, so that the Drive-Out is an interaction rather than a cutscene.
39. As a visitor, I want the Model Vehicle to accelerate faster, feel heavier, turn more broadly, and allow a small controlled drift, so that it feels meaningfully different from the Inspector Cart.
40. As a visitor, I want the same basic controls in both vehicles, so that vehicle character does not add control complexity.
41. As a visitor, I want to continue driving the Active Flagship freely after the Drive-Out, so that selecting a model changes how I explore Motor Town.
42. As a visitor, I want the Dyno Lab to respond to the Active Flagship, so that the information I reveal belongs to the vehicle I drove there.
43. As a visitor, I want to align the vehicle on visible Dyno rollers, so that beginning a benchmark inspection is a deliberate driving action.
44. As a visitor, I want the Dyno clamps to secure the vehicle, so that I understand it is safe to accelerate in place.
45. As a visitor, I want to hold the normal accelerator to perform the Dyno run, so that the test uses the driving language I already learned.
46. As a visitor, I want wheels, rollers, fans, gauges, vibration, and sound to escalate together, so that viewing benchmark evidence feels like an event.
47. As a visitor, I want a comically long physical Dyno Sheet to print at the end, so that the overly serious test produces an absurd result.
48. As a pointer user, I want to grab and pull the printed sheet, so that opening information is a strong mouse interaction with a world object.
49. As a trackpad user, I want the pull gesture to work without precision dragging, so that the interaction remains accessible on a laptop.
50. As a visitor, I want the physical sheet to unfold toward the camera and resolve into a crisp 2D Model Dossier, so that detailed information remains readable.
51. As a visitor, I want the Model Dossier to identify the Active Flagship and its exact Public Availability Date, so that Release Age is traceable to a concrete event.
52. As a visitor, I want Release Age derived from the Public Availability Date rather than stored as static copy, so that it remains current.
53. As a visitor, I want every Benchmark Record to show its benchmark name and version, score and unit, evaluator, evaluation date, source, provenance, and caveats, so that I can judge the evidence.
54. As a visitor, I want rival results shown together only when they are Comparable Benchmarks, so that unrelated tests are not presented as a fair ranking.
55. As a visitor, I want the Active Flagship shown alone when comparable rival evidence is unavailable, so that the site does not invent an overall score.
56. As a visitor, I want the Dyno run to present curated evidence without changing benchmark values based on my virtual driving, so that the interaction remains playful but the information stays honest.
57. As a visitor, I want external benchmark sources to open as links, so that I can verify the evidence myself.
58. As a visitor, I want to close the Model Dossier and see the paper retract into the Dyno, so that the information layer reconnects to the physical world.
59. As a visitor, I want closing the dossier to return me to the same Active Flagship and location, so that inspecting data does not reset my journey.
60. As a visitor, I want to drive away after reading the dossier, so that the completed information interaction returns naturally to exploration.
61. As a visitor, I want low-poly geometry rendered with stable pixelation, so that the world evokes a bright late-1990s arcade rather than smooth portfolio 3D.
62. As a visitor, I want stable geometry without PS1-style jitter, so that driving and reading the environment remain comfortable.
63. As a visitor, I want a bright daytime world with warm ivory buildings, charcoal roads, safety-orange interaction accents, faded green landscaping, and a pale blue sky, so that destinations remain legible.
64. As a visitor, I want machinery made from painted metal, enamel panels, dark rubber, and non-reflective hardware rather than decorative chrome, so that the visual identity stays tactile and playful.
65. As a visitor, I want Model Dossiers rendered as sharp 2D interfaces rather than pixelated 3D text, so that benchmark evidence remains readable.
66. As a visitor, I want the first load to wait until the playable slice is ready, so that the opening does not reveal missing assets or frozen interactions.
67. As a visitor, I want optional sound to obey browser playback restrictions without blocking control, so that I can begin even when autoplay is unavailable.
68. As a developer, I want the vertical slice to use one coherent set of CC0 generic assets, so that the prototype has consistent proportions and clear redistribution rights.
69. As a developer, I want identity-bearing assets isolated from generic town assets, so that the Inspector Cart, Model Vehicle, Dealership, Dyno Lab, and The Nose can be replaced or refined independently.
70. As a developer, I want editable source assets kept separate from optimized runtime assets, so that web compression never becomes the authoring source of truth.
71. As a developer, I want every third-party asset to retain source and license provenance, so that later publication does not depend on remembering where a file came from.
72. As a developer, I want repeated props to share geometry and materials, so that the small browser world does not waste draw calls or memory.
73. As a developer, I want the first slice to remain playable with primitives before final art, so that interaction quality can be evaluated before commissioning assets.
74. As a developer, I want the experience state to be deterministic under a fixed data fixture and input sequence, so that the complete journey can be tested at one high-level seam.

## Implementation Decisions

- Retain the current Vite, React, and TypeScript application as the host. Use React Three Fiber as the React renderer for Three.js rather than manually creating and disposing the renderer from a React effect. The R3F `Canvas` owns the real-time scene lifecycle and frame loop; regular React DOM owns loading state, the crisp Model Dossier, and other accessibility surfaces layered around it.
- Integrate Rapier through the React Three Fiber-compatible Rapier binding. Its suspenseful WASM initialization, physics world, rigid bodies, colliders, sensors, and stepping remain inside the R3F runtime. Direct Three.js and Rapier APIs remain available where the declarative wrappers do not express a required behavior cleanly.
- Establish Biome as the exact-pinned, single default formatter, linter, and import organizer, replacing the starter Oxlint setup instead of maintaining overlapping lint systems. Provide non-mutating checks, explicit write/fix commands, TypeScript checking, browser tests, and one aggregate validation command.
- Manage project Git hooks through a locally installed Lefthook dependency. Pre-commit checks applicable staged files with Biome; pre-push reuses the aggregate type, build, and browser-test validation. A fresh dependency installation must be able to install the hooks without a globally installed Lefthook executable.
- Organize the implementation around one high-level experience controller rather than allowing individual React components, Three.js objects, and physics callbacks to select modes independently. The controller owns the current experience phase, controlled vehicle, Active Flagship, interaction target, and any preserved driving state.
- Model the primary phase progression as: loading, opening, Inspector Cart driving, Showroom approach, Valet Transfer, Flagship driving, Dyno alignment, Dyno run, Dyno Sheet ready, Model Dossier open, and Flagship driving resumed. Skipping the opening moves directly to Inspector Cart driving; closing the dossier resumes rather than recreates Flagship driving state.
- Feed keyboard, pointer, reduced-motion preference, and later input types through an input abstraction. The first slice implements desktop keyboard and pointer adapters only, while avoiding logic that assumes touch support can never be added.
- Implement forgiving arcade vehicle behavior with a browser-capable rigid-body physics system. Visible meshes and simplified collision proxies are separate. Dynamic vehicles must not use detailed render meshes as colliders.
- Keep one high three-quarter chase-camera system for both vehicles and every location. Its target and tuning may change with vehicle speed and building visibility, but its fundamental camera language does not switch to an interior, first-person, free, or cinematic driving camera.
- Use a compact triangular road loop with the Inspector Cart start at the lower point, the OpenAI Dealership at the left point, the Dyno Lab at the right point, and The Nose at the center. Non-playable exits use physical barriers and distant silhouettes rather than invisible unfinished space.
- Build the opening from the loaded runtime scene. The Nose inhales particles, a physical gauge reacts, `FRESHNESS EVENT DETECTED` illuminates, a sneeze drives the camera reveal, the Inspector Cart cover moves away, and road guidance hands off control. Do not use a prerecorded video.
- Make the opening interruptible by any key. Respect `prefers-reduced-motion` with an abbreviated reveal that avoids the large camera impulse and exaggerated object motion.
- Derive Release Age from each Flagship Model's Public Availability Date at runtime. Do not store Release Age as manually maintained copy. A Public Availability Date is the first date an ordinary customer can use the model through an official product or API without private invitation; paid public access and openly available previews may qualify.
- Represent a Tracked Company's Flagship Lineup as one or more independently dated Flagship Models. Do not force a single current Flagship when the source evidence supports coequal models.
- Store manually curated Flagship and Benchmark Record data separately from scene objects. A Model Vehicle references a Flagship Model identity; it does not become the authoritative source for dates, names, or benchmark values.
- Include only highest-capability, general-purpose Flagship Models. Exclude mini, budget, specialized, private-preview, announcement-only, and minor point-update models.
- Require provenance for Flagship Launch dates and Benchmark Records. The vertical slice uses current OpenAI data researched from primary sources during implementation rather than hardcoding unverified values from the design discussion.
- Define Comparable Benchmarks strictly by matching evaluation source, version, and conditions. The Dyno Sheet may show a solo record when comparison requirements are not met and must never synthesize an overall score.
- Render one Model Vehicle instance per Flagship Model in the OpenAI Flagship Lineup. Instances share the same broad, angular 1990s concept grand-tourer silhouette and driving footprint while using model labels and restrained trim variation to remain distinguishable.
- Keep real company branding limited to identification. The OpenAI Dealership, Company Trim, and interface may use the company name and restrained official marks where necessary, but architecture, vehicles, machinery, and props remain original New Model Motors designs.
- Build the Inspector Cart as a separate vehicle identity with a small upright industrial silhouette, tight steering, modest acceleration, visible wobble, a smell detector, and serious utility sounds.
- Build the Model Vehicle as a faster, heavier arcade vehicle with broader steering and a limited controllable drift. Both vehicles share controls, collision recovery, and the same camera system.
- Use `WASD` and arrow keys for acceleration, reverse, and steering. Use `Space` for a short handbrake. Direction changes require no manual gear mode. Prevent page scrolling while driving controls have focus.
- Make collisions non-destructive and recover vehicles automatically when overturned or irretrievably stuck. The experience has no damage model, lives, timer, score, or failure screen.
- Keep the Showroom in the same loaded world. Fade or remove its roof and camera-facing wall sections based on approach and occupancy while retaining the vehicle, camera, and physics state.
- Place one clearly marked Valet Transfer Bay behind each displayed Model Vehicle. Successful alignment triggers the clamp and transfer sequence; no model-selection menu substitutes for parking.
- During Valet Transfer, suspend visitor steering, align the Cart deterministically, perform the Cart-stowing animation, activate the chosen Flagship, set it as the Active Flagship, and return steering only when the selected vehicle is ready for the manual Drive-Out.
- Treat the Dyno Lab as a physical alignment interaction rather than a proximity modal. A valid Dyno run requires an Active Flagship placed within the roller alignment tolerance.
- Reuse the normal accelerator input during the clamped Dyno run. The run controls only presentation progress; it never computes, increases, or decreases curated Benchmark Record values.
- Coordinate Dyno wheel motion, rollers, cooling fans, gauges, sound, vibration, and printed paper from one run-progress signal so their escalation remains synchronized.
- Make the printed Dyno Sheet a pointer target with generous hit area and drag tolerance. Pull distance controls the physical unfolding transition; reaching its completion threshold opens the Model Dossier.
- Keep the Model Dossier as crisp DOM-based 2D content above the pixelated world. While open, pause vehicle control and preserve the controlled vehicle transform, velocity policy, Active Flagship, Dyno state, and camera context.
- On dossier close, animate the paper back into the Dyno and resume the preserved Active Flagship at the same location. Do not reload the scene, respawn at the Dealership, or return to the Inspector Cart.
- Render low-poly 3D through a stable pixelation treatment. Use a deliberately reduced presentation resolution or pixel-rendering pass with hard-edged scaling, while keeping DOM text and interaction affordances at native display resolution.
- Do not use geometry jitter, unstable vertex snapping, dark neon cyberpunk styling, or decorative chrome. Use the approved warm ivory, charcoal, safety orange, faded green, and pale blue palette with matte painted metal, enamel, rubber, and restrained non-reflective hardware.
- Use The Nose as a data-driven landmark. Its orientation is derived from the newest Flagship Launch available to the slice, while `NEW MODEL SMELL REMAINING` remains a comic presentation of Release Age and must not imply model performance or quality.
- Build the first playable slice from primitives and a coherent CC0 asset family, using Kenney as the primary source for generic roads, buildings, street furniture, temporary vehicles, and sounds. Use additional sources only to fill a specific gap after normalizing scale, palette, and materials.
- Keep untouched source downloads and license evidence. Editable `.blend` files are authoring masters; optimized `.glb` files are runtime delivery assets. Each external asset records creator, source URL, acquisition date, exact license, modifications, and production usage.
- Split runtime assets into logical load units rather than one monolithic world file. Reuse and instance repeated geometry and materials. Validate and measure GLB output before applying optional compression.
- Gate the real-time opening on required world, physics, and interaction assets being ready. A lightweight loading surface may report progress, but it must not impersonate the finished experience with a separate promotional animation.
- Target desktop keyboard and pointer interaction for the vertical slice. Keep mobile controls, mobile layout tuning, and mobile performance outside acceptance while leaving input and quality systems extensible.
- Audio must be progressive enhancement. Browser autoplay restrictions or missing audio must not block the opening skip, driving, transfer, Dyno run, dossier, or return to driving.

## Testing Decisions

- Use one primary high-level seam: the running desktop browser experience with a fixed, provenance-valid data fixture. Drive the application through public keyboard and pointer behavior and observe visible application states, accessible DOM content, and stable visual checkpoints. Do not test private R3F scene structure, Three.js objects, React component internals, physics-engine implementation details, or exact animation-frame values.
- The principal automated journey covers: load readiness; opening completion or skip; Inspector Cart control; entry into the cutaway Showroom; parking in a specific Valet Transfer Bay; transfer to the corresponding Flagship; manual Drive-Out; driving to and aligning with the Dyno; completing a player-operated Dyno run; pulling the Dyno Sheet; reading the correct Active Flagship and Benchmark Records in the Model Dossier; closing it; and resuming the same Flagship at the preserved location.
- Run the same high-level journey with a multi-model OpenAI Flagship Lineup fixture and choose a non-first vehicle. This proves that Valet Transfer selects the parked-behind model rather than defaulting to the first item.
- Run the dossier portion with comparable benchmark evidence and with solo non-comparable evidence. Assert that direct rival comparison appears only in the comparable case and that no synthetic overall score appears.
- Run the opening with normal motion, an immediate any-key skip, and reduced-motion preference. Assert that every path reaches controllable Inspector Cart driving and that the reduced-motion path omits the large camera impulse.
- Exercise both `WASD` and arrow-key mappings and the handbrake through public input. Assert externally visible movement and state progression rather than fixed numerical velocities.
- Verify recovery behavior by causing a representative collision and overturned state. The vehicle must return to controllable driving without damage, failure UI, or a full experience reset.
- Verify dossier state preservation from externally visible behavior: the same Flagship identity remains active, the vehicle returns at the Dyno rather than the Dealership, and driving resumes without repeating Valet Transfer.
- Add visual-regression checkpoints for the Motor Town reveal, cutaway Showroom, active Valet Transfer, Dyno escalation, physical-to-2D sheet transition, and final Model Dossier. Use tolerant image comparison appropriate for WebGL output and treat material, palette, camera framing, and destination legibility as the assertions.
- Validate the curated domain fixture at its loading boundary. Reject missing source provenance, invalid Public Availability Dates, incomplete Benchmark Records, and rival comparisons whose source, version, or conditions do not match.
- Perform a manual desktop exploratory pass for driving feel, camera comfort, pointer-drag tolerance, sound synchronization, building occlusion, and stable performance. These qualities are user-visible but should not be reduced to brittle implementation assertions.
- The repository currently has no test framework or relevant prior test suite. Establish the browser-level harness around the completed user journey rather than introducing many lower-level test seams. Any small pure validation tests should support the same data-loading boundary and not mirror internal implementation.

## Out of Scope

- Mobile and tablet layouts, touch driving controls, mobile performance acceptance, and orientation handling.
- The Anthropic and Google Dealership interiors, their complete Flagship Lineups, and their Company Trims.
- A complete Motor Town, large open world, additional neighborhoods, hidden destinations, or unrestricted blocked-road areas.
- The Drive-In, Model Articles, Drive-In Program, and Screening interactions.
- Final production-quality commissioned models for the Inspector Cart, Model Vehicle, Dealerships, Dyno Lab, or The Nose.
- Multiple unrelated paid asset packs or purchases made before the vertical slice proves the core loop.
- Automated model discovery, web scraping, a content-management system, an administrative interface, or a backend data service.
- Benchmark generation, user-run model evaluation, synthetic normalization, or a universal model leaderboard.
- Realistic vehicle simulation, manual transmission, damage, fuel, racing opponents, timers, scores, lives, or failure states.
- Walking controls, a player avatar, free camera, first-person view, cockpit view, or separate interior camera.
- Prerecorded cinematic video, conventional scroll-driven scene progression, or a separate non-interactive landing page.
- Full controller/gamepad support, rebinding controls, or accessibility input modes beyond the agreed desktop keyboard, pointer, opening skip, and reduced-motion path.
- Production hosting, analytics, accounts, social features, saved progress, or cross-device persistence.
- SEO/editorial pages beyond the interactive vertical slice and its readable Model Dossier.

## Further Notes

- The [domain glossary](../../CONTEXT.md) is normative. Implementation and interface copy should use terms such as Release Age, Public Availability Date, Flagship Lineup, Inspector Cart, Drive-Out, Active Flagship, Dyno Sheet, and Model Dossier rather than the avoided alternatives.
- The [first vertical slice design](../design/first-vertical-slice.md) captures the agreed spatial and interaction details.
- The repository ADRs are binding design constraints for this issue, particularly the decisions covering New Model Motors, flagship inclusion, Public Availability Date, the high chase camera, comparable benchmarks, pixel rendering, asset strategy, cutaway Showrooms, Valet Transfer, Dyno operation, The Nose, palette, vehicle silhouettes, arcade physics, and desktop scope.
- The [3D asset pipeline research](../research/3d-asset-pipeline.md) identifies official CC0 and paid sources, Blender-to-GLB workflow, optimization concerns, and provenance requirements.
- The existing palette concept is a density and color study only. Its chrome-like highlights are rejected; The Nose must read as a literal painted enamel nose, and production buildings should be simpler than the concept image.
- React Three Fiber is the agreed integration layer for Three.js. It does not replace the Three.js engine; it expresses the Three.js scene graph and frame lifecycle through React.
- The vertical slice succeeds when an unfamiliar desktop visitor can complete the full journey without verbal explanation, wants to keep driving, can understand the cutaway Showroom, and returns from the Model Dossier to the same Active Flagship at the Dyno.
