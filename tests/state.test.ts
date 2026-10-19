import { describe, it, expect } from "vitest";
import {
  fresh,
  parseSave,
  move,
  blocked,
  damage,
  clamp,
} from "../src/systems/state";
describe("Persistencia y supervivencia", () => {
  it("recupera una partida completa sin perder progreso", () => {
    const s = fresh();
    s.room = 3;
    s.items = ["Llave de latón", "Tónico 1"];
    s.seals = [0, 1];
    s.defeated = ["enemy0"];
    expect(parseSave(JSON.stringify(s))).toEqual(s);
  });
  it.each([
    "{}",
    "null",
    "invalid",
    JSON.stringify({ ...fresh(), room: 11 }),
    JSON.stringify({ ...fresh(), health: -1 }),
    JSON.stringify({ ...fresh(), items: [12] }),
    JSON.stringify({ ...fresh(), x: 400 }),
    JSON.stringify({ ...fresh(), seals: [3] }),
  ])("rechaza partidas inválidas: %s", (raw) =>
    expect(parseSave(raw)).toBeNull(),
  );
  it("el daño respeta límites y afecta la cordura", () => {
    const s = fresh();
    damage(s, 12);
    expect(s.health).toBe(88);
    expect(s.sanity).toBeCloseTo(94.6);
    damage(s, 200);
    expect(s.health).toBe(0);
    expect(s.sanity).toBeGreaterThanOrEqual(0);
  });
  it("las partidas nuevas no comparten inventario", () => {
    const s = fresh();
    s.items.push("a");
    expect(fresh().items).toEqual([]);
  });
});
describe("Colisiones", () => {
  const furniture = [{ x: 1, z: 0, w: 1, d: 2 }];
  it("bloquea paredes y muebles con radio del personaje", () => {
    expect(blocked(7.9, 0, [])).toBe(true);
    expect(blocked(0.3, 0, furniture)).toBe(true);
    expect(blocked(-1, 0, furniture)).toBe(false);
  });
  it("permite deslizarse en un eje al chocar en el otro", () => {
    expect(move(0, 0, 0.3, 0.3, furniture)).toEqual({ x: 0, z: 0.3 });
  });
  it("impide salir por las cuatro paredes", () => {
    for (const [x, z, dx, dz] of [
      [7.6, 0, 0.2, 0],
      [-7.6, 0, -0.2, 0],
      [0, 7.6, 0, 0.2],
      [0, -7.6, 0, -0.2],
    ])
      expect(move(x, z, dx, dz, [])).toEqual({ x, z });
  });
  it("limita salud y cordura a rangos conocidos", () => {
    expect(clamp(130)).toBe(100);
    expect(clamp(-30)).toBe(0);
  });
});
it("no acepta índices de diario, objetos ni sellos repetidos que alteren el juego", () => {
  for (const change of [
    { read: ["99"] },
    { items: ["<script>"] },
    { seals: [0, 0, 0] },
    { defeated: ["enemy99"] },
  ])
    expect(parseSave(JSON.stringify({ ...fresh(), ...change }))).toBeNull();
});
