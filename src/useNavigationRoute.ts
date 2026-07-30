import { useCallback, useRef } from "react";
import type { WorldPosition } from "./flagshipLineup.js";

type NavigationWaypoint = {
  index: number;
  targetPosition: WorldPosition;
};

export function useNavigationRoute(
  initialWaypointIndex: number,
  getWaypoint: (
    position: WorldPosition,
    currentIndex: number,
  ) => NavigationWaypoint,
) {
  const waypointIndex = useRef(initialWaypointIndex);
  const getWaypointRef = useRef(getWaypoint);
  getWaypointRef.current = getWaypoint;

  return useCallback((position: WorldPosition) => {
    const waypoint = getWaypointRef.current(position, waypointIndex.current);
    waypointIndex.current = waypoint.index;

    return waypoint.targetPosition;
  }, []);
}
