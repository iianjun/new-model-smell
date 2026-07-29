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

function safelyResume(audio: HTMLAudioElement) {
  playWithoutBlocking(audio);
}

function stopLoop(audio: HTMLAudioElement) {
  audio.pause();
  audio.currentTime = 0;
  audio.loop = false;
  audio.playbackRate = 1;
  audio.volume = 0.32;
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

  const setDynoRunIntensity = useCallback(
    (active: boolean, intensity: number) => {
      const existing = audioByCue.current.get("dyno");

      if (!active || !enabledRef.current) {
        if (existing?.loop) {
          stopLoop(existing);
        }

        return;
      }

      const audio = getAudio("dyno");
      const normalizedIntensity = Math.min(1, Math.max(0, intensity));
      audio.loop = true;
      audio.volume = 0.12 + normalizedIntensity * 0.28;
      audio.playbackRate = 0.7 + normalizedIntensity * 1.1;

      if (audio.paused) {
        safelyResume(audio);
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
    setDynoRunIntensity,
    toggle,
  };
}
