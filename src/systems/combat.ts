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
export function canSeeTarget(
  enemy: T.Group,
  player: T.Group,
  obstacles: Obstacle[],
  range: number,
  halfAngle = Math.PI * 0.4,
) {
  const direction = player.position.clone().sub(enemy.position).setY(0);
  const distance = direction.length();
  if (
    distance > range ||
    !strikeClear(enemy.position, player.position, obstacles)
  )
    return false;
  if (distance < 2.2) return true; // A nearby opponent is visible at the edge of the frame.
  const forward = enemy.getWorldDirection(new T.Vector3()).setY(0).normalize();
  return forward.dot(direction.divideScalar(distance)) >= Math.cos(halfAngle);
}
export function inAttackArc(
  enemy: T.Group,
  player: T.Group,
  halfAngle = Math.PI * 0.38,
) {
  const direction = player.position.clone().sub(enemy.position).setY(0);
  if (direction.lengthSq() < 0.001) return true;
  direction.normalize();
  return (
    enemy
      .getWorldDirection(new T.Vector3())
      .setY(0)
      .normalize()
      .dot(direction) >= Math.cos(halfAngle)
  );
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
  private patrolOrigin?: T.Vector3;
  private searchTime = 0;
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
  windupDuration = 0.42;
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
    // windup belongs to the enemy's telegraphed attack; the player must be
    // able to dodge that attack unless their own strike or stagger prevents it.
    if (
      this.stamina < 25 ||
      this.dodge > 0 ||
      this.animation > 0 ||
      this.hurt > 0
    )
      return false;
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
    this.stamina = clamp(this.stamina + dt * (guard ? -7 : 18));
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
          this.windup = 0;
          this.enemyCooldown = Math.max(this.enemyCooldown, 0.55);
          if (this.aiState !== "dead") this.aiState = "recover";
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
    this.updateEnemyAI(
      dt,
      state,
      player,
      enemy,
      obstacles,
      noise,
      onSound,
      onMessage,
    );
  }
  private updateEnemyAI(
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
    this.patrolOrigin ??= enemy.position.clone();
    if (this.kind === "guardian" && this.health <= 75) this.phase = 2;
    this.vulnerable = Math.max(0, this.vulnerable - dt);
    const seen = canSeeTarget(
      enemy,
      player,
      obstacles,
      this.kind === "stalker" ? 5.5 : this.kind === "centurion" ? 8 : 7,
      this.kind === "plagueScribe" ? Math.PI * 0.3 : Math.PI * 0.4,
    );
    if (seen) {
      this.lastSeen.copy(player.position);
      this.lost =
        this.kind === "stalker" ? 1.6 : this.kind === "centurion" ? 4 : 3;
      this.searchTime = 3;
      if (this.aiState === "patrol" || this.aiState === "investigate")
        this.aiState = "chase";
    } else if (
      noise > 0.5 &&
      dist < (this.kind === "plagueScribe" ? 10 : 8) &&
      this.aiState === "patrol"
    ) {
      this.lastSeen.copy(player.position);
      this.aiState = "investigate";
      this.searchTime = this.kind === "centurion" ? 5 : 3;
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
          inAttackArc(
            enemy,
            player,
            this.kind === "guardian" ? Math.PI * 0.48 : Math.PI * 0.38,
          ) &&
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
                      : this.kind === "shade"
                        ? 12
                        : 9;
            damage(
              state,
              this.guarding
                ? Math.ceil(amount * (this.kind === "shade" ? 0.25 : 0.28))
                : amount,
            );
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
        this.enemyCooldown = this.kind === "stalker" ? 0.9 : 1.2;
      }
    } else if (this.vulnerable > 0) this.aiState = "vulnerable";
    else if (this.aiState === "recover" && this.enemyCooldown > 0) {
      // A committed attack has recovery; detection and investigation do not.
    } else if (
      seen &&
      this.enemyHurt <= 0 &&
      dist < (this.kind === "guardian" ? 2.15 : 1.45) &&
      this.enemyCooldown <= 0
    ) {
      this.longAttack = this.kind === "guardian" && this.attacks++ % 2 === 0;
      this.windup =
        this.kind === "stalker"
          ? 0.44
          : this.kind === "shade"
            ? 0.42
            : this.kind === "plagueScribe"
              ? 0.72
              : this.kind === "centurion"
                ? 0.8
                : this.kind === "ritual"
                  ? 0.68
                  : this.longAttack
                    ? 0.9
                    : 0.5;
      this.windupDuration = this.windup;
      enemy.lookAt(player.position); // Lock the strike direction at the visible tell.
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
                : this.kind === "shade"
                  ? "La sombra levanta las garras. Puedes defenderte."
                  : "Algo salta desde las sombras.",
      );
    } else {
      if (this.aiState === "recover" || this.aiState === "vulnerable")
        this.aiState = seen ? "chase" : "investigate";
      let target = this.lastSeen;
      if (this.aiState === "patrol") {
        target = this.patrolOrigin
          .clone()
          .add(new T.Vector3(this.patrolSide * 2.4, 0, 0));
        if (enemy.position.distanceTo(target) < 0.5) this.patrolSide *= -1;
      } else if (this.aiState === "investigate" && !seen) {
        if (enemy.position.distanceTo(target) < 0.6) this.searchTime -= dt;
        if (this.searchTime <= 0) this.aiState = "patrol";
      }
      if (this.kind !== "guardian" || seen || this.aiState === "investigate") {
        const vector = target.clone().sub(enemy.position).setY(0);
        if (vector.length() > 0.35) {
          vector
            .normalize()
            .multiplyScalar(
              dt *
                (this.kind === "stalker"
                  ? 1.65
                  : this.kind === "shade"
                    ? 0.85 + state.room * 0.08
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
          if (next.x === enemy.position.x && next.z === enemy.position.z) {
            const side = move(
              enemy.position.x,
              enemy.position.z,
              -vector.z,
              vector.x,
              obstacles,
            );
            enemy.position.set(side.x, 0, side.z);
          } else enemy.position.set(next.x, 0, next.z);
          enemy.lookAt(target);
        }
      }
    }
    animateCharacter(
      enemy,
      state.elapsed,
      this.aiState === "chase" ||
        this.aiState === "patrol" ||
        this.aiState === "investigate",
      this.windup > 0
        ? 0.3 - 0.15 * (1 - this.windup / this.windupDuration)
        : 0,
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
