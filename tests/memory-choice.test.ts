import { describe, expect, it } from "vitest";
import { fresh, parseSave } from "../src/systems/state";
import { reconcileLegacy } from "../src/systems/legacy";
import { chosenMemory, chooseMemory, memoryConsequence } from "../src/systems/memory-choice";
import { World } from "../src/world/scene";

describe("Fase 4.4 — decisiones de las tres edades", () => {
  const reconciled = () => {
    const s = fresh();
    s.items.push("Tablilla del intervalo", "Códice de Montfort");
    reconcileLegacy(s);
    return s;
  };

  it("cannot choose before reconciliation and leaves the normal mansion route intact", () => {
    const s = fresh();
    expect(chooseMemory(s, "Juramento de Lucius")).toBe("locked");
    expect(chosenMemory(s)).toBeNull();
    const world = new World(0, s.items, s.seals, s.read);
    expect(world.objects.some((o) => o.id === "next")).toBe(true);
    world.dispose();
  });

  it("Lucius grants health once, stays locked and is saved with its visual effect", () => {
    const s = reconciled();
    s.health = 60;
    expect(chooseMemory(s, "Juramento de Lucius")).toBe("chosen");
    expect(s.health).toBe(90);
    expect(chooseMemory(s, "Promesa de Isabelle")).toBe("already");
    expect(s.health).toBe(90);
    expect(memoryConsequence(s)?.visual).toBe("bronze");
    expect(parseSave(JSON.stringify(s))).toEqual(s);
    const archive = new World(5, s.items, s.seals, s.read);
    expect(archive.objects.some((o) => o.id === "memory-altar")).toBe(true);
    archive.dispose();
  });

  it("Isabelle grants sanity once and invalid saves cannot choose both", () => {
    const s = reconciled();
    s.sanity = 52;
    expect(chooseMemory(s, "Promesa de Isabelle")).toBe("chosen");
    expect(s.sanity).toBe(82);
    expect(memoryConsequence(s)?.visual).toBe("violet");
    expect(parseSave(JSON.stringify(s))).toEqual(s);
    s.items.push("Juramento de Lucius");
    expect(parseSave(JSON.stringify(s))).toBeNull();
  });
});
