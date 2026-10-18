import type { SpotLight } from "three";
/** Ignore sub-centimetre idle breathing; redraw for movement, pose, visibility or combat. */
export class ShadowBudget {
  private dirty = true;
  private last = -Infinity;
  constructor(private quality: number) {}
  mark(changed: boolean) {
    this.dirty ||= changed;
  }
  apply(light: SpotLight, timeMs: number) {
    if (!light.castShadow || !this.dirty) return false;
    if (this.quality !== 1.6 && timeMs - this.last < 32) return false;
    light.shadow.needsUpdate = true;
    this.dirty = false;
    this.last = timeMs;
    return true;
  }
}
