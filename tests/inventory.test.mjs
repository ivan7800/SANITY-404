import { expect, it } from "vitest";
import { drinkTonic } from "../src/systems/inventory.ts";
import { fresh, parseSave } from "../src/systems/state.ts";
import { tonicConsumption } from "../scripts/phase22-resources.mjs";

const tonicIds = [0, 1, 2, 3, 5, 6, 7];

it.each(tonicIds)(
  "consume Tónico %i una sola vez con salud baja y cordura cero",
  (id) => {
    const state = fresh();
    const tonic = `Tónico ${id}`;
    state.health = 32;
    state.sanity = 0;
    state.items = ["Llave de latón", tonic];
    const before = {
      health: state.health,
      sanity: state.sanity,
      tonics: [tonic],
    };
    expect(drinkTonic(state)).toBe("used");
    expect(state).toMatchObject({ health: 72, sanity: 25 });
    expect(state.items).toEqual(["Llave de latón"]);
    expect(
      tonicConsumption(before, {
        health: state.health,
        sanity: state.sanity,
        tonics: [],
      }).passed,
    ).toBe(true);
    expect(drinkTonic(state)).toBe("empty");
    expect(state).toMatchObject({ health: 72, sanity: 25 });
  },
);

it("conserva orden y estado tras guardar y recargar varios tónicos", () => {
  const state = fresh();
  state.items = ["Tónico 1", "Medallón Veyr", "Tónico 2"];
  state.health = 45;
  state.sanity = 70;
  const restored = parseSave(JSON.stringify(state));
  expect(restored).not.toBeNull();
  expect(drinkTonic(restored)).toBe("used");
  expect(restored.items).toEqual(["Medallón Veyr", "Tónico 2"]);
  expect(restored).toMatchObject({ health: 85, sanity: 95 });
  expect(drinkTonic(restored)).toBe("used");
  expect(restored.items).toEqual(["Medallón Veyr"]);
  expect(restored).toMatchObject({ health: 100, sanity: 100 });
});

it("no consume con inventario vacío ni cuando salud y cordura están completas", () => {
  const state = fresh();
  expect(drinkTonic(state)).toBe("empty");
  state.items = ["Tónico 0"];
  expect(drinkTonic(state)).toBe("full");
  expect(state.items).toEqual(["Tónico 0"]);
  state.sanity = 0;
  expect(drinkTonic(state)).toBe("used");
  expect(state).toMatchObject({ health: 100, sanity: 25 });
});

it("no reanima ni consume un tónico después de llegar a cero salud", () => {
  const state = fresh();
  state.health = 0;
  state.sanity = 0;
  state.items = ["Tónico 6"];
  expect(drinkTonic(state)).toBe("dead");
  expect(state.health).toBe(0);
  expect(state.sanity).toBe(0);
  expect(state.items).toEqual(["Tónico 6"]);
});

it("rechaza lecturas tempranas y consumos duplicados en la certificación", () => {
  const before = {
    health: 32,
    sanity: 0,
    tonics: ["Tónico 0", "Tónico 1"],
  };
  expect(tonicConsumption(before, before).passed).toBe(false);
  expect(
    tonicConsumption(before, {
      health: 72,
      sanity: 25,
      tonics: before.tonics,
    }).passed,
  ).toBe(false);
  expect(
    tonicConsumption(before, {
      health: 72,
      sanity: 25,
      tonics: [],
    }).passed,
  ).toBe(false);
  expect(
    tonicConsumption(before, {
      health: 72,
      sanity: 25,
      tonics: ["Tónico 1"],
    }).passed,
  ).toBe(true);
  expect(
    tonicConsumption(
      { health: 100, sanity: 0, tonics: ["Tónico 0"] },
      { health: 100, sanity: 25, tonics: [] },
    ).passed,
  ).toBe(true);
});
