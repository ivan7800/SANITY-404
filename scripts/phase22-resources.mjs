/** Verify an observed tonic transition without changing game state. */
export function tonicConsumption(before, after) {
  const remaining = before.tonics.slice(1);
  const exactlyOneRemoved =
    before.tonics.length > 0 &&
    after.tonics.length === remaining.length &&
    after.tonics.every((tonic, index) => tonic === remaining[index]);
  const healthEffect =
    before.health < 100 &&
    after.health > before.health &&
    after.health <= Math.min(100, before.health + 40);
  const sanityEffect =
    before.sanity < 100 &&
    after.sanity > before.sanity &&
    after.sanity <= Math.min(100, before.sanity + 25);
  return {
    passed: exactlyOneRemoved && (healthEffect || sanityEffect),
    exactlyOneRemoved,
    healthEffect,
    sanityEffect,
  };
}
