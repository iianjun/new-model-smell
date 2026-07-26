# 01 — Establish the React Three Fiber interactive runtime

**What to build:** Replace the starter screen with the smallest complete New Model Motors runtime and its shared project-quality foundation: a full-viewport React Three Fiber world that waits for React Three Rapier, renders a physical smoke scene, and exposes a regular React DOM surface for loading and readable interface content. A visitor must be able to open the site, see loading resolve into a live rendered scene, and observe a physics object settle on the ground. An implementer must receive one consistent Biome toolchain, automatically installed Lefthook checks, and the browser-level test seam used by every later ticket.

**Blocked by:** None — can start immediately.

**Status:** complete

- [x] The application uses a React 19-compatible React Three Fiber release with Three.js and a compatible React Three Rapier release.
- [x] Biome is installed as an exact-pinned development dependency and is the single default formatter, linter, and import organizer for supported project files.
- [x] Redundant Oxlint configuration and dependencies are removed rather than leaving two competing default linters.
- [x] The Biome configuration covers the repository's TypeScript, TSX, JavaScript, JSON, and stylesheet sources while excluding generated output and downloaded runtime assets.
- [x] Project commands provide non-mutating formatting and lint checks, explicit write/fix variants, TypeScript checking, browser tests, and one aggregate validation command.
- [x] Lefthook is installed as a project development dependency and can install its Git hooks after a fresh dependency installation without requiring a global executable.
- [x] The Lefthook pre-commit hook runs non-mutating Biome checks against applicable staged files and rejects a commit when they fail.
- [x] The Lefthook pre-push hook runs the aggregate type, build, and browser-test validation required to keep the current frontier green.
- [x] Hook commands reuse the package scripts used manually and in automation instead of duplicating separate lint or test commands.
- [x] The default Vite starter content and assets no longer appear.
- [x] The application fills the desktop viewport without document scrolling or an unintended page background around the scene.
- [x] A loading surface remains visible until the R3F scene and Rapier WASM world are ready.
- [x] A visible primitive rigid body falls onto a visible ground collider and settles when loading completes.
- [x] The R3F `Canvas` owns the Three.js renderer lifecycle and frame loop; the application does not create a second manually managed renderer.
- [x] Regular React DOM content can render above the canvas without being pixelated with the 3D scene.
- [x] Development remounting and hot reload do not leave duplicate canvases, animation loops, event listeners, or physics worlds.
- [x] Formatting checks, lint checks, TypeScript checks, the production build, and browser tests all pass from a clean dependency installation.
- [x] A Playwright smoke test loads the running application and verifies the public loading-to-ready behavior without asserting private R3F scene structure.
