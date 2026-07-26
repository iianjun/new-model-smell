# 03 — Enter Motor Town through The Nose's sneeze

**What to build:** Replace the direct handoff to the Inspector Cart with the agreed real-time opening. A visitor begins close to The Nose, watches it detect a freshness event and sneeze the camera backward to reveal Motor Town, then receives control of the uncovered Inspector Cart. Returning visitors and visitors requesting reduced motion must reach the same playable state without sitting through the full motion.

**Blocked by:** 02 — Drive the Inspector Cart through graybox Motor Town.

**Status:** ready-for-agent

- [ ] The opening is performed with the same R3F world, camera, The Nose, and Inspector Cart used during play rather than a prerecorded video.
- [ ] The Nose inhales visible pixel scent particles and drives a physical freshness gauge toward its event state.
- [ ] `FRESHNESS EVENT DETECTED` becomes clearly visible before the sneeze.
- [ ] The sneeze pushes the camera upward and backward to reveal the triangular Motor Town layout.
- [ ] The Inspector Cart's cover is physically removed and the Cart visibly wakes before control is granted.
- [ ] `WASD — BEGIN INSPECTION` appears on or directly above the road when driving becomes available.
- [ ] Pressing any key during the opening skips promptly to the same controllable Inspector Cart state without leaving half-completed objects or camera state.
- [ ] `prefers-reduced-motion` receives a calm abbreviated reveal without the large sneeze-driven camera impulse.
- [ ] Vehicle input is ignored while the full opening owns the camera and becomes active exactly once at handoff.
- [ ] A browser test verifies normal completion, immediate skip, and reduced-motion entry all reach controllable Inspector Cart driving.
