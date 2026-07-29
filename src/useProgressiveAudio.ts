import { useCallback, useEffect, useRef, useState } from "react";
import { AUDIO_RUNTIME_ASSETS } from "./assetCatalog";

export type MotorTownAudioCue = keyof typeof AUDIO_RUNTIME_ASSETS;

function safelyPlay(audio: HTMLAudioElement) {
  try {
    audio.currentTime = 0;
    void audio.play().catch(() => {
      // Audio is progressive enhancement. Browser policy and decode failures
      // must never become application-state failures.
    });
  } catch {
    // Some browsers throw synchronously before returning a play promise.
  }
}

export function useProgressiveAudio() {
  const [enabled, setEnabled] = useState(false);
  const enabledRef = useRef(false);
  const audioByCue = useRef(new Map<MotorTownAudioCue, HTMLAudioElement>());

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

  const playCue = useCallback(
    (cue: MotorTownAudioCue) => {
      if (enabledRef.current) {
        safelyPlay(getAudio(cue));
      }
    },
    [getAudio],
  );

  const toggle = useCallback(() => {
    const nextEnabled = !enabledRef.current;
    enabledRef.current = nextEnabled;
    setEnabled(nextEnabled);

    if (nextEnabled) {
      safelyPlay(getAudio("transfer"));
      return;
    }

    for (const audio of audioByCue.current.values()) {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [getAudio]);

  useEffect(
    () => () => {
      for (const audio of audioByCue.current.values()) {
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
      }

      audioByCue.current.clear();
    },
    [],
  );

  return {
    enabled,
    playCue,
    toggle,
  };
}
