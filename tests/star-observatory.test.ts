import { describe, expect, it } from "vitest";
import { blocked, fresh, parseSave } from "../src/systems/state";
import {
  completeChapter,
  starAlignmentStep,
  starsObjective,
} from "../src/systems/campaign";
import { Combat } from "../src/systems/combat";
import { eligibleSanityEvents } from "../src/systems/sanity";
import { createEnemy, enemyKindForRoom } from "../src/world/enemies";
import { samira } from "../src/world/samira";
import { World, character } from "../src/world/scene";
import { reachableFromEntrance } from "./room-navigation";

describe("observatorio de Samira, año 783", () => {
  it("enlaza dos salas accesibles después del archivo costero", () => {
    const state = fresh();
    completeChapter(state.campaign, "coast-537");
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
      (object) => object.id === "stars-portal",
    );
    expect(portal?.target).toBe(15);
    expect(blocked(portal!.x, portal!.z, mansion.obstacles)).toBe(true);
    expect(reachableFromEntrance(mansion.obstacles, portal!)).toBe(true);
    mansion.dispose();
    for (const room of [15, 16]) {
      const world = new World(room, [], [], []);
      for (const object of world.objects) {
        expect(object.collider, object.id).toBeDefined();
        expect(reachableFromEntrance(world.obstacles, object), object.id).toBe(
          true,
        );
      }
      if (room === 16)
        expect(world.scene.getObjectByName("astrolabe-wheel")).toBeDefined();
      world.dispose();
    }
  });

  it("guarda etapas del astrolabio, reinicia errores y conserva el disco", () => {
    const state = fresh();
    state.room = 16;
    state.phase2.visited.push(15, 16);
    state.campaign.visited.push("stars-783");
    expect(starsObjective(state)).toMatch(/observaciones/);
    expect(starAlignmentStep(state, 0)).toBe("locked");
    state.read.push("15", "16");
    state.items.push("Carta astral");
    expect(starAlignmentStep(state, 0)).toBe("correct");
    expect(parseSave(JSON.stringify(state))?.items).toContain("Primer azimut");
    expect(starAlignmentStep(state, 1)).toBe("wrong");
    expect(state.items).not.toContain("Primer azimut");
    expect(state.sanity).toBe(95);
    expect(starAlignmentStep(state, 0)).toBe("correct");
    expect(starAlignmentStep(state, 2)).toBe("correct");
    expect(starAlignmentStep(state, 1)).toBe("solved");
    expect(starAlignmentStep(state, 1)).toBe("already");
    expect(starsObjective(state)).toMatch(/vigilante/);
    state.defeated.push("enemy16");
    state.items.push("Disco estelar");
    expect(starsObjective(state)).toMatch(/Cruza/);
    completeChapter(state.campaign, "stars-783");
    expect(parseSave(JSON.stringify(state))).toEqual(state);
  });

  it("diferencia a Samira y al vigilante ciego, que oye correr", () => {
    expect(samira().userData.historicalHero).toBe("samira");
    expect(enemyKindForRoom(16)).toBe("blindWatcher");
    const enemy = createEnemy("blindWatcher");
    expect(enemy.name).toContain("ciego");
    const player = character();
    enemy.position.z = 4;
    const combat = new Combat(16);
    expect(combat.health).toBe(90);
    const state = fresh();
    state.room = 16;
    combat.update(
      0.1,
      state,
      player,
      enemy,
      [],
      false,
      () => {},
      () => {},
    );
    expect(combat.aiState).toBe("patrol");
    combat.update(
      0.1,
      state,
      player,
      enemy,
      [],
      false,
      () => {},
      () => {},
      false,
      false,
      1,
    );
    expect(combat.aiState).toBe("chase");
    state.sanity = 40;
    state.read.push("16");
    state.items.push("Carta astral");
    expect(eligibleSanityEvents(state).map((event) => event.id)).toContain(
      "stars-unseen-watcher",
    );
    expect(eligibleSanityEvents(state).map((event) => event.id)).toContain(
      "stars-reverse-dust",
    );
  });
});
