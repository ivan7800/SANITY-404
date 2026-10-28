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
    JSON.stringify({ ...fresh(), room: 29 }),
    JSON.stringify({ ...fresh(), health: -1 }),
    JSON.stringify({ ...fresh(), items: [12] }),
    JSON.stringify({ ...fresh(), x: 400 }),
    JSON.stringify({ ...fresh(), seals: [3] }),
  ])("rechaza partidas inválidas: %s", (raw) =>
    expect(parseSave(raw)).toBeNull(),
  );
  it("rechaza un puzle con tres pasos sin resolver y un atajo incoherente", () => {
    const stuck = fresh();
    stuck.phase2.steps[1] = 3;
    expect(parseSave(JSON.stringify(stuck))).toBeNull();
    const missingShortcut = fresh();
    missingShortcut.phase2.steps[2] = 3;
    missingShortcut.phase2.solved.push("astronomy");
    expect(parseSave(JSON.stringify(missingShortcut))).toBeNull();
  });
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
    const next = move(0, 0, 0.3, 0.3, furniture);
    expect(next.x).toBeGreaterThan(0);
    expect(next.x).toBeLessThan(0.16);
    expect(next.z).toBeCloseTo(0.3);
    expect(blocked(next.x, next.z, furniture)).toBe(false);
  });
  it("impide atravesar paredes finas con carrera, esquiva o fotogramas largos", () => {
    const wall = [{ x: 1.5, z: 0, w: 0.08, d: 6 }];
    for (const speed of [1.1, 2.5, 7]) {
      const next = move(0, 0, speed, 0, wall);
      expect(next.x).toBeLessThan(1.5 - 0.04 - 0.34 + 0.001);
      expect(blocked(next.x, next.z, wall)).toBe(false);
    }
  });
  it("no atraviesa una esquina durante un desplazamiento diagonal largo", () => {
    const corner = [
      { x: 1, z: 0, w: 0.08, d: 2 },
      { x: 0, z: 1, w: 2, d: 0.08 },
    ];
    const next = move(0, 0, 3, 3, corner);
    expect(blocked(next.x, next.z, corner)).toBe(false);
    expect(next.x).toBeLessThan(0.7);
    expect(next.z).toBeLessThan(0.7);
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
