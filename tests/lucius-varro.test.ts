import { describe, expect, it } from "vitest";
import { World } from "../src/world/scene";
import { luciusVarro } from "../src/world/lucius";
import { createEnemy, enemyKindForRoom } from "../src/world/enemies";
import { Combat } from "../src/systems/combat";
import { fresh, parseSave } from "../src/systems/state";
import { animateCharacter, type Rig } from "../src/world/character";

describe("Fase 4.2 — Lucius Varro", () => {
  it("uses the shared articulated combat rig with a distinct Roman silhouette", () => {
    const lucius = luciusVarro();
    expect(lucius.name).toContain("Lucius Varro");
    const rig = lucius.userData.rig as Rig;
    expect(rig.coat.visible).toBe(false);
    expect(rig.weapon.visible).toBe(false);
    expect(lucius.userData.historicalHero).toBe("lucius");
    animateCharacter(lucius, 0.2, true, 0.1, false, 0, true, 1 / 60);
    expect(Number.isFinite(rig.rightArm.rotation.x)).toBe(true);
  });
  it("spawns a unique centurion with dedicated combat balance", () => {
    expect(enemyKindForRoom(8)).toBe("centurion");
    expect(createEnemy("centurion").name).toBe("El centurión sin rostro");
    const combat = new Combat(8);
    expect(combat.kind).toBe("centurion");
    expect(combat.health).toBe(115);
  });
  it("places the altar puzzle and persists its solution", () => {
    const world = new World(8, [], [], []);
    expect(world.objects.find((o) => o.id === "roman-inscription")?.kind).toBe(
      "romanPuzzle",
    );
    const state = fresh();
    state.room = 8;
    state.phase2.visited.push(8);
    state.items.push("Marca de Varro");
    expect(parseSave(JSON.stringify(state))).toEqual(state);
    world.dispose();
  });
});
