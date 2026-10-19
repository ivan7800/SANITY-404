import * as T from "three";
import { animateCharacter } from "../world/character";
import {
  animateEnemyStyle,
  enemyKindForRoom,
  type EnemyKind,
} from "../world/enemies";
import { clamp, damage, move, type State, type Obstacle } from "./state";
/** Segment/AABB at chest height: low carpets do not block a strike, furniture does. */
export function strikeClear(a: T.Vector3, b: T.Vector3, obstacles: Obstacle[]) {
  const start = a.clone().setY(1.05),
    end = b.clone().setY(1.05);
  const delta = end.clone().sub(start),
    length = delta.length();
  if (length < 0.001) return true;
  const ray = new T.Ray(start, delta.normalize()),
    hit = new T.Vector3();
  return !obstacles.some((o) => {
    const box = new T.Box3(
      new T.Vector3(o.x - o.w / 2, 0, o.z - o.d / 2),
      new T.Vector3(o.x + o.w / 2, o.height ?? 2, o.z + o.d / 2),
    );
    return !!ray.intersectBox(box, hit) && hit.distanceTo(start) <= length;
  });
}
export class Combat {
  kind: EnemyKind;
  aiState:
    | "patrol"
    | "investigate"
    | "chase"
    | "windup"
    | "recover"
    | "vulnerable"
    | "dead" = "patrol";
  phase = 1;
  stamina = 100;
  dodge = 0;
  vulnerable = 0;
  private lost = 0;
  private patrolSide = 1;
  private lastSeen = new T.Vector3(0, 0, -2);
  private attacks = 0;
  private longAttack = false;
  enemyHurt = 0;
  impact = 0;
  health = 60;
  enemyCooldown = 1;
  attackCooldown = 0;
  animation = 0;
  windup = 0;
  hurt = 0;
  guarding = false;
  constructor(room: number) {
    this.kind = enemyKindForRoom(room);
    this.health =
      this.kind === "guardian"
        ? 150
        : this.kind === "centurion"
          ? 115
          : this.kind === "plagueScribe"
            ? 85
          : this.kind === "ritual"
            ? 105
            : this.kind === "stalker"
              ? 75
              : 60 + room * 10;
  }
  startDodge() {
    if (this.stamina < 25 || this.dodge > 0) return false;
    this.stamina -= 25;
    this.dodge = 0.32;
    return true;
  }
  update(
    dt: number,
    state: State,
    player: T.Group,
    enemy: T.Group,
    obstacles: Obstacle[],
    attack: boolean,
    onSound: (frequency: number, duration: number) => void,
    onMessage: (text: string) => void,
    guard = false,
    heavy = false,
    noise = 0,
  ) {
    this.stamina = clamp(this.stamina + dt * (guard ? 4 : 18));
    this.guarding = guard && this.stamina > 0;
    this.dodge = Math.max(0, this.dodge - dt);
    this.enemyHurt = Math.max(0, this.enemyHurt - dt);
    this.impact = Math.max(0, this.impact - dt);
    this.hurt = Math.max(0, this.hurt - dt);
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.enemyCooldown -= dt;
    this.animation = Math.max(0, this.animation - dt);
    if (
      (attack || heavy) &&
      !guard &&
      this.attackCooldown === 0 &&
      (!heavy || this.stamina >= 35)
    ) {
      if (heavy) this.stamina -= 35;
      this.attackCooldown = heavy ? 1.05 : 0.65;
      this.animation = 0.3;
      onSound(heavy ? 115 : 150, heavy ? 0.24 : 0.15);
      const delta = enemy.position.clone().sub(player.position).setY(0);
      const facing = new T.Vector3(
        Math.sin(player.rotation.y),
        0,
        Math.cos(player.rotation.y),
      );
      if (
        enemy.visible &&
        delta.length() < (heavy ? 2.1 : 1.9) &&
        facing.dot(delta.normalize()) > -0.15 &&
        strikeClear(player.position, enemy.position, obstacles)
      ) {
        const exposed = this.kind !== "guardian" || this.vulnerable > 0;
        if (!exposed) {
          onSound(340, 0.16);
          onMessage(
            "La coraza del guardián resiste. Ataca tras su embestida larga.",
          );
        } else {
          const amount =
            this.kind === "ritual" && !heavy ? 18 : heavy ? 50 : 30;
          this.health -= amount;
          if (this.kind === "guardian") this.vulnerable = 0;
        }
        if (exposed) {
          this.enemyHurt = 0.35;
          this.impact = 0.18;
          onSound(92, 0.12);
          state.sanity = clamp(state.sanity + 2);
          const knock = enemy.position
            .clone()
            .sub(player.position)
            .normalize()
            .multiplyScalar(0.4);
          const p = move(
            enemy.position.x,
            enemy.position.z,
            knock.x,
            knock.z,
            obstacles,
          );
          enemy.position.set(p.x, 0, p.z);
          if (this.health <= 0) {
            enemy.visible = false;
            this.aiState = "dead";
            state.defeated.push("enemy" + state.room);
            onMessage(
              this.kind === "guardian"
                ? "Étienne recuerda su nombre. El umbral cede."
                : "La sombra se deshace. La casa guarda silencio.",
            );
          }
        }
      }
    }
    if (!enemy.visible) {
      state.sanity = clamp(state.sanity + dt * 0.35);
      return;
    }
    if (this.kind !== "shade") {
      this.updatePhase2AI(
        dt,
        state,
        player,
        enemy,
        obstacles,
        noise,
        onSound,
        onMessage,
      );
      return;
    }
    const dist = enemy.position.distanceTo(player.position);
    if (dist < 8 && dist > 1.1) {
      const d = player.position
        .clone()
        .sub(enemy.position)
        .normalize()
        .multiplyScalar((0.85 + state.room * 0.08) * dt);
      let p = move(enemy.position.x, enemy.position.z, d.x, d.z, obstacles);
      if (Math.hypot(p.x - enemy.position.x, p.z - enemy.position.z) < 0.001) {
        p = move(enemy.position.x, enemy.position.z, -d.z, d.x, obstacles);
      }
      enemy.position.set(p.x, 0, p.z);
      enemy.lookAt(player.position);
    }
    if (this.windup > 0) {
      this.windup -= dt;
      if (this.windup <= 0) {
        if (
          dist < 1.8 &&
          strikeClear(enemy.position, player.position, obstacles)
        ) {
          if (this.dodge > 0) {
            onMessage("Esquivas las garras por un instante.");
          } else damage(state, this.guarding ? 3 : 12);
          this.hurt = 0.3;
          onSound(this.guarding ? 200 : 48, 0.25);
          onMessage(
            this.guarding
              ? "Desvías el golpe. La defensa amortigua el daño."
              : "La sombra te alcanza. Mantén F / LB para defender.",
          );
        }
        this.enemyCooldown = 1.5;
      }
    } else if (
      dist < 1.5 &&
      this.enemyCooldown <= 0 &&
      strikeClear(enemy.position, player.position, obstacles)
    ) {
      this.windup = 0.42;
      onMessage("La sombra levanta las garras…");
    }
    animateCharacter(
      enemy,
      state.elapsed,
      dist > 1.5,
      this.windup > 0 ? 0.3 * (1 - this.windup / 0.42) : 0,
      false,
      this.enemyHurt,
      false,
      dt,
    );
    if (dist < 5) state.sanity = clamp(state.sanity - dt * 0.6);
  }
  private updatePhase2AI(
    dt: number,
    state: State,
    player: T.Group,
    enemy: T.Group,
    obstacles: Obstacle[],
    noise: number,
    onSound: (frequency: number, duration: number) => void,
    onMessage: (text: string) => void,
  ) {
    const dist = enemy.position.distanceTo(player.position);
    if (this.kind === "guardian" && this.health <= 75) this.phase = 2;
    this.vulnerable = Math.max(0, this.vulnerable - dt);
    if (dist > 10) {
      animateCharacter(
        enemy,
        state.elapsed,
        false,
        0,
        false,
        this.enemyHurt,
        false,
        dt,
      );
      return;
    }
    const seen =
      dist < (this.kind === "stalker" ? 5.5 : 7) &&
      strikeClear(enemy.position, player.position, obstacles);
    if (seen) {
      this.lastSeen.copy(player.position);
      this.lost = this.kind === "stalker" ? 1.6 : 3;
      if (this.aiState === "patrol" || this.aiState === "investigate")
        this.aiState = "chase";
    } else if (noise > 0.5 && dist < 8 && this.aiState === "patrol") {
      this.lastSeen.copy(player.position);
      this.aiState = "investigate";
    } else if (this.aiState === "chase") {
      this.lost -= dt;
      if (this.lost <= 0) this.aiState = "investigate";
    }
    if (this.windup > 0) {
      this.aiState = "windup";
      this.windup -= dt;
      if (this.windup <= 0) {
        const reach = this.kind === "guardian" ? 2.35 : 1.8;
        if (
          dist < reach &&
          strikeClear(enemy.position, player.position, obstacles)
        ) {
          if (this.dodge > 0) onMessage("Esquivas el ataque.");
          else {
            const amount =
              this.kind === "plagueScribe"
                ? 13
              : this.kind === "centurion"
                ? 17
                : this.kind === "guardian"
                  ? this.longAttack
                    ? 24
                    : 16
                  : this.kind === "ritual"
                    ? 14
                    : 9;
            damage(state, this.guarding ? Math.ceil(amount * 0.28) : amount);
            if (this.kind === "ritual") state.sanity = clamp(state.sanity - 7);
            this.hurt = 0.32;
            onSound(this.guarding ? 210 : 55, 0.28);
            onMessage(
              this.guarding
                ? "Desvías parte del impacto."
                : "La criatura te alcanza.",
            );
          }
        }
        if (this.kind === "guardian" && this.longAttack) {
          this.vulnerable = this.phase === 2 ? 1.2 : 1.6;
          this.aiState = "vulnerable";
          onMessage("La coraza se abre. ¡Ahora!");
        } else this.aiState = "recover";
        this.enemyCooldown = this.kind === "stalker" ? 0.75 : 1.2;
      }
    } else if (this.vulnerable > 0) this.aiState = "vulnerable";
    else if (this.aiState === "recover" && this.enemyCooldown > 0) {
      // A committed attack has recovery; detection and investigation do not.
    } else if (
      seen &&
      dist < (this.kind === "guardian" ? 2.15 : 1.45) &&
      this.enemyCooldown <= 0
    ) {
      this.longAttack = this.kind === "guardian" && this.attacks++ % 2 === 0;
      this.windup =
        this.kind === "stalker"
          ? 0.28
          : this.kind === "plagueScribe"
            ? 0.72
          : this.kind === "centurion"
            ? 0.8
            : this.kind === "ritual"
              ? 0.68
              : this.longAttack
                ? 0.9
                : 0.5;
      this.aiState = "windup";
      onMessage(
        this.kind === "guardian"
          ? this.longAttack
            ? "Étienne prepara una embestida larga."
            : "Étienne barre el suelo con el brazo."
          : this.kind === "plagueScribe"
            ? "El copista susurra un nombre. Se prepara para atacar."
          : this.kind === "centurion"
            ? "El centurión marca el suelo con su hoja. ¡Prepárate!"
            : this.kind === "ritual"
              ? "La criatura traza un signo en el aire."
              : "Algo salta desde las sombras.",
      );
    } else {
      if (this.aiState === "recover" || this.aiState === "vulnerable")
        this.aiState = seen ? "chase" : "investigate";
      let target = this.lastSeen;
      if (this.aiState === "patrol") {
        target = new T.Vector3(this.patrolSide * 2.6, 0, -2.4);
        if (enemy.position.distanceTo(target) < 0.5) this.patrolSide *= -1;
      }
      if (this.kind !== "guardian" || seen) {
        const vector = target.clone().sub(enemy.position).setY(0);
        if (vector.length() > 0.35) {
          vector
            .normalize()
            .multiplyScalar(
              dt *
                (this.kind === "stalker"
                  ? 1.65
                  : this.kind === "ritual"
                    ? 1.05
                    : this.phase === 2
                      ? 1.35
                      : 0.9),
            );
          const next = move(
            enemy.position.x,
            enemy.position.z,
            vector.x,
            vector.z,
            obstacles,
          );
          enemy.position.set(next.x, 0, next.z);
          enemy.lookAt(target);
        } else if (this.aiState === "investigate") this.aiState = "patrol";
      }
    }
    animateCharacter(
      enemy,
      state.elapsed,
      this.aiState === "chase" || this.aiState === "patrol",
      this.windup > 0 ? 0.25 : 0,
      false,
      this.enemyHurt,
      this.kind === "stalker" && this.aiState === "chase",
      dt,
    );
    animateEnemyStyle(
      enemy,
      state.elapsed,
      this.kind,
      this.aiState,
      this.phase,
    );
    if (dist < 5)
      state.sanity = clamp(
        state.sanity - dt * (this.kind === "ritual" ? 1.1 : 0.6),
      );
  }
}
