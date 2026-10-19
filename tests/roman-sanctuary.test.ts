import { describe, expect, it } from "vitest";
import { fresh, parseSave } from "../src/systems/state";
import { World, names, subtitles } from "../src/world/scene";
import { notes } from "../src/world/narrative";
import { validPhase2 } from "../src/systems/phase2";

describe("Fase 4.1 — recuerdo romano", () => {
  it("conecta el vestíbulo con Roma y permite regresar", () => {
    const mansion = new World(0, [], [], []);
    const gate = mansion.objects.find((o) => o.id === "roman-portal");
    expect(gate?.target).toBe(8);
    mansion.dispose();
    const rome = new World(8, [], [], []);
    expect(rome.objects.find((o) => o.id === "roman-return")?.target).toBe(0);
    expect(rome.objects.find((o) => o.id === "roman-tablet")?.value).toBe(
      "Tablilla del intervalo",
    );
    expect(rome.scene.getObjectByName("altar-romano")).toBeDefined();
    rome.dispose();
  });

  it("conserva el artefacto y la ubicación en un guardado compatible", () => {
    const state = fresh();
    state.room = 8;
    state.z = 5.2;
    state.items.push("Tablilla del intervalo");
    state.collected.push("Tablilla del intervalo");
    state.read.push("8");
    state.defeated.push("enemy8");
    state.phase2.visited.push(8);
    expect(validPhase2(state.phase2)).toBe(true);
    expect(parseSave(JSON.stringify(state))).toEqual(state);
    expect(parseSave(JSON.stringify(fresh()))).toEqual(fresh());
  });

  it("la nueva sala tiene documento y nombres propios", () => {
    expect(names[8]).toContain("Santuario");
    expect(subtitles[8]).toContain("189");
    expect(notes[8][1]).toContain("Lucius Varro");
  });
});
