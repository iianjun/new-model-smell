import type { CSSProperties } from "react";
import {
  type FlagshipModel,
  formatPublicAvailabilityDate,
  formatReleaseAge,
  getReleaseAgeInDays,
  OPENAI_COMPANY_TRIM,
} from "./flagshipLineup";

type ShowroomDirectoryProps = {
  lineup: readonly FlagshipModel[];
  visible: boolean;
};

export function ShowroomDirectory({ lineup, visible }: ShowroomDirectoryProps) {
  if (!visible) {
    return null;
  }

  return (
    <section
      aria-label="OpenAI Flagship Showroom"
      className="showroom-directory"
    >
      <header>
        <p>OpenAI Dealership</p>
        <h2>Flagship Showroom</h2>
        <span>{lineup.length.toString().padStart(2, "0")} on display</span>
      </header>
      <div className="showroom-lineup">
        {lineup.map((model, index) => {
          const releaseAge = getReleaseAgeInDays(model.publicAvailabilityDate);

          return (
            <article aria-label={model.name} key={model.id}>
              <span
                aria-hidden="true"
                className="model-swatch"
                style={
                  {
                    "--model-accent": OPENAI_COMPANY_TRIM.body,
                    "--model-light": OPENAI_COMPANY_TRIM.light,
                  } as CSSProperties
                }
              />
              <div>
                <p>Display {String(index + 1).padStart(2, "0")}</p>
                <h3>{model.name}</h3>
                <p className="model-fact">
                  Public availability ·{" "}
                  {formatPublicAvailabilityDate(model.publicAvailabilityDate)}
                </p>
                <p className="model-fact">
                  Release Age · {formatReleaseAge(releaseAge)}
                </p>
                <a href={model.provenance.url} rel="noreferrer" target="_blank">
                  {model.provenance.label}
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
