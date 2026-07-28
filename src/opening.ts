import { MathUtils } from "three";

export type OpeningEntry = "full" | "reduced";

export type OpeningStage = "detected" | "inhale" | "sneeze" | "wake";

export const INITIAL_OPENING_STAGE: OpeningStage = "inhale";

const NOSE_BACKWARD_SPEED = 7.2;
const NOSE_LIFT_SPEED = 6;
const NOSE_GRAVITY = 3.5;
const NOSE_TUMBLE_SPEED = 0.92;
export const NOSE_REST_POSITION_Y = 1.55;
export const NOSE_SNEEZE_MOTION_SECONDS = 2.5;

export type NoseSneezeTransform = {
  positionY: number;
  positionZ: number;
  rotationX: number;
  scale: [number, number, number];
};

export function getNoseSneezeTransform(sneezeAge: number): NoseSneezeTransform {
  const age = MathUtils.clamp(
    Math.max(sneezeAge, 0),
    0,
    NOSE_SNEEZE_MOTION_SECONDS,
  );

  if (age === 0) {
    return {
      positionY: NOSE_REST_POSITION_Y,
      positionZ: 0,
      rotationX: 0,
      scale: [1, 1, 1],
    };
  }

  return {
    positionY:
      NOSE_REST_POSITION_Y +
      NOSE_LIFT_SPEED * age -
      (NOSE_GRAVITY * age ** 2) / 2,
    positionZ: -NOSE_BACKWARD_SPEED * age,
    rotationX: -NOSE_TUMBLE_SPEED * age,
    scale: [1, 1, 1],
  };
}
