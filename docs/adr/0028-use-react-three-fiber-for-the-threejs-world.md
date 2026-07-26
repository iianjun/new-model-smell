# Use React Three Fiber for the Three.js world

The Vite, React, and TypeScript application will use React Three Fiber as its React renderer for Three.js. R3F's `Canvas` owns the real-time scene lifecycle and frame loop; declarative scene components express Motor Town, vehicles, destinations, lights, effects, and camera behavior. Regular React DOM remains responsible for loading surfaces, the crisp Model Dossier, and other accessible two-dimensional interfaces.

Physics will be integrated through the React Three Fiber-compatible Rapier binding so its asynchronous WASM initialization, rigid bodies, colliders, sensors, and stepping participate in the same runtime. Direct Three.js and Rapier APIs may still be used behind focused modules when a required behavior is not cleanly represented by the wrappers.

React Three Fiber is not a replacement 3D engine. It is the agreed React integration layer over Three.js, preserving access to Three.js features while avoiding a second manually managed renderer lifecycle inside the React application.
