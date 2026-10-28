import * as T from "three";
import { animateCharacter } from "../world/character";
import {
  animateEnemyStyle,
  enemyKindForRoom,
  type EnemyKind,
} from "../world/enemies";
import {
  blocked,
  clamp,
  damage,
  move,
  type State,
  type Obstacle,
} from "./state";
import { absorbVeil } from "./ritual";
import { mansionFloorHeight } from "../world/mansion";
import { mansionMove, upperWalkable } from "../world/mansion-navigation";
import { MANSION_GALLERY_Y } from "../world/mansion-topology";
import { actorPath, type PathPoint } from "./actor-path";
import { weaponProfileForRoom, type WeaponProfile } from "./weapons";
export type TargetZone = "torso" | "arms" | "head";
/** Segment/AABB at chest height: low carpets do not block a strike, furniture does. */
export function strikeClear(a: T.Vector3, b: T.Vector3, obstacles: Obstacle[]) {
  const start = a.clone().add(new T.Vector3(0, 1.05, 0)),
    end = b.clone().add(new T.Vector3(0, 1.05, 0));
  const delta = end.clone().sub(start),
    length = delta.length();
  if (length < 0.001) return true;
  const ray = new T.Ray(start, delta.normalize()),
    hit = new T.Vector3();
  return !obstacles.some((o) => {
    const box = new T.Box3(
      new T.Vector3(o.x - o.w / 2, o.y ?? 0, o.z - o.d / 2),
      new T.Vector3(o.x + o.w / 2, (o.y ?? 0) + (o.height ?? 2), o.z + o.d / 2),
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
function gazeToPlayer(enemy: T.Group, player: T.Group) {
  const angle =
    Math.atan2(
      player.position.x - enemy.position.x,
      player.position.z - enemy.position.z,
    ) - enemy.rotation.y;
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}
export class Combat {
  kind: EnemyKind;
  defeatedId: string;
  aiState:
    | "patrol"
    | "investigate"
    | "suspect"
    | "search"
    | "chase"
    | "windup"
    | "recover"
    | "retreat"
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
  private suspicionTime = 0;
  private lastSeen = new T.Vector3(0, 0, -2);
  private attacks = 0;
  private longAttack = false;
  private reflectionStep = 0;
  private guestUnseen = 0;
  private guestPose = 0;
  private guestPoseStep = 0;
  private crawlerJink = 0;
  private pursuitPath: PathPoint[] = [];
  private pursuitGoal?: PathPoint;
  private pathRetry = 0;
  /** Read-only QA view of the physical route; never changes AI decisions. */
  get routeDiagnostic() {
    return {
      waypoint: this.pursuitPath[0] ? { ...this.pursuitPath[0] } : null,
      remaining: this.pursuitPath.length,
      goal: this.pursuitGoal ? { ...this.pursuitGoal } : null,
      retrySeconds: this.pathRetry,
    };
  }
  enemyHurt = 0;
  impact = 0;
  health = 60;
  /** Read-only diagnostics; never affects damage or enemy decisions. */
  hitsReceived = 0;
  lastPlayerHit?: {
    elapsed: number;
    source: string;
    kind: EnemyKind;
    raw: number;
    applied: number;
    guarded: boolean;
    healthBefore: number;
    healthAfter: number;
  };
  enemyCooldown = 1;
  attackCooldown = 0;
  animation = 0;
  windup = 0;
  windupDuration = 0.42;
  hurt = 0;
  guarding = false;
  parryWindow = 0;
  crippled = 0;
  private guardWasDown = false;
  private readonly weapon: WeaponProfile;
  constructor(
    room: number,
    kind = enemyKindForRoom(room),
    defeatedId = "enemy" + room,
  ) {
    this.weapon = weaponProfileForRoom(room);
    this.kind = kind;
    this.defeatedId = defeatedId;
    this.health =
      this.kind === "nameRoot"
        ? 165
        : this.kind === "widow"
          ? 105
          : this.kind === "guest"
            ? 90
            : this.kind === "crawler"
              ? 70
              : this.kind === "wrongReflection"
                ? 78
                : this.kind === "guardian"
                  ? 150
                  : this.kind === "typesetter"
                    ? 92
                    : this.kind === "portrait"
                      ? 105
                      : this.kind === "automaton"
                        ? 118
                        : this.kind === "developerShade"
                          ? 96
                          : this.kind === "centurion"
                            ? 115
                            : this.kind === "mosaic"
                              ? 95
                              : this.kind === "drowned"
                                ? 88
                                : this.kind === "blindWatcher"
                                  ? 90
                                  : this.kind === "stoneworker"
                                    ? 110
                                    : this.kind === "wardKeeper"
                                      ? 100
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
    target: TargetZone = "torso",
    observed = false,
    mansionObstacles?: { ground: Obstacle[]; upper: Obstacle[] },
  ) {
    this.crippled = Math.max(0, this.crippled - dt);
    this.stamina = clamp(this.stamina + dt * (guard ? -7 : 18));
    this.guarding = guard && this.stamina > 0;
    if (this.guarding && !this.guardWasDown)
      this.parryWindow = this.weapon.parryWindow;
    else this.parryWindow = Math.max(0, this.parryWindow - dt);
    if (!this.guarding) this.parryWindow = 0;
    this.guardWasDown = this.guarding;
    this.dodge = Math.max(0, this.dodge - dt);
    this.enemyHurt = Math.max(0, this.enemyHurt - dt);
    this.impact = Math.max(0, this.impact - dt);
    this.hurt = Math.max(0, this.hurt - dt);
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.enemyCooldown -= dt;
    this.animation = Math.max(0, this.animation - dt);
    this.separateReflection(player, enemy, obstacles);
    if (
      (attack || heavy) &&
      !guard &&
      this.attackCooldown === 0 &&
      (!heavy || this.stamina >= this.weapon.heavyCost)
    ) {
      if (heavy) this.stamina -= this.weapon.heavyCost;
      this.attackCooldown = heavy
        ? this.weapon.heavyCooldown
        : this.weapon.lightCooldown;
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
        delta.length() <
          (heavy ? this.weapon.heavyReach : this.weapon.lightReach) &&
        facing.dot(delta.normalize()) > (target === "head" ? 0.5 : -0.15) &&
        strikeClear(player.position, enemy.position, obstacles)
      ) {
        const exposed =
          (this.kind !== "guardian" && this.kind !== "nameRoot") ||
          this.vulnerable > 0;
        if (!exposed) {
          onSound(340, 0.16);
          onMessage(
            this.kind === "nameRoot"
              ? "La corteza protege el corazón. Espera a que termine la barrida de raíces."
              : "La coraza del guardián resiste. Ataca tras su embestida larga.",
          );
        } else {
          const shielded =
            this.kind === "centurion" &&
            !heavy &&
            this.aiState !== "windup" &&
            this.aiState !== "recover" &&
            enemy
              .getWorldDirection(new T.Vector3())
              .setY(0)
              .normalize()
              .dot(
                player.position.clone().sub(enemy.position).setY(0).normalize(),
              ) > 0.25;
          const stoneArmor =
            this.kind === "stoneworker" && !heavy && this.aiState !== "recover";
          const lateArmor =
            (this.kind === "portrait" || this.kind === "automaton") &&
            !heavy &&
            this.vulnerable <= 0;
          const amount = shielded
            ? 12
            : stoneArmor
              ? 16
              : lateArmor
                ? this.kind === "automaton"
                  ? 14
                  : 18
                : this.kind === "ritual" && !heavy
                  ? 18
                  : heavy
                    ? 50
                    : 30;
          const directedAmount =
            target === "head"
              ? Math.ceil(amount * 1.25)
              : target === "arms"
                ? Math.ceil(amount * 0.8)
                : amount;
          this.health -= directedAmount;
          if (target === "arms") {
            this.crippled = 5;
            onMessage(
              "El brazo del enemigo cede. Su próximo golpe será más lento.",
            );
          } else if (target === "head") onMessage("Golpe preciso a la cabeza.");
          if (shielded)
            onMessage(
              "El escudo amortigua el corte. Golpea fuerte o castiga su recuperación.",
            );
          if (stoneArmor)
            onMessage(
              "La roca amortigua el golpe. Espera a que su fisura se abra o golpea fuerte.",
            );
          if (lateArmor)
            onMessage(
              this.kind === "automaton"
                ? "El bronce amortigua el golpe. Esquiva su carga y ataca durante la recuperación."
                : "El marco protege al retrato. Castiga su gesto o golpea fuerte.",
            );
          if (this.kind === "guardian" || this.kind === "nameRoot")
            this.vulnerable = 0;
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
          const widowLevel =
            this.kind === "widow" &&
            enemy.position.y >= MANSION_GALLERY_Y - 0.01 &&
            upperWalkable(enemy.position.x, enemy.position.z)
              ? 1
              : 0;
          const p: { x: number; z: number; level?: 0 | 1 } =
            this.kind === "widow" && mansionObstacles
              ? mansionMove(
                  enemy.position.x,
                  enemy.position.z,
                  knock.x,
                  knock.z,
                  widowLevel,
                  mansionObstacles.ground,
                  mansionObstacles.upper,
                )
              : move(
                  enemy.position.x,
                  enemy.position.z,
                  knock.x,
                  knock.z,
                  obstacles,
                );
          enemy.position.set(
            p.x,
            this.kind === "widow"
              ? mansionFloorHeight(
                  p.x,
                  p.z,
                  mansionObstacles ? (p.level ?? widowLevel) : 0,
                )
              : enemy.position.y,
            p.z,
          );
          if (this.health <= 0) {
            enemy.visible = false;
            this.aiState = "dead";
            if (!state.defeated.includes(this.defeatedId))
              state.defeated.push(this.defeatedId);
            onMessage(
              this.kind === "guardian"
                ? "Étienne recuerda su nombre. El umbral cede."
                : this.kind === "centurion"
                  ? "El centurión cae; su escudo deja al descubierto la tablilla."
                  : this.kind === "typesetter"
                    ? "Los tipos caen al suelo; la plancha queda libre."
                    : this.kind === "portrait"
                      ? "El retrato vuelve al marco sin borrar a Inés."
                      : this.kind === "automaton"
                        ? "La cuerda del autómata se detiene."
                        : this.kind === "developerShade"
                          ? "La sombra se separa de la placa fijada."
                          : this.kind === "nameRoot"
                            ? "La raíz suelta los nombres que retenía."
                            : this.kind === "wrongReflection"
                              ? "El reflejo vuelve a imitar tus movimientos."
                              : this.kind === "widow"
                                ? "La viuda se retira del rellano."
                                : this.kind === "crawler"
                                  ? "El reptante se esconde entre las tablas."
                                  : this.kind === "guest"
                                    ? "El huésped permanece inmóvil por última vez."
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
      observed,
      mansionObstacles,
    );
    this.separateReflection(player, enemy, obstacles);
  }
  /** Keep the double visible beside Élise without changing attack reach or sanity. */
  private separateReflection(
    player: T.Group,
    enemy: T.Group,
    obstacles: Obstacle[],
  ) {
    if (
      this.kind !== "wrongReflection" ||
      !enemy.visible ||
      Math.abs(enemy.position.y - player.position.y) > 0.8
    )
      return;
    const dx = enemy.position.x - player.position.x;
    const dz = enemy.position.z - player.position.z;
    const distance = Math.hypot(dx, dz);
    const minimum = 1.35;
    if (distance >= minimum) return;
    const bearing =
      distance > 0.001 ? Math.atan2(dz, dx) : player.rotation.y + Math.PI / 2;
    for (const offset of [
      0,
      Math.PI / 4,
      -Math.PI / 4,
      Math.PI / 2,
      -Math.PI / 2,
      (3 * Math.PI) / 4,
      (-3 * Math.PI) / 4,
      Math.PI,
    ]) {
      const angle = bearing + offset;
      const x = player.position.x + Math.cos(angle) * minimum;
      const z = player.position.z + Math.sin(angle) * minimum;
      if (
        blocked(x, z, obstacles) ||
        (enemy.position.y > 1 && !upperWalkable(x, z)) ||
        !strikeClear(
          enemy.position,
          new T.Vector3(x, enemy.position.y, z),
          obstacles,
        )
      )
        continue;
      enemy.position.set(x, enemy.position.y, z);
      enemy.lookAt(player.position);
      return;
    }
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
    observed: boolean,
    mansionObstacles?: { ground: Obstacle[]; upper: Obstacle[] },
  ) {
    this.pathRetry = Math.max(0, this.pathRetry - dt);
    const dist = enemy.position.distanceTo(player.position);
    const mansionCreature = [
      "guest",
      "widow",
      "crawler",
      "wrongReflection",
      "nameRoot",
    ].includes(this.kind);
    if (this.kind === "guest" && observed && dist > 1) {
      // Hold the pose for the whole look. Small changes accumulate only while
      // the player has genuinely lost sight of the Guest.
      this.guestUnseen = 0;
      this.aiState = "patrol";
      this.windup = 0;
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
      animateEnemyStyle(
        enemy,
        state.elapsed,
        this.kind,
        "frozen",
        this.phase,
        0,
        this.guestPose,
        state.sanity,
      );
      return;
    }
    if (this.kind === "guest" && !observed) {
      this.guestUnseen += dt;
      if (this.guestUnseen >= 0.8) {
        this.guestUnseen = 0;
        this.guestPoseStep++;
        this.guestPose = [0, 0.18, -0.12, 0.32, -0.24][this.guestPoseStep % 5];
      }
    }
    if (this.kind === "wrongReflection") {
      this.reflectionStep += dt;
      const interval = state.sanity < 30 ? 3.2 : 5.2;
      if (this.reflectionStep > interval && dist > 2.8 && this.windup <= 0) {
        this.reflectionStep = 0;
        const x =
          player.position.x -
          Math.sin(player.rotation.y) * 2.5 +
          Math.cos(player.rotation.y) * 1.1;
        const z =
          player.position.z -
          Math.cos(player.rotation.y) * 2.5 -
          Math.sin(player.rotation.y) * 1.1;
        if (
          (!player.position.y || upperWalkable(x, z)) &&
          !blocked(x, z, obstacles)
        ) {
          enemy.position.set(x, player.position.y, z);
          enemy.lookAt(player.position);
          // The apparition can be examined or escaped before it can strike.
          this.enemyCooldown = Math.max(this.enemyCooldown, 1.6);
          onSound(207, 0.38);
          onMessage("Tu reflejo aparece donde acabas de dejar de mirar.");
        }
      }
    }
    this.patrolOrigin ??= enemy.position.clone();
    if (this.kind === "guardian" && this.health <= 75) this.phase = 2;
    if (this.kind === "nameRoot")
      this.phase = this.health <= 50 ? 3 : this.health <= 105 ? 2 : 1;
    this.vulnerable = Math.max(0, this.vulnerable - dt);
    const seen =
      this.kind === "blindWatcher"
        ? (dist < 1.8 || (noise > 0.5 && dist < 7)) &&
          strikeClear(enemy.position, player.position, obstacles)
        : canSeeTarget(
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
      if (["patrol", "investigate", "suspect", "search"].includes(this.aiState))
        this.aiState = "chase";
    } else if (
      noise > 0.5 &&
      dist <
        (this.kind === "plagueScribe" || this.kind === "drowned" ? 10 : 8) &&
      this.aiState === "patrol"
    ) {
      this.lastSeen.copy(player.position);
      this.aiState = mansionCreature ? "suspect" : "investigate";
      this.suspicionTime = 0.55;
      this.searchTime = this.kind === "centurion" ? 5 : 3;
    } else if (this.aiState === "chase") {
      this.lost -= dt;
      if (this.lost <= 0)
        this.aiState = mansionCreature ? "search" : "investigate";
    }
    if (this.aiState === "suspect" && !seen) {
      this.suspicionTime -= dt;
      if (this.suspicionTime <= 0) this.aiState = "search";
    }
    if (this.windup > 0) {
      this.aiState = "windup";
      this.windup -= dt;
      if (this.windup <= 0) {
        let parried = false;
        const reach =
          this.kind === "guardian" || this.kind === "nameRoot"
            ? 2.35
            : this.kind === "automaton"
              ? 2.05
              : 1.8;
        if (
          dist < reach &&
          inAttackArc(
            enemy,
            player,
            this.kind === "guardian" || this.kind === "nameRoot"
              ? Math.PI * 0.48
              : Math.PI * 0.38,
          ) &&
          strikeClear(enemy.position, player.position, obstacles)
        ) {
          if (this.dodge > 0) onMessage("Esquivas el ataque.");
          else if (this.guarding && this.parryWindow > 0) {
            parried = true;
            this.parryWindow = 0;
            this.vulnerable = 0.85;
            this.enemyHurt = 0.25;
            this.stamina = clamp(this.stamina - 12);
            state.sanity = clamp(state.sanity + 2);
            onSound(430, 0.18);
            onMessage(
              "Defensa precisa. El enemigo queda expuesto: contraataca.",
            );
          } else {
            const amount =
              this.kind === "nameRoot"
                ? this.phase === 3
                  ? 25
                  : 18
                : this.kind === "widow"
                  ? 17
                  : this.kind === "crawler"
                    ? 11
                    : this.kind === "wrongReflection"
                      ? 9
                      : this.kind === "guest"
                        ? 15
                        : this.kind === "plagueScribe"
                          ? 13
                          : this.kind === "typesetter"
                            ? 14
                            : this.kind === "portrait"
                              ? 16
                              : this.kind === "automaton"
                                ? 19
                                : this.kind === "developerShade"
                                  ? 15
                                  : this.kind === "mosaic"
                                    ? 15
                                    : this.kind === "drowned"
                                      ? 16
                                      : this.kind === "blindWatcher"
                                        ? 14
                                        : this.kind === "stoneworker"
                                          ? 18
                                          : this.kind === "wardKeeper"
                                            ? 15
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
            const incoming = this.guarding
              ? Math.ceil(amount * (this.kind === "shade" ? 0.25 : 0.28))
              : amount;
            const guarded = absorbVeil(state, incoming);
            const healthBefore = state.health;
            damage(state, guarded);
            this.hitsReceived++;
            this.lastPlayerHit = {
              elapsed: state.elapsed,
              source: this.defeatedId,
              kind: this.kind,
              raw: amount,
              applied: guarded,
              guarded: this.guarding,
              healthBefore,
              healthAfter: state.health,
            };
            if (guarded < incoming)
              onMessage("El velo ritual absorbe el impacto y se rompe.");
            if (this.kind === "typesetter" && !this.guarding)
              this.stamina = clamp(this.stamina - 12);
            const psychicDamage =
              this.kind === "wrongReflection"
                ? 10
                : this.kind === "nameRoot"
                  ? 7
                  : this.kind === "portrait" || this.kind === "developerShade"
                    ? this.guarding
                      ? 2
                      : 5
                    : this.kind === "mosaic" || this.kind === "wardKeeper"
                      ? 4
                      : this.kind === "drowned"
                        ? 5
                        : this.kind === "ritual"
                          ? 7
                          : 0;
            state.sanity = clamp(state.sanity - psychicDamage);
            this.hurt = 0.32;
            onSound(this.guarding ? 210 : 55, 0.28);
            onMessage(
              this.guarding
                ? "Desvías parte del impacto."
                : "La criatura te alcanza.",
            );
          }
        }
        if (
          (this.kind === "guardian" || this.kind === "nameRoot") &&
          this.longAttack
        ) {
          this.vulnerable = this.phase === 2 ? 1.2 : 1.6;
          this.aiState = "vulnerable";
          onMessage("La coraza se abre. ¡Ahora!");
        } else if (parried) {
          this.aiState = "vulnerable";
        } else if (this.kind === "portrait" || this.kind === "automaton") {
          this.vulnerable = this.kind === "automaton" ? 1.1 : 0.85;
          this.aiState = "vulnerable";
          onMessage(
            this.kind === "automaton"
              ? "El brazo mecánico queda abierto. ¡Ataca!"
              : "El retrato abandona el marco. ¡Ataca!",
          );
        } else this.aiState = this.kind === "crawler" ? "retreat" : "recover";
        this.enemyCooldown =
          this.kind === "crawler" ? 0.85 : this.kind === "stalker" ? 0.9 : 1.2;
      }
    } else if (this.vulnerable > 0) this.aiState = "vulnerable";
    else if (this.aiState === "recover" && this.enemyCooldown > 0) {
      // A committed attack has recovery; detection and investigation do not.
    } else if (
      seen &&
      this.enemyHurt <= 0 &&
      dist <
        (this.kind === "guardian" || this.kind === "nameRoot" ? 2.15 : 1.45) &&
      this.enemyCooldown <= 0
    ) {
      this.longAttack =
        (this.kind === "guardian" || this.kind === "nameRoot") &&
        this.attacks++ % 2 === 0;
      this.windup =
        this.kind === "guest"
          ? 0.88
          : this.kind === "widow"
            ? 0.92
            : this.kind === "crawler"
              ? 0.38
              : this.kind === "wrongReflection"
                ? 0.7
                : this.kind === "nameRoot"
                  ? this.phase === 3
                    ? 0.58
                    : this.longAttack
                      ? 1.0
                      : 0.8
                  : this.kind === "stalker"
                    ? 0.44
                    : this.kind === "shade"
                      ? 0.42
                      : this.kind === "plagueScribe"
                        ? 0.72
                        : this.kind === "typesetter"
                          ? 0.58
                          : this.kind === "portrait"
                            ? 0.83
                            : this.kind === "automaton"
                              ? 0.95
                              : this.kind === "developerShade"
                                ? 0.66
                                : this.kind === "mosaic"
                                  ? 0.66
                                  : this.kind === "drowned"
                                    ? 0.76
                                    : this.kind === "blindWatcher"
                                      ? 0.62
                                      : this.kind === "stoneworker"
                                        ? 0.9
                                        : this.kind === "wardKeeper"
                                          ? 0.74
                                          : this.kind === "centurion"
                                            ? 0.8
                                            : this.kind === "ritual"
                                              ? 0.68
                                              : this.longAttack
                                                ? 0.9
                                                : 0.5;
      if (this.crippled > 0) this.windup += 0.25;
      this.windupDuration = this.windup;
      enemy.lookAt(player.position); // Lock the strike direction at the visible tell.
      this.aiState = "windup";
      if (
        ["guest", "widow", "crawler", "wrongReflection", "nameRoot"].includes(
          this.kind,
        )
      )
        onSound(
          this.kind === "nameRoot"
            ? 52
            : this.kind === "crawler"
              ? 140
              : this.kind === "wrongReflection"
                ? 220
                : this.kind === "widow"
                  ? 110
                  : 72,
          0.45,
        );
      onMessage(
        this.kind === "nameRoot"
          ? this.phase === 3
            ? "La raíz abre todas sus ramas. Esquiva la barrida."
            : "Las raíces se tensan antes de golpear."
          : this.kind === "guest"
            ? "El huésped se detiene y extiende una mano. Míralo o defiéndete."
            : this.kind === "widow"
              ? "La viuda desciende y alza el velo."
              : this.kind === "crawler"
                ? "El reptante encoge las patas antes de saltar."
                : this.kind === "wrongReflection"
                  ? "Tu reflejo mueve el brazo equivocado."
                  : this.kind === "guardian"
                    ? this.longAttack
                      ? "Étienne prepara una embestida larga."
                      : "Étienne barre el suelo con el brazo."
                    : this.kind === "plagueScribe"
                      ? "El copista susurra un nombre. Se prepara para atacar."
                      : this.kind === "typesetter"
                        ? "El cajista lanza un tipo de metal. Defiéndete."
                        : this.kind === "portrait"
                          ? "El retrato abandona su marco y alza la mano."
                          : this.kind === "automaton"
                            ? "El autómata carga su brazo de bronce."
                            : this.kind === "developerShade"
                              ? "La sombra se condensa sobre la placa."
                              : this.kind === "mosaic"
                                ? "Las teselas del custodio crujen: prepara un golpe amplio."
                                : this.kind === "drowned"
                                  ? "El custodio ahogado inspira agua y prepara una embestida."
                                  : this.kind === "blindWatcher"
                                    ? "El vigilante orienta su bastón hacia tus pasos."
                                    : this.kind === "stoneworker"
                                      ? "El obrero levanta ambos brazos de piedra."
                                      : this.kind === "wardKeeper"
                                        ? "El custodio lee un nombre ajeno antes de alzar su llave."
                                        : this.kind === "centurion"
                                          ? "El centurión marca el suelo con su hoja. ¡Prepárate!"
                                          : this.kind === "ritual"
                                            ? "La criatura traza un signo en el aire."
                                            : this.kind === "shade"
                                              ? "La sombra levanta las garras. Puedes defenderte."
                                              : "Algo salta desde las sombras.",
      );
    } else {
      if (
        this.aiState === "recover" ||
        this.aiState === "vulnerable" ||
        (this.aiState === "retreat" && this.enemyCooldown <= 0)
      )
        this.aiState = seen
          ? "chase"
          : mansionCreature
            ? "search"
            : "investigate";
      let target = this.lastSeen;
      if (this.kind === "crawler" && this.aiState === "chase" && dist > 2) {
        this.crawlerJink += dt;
        const side = Math.floor(this.crawlerJink / 0.7) % 2 ? -1 : 1;
        const dx = player.position.x - enemy.position.x;
        const dz = player.position.z - enemy.position.z;
        const scale = 0.95 / Math.max(0.1, Math.hypot(dx, dz));
        target = player.position
          .clone()
          .add(new T.Vector3(-dz * scale * side, 0, dx * scale * side));
      }
      if (this.aiState === "retreat")
        target = enemy.position
          .clone()
          .add(
            enemy.position
              .clone()
              .sub(player.position)
              .setY(0)
              .normalize()
              .multiplyScalar(2.2),
          );
      if (this.aiState === "patrol") {
        target = this.patrolOrigin
          .clone()
          .add(
            this.kind === "shade"
              ? new T.Vector3(0, 0, this.patrolSide * 2.4)
              : new T.Vector3(this.patrolSide * 2.4, 0, 0),
          );
        if (enemy.position.distanceTo(target) < 0.5) this.patrolSide *= -1;
      } else if (
        (this.aiState === "investigate" || this.aiState === "search") &&
        !seen
      ) {
        if (enemy.position.distanceTo(target) < 0.6) this.searchTime -= dt;
        if (this.searchTime <= 0) this.aiState = "patrol";
      }
      const widowUpper =
        this.kind === "widow" &&
        mansionObstacles &&
        enemy.position.y >= MANSION_GALLERY_Y - 0.01 &&
        player.position.y >= MANSION_GALLERY_Y - 0.01;
      if (
        !widowUpper ||
        this.aiState !== "chase" ||
        (this.pursuitGoal &&
          Math.hypot(
            player.position.x - this.pursuitGoal.x,
            player.position.z - this.pursuitGoal.z,
          ) > 1.3)
      )
        this.pursuitPath = [];
      while (
        this.pursuitPath.length &&
        Math.hypot(
          enemy.position.x - this.pursuitPath[0].x,
          enemy.position.z - this.pursuitPath[0].z,
        ) < 0.16
      )
        this.pursuitPath.shift();
      if (this.pursuitPath.length)
        target = new T.Vector3(
          this.pursuitPath[0].x,
          enemy.position.y,
          this.pursuitPath[0].z,
        );
      if (
        this.aiState !== "suspect" &&
        (this.kind !== "guardian" || seen || this.aiState === "investigate")
      ) {
        const vector = target.clone().sub(enemy.position).setY(0);
        if (vector.length() > (this.pursuitPath.length ? 0.12 : 0.35)) {
          vector
            .normalize()
            .multiplyScalar(
              dt *
                (this.aiState === "retreat"
                  ? 2.7
                  : this.kind === "crawler"
                    ? observed
                      ? 1.3
                      : 3.0
                    : this.kind === "guest"
                      ? 1.65
                      : this.kind === "widow"
                        ? 1.28
                        : this.kind === "wrongReflection"
                          ? 1.5
                          : this.kind === "nameRoot"
                            ? this.phase === 3
                              ? 1.6
                              : 1.1
                            : this.kind === "stalker"
                              ? 1.65
                              : this.kind === "shade"
                                ? 0.85 + state.room * 0.08
                                : this.kind === "ritual"
                                  ? 1.05
                                  : this.phase === 2
                                    ? 1.35
                                    : 0.9),
            );
          // The widow's visible skirt and Élise's body need about one metre
          // between their centres. Her attack reach and damage are unchanged.
          const bodySpace =
            this.kind === "widow" &&
            Math.abs(enemy.position.y - player.position.y) < 0.8
              ? 1.05
              : 0;
          const playerDistance = Math.hypot(
            enemy.position.x - player.position.x,
            enemy.position.z - player.position.z,
          );
          if (bodySpace && this.aiState !== "retreat")
            vector.clampLength(0, Math.max(0, playerDistance - bodySpace));
          const preservesBodySpace = (x: number, z: number) =>
            !bodySpace ||
            Math.hypot(x - player.position.x, z - player.position.z) >=
              Math.min(bodySpace, playerDistance);
          const widowLevel =
            this.kind === "widow" &&
            enemy.position.y >= MANSION_GALLERY_Y - 0.01 &&
            upperWalkable(enemy.position.x, enemy.position.z)
              ? 1
              : 0;
          const moveEnemy = (
            dx: number,
            dz: number,
          ): { x: number; z: number; level?: 0 | 1 } =>
            this.kind === "widow" && mansionObstacles
              ? mansionMove(
                  enemy.position.x,
                  enemy.position.z,
                  dx,
                  dz,
                  widowLevel,
                  mansionObstacles.ground,
                  mansionObstacles.upper,
                )
              : move(enemy.position.x, enemy.position.z, dx, dz, obstacles);
          const next = moveEnemy(vector.x, vector.z);
          const progress = Math.hypot(
            next.x - enemy.position.x,
            next.z - enemy.position.z,
          );
          if (
            widowUpper &&
            progress < vector.length() * 0.45 &&
            !this.pursuitPath.length &&
            this.pathRetry <= 0 &&
            Math.hypot(
              enemy.position.x - player.position.x,
              enemy.position.z - player.position.z,
            ) > 1.6
          ) {
            this.pathRetry = 1;
            this.pursuitGoal = {
              x: player.position.x,
              z: player.position.z,
            };
            this.pursuitPath =
              actorPath(
                { x: enemy.position.x, z: enemy.position.z },
                this.pursuitGoal,
                mansionObstacles.upper,
                upperWalkable,
              ) ?? [];
          }
          const upperThreat =
            ["guest", "crawler", "wrongReflection", "nameRoot"].includes(
              this.kind,
            ) && enemy.position.y > 1;
          if (
            (next.x === enemy.position.x && next.z === enemy.position.z) ||
            (upperThreat && !upperWalkable(next.x, next.z))
          ) {
            const side = moveEnemy(-vector.z, vector.x);
            if (
              (!upperThreat || upperWalkable(side.x, side.z)) &&
              preservesBodySpace(side.x, side.z)
            )
              enemy.position.set(
                side.x,
                this.kind === "widow"
                  ? mansionFloorHeight(
                      side.x,
                      side.z,
                      mansionObstacles ? (side.level ?? widowLevel) : 0,
                    )
                  : enemy.position.y,
                side.z,
              );
          } else if (preservesBodySpace(next.x, next.z))
            enemy.position.set(
              next.x,
              this.kind === "widow"
                ? mansionFloorHeight(
                    next.x,
                    next.z,
                    mansionObstacles ? (next.level ?? widowLevel) : 0,
                  )
                : enemy.position.y,
              next.z,
            );
          enemy.lookAt(target);
        }
      }
    }
    animateCharacter(
      enemy,
      state.elapsed,
      this.aiState === "chase" ||
        this.aiState === "patrol" ||
        this.aiState === "investigate" ||
        this.aiState === "search" ||
        this.aiState === "retreat",
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
      this.windup > 0 ? 1 - this.windup / this.windupDuration : 0,
      gazeToPlayer(enemy, player),
      state.sanity,
    );
    if (dist < 5)
      state.sanity = clamp(
        state.sanity - dt * (this.kind === "ritual" ? 1.1 : 0.6),
      );
  }
}
