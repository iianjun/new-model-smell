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

  enabledRef.current = enabled;

  useEffect(() => {
    if (enabled) {
      return;
    }

    pressedKeys.current.clear();
    input.current = createDrivingInput();
  }, [enabled]);

  useEffect(() => {
    pressedKeys.current.clear();
    input.current = createDrivingInput();

    const updateInput = () => {
      if (!enabledRef.current) {
        input.current = createDrivingInput();
        return;
      }

      const pressed = pressedKeys.current;
      const accelerate = pressed.has("KeyW") || pressed.has("ArrowUp");
      const reverse = pressed.has("KeyS") || pressed.has("ArrowDown");
      const left = pressed.has("KeyA") || pressed.has("ArrowLeft");
      const right = pressed.has("KeyD") || pressed.has("ArrowRight");

      input.current.throttle = Number(accelerate) - Number(reverse);
      input.current.steer = Number(left) - Number(right);
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
      updateInput();
    };

    window.addEventListener("keydown", handleKeyDown, { passive: false });
    window.addEventListener("keyup", handleKeyUp, { passive: false });
    window.addEventListener("blur", clearInput);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", clearInput);
    };
  }, []);

  return input;
}
