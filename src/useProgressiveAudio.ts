import { useCallback, useEffect, useRef, useState } from "react";
import { AUDIO_RUNTIME_ASSETS } from "./assetCatalog";

export type MotorTownAudioCue = keyof typeof AUDIO_RUNTIME_ASSETS;

function playWithoutBlocking(audio: HTMLAudioElement) {
  try {
    void audio.play().catch(() => {
      // Audio is progressive enhancement. Browser policy and decode failures
      // must never become application-state failures.
    });
  } catch {
    // Some browsers throw synchronously before returning a play promise.
  }
}

function safelyPlay(audio: HTMLAudioElement) {
  audio.currentTime = 0;
  playWithoutBlocking(audio);
}

function resumeWithoutBlocking(context: AudioContext) {
  try {
    void context.resume().catch(() => {
      // Audio is progressive enhancement. Browser policy failures must never
      // become application-state failures.
    });
  } catch {
    // Some browsers throw synchronously before returning a resume promise.
  }
}

type DynoSynthesis = {
  context: AudioContext;
  motor: OscillatorNode;
  motorGain: GainNode;
  output: GainNode;
  roller: OscillatorNode;
  rollerGain: GainNode;
};

export function useProgressiveAudio() {
  const [enabled, setEnabled] = useState(false);
  const enabledRef = useRef(false);
  const audioByCue = useRef(new Map<MotorTownAudioCue, HTMLAudioElement>());
  const dynoSynthesis = useRef<DynoSynthesis | null>(null);
  const dynoSynthesisUnavailable = useRef(false);

  const getAudio = useCallback((cue: MotorTownAudioCue) => {
    const existing = audioByCue.current.get(cue);

    if (existing) {
      return existing;
    }

    const audio = new Audio(AUDIO_RUNTIME_ASSETS[cue]);
    audio.preload = "auto";
    audio.volume = 0.32;
    audioByCue.current.set(cue, audio);

    return audio;
  }, []);

  const getDynoSynthesis = useCallback(() => {
    const existing = dynoSynthesis.current;

    if (existing) {
      return existing;
    }

    if (dynoSynthesisUnavailable.current) {
      return null;
    }

    let context: AudioContext | null = null;

    try {
      context = new AudioContext();
      const motor = context.createOscillator();
      const motorGain = context.createGain();
      const output = context.createGain();
      const roller = context.createOscillator();
      const rollerGain = context.createGain();

      motor.type = "sawtooth";
      motor.frequency.value = 72;
      motorGain.gain.value = 0.52;
      roller.type = "triangle";
      roller.frequency.value = 118;
      rollerGain.gain.value = 0.28;
      output.gain.value = 0;

      motor.connect(motorGain);
      motorGain.connect(output);
      roller.connect(rollerGain);
      rollerGain.connect(output);
      output.connect(context.destination);
      motor.start();
      roller.start();

      const synthesis = {
        context,
        motor,
        motorGain,
        output,
        roller,
        rollerGain,
      };
      dynoSynthesis.current = synthesis;

      return synthesis;
    } catch {
      dynoSynthesisUnavailable.current = true;
      if (context) {
        void context.close().catch(() => {
          // Audio is progressive enhancement.
        });
      }

      return null;
    }
  }, []);

  const playCue = useCallback(
    (cue: MotorTownAudioCue) => {
      if (enabledRef.current) {
        safelyPlay(getAudio(cue));
      }
    },
    [getAudio],
  );

  const setDynoRunIntensity = useCallback(
    (active: boolean, intensity: number) => {
      const existing = dynoSynthesis.current;

      if (!active || !enabledRef.current) {
        if (existing) {
          existing.output.gain.setTargetAtTime(
            0,
            existing.context.currentTime,
            0.025,
          );
        }

        return;
      }

      const synthesis = getDynoSynthesis();

      if (!synthesis) {
        return;
      }

      const normalizedIntensity = Math.min(1, Math.max(0, intensity));
      const now = synthesis.context.currentTime;

      resumeWithoutBlocking(synthesis.context);
      synthesis.motor.frequency.setTargetAtTime(
        72 + normalizedIntensity * 118,
        now,
        0.04,
      );
      synthesis.roller.frequency.setTargetAtTime(
        118 + normalizedIntensity * 224,
        now,
        0.035,
      );
      synthesis.output.gain.setTargetAtTime(
        0.045 + normalizedIntensity * 0.105,
        now,
        0.025,
      );
    },
    [getDynoSynthesis],
  );

  const toggle = useCallback(() => {
    const nextEnabled = !enabledRef.current;
    enabledRef.current = nextEnabled;
    setEnabled(nextEnabled);

    if (nextEnabled) {
      safelyPlay(getAudio("transfer"));
      const synthesis = getDynoSynthesis();

      if (synthesis) {
        resumeWithoutBlocking(synthesis.context);
      }
      return;
    }

    const synthesis = dynoSynthesis.current;

    if (synthesis) {
      synthesis.output.gain.setValueAtTime(0, synthesis.context.currentTime);
      try {
        void synthesis.context.suspend().catch(() => {
          // Audio is progressive enhancement.
        });
      } catch {
        // Some browsers throw synchronously before returning a suspend promise.
      }
    }

    for (const audio of audioByCue.current.values()) {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [getAudio, getDynoSynthesis]);

  useEffect(
    () => () => {
      for (const audio of audioByCue.current.values()) {
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
      }

      audioByCue.current.clear();
      const synthesis = dynoSynthesis.current;

      if (synthesis) {
        synthesis.motor.stop();
        synthesis.roller.stop();
        synthesis.motor.disconnect();
        synthesis.motorGain.disconnect();
        synthesis.roller.disconnect();
        synthesis.rollerGain.disconnect();
        synthesis.output.disconnect();
        void synthesis.context.close().catch(() => {
          // Audio is progressive enhancement.
        });
        dynoSynthesis.current = null;
      }
    },
    [],
  );

  return {
    enabled,
    playCue,
    setDynoRunIntensity,
    toggle,
  };
}
