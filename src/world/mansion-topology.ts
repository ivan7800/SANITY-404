/** Shared footprint of the stair's upper landing. The floor changes only at
 * its south edge; approaching through the side rail is not a valid ascent. */
export const MANSION_LANDING = {
  minX: 3.72,
  maxX: 6.28,
  topZ: -5.11,
  backZ: -6.48,
} as const;

export function onMansionLanding(x: number, z: number) {
  return (
    x > MANSION_LANDING.minX &&
    x < MANSION_LANDING.maxX &&
    z <= MANSION_LANDING.topZ &&
    z >= MANSION_LANDING.backZ
  );
}

/** Ground-floor routes must not shortcut through a different floor. This is
 * a topological routing boundary, never a physical obstacle in the game. */
export const MANSION_GROUND_ROUTE_BARRIER = {
  id: "mansion-upper-landing-route-boundary",
  x: (MANSION_LANDING.minX + MANSION_LANDING.maxX) / 2,
  z: (MANSION_LANDING.topZ + MANSION_LANDING.backZ) / 2,
  w: MANSION_LANDING.maxX - MANSION_LANDING.minX,
  d: MANSION_LANDING.topZ - MANSION_LANDING.backZ,
};
