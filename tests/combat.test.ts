import { it, expect, vi } from "vitest";
import { Combat } from "../src/systems/combat";
import { fresh } from "../src/systems/state";
import { drinkTonic } from "../src/systems/inventory";
import { character } from "../src/world/scene";
import { createEnemy } from "../src/world/enemies";
it("permite dirigir golpes: cabeza exige alineación y brazos ralentizan", () => {
  const noop = () => {};
  const strike = (zone: "torso" | "arms" | "head", rotation = 0) => {
    const state = fresh();
    const player = character();
    const enemy = character(true);
    const combat = new Combat(1);
    player.rotation.y = rotation;
    enemy.position.z = 1.3;
    combat.update(
      0.01,
      state,
      player,
      enemy,
      [],
      true,
      noop,
      noop,
      false,
      false,
      0,
      zone,
    );
    return combat;
  };
  expect(strike("head").health).toBeLessThan(strike("torso").health);
  expect(strike("head", Math.PI / 2).health).toBe(70);
  const arms = strike("arms");
  expect(arms.health).toBeGreaterThan(strike("torso").health);
  expect(arms.crippled).toBeGreaterThan(0);
  const windup = (crippled: number) => {
    const state = fresh();
    const player = character();
    const enemy = character(true);
    const combat = new Combat(1);
    combat.crippled = crippled;
    combat.enemyCooldown = 0;
    enemy.position.z = 1;
    enemy.lookAt(player.position);
    combat.update(0.01, state, player, enemy, [], false, noop, noop);
    return combat.windupDuration;
  };
  expect(windup(5) - windup(0)).toBeCloseTo(0.25);
});
it("un golpe tiene recuperación, un enemigo derrotado deja de causar daño", () => {
  const state = fresh(),
    player = character(),
    enemy = character(true),
    combat = new Combat(0),
    sound = vi.fn(),
    message = vi.fn();
  enemy.position.z = 1.4;
  combat.update(0.01, state, player, enemy, [], true, sound, message);
  expect(combat.health).toBe(30);
  combat.update(0.01, state, player, enemy, [], true, sound, message);
  expect(combat.health).toBe(30);
  enemy.position.z = 1.4;
  combat.update(0.7, state, player, enemy, [], true, sound, message);
  expect(enemy.visible).toBe(false);
  expect(state.defeated).toContain("enemy0");
  const hp = state.health;
  combat.update(5, state, player, enemy, [], false, sound, message);
  expect(state.health).toBe(hp);
});
it("una pared sólida impide tanto el golpe del jugador como el daño enemigo", () => {
  const state = fresh();
  const player = character();
  const enemy = character(true);
  enemy.position.z = 1.3;
  enemy.lookAt(player.position);
  const combat = new Combat(0);
  const wall = [{ id: "muro-qa", x: 0, z: 0.65, w: 2, d: 0.14, height: 2.5 }];
  combat.update(
    0.01,
    state,
    player,
    enemy,
    wall,
    true,
    () => {},
    () => {},
  );
  expect(combat.health).toBe(60);
  combat.windup = 0.01;
  combat.update(
    0.02,
    state,
    player,
    enemy,
    wall,
    false,
    () => {},
    () => {},
  );
  expect(state.health).toBe(100);
});
it("el enemigo persigue, daña con recuperación y no atraviesa límites", () => {
  const state = fresh(),
    p = character(),
    e = character(true),
    c = new Combat(1);
  e.position.set(0, 0, 3);
  e.lookAt(p.position);
  const noop = () => {};
  c.update(0.1, state, p, e, [], false, noop, noop);
  expect(e.position.z).toBeLessThan(3);
  e.position.z = 1;
  c.update(1.1, state, p, e, [], false, noop, noop);
  expect(state.health).toBe(100);
  expect(c.windup).toBeGreaterThan(0);
  c.update(0.43, state, p, e, [], false, noop, noop);
  expect(state.health).toBe(88);
  expect(c.hitsReceived).toBe(1);
  expect(c.lastPlayerHit).toMatchObject({
    source: "enemy1",
    kind: "shade",
    raw: 12,
    applied: 12,
    guarded: false,
    healthBefore: 100,
    healthAfter: 88,
  });
  c.update(0.1, state, p, e, [], false, noop, noop);
  expect(state.health).toBe(88);
  expect(c.hitsReceived).toBe(1);
});
it("un tónico cura y se consume una única vez, sin superar máximos", () => {
  const s = fresh();
  s.items = ["Tónico 0"];
  expect(drinkTonic(s)).toBe("full");
  s.health = 90;
  s.sanity = 30;
  expect(drinkTonic(s)).toBe("used");
  expect(s.health).toBe(100);
  expect(s.sanity).toBe(55);
  expect(drinkTonic(s)).toBe("empty");
});

it("defender reduce el daño y evita atacar simultáneamente", () => {
  const s = fresh(),
    p = character(),
    e = character(true),
    c = new Combat(0),
    noop = () => {};
  e.position.z = 1;
  c.update(1.1, s, p, e, [], true, noop, noop, true);
  expect(c.health).toBe(60);
  c.update(0.43, s, p, e, [], false, noop, noop, true);
  expect(s.health).toBe(97);
  expect(c.lastPlayerHit).toMatchObject({
    source: "enemy0",
    raw: 12,
    applied: 3,
    guarded: true,
  });
});
it("el centurión amortigua cortes frontales y expone su escudo al golpe fuerte", () => {
  const state = fresh();
  state.room = 8;
  const player = character();
  const enemy = createEnemy("centurion");
  enemy.position.z = 1.4;
  enemy.lookAt(player.position);
  const combat = new Combat(8);
  const messages: string[] = [];
  combat.update(
    0.01,
    state,
    player,
    enemy,
    [],
    true,
    () => {},
    (message) => messages.push(message),
  );
  expect(combat.health).toBe(103);
  expect(messages.some((message) => message.includes("escudo"))).toBe(true);
  combat.update(
    1.1,
    state,
    player,
    enemy,
    [],
    false,
    () => {},
    () => {},
  );
  enemy.position.z = 1.4;
  combat.update(
    0.01,
    state,
    player,
    enemy,
    [],
    false,
    () => {},
    () => {},
    false,
    true,
  );
  expect(combat.health).toBe(53);
});

it("el autómata expone sus articulaciones tras el ataque anunciado", () => {
  const state = fresh();
  state.room = 26;
  const player = character();
  const enemy = createEnemy("automaton");
  const combat = new Combat(26);
  const messages: string[] = [];
  const notify = (message: string) => messages.push(message);
  const noop = () => {};
  enemy.position.z = 1.2;
  combat.update(0.01, state, player, enemy, [], true, noop, notify);
  expect(combat.health).toBe(104); // El bronce reduce el golpe ligero inicial.
  combat.update(1.3, state, player, enemy, [], false, noop, notify);
  enemy.position.z = 1.2;
  enemy.lookAt(player.position);
  combat.update(0.01, state, player, enemy, [], false, noop, notify);
  expect(combat.windup).toBeGreaterThan(0);
  combat.update(0.96, state, player, enemy, [], false, noop, notify);
  expect(combat.vulnerable).toBeGreaterThan(0);
  expect(messages.some((message) => message.includes("brazo mecánico"))).toBe(
    true,
  );
  enemy.position.z = 1.2;
  combat.update(0.01, state, player, enemy, [], true, noop, notify);
  expect(combat.health).toBe(74); // La ventana admite el daño completo.
});

it("la defensa amortigua la agresión psíquica del retrato", () => {
  function hit(guard: boolean) {
    const state = fresh();
    state.room = 24;
    const player = character();
    const enemy = createEnemy("portrait");
    enemy.position.z = 1;
    enemy.lookAt(player.position);
    const combat = new Combat(24);
    const noop = () => {};
    combat.update(1.3, state, player, enemy, [], false, noop, noop, guard);
    combat.update(0.84, state, player, enemy, [], false, noop, noop, guard);
    return state;
  }
  const exposed = hit(false);
  const defended = hit(true);
  expect(exposed.health).toBeLessThan(defended.health);
  expect(exposed.sanity).toBeLessThan(defended.sanity);
});

it("una defensa precisa anula el golpe y abre una ventana de contraataque", () => {
  const state = fresh();
  state.room = 12;
  const player = character();
  const enemy = createEnemy("mosaic");
  enemy.position.z = 1;
  enemy.lookAt(player.position);
  const combat = new Combat(12);
  const messages: string[] = [];
  const notify = (message: string) => messages.push(message);
  const noop = () => {};
  combat.update(1.1, state, player, enemy, [], false, noop, notify);
  combat.update(0.52, state, player, enemy, [], false, noop, notify);
  expect(combat.windup).toBeGreaterThan(0);
  combat.update(0.15, state, player, enemy, [], false, noop, notify, true);
  expect(state.health).toBe(100);
  expect(combat.vulnerable).toBeGreaterThan(0);
  expect(messages.some((message) => message.includes("Defensa precisa"))).toBe(
    true,
  );
  combat.update(0.01, state, player, enemy, [], true, noop, notify);
  expect(combat.health).toBeLessThan(95);
});
