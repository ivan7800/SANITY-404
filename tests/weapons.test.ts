import { expect, it } from "vitest";
import { Combat } from "../src/systems/combat";
import { fresh } from "../src/systems/state";
import { weaponProfileForRoom } from "../src/systems/weapons";
import { character } from "../src/world/scene";

it("las once herramientas conservan su perfil en ambas salas del capítulo", () => {
  const rooms = [8, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27];
  expect(
    new Set(rooms.map((room) => weaponProfileForRoom(room).name)).size,
  ).toBe(11);
  for (const room of rooms.slice(1)) {
    expect(weaponProfileForRoom(room + 1)).toBe(weaponProfileForRoom(room));
    expect(weaponProfileForRoom(room).technique).not.toBe("");
  }
  expect(weaponProfileForRoom(0).name).toBe("bastón de fresno");
});

it("el estoque de Inés alcanza al retrato desde una distancia que el bastón de Élise no cubre", () => {
  const strike = (room: number) => {
    const state = fresh();
    const player = character();
    const enemy = character(true);
    enemy.position.z = 2.18;
    const combat = new Combat(room);
    const initial = combat.health;
    combat.update(
      0.01,
      state,
      player,
      enemy,
      [],
      true,
      () => {},
      () => {},
    );
    return initial - combat.health;
  };
  expect(strike(1)).toBe(0);
  expect(strike(23)).toBeGreaterThan(0);
});
