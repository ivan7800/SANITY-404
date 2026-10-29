import { afterEach, expect, it, vi } from "vitest";
import { readSave, writeSave } from "../src/systems/save";
import { fresh } from "../src/systems/state";

afterEach(() => vi.unstubAllGlobals());

it("no reemplaza una partida cargable por un estado interno imposible", () => {
  const values = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  });
  const valid = fresh();
  valid.items.push("Llave de latón");
  expect(writeSave(valid)).toBe(true);
  const original = values.get("sanity404-save");
  const corrupted = fresh();
  corrupted.phase2.steps[1] = 3;
  expect(writeSave(corrupted)).toBe(false);
  expect(values.get("sanity404-save")).toBe(original);
  expect(readSave()).toEqual(valid);
});

it("recupera el menú tras una partida corrupta y conserva un guardado nuevo", () => {
  const values = new Map<string, string>([["sanity404-save", "{invalid json"]]);
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  });
  expect(readSave()).toBeNull();
  const next = fresh();
  next.x = -1.25;
  next.items.push("Llave de latón");
  expect(writeSave(next)).toBe(true);
  expect(readSave()).toEqual(next);
  expect(values.get("sanity404-save")).toBe(JSON.stringify(next));
});
