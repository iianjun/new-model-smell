import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_GRAPHICS_QUALITY_ID,
  GRAPHICS_QUALITY_PRESETS,
  type GraphicsQualityId,
} from "./graphicsQuality";

type GraphicsQualitySettingsProps = {
  onChange: (quality: GraphicsQualityId) => void;
  selectedQuality: GraphicsQualityId;
};

export function GraphicsQualitySettings({
  onChange,
  selectedQuality,
}: GraphicsQualitySettingsProps) {
  const [open, setOpen] = useState(false);
  const closeButton = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) {
      return;
    }

    closeButton.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
    };

    window.addEventListener("keydown", closeOnEscape);

    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [close, open]);

  return (
    <>
      <button
        aria-controls="graphics-settings-surface"
        aria-expanded={open}
        aria-label={
          open ? "Close graphics settings panel" : "Open graphics settings"
        }
        className="settings-control"
        onClick={(event) => {
          if (open) {
            close();
            event.currentTarget.blur();
            return;
          }

          setOpen(true);
        }}
        type="button"
      >
        <span aria-hidden="true">▦</span>
        Graphics
      </button>

      {open ? (
        <section
          aria-labelledby="graphics-settings-title"
          className="graphics-settings-surface"
          id="graphics-settings-surface"
          role="dialog"
        >
          <header>
            <div>
              <p>Motor Town display</p>
              <h2 id="graphics-settings-title">Graphics settings</h2>
            </div>
            <button
              aria-label="Close graphics settings"
              className="graphics-settings-close"
              onClick={close}
              ref={closeButton}
              type="button"
            >
              ×
            </button>
          </header>

          <p className="graphics-settings-explainer">
            Choose the GPU rendering work that suits this display. Motor Town's
            low-poly forms, palette, and materials stay unchanged.
          </p>

          <fieldset>
            <legend>Graphics quality</legend>
            {GRAPHICS_QUALITY_PRESETS.map((preset) => (
              <label
                data-selected={preset.id === selectedQuality}
                key={preset.id}
              >
                <input
                  checked={preset.id === selectedQuality}
                  className="graphics-quality-choice"
                  name="graphics-quality"
                  onChange={() => onChange(preset.id)}
                  type="radio"
                  value={preset.id}
                />
                <span>
                  <strong className="graphics-quality-title">
                    {preset.label}
                    {preset.id === DEFAULT_GRAPHICS_QUALITY_ID
                      ? " · Default"
                      : ""}
                  </strong>
                  <small className="graphics-quality-description">
                    {preset.description}
                  </small>
                </span>
              </label>
            ))}
          </fieldset>

          <p className="graphics-settings-note">
            Applies immediately and is remembered on this device.
          </p>
        </section>
      ) : null}
    </>
  );
}
