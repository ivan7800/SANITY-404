import { describe, expect, it } from "vitest";
import { World, names } from "../src/world/scene";
import { isabelleDeMontfort } from "../src/world/isabelle";
import { enemyKindForRoom, createEnemy } from "../src/world/enemies";
import { Combat } from "../src/systems/combat";
import { fresh, parseSave, blocked } from "../src/systems/state";
import { notes } from "../src/world/narrative";
import { type Rig, animateCharacter } from "../src/world/character";

describe("Fase 4.3 — Isabelle de Montfort", () => {
  it("adds navigable monastery and scriptorium with return routes", () => {
    const hall = new World(0, [], [], []);
    expect(hall.objects.find(o => o.id === "medieval-portal")?.target).toBe(9);
    hall.dispose();
    const cloister = new World(9, [], [], []);
    expect(cloister.objects.find(o => o.id === "medieval-return")?.target).toBe(0);
    expect(cloister.objects.find(o => o.id === "medieval-scriptorium")?.target).toBe(10);
    expect(blocked(0, 5.2, cloister.obstacles)).toBe(false);
    cloister.dispose();
    const scriptorium = new World(10, [], [], []);
    expect(scriptorium.objects.find(o => o.id === "medieval-back")?.target).toBe(9);
    expect(scriptorium.objects.find(o => o.id === "medieval-manuscript")?.kind).toBe("medievalPuzzle");
    expect(scriptorium.objects.find(o => o.id === "medieval-codex")?.value).toBe("Códice de Montfort");
    scriptorium.dispose();
  });
  it("uses a custom animated protagonist and a distinct plague enemy", () => {
    const isabelle = isabelleDeMontfort();
    const rig = isabelle.userData.rig as Rig;
    expect(isabelle.name).toContain("Isabelle");
    expect(rig.coat.visible).toBe(false);
    animateCharacter(isabelle, 0.2, true, 0.2, false, 0, false, 1/60);
    expect(Number.isFinite(rig.rightArm.rotation.x)).toBe(true);
    expect(enemyKindForRoom(9)).toBe("plagueScribe");
    expect(enemyKindForRoom(10)).toBe("plagueScribe");
    expect(createEnemy("plagueScribe").name).toContain("copista");
    expect(new Combat(10).health).toBe(85);
  });
  it("keeps medieval memories in old-version compatible saves", () => {
    const state = fresh();
    state.room = 10;
    state.phase2.visited.push(9, 10);
    state.read.push("9", "10");
    state.defeated.push("enemy9", "enemy10");
    state.items.push("Sello de Montfort", "Códice de Montfort");
    state.collected.push("Códice de Montfort");
    expect(parseSave(JSON.stringify(state))).toEqual(state);
    expect(parseSave(JSON.stringify(fresh()))).toEqual(fresh());
    expect(names[10]).toContain("Scriptorium");
    expect(notes[10][1]).toContain("Lucius");
  });
});
