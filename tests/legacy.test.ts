import { describe, expect, it } from "vitest";
import { fresh, parseSave } from "../src/systems/state";
import { legacy, reconcileLegacy, legacyEnding } from "../src/systems/legacy";
import { World } from "../src/world/scene";

describe("Fase 4.4 — consecuencias entre épocas", () => {
  it("keeps the original campaign accessible without historical progress", () => {
    const s = fresh();
    expect(legacy(s).complete).toBe(false);
    expect(reconcileLegacy(s)).toBe("missing");
    expect(legacyEnding(s)).toBeNull();
    const world = new World(0, s.items, s.seals, s.read);
    expect(world.objects.some((o) => o.id === "legacy-desk")).toBe(true);
    expect(world.objects.some((o) => o.id === "legacy-passage")).toBe(false);
    expect(world.objects.some((o) => o.id === "next")).toBe(true);
    world.dispose();
  });
  it("reconciles exactly once, restores sanity and opens both ends of shortcut", () => {
    const s = fresh();
    s.sanity = 75;
    s.items.push("Tablilla del intervalo", "Códice de Montfort");
    expect(legacy(s).complete).toBe(true);
    expect(reconcileLegacy(s)).toBe("reconciled");
    expect(s.sanity).toBe(95);
    expect(reconcileLegacy(s)).toBe("already");
    expect(
      s.items.filter((item) => item === "Memoria reconciliada"),
    ).toHaveLength(1);
    expect(s.sanity).toBe(95);
    const entrance = new World(0, s.items, s.seals, s.read);
    expect(
      entrance.objects.find((o) => o.id === "legacy-passage")?.target,
    ).toBe(5);
    entrance.dispose();
    const archive = new World(5, s.items, s.seals, s.read);
    expect(archive.objects.find((o) => o.id === "legacy-back")?.target).toBe(0);
    archive.dispose();
    expect(parseSave(JSON.stringify(s))).toEqual(s);
  });
  it("requires both reconciled evidence and Adrien's discovery for third ending", () => {
    const s = fresh();
    s.items.push("Tablilla del intervalo", "Códice de Montfort");
    reconcileLegacy(s);
    expect(legacyEnding(s)).toBeNull();
    s.phase2.discoveries.push("adrien");
    expect(legacyEnding(s)?.text).toContain("Lucius");
    const ruins = new World(4, s.items, s.seals, s.read);
    expect(ruins.objects.some((o) => o.kind === "end")).toBe(true);
    ruins.dispose();
    expect(parseSave(JSON.stringify(s))).toEqual(s);
  });
});
