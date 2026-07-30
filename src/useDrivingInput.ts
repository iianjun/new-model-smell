import { useEffect, useRef } from "react";
import { PHYSICS_TIME_STEP } from "./driving.js";

export type DrivingInput = {
  handbrake: boolean;
  handbrakeStepsRemaining: number;
  steer: number;
  throttle: number;
};

export const HANDBRAKE_DURATION_STEPS = Math.round(0.52 / PHYSICS_TIME_STEP);

export function createDrivingInput(): DrivingInput {
  return {
    handbrake: false,
    handbrakeStepsRemaining: 0,
    steer: 0,
    throttle: 0,
  };
}

export function queueHandbrakePulse(input: DrivingInput) {
  input.handbrake = true;
  input.handbrakeStepsRemaining = HANDBRAKE_DURATION_STEPS;
}

export function consumeHandbrakeStep(input: DrivingInput) {
  const handbrakeActive = input.handbrakeStepsRemaining > 0;

  if (handbrakeActive) {
    input.handbrakeStepsRemaining -= 1;
  }

  input.handbrake = input.handbrakeStepsRemaining > 0;

  return handbrakeActive;
}

const DRIVING_KEYS = new Set([
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "KeyA",
  "KeyD",
  "KeyS",
  "KeyW",
  "Space",
]);

function isEditableTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      target.matches("button, input, select, textarea, [role='button']"))
  );
}

export function useDrivingInput(enabled: boolean) {
  const enabledRef = useRef(enabled);
  const input = useRef<DrivingInput>(createDrivingInput());
  const pressedKeys = useRef(new Set<string>());
  const reverseAlarmTimer = useRef<number | undefined>(undefined);
  const reverseAlarmContext = useRef<AudioContext | null>(null);

  enabledRef.current = enabled;

  useEffect(() => {
    if (enabled) {
      return;
    }

    pressedKeys.current.clear();
    input.current = createDrivingInput();
    window.clearInterval(reverseAlarmTimer.current);
    reverseAlarmTimer.current = undefined;
  }, [enabled]);

  useEffect(() => {
    pressedKeys.current.clear();
    input.current = createDrivingInput();

    const soundReverseAlarm = () => {
      try {
        let context = reverseAlarmContext.current;

        if (!context) {
          context = new AudioContext();
          reverseAlarmContext.current = context;
        }

        if (context.state === "suspended") {
          void context.resume();
        }

        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const startsAt = context.currentTime + 0.01;

        oscillator.type = "square";
        oscillator.frequency.setValueAtTime(620, startsAt);
        gain.gain.setValueAtTime(0.0001, startsAt);
        gain.gain.exponentialRampToValueAtTime(0.045, startsAt + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, startsAt + 0.13);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(startsAt);
        oscillator.stop(startsAt + 0.14);
        oscillator.addEventListener("ended", () => {
          oscillator.disconnect();
          gain.disconnect();
        });
      } catch {
        // Audio is progressive enhancement; driving must still work without it.
      }
    };

    const stopReverseAlarm = () => {
      window.clearInterval(reverseAlarmTimer.current);
      reverseAlarmTimer.current = undefined;
    };

    const updateReverseAlarm = () => {
      const pressed = pressedKeys.current;
      const isAccelerating = pressed.has("KeyW") || pressed.has("ArrowUp");
      const isReversing =
        !isAccelerating && (pressed.has("KeyS") || pressed.has("ArrowDown"));

      if (isReversing && reverseAlarmTimer.current === undefined) {
        soundReverseAlarm();
        reverseAlarmTimer.current = window.setInterval(soundReverseAlarm, 720);
      } else if (!isReversing) {
        stopReverseAlarm();
      }
    };

    const updateInput = () => {
      if (!enabledRef.current) {
        input.current = createDrivingInput();
        stopReverseAlarm();
        return;
      }

      const pressed = pressedKeys.current;
      const accelerate = pressed.has("KeyW") || pressed.has("ArrowUp");
      const reverse = pressed.has("KeyS") || pressed.has("ArrowDown");
      const left = pressed.has("KeyA") || pressed.has("ArrowLeft");
      const right = pressed.has("KeyD") || pressed.has("ArrowRight");

      input.current.throttle = Number(accelerate) - Number(reverse);
      input.current.steer = Number(left) - Number(right);
      updateReverseAlarm();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!enabledRef.current || !DRIVING_KEYS.has(event.code)) {
        return;
      }

      if (isEditableTarget(event.target)) {
        pressedKeys.current.delete(event.code);
        updateInput();
        return;
      }

      event.preventDefault();
      pressedKeys.current.add(event.code);

      if (event.code === "Space" && !event.repeat) {
        queueHandbrakePulse(input.current);
      }

      updateInput();
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (!enabledRef.current || !DRIVING_KEYS.has(event.code)) {
        return;
      }

      if (isEditableTarget(event.target)) {
        pressedKeys.current.delete(event.code);
        updateInput();
        return;
      }

      event.preventDefault();
      pressedKeys.current.delete(event.code);
      updateInput();
    };

    const clearInput = () => {
      pressedKeys.current.clear();
      input.current = createDrivingInput();
      stopReverseAlarm();
      updateInput();
    };

    window.addEventListener("keydown", handleKeyDown, { passive: false });
    window.addEventListener("keyup", handleKeyUp, { passive: false });
    window.addEventListener("blur", clearInput);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", clearInput);
      stopReverseAlarm();
      const audioContext = reverseAlarmContext.current;
      reverseAlarmContext.current = null;
      void audioContext?.close();
    };
  }, []);

  return input;
}
