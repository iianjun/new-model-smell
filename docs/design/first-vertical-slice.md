# First vertical slice

## Purpose

Prove that New Model Motors is enjoyable as a continuous driving experience before producing a complete Motor Town or commissioning signature assets.

The playable loop is:

1. Enter in the Inspector Cart.
2. Drive into the OpenAI Dealership.
3. Choose and board a Flagship Model Vehicle.
4. Manually Drive-Out into Motor Town.
5. Drive onto the Dyno Lab.
6. Run the Dyno by holding the accelerator and open its Model Dossier.
7. Continue driving from the same position in the same vehicle.

## Opening

The experience begins in an extreme close view of The Nose as it inhales pixel scent particles and drives its gauge to the limit. `FRESHNESS EVENT DETECTED` illuminates; The Nose sneezes; and the impact pushes the camera upward and backward to reveal the triangular Motor Town slice. The Inspector Cart's cover blows away, its engine starts, and `WASD — BEGIN INSPECTION` appears on the road as control passes to the visitor.

The sequence is a short real-time camera and object performance rather than a rendered video. Any key can skip it, and reduced-motion preferences receive a calm abbreviated reveal.

## Map

The slice uses one compact triangular road loop:

- the Inspector Cart starts near the bottom point;
- the OpenAI Dealership occupies the left point;
- the Dyno Lab occupies the right point;
- The Nose creates a recognizable center, communicates current Model Freshness, and prevents the loop from feeling like an empty test track;
- blocked road stubs and distant Dealership silhouettes imply a larger future Motor Town without making those areas playable.

The loop must be large enough to test turning and acceleration but small enough that both destinations remain visually legible from the high three-quarter chase camera.

## Dealership

The Showroom is part of the same world, not a separately loaded scene. Its entrance is wide enough for the Inspector Cart and the selected Model Vehicle. When the visitor approaches or enters, the roof and camera-facing walls fade or disappear, revealing a low-partition cutaway interior. The same camera and driving controls remain active.

Each Flagship Model Vehicle has a marked Valet Transfer Bay directly behind it. Parking the Inspector Cart in a bay activates an excessively refined handover mechanism: floor clamps align the Cart, machinery packs it into the chosen Flagship's trunk, the Flagship wakes up, and control transfers to it without opening a menu or changing cameras. The visitor then performs the Drive-Out manually.

## Prototype assets

Source and adapt from the selected CC0 kit family:

- road, curb, sidewalk, and blocked-road modules;
- generic building shell, windows, doors, lamps, trees, barriers, and signs;
- temporary Inspector Cart and Model Vehicle meshes;
- temporary UI, tire, and collision sounds.

Build from primitives or substantially customize:

- OpenAI Dealership entrance silhouette and restrained identification;
- one Showroom display position per tested Flagship Model;
- one Valet Transfer Bay with clamps and a Cart-stowing mechanism;
- Dyno Lab rollers, frame, display, and activation area;
- The Nose, including its turntable, freshness gauge, intake particles, and reactive sneeze;
- simple vehicle collision proxies and separated wheels.

## Art bar

Use low-poly geometry, a small shared material palette, flat or tightly controlled lighting, and stable late-1990s arcade-style pixelation. The Model Dossier remains crisp 2D. Visual polish is subordinate to proving controls, camera behavior, collision readability, vehicle transfer, Drive-Out, Dyno activation, and state restoration.

### Model Vehicle

The shared Model Vehicle uses the proportions of a broad, angular 1990s concept grand tourer: a low wedge-shaped nose, large glass canopy, strong planar shoulders, and oversized wheels that remain legible from the high camera. It should look prestigious and fast without reproducing a recognizable production car or automotive marque. Company Trims alter its controlled colors, light signatures, badges, and a small number of replaceable panels without changing the underlying silhouette or driving footprint.

### Inspector Cart

The Inspector Cart combines the compact proportions of an airport baggage tug and a golf cart. It has a short, tall body, deliberately small wheels, warm-ivory and safety-orange paint, a roof-mounted rotating smell detector, and a loosely mounted inspection clipboard. Its industrial reverse alarm treats the tiny vehicle with unnecessary seriousness. The Cart is visibly small enough to fit inside the Model Vehicle's exaggerated trunk during a Valet Transfer, making the move from the Cart to the broad, low Flagship immediately legible.

## Driving feel

Both vehicles use forgiving arcade physics rather than realistic simulation. The Inspector Cart is slow, turns tightly, and visibly wobbles. The Model Vehicle is faster, heavier, turns more broadly, and permits a small controlled drift. Collisions bounce without damage or failure, and overturned vehicles recover automatically.

`WASD` and the arrow keys provide the same accelerate, reverse, and steering controls; reverse direction requires no manual gear change. `Space` provides a short handbrake. Different vehicle characters must come from tuned acceleration, steering, grip, suspension response, and sound without introducing a second control scheme.

### Palette exploration

![Bright daytime Motor Town palette exploration](assets/motor-town-palette-concept-v1.png)

This first concept tests warm ivory architecture, charcoal asphalt, safety-orange interaction accents, faded green landscaping, and pale blue sky. Its chrome-like highlights are not part of the approved material direction. Production machinery uses matte painted metal, enamel panels, dark rubber, and restrained non-reflective hardware. The image is a color and density reference rather than a final model-design reference: The Nose must read more clearly as a literal nose, and production buildings should be simpler and more stylized.

## The Nose

The center landmark is a giant painted enamel nose presented like an expensive automotive sculpture on a matte mechanical turntable. It rotates toward the Dealership whose Flagship Lineup contains the newest Flagship Launch and displays `NEW MODEL SMELL REMAINING` on a physical gauge. It periodically inhales visible pixel scent particles. When a visitor drives close, it tracks the vehicle and may produce an exaggerated sneeze, making the live freshness indicator an interactive town object rather than decorative text.

## Exit criteria

The slice is successful on desktop when a first-time visitor can complete the entire loop with keyboard and pointer input without explanation, driving feels playful enough to repeat, the cutaway Showroom remains readable, and closing the Dyno dossier reliably returns the visitor to the same vehicle and location.

Touch controls and mobile performance are outside the first vertical slice. The desktop implementation must avoid architectural assumptions that prevent later touch input or scalable quality settings, but mobile parity is not a release criterion for this prototype.

## Dyno run

The Dyno Lab does not reveal results merely because the visitor enters a trigger. The visitor aligns the Active Flagship on the rollers, the wheel clamps close, and the visitor holds the normal accelerator control to perform the run. Wheels, rollers, cooling fans, gauges, vibration, sound, and a comically long printed Dyno Sheet escalate together. The displayed benchmark values remain manually curated evidence; the run is a physical presentation ritual and does not generate or alter those values.

At the end of the run, the Dyno prints a physical paper strip into the three-dimensional world. The visitor grabs its exposed end with the pointer and pulls. The paper unfurls toward the camera and resolves into the crisp two-dimensional Model Dossier. Closing the dossier folds and retracts the paper into the Dyno, returning control to the same Active Flagship at the same position.
