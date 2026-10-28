import { afterEach, expect, it, vi } from "vitest";
import { fresh, parseSave } from "../src/systems/state";
import { readSave, writeSave } from "../src/systems/save";

afterEach(() => vi.unstubAllGlobals());

it("rechaza inventario, lecturas y enemigos duplicados en un guardado externo", () => {
  for (const change of [
    { items: ["Tónico 0", "Tónico 0"] },
    { collected: ["Tónico 1", "Tónico 1"] },
    { read: ["8", "8"] },
    { defeated: ["enemy8", "enemy8"] },
  ]) {
    const state = { ...fresh(), ...change };
    expect(parseSave(JSON.stringify(state))).toBeNull();
  }
});

it("no ofrece Continuar con una partida muerta ni sobrescribe la anterior", () => {
  const values = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  });
  const valid = fresh();
  valid.health = 17;
  expect(writeSave(valid)).toBe(true);
  const previous = values.get("sanity404-save");

  const dead = fresh();
  dead.health = 0;
  expect(writeSave(dead)).toBe(false);
  expect(values.get("sanity404-save")).toBe(previous);
  values.set("sanity404-save", JSON.stringify(dead));
  expect(readSave()).toBeNull();
});

it("conserva una partida antigua v1 recuperable e incompleta", () => {
  const old = fresh() as unknown as Record<string, unknown>;
  old.version = 1;
  old.room = 8;
  old.health = 12;
  old.items = ["Tónico 0"];
  delete old.campaign;
  const migrated = parseSave(JSON.stringify(old));
  expect(migrated?.version).toBe(2);
  expect(migrated?.room).toBe(8);
  expect(migrated?.health).toBe(12);
  expect(migrated?.items).toEqual(["Tónico 0"]);
});
