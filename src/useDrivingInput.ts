import { useEffect, useRef } from "react";

export type DrivingInput = {
  handbrake: boolean;
  steer: number;
  throttle: number;
};

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

export function useDrivingInput() {
  const input = useRef<DrivingInput>({
    handbrake: false,
    steer: 0,
    throttle: 0,
  });
  const pressedKeys = useRef(new Set<string>());
  const handbrakeUntil = useRef(0);
  const handbrakeTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const updateInput = () => {
      const pressed = pressedKeys.current;
      const accelerate = pressed.has("KeyW") || pressed.has("ArrowUp");
      const reverse = pressed.has("KeyS") || pressed.has("ArrowDown");
      const left = pressed.has("KeyA") || pressed.has("ArrowLeft");
      const right = pressed.has("KeyD") || pressed.has("ArrowRight");

      input.current.throttle = Number(accelerate) - Number(reverse);
      input.current.steer = Number(left) - Number(right);
      input.current.handbrake = performance.now() < handbrakeUntil.current;
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!DRIVING_KEYS.has(event.code) || isEditableTarget(event.target)) {
        return;
      }

      event.preventDefault();
      pressedKeys.current.add(event.code);

      if (event.code === "Space" && !event.repeat) {
        handbrakeUntil.current = performance.now() + 520;
        window.clearTimeout(handbrakeTimer.current);
        handbrakeTimer.current = window.setTimeout(updateInput, 530);
      }

      updateInput();
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (!DRIVING_KEYS.has(event.code) || isEditableTarget(event.target)) {
        return;
      }

      event.preventDefault();
      pressedKeys.current.delete(event.code);
      updateInput();
    };

    const clearInput = () => {
      pressedKeys.current.clear();
      handbrakeUntil.current = 0;
      window.clearTimeout(handbrakeTimer.current);
      updateInput();
    };

    window.addEventListener("keydown", handleKeyDown, { passive: false });
    window.addEventListener("keyup", handleKeyUp, { passive: false });
    window.addEventListener("blur", clearInput);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", clearInput);
      window.clearTimeout(handbrakeTimer.current);
    };
  }, []);

  return input;
}
