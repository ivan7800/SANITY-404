import * as T from "three";
import type { World } from "../world/scene";
import type { Audio } from "./audio";
import type { Combat } from "./combat";
import type { Settings } from "./config";

/** Room-local, game-state driven cues. All changes live on existing scene objects. */
export class TerrorDirector {
  private time = 0;
  private entrancePlayed = false;
  private encounterPlayed = false;
  private anticipationPlayed = false;
  private investigated = false;
  private initialLights: number[];
  private door?: T.Object3D;
  private doorAngle = 0;
  private reaction = 0;
  private pulse = 0;
  constructor(private world: World) {
    this.initialLights = world.lights.map((light) => light.intensity);
    this.door = world.objects.find((object) => object.kind === "door")?.mesh;
    this.doorAngle = this.door?.rotation.y ?? 0;
  }
  update(
    dt: number,
    player: T.Object3D,
    enemy: T.Object3D,
    combat: Combat,
    audio: Audio,
    settings: Settings,
    elapsed: number,
  ) {
    this.time += dt;
    const room = this.world.room;
    const pan = Math.max(
      -1,
      Math.min(1, (enemy.position.x - player.position.x) / 6),
    );
    if (!this.entrancePlayed && this.time > 2.5) {
      this.entrancePlayed = true;
      audio.directional(
        room === 8 ? 145 : room >= 9 ? 115 : 90,
        room % 2 ? -0.7 : 0.7,
      );
      this.reaction = 0.9;
    }
    if (!this.investigated && combat.aiState === "investigate") {
      this.investigated = true;
      audio.directional(room >= 9 ? 220 : 125, pan);
      this.reaction = 0.7;
    }
    if (
      !this.anticipationPlayed &&
      enemy.visible &&
      enemy.position.distanceTo(player.position) < 6 &&
      combat.aiState === "patrol"
    ) {
      this.anticipationPlayed = true;
      audio.silence(elapsed, 2.2);
      this.pulse = 0.7;
    }
    if (
      !this.encounterPlayed &&
      enemy.visible &&
      (combat.aiState === "chase" || combat.aiState === "windup")
    ) {
      this.encounterPlayed = true;
      audio.silence(elapsed, 2.2);
      audio.directional(room === 8 ? 70 : room >= 9 ? 100 : 60, pan, 0.7);
      this.pulse = 1.6;
      this.reaction = 1.2;
    }
    this.reaction = Math.max(0, this.reaction - dt);
    this.pulse = Math.max(0, this.pulse - dt);
    if (this.door) {
      this.door.rotation.y =
        this.doorAngle +
        (settings.reduced
          ? 0
          : Math.sin(this.time * 9) * this.reaction * 0.035);
    }
    for (let i = 0; i < this.world.lights.length; i++) {
      const light = this.world.lights[i];
      const reduction = settings.reduceFlashes ? 0 : this.pulse * 0.075;
      light.intensity = this.initialLights[i] * (1 - reduction);
    }
  }
  restore() {
    if (this.door) this.door.rotation.y = this.doorAngle;
    this.world.lights.forEach(
      (light, i) => (light.intensity = this.initialLights[i]),
    );
  }
}
