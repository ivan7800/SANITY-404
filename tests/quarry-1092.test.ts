import { describe, expect, it } from "vitest";
import { blocked, fresh, parseSave } from "../src/systems/state";
import {
  assembleQuarryArch,
  completeChapter,
  quarryObjective,
} from "../src/systems/campaign";
import { Combat } from "../src/systems/combat";
import { eligibleSanityEvents } from "../src/systems/sanity";
import { createEnemy, enemyKindForRoom } from "../src/world/enemies";
import { idris } from "../src/world/idris";
import { World } from "../src/world/scene";
import { reachableFromEntrance } from "./room-navigation";

describe("cantera de Idris, año 1092", () => {
  it("abre el acceso tras Samira y mantiene alcanzables las dos salas", () => {
    const state = fresh();
    const closed = new World(
      0,
      [],
      [],
      [],
      [],
      1,
      state.phase2,
      state.campaign,
    );
    expect(closed.objects.some((object) => object.id === "quarry-portal")).toBe(
      false,
    );
    closed.dispose();
    completeChapter(state.campaign, "stars-783");
    const mansion = new World(
      0,
      [],
      [],
      [],
      [],
      1,
      state.phase2,
      state.campaign,
    );
    const portal = mansion.objects.find(
      (object) => object.id === "quarry-portal",
    );
    expect(portal?.target).toBe(17);
    expect(blocked(portal!.x, portal!.z, mansion.obstacles)).toBe(false);
    mansion.dispose();
    for (const room of [17, 18]) {
      const world = new World(room, [], [], []);
      for (const object of world.objects)
        expect(blocked(object.x, object.z, world.obstacles), object.id).toBe(
          false,
        );
      for (const object of world.objects)
        expect(reachableFromEntrance(world.obstacles, object), object.id).toBe(
          true,
        );
      world.dispose();
    }
  });

  it("persiste el orden del arco, reinicia errores y conserva el plano", () => {
    const state = fresh();
    state.room = 18;
    state.phase2.visited.push(17, 18);
    state.campaign.visited.push("quarry-1092");
    expect(quarryObjective(state)).toMatch(/cuaderno/);
    expect(assembleQuarryArch(state, 0)).toBe("locked");
    state.read.push("17", "18");
    state.items.push("Cuña marcada");
    expect(assembleQuarryArch(state, 0)).toBe("correct");
    expect(parseSave(JSON.stringify(state))?.items).toContain("Base asentada");
    expect(assembleQuarryArch(state, 1)).toBe("wrong");
    expect(state.items).not.toContain("Base asentada");
    expect(state.sanity).toBe(95);
    expect(assembleQuarryArch(state, 0)).toBe("correct");
    expect(assembleQuarryArch(state, 2)).toBe("correct");
    expect(parseSave(JSON.stringify(state))?.items).toContain("Clave colocada");
    expect(assembleQuarryArch(state, 1)).toBe("solved");
    expect(assembleQuarryArch(state, 1)).toBe("already");
    expect(quarryObjective(state)).toMatch(/obrero/);
    state.defeated.push("enemy18");
    state.items.push("Plano del umbral");
    expect(quarryObjective(state)).toMatch(/Sal/);
    completeChapter(state.campaign, "quarry-1092");
    expect(parseSave(JSON.stringify(state))).toEqual(state);
    const restored = new World(18, state.items, [], state.read);
    expect(
      restored.scene.getObjectByName("quarry-assembled-arch")?.visible,
    ).toBe(true);
    restored.dispose();
  });

  it("diferencia a Idris, al obrero y sus alucinaciones", () => {
    expect(idris().userData.historicalHero).toBe("idris");
    expect(enemyKindForRoom(18)).toBe("stoneworker");
    const enemy = createEnemy("stoneworker");
    expect(enemy.name).toContain("petrificado");
    expect(enemy.getObjectByName("stoneworker-fissure")).toBeDefined();
    const combat = new Combat(18);
    expect(combat.health).toBe(110);
    expect(combat.windupDuration).toBe(0.42);
    const state = fresh();
    state.room = 18;
    state.sanity = 40;
    state.read.push("18");
    state.items.push("Cuña marcada");
    expect(eligibleSanityEvents(state).map((event) => event.id)).toContain(
      "quarry-wrong-name",
    );
    expect(eligibleSanityEvents(state).map((event) => event.id)).toContain(
      "quarry-receding-exit",
    );
  });
});
