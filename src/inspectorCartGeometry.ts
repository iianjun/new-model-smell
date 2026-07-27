export const INSPECTOR_CART_COLLIDER_CENTER_Y = -0.07;
export const INSPECTOR_CART_COLLIDER_HALF_HEIGHT = 0.5;
export const INSPECTOR_CART_WHEEL_CENTER_Y = -0.27;
export const INSPECTOR_CART_WHEEL_RADIUS = 0.3;

export function getInspectorCartWheelGroundClearance() {
  const colliderBottom =
    INSPECTOR_CART_COLLIDER_CENTER_Y - INSPECTOR_CART_COLLIDER_HALF_HEIGHT;
  const wheelBottom =
    INSPECTOR_CART_WHEEL_CENTER_Y - INSPECTOR_CART_WHEEL_RADIUS;

  return wheelBottom - colliderBottom;
}
