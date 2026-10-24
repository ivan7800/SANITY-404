import { describe, expect, it } from "vitest";
import { blocked, fresh, parseSave } from "../src/systems/state";
import { Combat } from "../src/systems/combat";
import { eligibleSanityEvents } from "../src/systems/sanity";
import { aurelia } from "../src/world/aurelia";
import { createEnemy, enemyKindForRoom } from "../src/world/enemies";
import { World } from "../src/world/scene";

describe("taller de mosaicos, año 312", () => {
  it("mantiene accesibles puertas, pista, puzle y molde en ambas salas", () => {
    for (const room of [11, 12]) {
      const world = new World(room, [], [], []);
      for (const object of world.objects)
        expect(
          blocked(object.x, object.z, world.obstacles, 0.34),
          object.id,
        ).toBe(false);
      if (room === 12)
        expect(
          world.scene.getObjectByName("mosaic-restored-face")?.visible,
        ).toBe(false);
      world.dispose();
    }
  });

  it("distingue artesana y custodio y conserva el progreso de un guardado v2", () => {
    const hero = aurelia();
    expect(hero.userData.historicalHero).toBe("aurelia");
    expect(hero.userData.rig.rightArm.children.length).toBeGreaterThan(1);
    expect(enemyKindForRoom(12)).toBe("mosaic");
    expect(createEnemy("mosaic").name).toContain("teselas");
    expect(new Combat(12).health).toBe(95);
    const state = fresh();
    state.room = 12;
    state.phase2.visited.push(11, 12);
    state.campaign.visited.push("mosaic-312");
    state.items.push("Pigmento de cinabrio", "Boceto recompuesto");
    expect(parseSave(JSON.stringify(state))).toEqual(state);
    const restored = new World(
      12,
      state.items,
      [],
      [],
      [],
      1,
      state.phase2,
      state.campaign,
    );
    expect(
      restored.scene.getObjectByName("mosaic-restored-face")?.visible,
    ).toBe(true);
    restored.dispose();
    state.sanity = 70;
    expect(
      eligibleSanityEvents(state).some(
        (event) => event.id === "mosaic-false-face",
      ),
    ).toBe(true);
  });

  it("no acepta una sala nueva falsificada como partida v1", () => {
    const state = fresh() as unknown as Record<string, unknown>;
    state.version = 1;
    state.room = 12;
    delete state.campaign;
    expect(parseSave(JSON.stringify(state))).toBeNull();
  });
});
