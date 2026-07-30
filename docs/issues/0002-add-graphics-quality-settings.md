# Add graphics quality settings

Status: `done`

Evidence: [browser coverage](../../tests/graphics-quality.spec.ts) · [desktop visual baseline](../../tests/__screenshots__/graphics-quality.spec.ts/graphics-settings.png)

## Problem Statement

New Model Motors defaults to a clean, high-density low-poly presentation. That default preserves the intended visual identity, but a fixed high render density may be unnecessarily expensive on some desktop hardware.

Pixel-art inspiration describes the world's forms, palette, materials, and restrained detail. It must not force every visitor into deliberately low-resolution or jagged output.

## Solution

Add an accessible settings button to the runtime interface that lets a visitor choose an appropriate graphics-quality level. Keep the clean high-quality presentation as the default, offer lower-cost rendering as an explicit performance choice, and persist the visitor's selection locally.

## Acceptance Criteria

- [x] A keyboard-accessible settings button opens and closes a crisp DOM-based settings surface without interrupting or resetting the current driving state.
- [x] The settings surface explains graphics quality in performance terms rather than treating low-resolution output as the project's visual identity.
- [x] The default quality preserves display-native rendering up to DPR 2 and antialiased edges.
- [x] At least one lower-cost quality option reduces GPU rendering work while retaining the approved low-poly forms, palette, and materials.
- [x] Changing quality applies predictably to the live world, including any renderer recreation required by constructor-only settings.
- [x] The selected quality persists locally and is restored on the next visit.
- [x] Browser tests cover opening the settings surface, changing quality, preserving driving state, and restoring the saved choice.
