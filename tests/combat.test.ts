import { it, expect, vi } from "vitest";
import { Combat } from "../src/systems/combat";
import { fresh } from "../src/systems/state";
import { drinkTonic } from "../src/systems/inventory";
import { character } from "../src/world/scene";
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
  c.update(0.1, state, p, e, [], false, noop, noop);
  expect(state.health).toBe(88);
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
});
