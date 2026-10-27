import { describe, expect, it } from "vitest";
import { blocked, fresh, parseSave } from "../src/systems/state";
import {
  completeChapter,
  hospitalObjective,
  identifyHospitalRemedy,
  keepHospitalTestimony,
} from "../src/systems/campaign";
import { Combat } from "../src/systems/combat";
import { eligibleSanityEvents } from "../src/systems/sanity";
import { createEnemy, enemyKindForRoom } from "../src/world/enemies";
import { oona } from "../src/world/oona";
import { World } from "../src/world/scene";
import { reachableFromEntrance } from "./room-navigation";

describe("hospital de Oona, año 1217", () => {
  it("abre desde la cantera y permite alcanzar documentos, remedio y salida", () => {
    const state = fresh();
    const before = new World(
      0,
      [],
      [],
      [],
      [],
      1,
      state.phase2,
      state.campaign,
    );
    expect(
      before.objects.some((object) => object.id === "hospital-portal"),
    ).toBe(false);
    before.dispose();
    completeChapter(state.campaign, "quarry-1092");
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
      (object) => object.id === "hospital-portal",
    );
    expect(portal?.target).toBe(19);
    expect(blocked(portal!.x, portal!.z, mansion.obstacles)).toBe(true);
    expect(reachableFromEntrance(mansion.obstacles, portal!)).toBe(true);
    // A real campaign trace stalled at x=6.17, z≈-1 while trying to walk
    // down the outside of the staircase. Keep the ground-floor approach open.
    expect(blocked(6.17, -3.3, mansion.obstacles)).toBe(true);
    // The solid puzzle desk blocks the old straight aisle; the portal remains
    // reachable around it by the same collision rules used in gameplay.
    expect(blocked(2.4, 4.65, mansion.obstacles)).toBe(true);
    expect(blocked(2.4, -3.3, mansion.obstacles)).toBe(true);
    mansion.dispose();
    for (const room of [19, 20]) {
      const world = new World(room, [], [], []);
      for (const object of world.objects)
        expect(object.collider, object.id).toBeDefined();
      for (const object of world.objects)
        expect(reachableFromEntrance(world.obstacles, object), object.id).toBe(
          true,
        );
      world.dispose();
    }
  });

  it("resuelve la historia de Bran y conserva una sola decisión", () => {
    const state = fresh();
    state.room = 20;
    state.phase2.visited.push(19, 20);
    state.campaign.visited.push("hospital-1217");
    expect(hospitalObjective(state)).toMatch(/ingresos/);
    expect(identifyHospitalRemedy(state, 1)).toBe("locked");
    state.read.push("19", "20");
    state.items.push("Hierbas de serbal");
    expect(identifyHospitalRemedy(state, 0)).toBe("wrong");
    expect(state.sanity).toBe(94);
    expect(identifyHospitalRemedy(state, 1)).toBe("solved");
    expect(identifyHospitalRemedy(state, 1)).toBe("already");
    expect(hospitalObjective(state)).toMatch(/custodio/);
    state.defeated.push("enemy20");
    expect(keepHospitalTestimony(state, "Ada")).toBe(false);
    state.items.push("Cuaderno de Oona");
    expect(keepHospitalTestimony(state, "Bran")).toBe(true);
    expect(keepHospitalTestimony(state, "Ada")).toBe(false);
    expect(hospitalObjective(state)).toMatch(/Regresa/);
    completeChapter(state.campaign, "hospital-1217");
    expect(parseSave(JSON.stringify(state))).toEqual(state);
    state.items.push("Testimonio de Ada");
    expect(parseSave(JSON.stringify(state))).toBeNull();
  });

  it("presenta a Oona, al custodio y las camas imposibles", () => {
    expect(oona().userData.historicalHero).toBe("oona");
    expect(enemyKindForRoom(20)).toBe("wardKeeper");
    const enemy = createEnemy("wardKeeper");
    expect(enemy.name).toContain("custodio");
    expect(enemy.getObjectByName("wardkeeper-tag")).toBeDefined();
    expect(new Combat(20).health).toBe(100);
    const state = fresh();
    state.room = 20;
    state.sanity = 40;
    state.read.push("20");
    state.items.push("Hierbas de serbal");
    const ids = eligibleSanityEvents(state).map((event) => event.id);
    expect(ids).toContain("hospital-occupied-beds");
    expect(ids).toContain("hospital-swapped-chart");
  });
});
