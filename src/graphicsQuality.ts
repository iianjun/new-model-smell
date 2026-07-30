export const GRAPHICS_QUALITY_STORAGE_KEY = "new-model-motors.graphics-quality";

export type GraphicsQualityId = "high" | "performance";

export type GraphicsQualityPreset = {
  description: string;
  dpr: number | [number, number];
  id: GraphicsQualityId;
  label: string;
};

export const GRAPHICS_QUALITY_PRESETS: readonly GraphicsQualityPreset[] = [
  {
    description: "Display-native rendering up to DPR 2 with antialiased edges.",
    dpr: [1, 2],
    id: "high",
    label: "High fidelity",
  },
  {
    description:
      "DPR 1 reduces GPU pixel work while keeping the same geometry, materials, and palette.",
    dpr: 1,
    id: "performance",
    label: "Performance",
  },
];

export const DEFAULT_GRAPHICS_QUALITY_ID: GraphicsQualityId = "high";

export function isGraphicsQualityId(
  value: string | null,
): value is GraphicsQualityId {
  return GRAPHICS_QUALITY_PRESETS.some((preset) => preset.id === value);
}

export function getGraphicsQualityPreset(id: GraphicsQualityId) {
  const preset = GRAPHICS_QUALITY_PRESETS.find((entry) => entry.id === id);

  if (!preset) {
    throw new Error(`Unknown graphics quality preset: ${id}`);
  }

  return preset;
}

export function readGraphicsQualityPreference(): GraphicsQualityId {
  try {
    const storedQuality = window.localStorage.getItem(
      GRAPHICS_QUALITY_STORAGE_KEY,
    );

    return isGraphicsQualityId(storedQuality)
      ? storedQuality
      : DEFAULT_GRAPHICS_QUALITY_ID;
  } catch {
    return DEFAULT_GRAPHICS_QUALITY_ID;
  }
}

export function writeGraphicsQualityPreference(id: GraphicsQualityId) {
  try {
    window.localStorage.setItem(GRAPHICS_QUALITY_STORAGE_KEY, id);
  } catch {
    // Storage is progressive enhancement; the live setting still applies.
  }
}
