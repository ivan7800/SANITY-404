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
  private upperDoors: T.Object3D[] = [];
  private shadow?: T.Mesh;
  private shadowVanished = false;
  private shadowCue = false;
  private nextKnock = 13;
  private knocks = 0;
  private dissonancePlayed = false;
  private lastKind = "";
  constructor(private world: World) {
    this.initialLights = world.lights.map((light) => light.intensity);
    this.door = world.objects.find((object) => object.kind === "door")?.mesh;
    this.doorAngle = this.door?.rotation.y ?? 0;
    if (world.room === 0) {
      this.upperDoors = ["upper-door-portraits", "upper-door-observatory"]
        .map((name) => world.scene.getObjectByName(name))
        .filter((door): door is T.Object3D => !!door);
      const shape = new T.Shape();
      shape.moveTo(-0.36, -0.9);
      shape.lineTo(-0.39, -0.17);
      shape.lineTo(-0.31, 0.35);
      shape.lineTo(-0.16, 0.48);
      shape.lineTo(-0.15, 0.73);
      shape.quadraticCurveTo(-0.13, 0.94, 0.02, 0.96);
      shape.quadraticCurveTo(0.19, 0.94, 0.17, 0.68);
      shape.lineTo(0.14, 0.45);
      shape.lineTo(0.35, 0.23);
      shape.lineTo(0.42, -0.84);
      shape.lineTo(0.08, -0.65);
      shape.lineTo(-0.36, -0.9);
      this.shadow = new T.Mesh(
        new T.ShapeGeometry(shape),
        new T.MeshBasicMaterial({
          color: 0x090b0d,
          transparent: true,
          opacity: 0,
          depthWrite: false,
          side: T.DoubleSide,
        }),
      );
      this.shadow.name = "gallery-false-shadow";
      this.shadow.position.set(-2.6, 3.57, -5.5);
      world.scene.add(this.shadow);
    }
  }
  update(
    dt: number,
    player: T.Object3D,
    enemy: T.Object3D,
    combat: Combat,
    audio: Audio,
    settings: Settings,
    elapsed: number,
    sanity = 100,
  ) {
    this.time += dt;
    const room = this.world.room;
    const upper = room === 0 && player.position.y > 1.6;
    const kind = combat.kind;
    if (kind !== this.lastKind) {
      this.lastKind = kind;
      this.encounterPlayed = false;
      this.anticipationPlayed = false;
    }
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
    if (
      !this.investigated &&
      ["investigate", "suspect", "search"].includes(combat.aiState)
    ) {
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
      if (kind === "widow") audio.lament(pan);
    }
    if (
      upper &&
      this.time >= this.nextKnock &&
      this.knocks < 4 &&
      combat.aiState !== "windup"
    ) {
      const side = this.knocks % 2 ? -0.75 : 0.75;
      if (this.knocks % 2 === 0) {
        audio.directional(73 + this.knocks * 11, side, 0.13);
        audio.directional(54 + this.knocks * 7, side, 0.24);
      } else {
        for (let step = 0; step < 3; step++)
          audio.directional(
            62 + step * 8,
            side - step * 0.12,
            0.09,
            step * 0.17,
          );
      }
      this.knocks++;
      this.nextKnock = this.time + 14 + this.knocks * 5;
      this.reaction = 0.65;
    }
    if (upper && sanity < 35 && !this.dissonancePlayed) {
      this.dissonancePlayed = true;
      audio.directional(41, pan, 1.1);
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
    for (const door of this.upperDoors) {
      const distance = Math.hypot(
        door.position.x - enemy.position.x,
        door.position.z - enemy.position.z,
      );
      const presence =
        upper && enemy.visible && distance < 3.4 ? 1 - distance / 3.4 : 0;
      door.rotation.y =
        -0.8 +
        (settings.reduced
          ? 0
          : Math.sin(this.time * 3.2 + door.position.x) * presence * 0.12);
    }
    if (this.shadow) {
      const distance = player.position.distanceTo(this.shadow.position);
      if (distance < 2.6 && upper) this.shadowVanished = true;
      const visible =
        upper &&
        !this.shadowVanished &&
        this.time > 5 &&
        this.time < 24 &&
        distance > 2.6 &&
        distance < 8 &&
        kind !== "nameRoot";
      if (visible && !this.shadowCue) {
        this.shadowCue = true;
        audio.directional(42, -0.5, 0.7);
      }
      (this.shadow.material as T.MeshBasicMaterial).opacity =
        visible && !settings.reduced
          ? Math.min(0.22, Math.max(0, (distance - 2.6) * 0.05))
          : 0;
      this.shadow.rotation.y = Math.sin(this.time * 0.25) * 0.15;
    }
    for (let i = 0; i < this.world.lights.length; i++) {
      const light = this.world.lights[i];
      const reduction = settings.reduceFlashes ? 0 : this.pulse * 0.075;
      light.intensity *=
        (1 - reduction) * (1 - (Math.max(0, 35 - sanity) / 35) * 0.12);
    }
  }
  restore() {
    if (this.door) this.door.rotation.y = this.doorAngle;
    for (const door of this.upperDoors) door.rotation.y = -0.8;
    if (this.shadow) {
      this.world.scene.remove(this.shadow);
      this.shadow.geometry.dispose();
      (this.shadow.material as T.Material).dispose();
    }
    this.world.lights.forEach(
      (light, i) => (light.intensity = this.initialLights[i]),
    );
  }
}
