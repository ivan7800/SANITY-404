import { describe, expect, it } from "vitest";
import { blocked, fresh, parseSave } from "../src/systems/state";
import {
  coastObjective,
  correctCoastLedger,
  completeChapter,
} from "../src/systems/campaign";
import { Combat } from "../src/systems/combat";
import { eligibleSanityEvents } from "../src/systems/sanity";
import { createEnemy, enemyKindForRoom } from "../src/world/enemies";
import { maeve } from "../src/world/maeve";
import { World } from "../src/world/scene";

describe("archivo costero, año 537", () => {
  it("abre el portal tras Aurelia y deja accesibles las dos salas", () => {
    const state = fresh();
    const closed = new World(
      0,
      state.items,
      [],
      [],
      [],
      1,
      state.phase2,
      state.campaign,
    );
    expect(closed.objects.some((object) => object.id === "coast-portal")).toBe(
      false,
    );
    closed.dispose();
    completeChapter(state.campaign, "roman-189");
    completeChapter(state.campaign, "mosaic-312");
    const mansion = new World(
      0,
      state.items,
      [],
      [],
      [],
      1,
      state.phase2,
      state.campaign,
    );
    const portal = mansion.objects.find(
      (object) => object.id === "coast-portal",
    );
    expect(portal?.target).toBe(13);
    expect(blocked(portal!.x, portal!.z, mansion.obstacles)).toBe(false);
    mansion.dispose();
    for (const room of [13, 14]) {
      const world = new World(
        room,
        state.items,
        [],
        [],
        [],
        1,
        state.phase2,
        state.campaign,
      );
      for (const object of world.objects)
        expect(blocked(object.x, object.z, world.obstacles), object.id).toBe(
          false,
        );
      expect(
        world.objects.find(
          (object) =>
            object.id === (room === 13 ? "coast-vault" : "coast-back"),
        ),
      ).toBeDefined();
      world.dispose();
    }
  });

  it("cruza documentos y mareas una sola vez, guarda lista y conclusión", () => {
    const state = fresh();
    state.room = 13;
    state.phase2.visited.push(13);
    state.campaign.visited.push("coast-537");
    expect(coastObjective(state)).toMatch(/libro/);
    expect(correctCoastLedger(state, 2)).toBe("locked");
    state.read.push("13");
    state.items.push("Tabla de mareas");
    expect(coastObjective(state)).toMatch(/depósito/);
    state.room = 14;
    state.phase2.visited.push(14);
    state.read.push("14");
    expect(correctCoastLedger(state, 1)).toBe("wrong");
    expect(state.sanity).toBe(94);
    expect(correctCoastLedger(state, 2)).toBe("solved");
    expect(correctCoastLedger(state, 2)).toBe("already");
    expect(coastObjective(state)).toMatch(/custodio/);
    state.defeated.push("enemy14");
    state.items.push("Lista de pasajeros");
    state.collected.push("Lista de pasajeros");
    expect(coastObjective(state)).toMatch(/Evacúa/);
    completeChapter(state.campaign, "coast-537");
    expect(parseSave(JSON.stringify(state))).toEqual(state);
  });

  it("diferencia a Maeve, al ahogado y los eventos de cordura", () => {
    expect(maeve().userData.historicalHero).toBe("maeve");
    expect(enemyKindForRoom(14)).toBe("drowned");
    expect(createEnemy("drowned").name).toContain("ahogado");
    expect(new Combat(14).health).toBe(88);
    const state = fresh();
    state.room = 14;
    state.sanity = 40;
    state.read.push("14");
    state.items.push("Tabla de mareas");
    expect(eligibleSanityEvents(state).map((event) => event.id)).toContain(
      "coast-passengers",
    );
    expect(eligibleSanityEvents(state).map((event) => event.id)).toContain(
      "coast-upward-rain",
    );
  });
});
