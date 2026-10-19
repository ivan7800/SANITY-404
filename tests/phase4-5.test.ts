import { describe, expect, it } from "vitest";
import { fresh } from "../src/systems/state";
import { eligibleSanityEvents, Sanity } from "../src/systems/sanity";
import { Combat } from "../src/systems/combat";
import { World, character } from "../src/world/scene";

describe("Fase 4.5 — sanity, combat and low-cost hallucinations", () => {
  it("offers original historical events only at the intended thresholds", () => {
    const state = fresh();
    state.room = 8;
    state.sanity = 75;
    expect(
      eligibleSanityEvents(state).some((event) => event.id === "roman-witness"),
    ).toBe(true);
    expect(
      eligibleSanityEvents(state).some(
        (event) => event.id === "roman-false-exit",
      ),
    ).toBe(false);
    state.sanity = 40;
    expect(
      eligibleSanityEvents(state).some(
        (event) => event.id === "roman-false-exit",
      ),
    ).toBe(true);
    state.room = 10;
    expect(
      eligibleSanityEvents(state).some(
        (event) => event.id === "ink-apparition",
      ),
    ).toBe(true);
    state.room = 0;
    expect(
      eligibleSanityEvents(state).some((event) => event.id === "mansion-echo"),
    ).toBe(false);
  });
  it("respects reduced effects and never changes player position or save data", () => {
    const world = new World(9, [], [], []);
    const sanity = new Sanity(world);
    const state = fresh();
    state.room = 9;
    state.sanity = 30;
    state.elapsed = 80;
    const before = JSON.stringify(state);
    sanity.update(
      state,
      world,
      {
        reduced: true,
        reduceFlashes: true,
        reduceDistortion: true,
        reduceAudio: true,
      },
      () => {
        throw Error("unexpected toast");
      },
      () => {
        throw Error("unexpected sound");
      },
    );
    expect(JSON.stringify(state)).toBe(before);
    expect(sanity.apparition.visible).toBe(false);
    world.dispose();
  });
  it("defence spends stamina and dodging is unavailable while staggered", () => {
    const combat = new Combat(8);
    const world = new World(8, [], [], []);
    const state = fresh();
    state.room = 8;
    const player = character();
    const enemy = character(true);
    enemy.visible = false;
    combat.stamina = 50;
    combat.update(
      1,
      state,
      player,
      enemy,
      world.obstacles,
      false,
      () => {},
      () => {},
      true,
    );
    expect(combat.stamina).toBeLessThan(50);
    combat.hurt = 0.5;
    expect(combat.startDodge()).toBe(false);
    world.dispose();
  });
});
