# 02 — Drive the Inspector Cart through graybox Motor Town

**What to build:** Turn the runtime smoke scene into the first playable tracer bullet. A visitor receives a primitive Inspector Cart in a compact triangular graybox of Motor Town and can drive it around using forgiving arcade controls while one high three-quarter chase camera keeps the route readable. Collisions and mistakes must remain playful and recoverable.

**Blocked by:** 01 — Establish the React Three Fiber interactive runtime.

**Status:** complete

- [x] Motor Town contains a compact triangular road loop with a start point, left and right destination plots, a central landmark plot, blocked road stubs, and physical outer boundaries.
- [x] The graybox is large enough to feel drivable while keeping both destination plots legible from the chosen camera.
- [x] The Inspector Cart is recognizable from above as a small, upright industrial vehicle built from temporary primitives.
- [x] `WASD` and arrow keys provide equivalent acceleration, reverse, and steering behavior.
- [x] `Space` applies a short handbrake without introducing manual gears or a second driving mode.
- [x] The Inspector Cart accelerates modestly, turns tightly, and visibly wobbles without becoming difficult to control.
- [x] The high three-quarter chase camera follows smoothly without becoming a free, first-person, or cockpit camera.
- [x] Collisions bounce without damage, lives, scores, timers, or failure screens.
- [x] An overturned or irretrievably trapped Inspector Cart returns automatically to controllable driving.
- [x] Driving input does not scroll the page or activate unrelated DOM controls.
- [x] The scene establishes the approved bright daytime palette and a stable pixelated presentation without geometry jitter or decorative chrome.
- [x] A browser test drives the Cart far enough to verify public movement, collision recovery, and continued control.
