import { describe, expect, it } from "vitest";
import {
  chapters,
  completeChapter,
  romanObjective,
} from "../src/systems/campaign";
import { fresh, parseSave } from "../src/systems/state";

describe("campaña histórica", () => {
  it("conecta doce capítulos y solo registra escenas existentes como producción", () => {
    expect(chapters).toHaveLength(12);
    expect(new Set(chapters.map((chapter) => chapter.id)).size).toBe(12);
    chapters.forEach((chapter, index) => {
      expect(chapter.prerequisite).toBe(index ? chapters[index - 1].id : null);
      expect(chapter.status === "draft").toBe(chapter.room === null);
    });
  });

  it("migra v1 sin perder inventario, pistas, combate ni progreso lateral", () => {
    const old = fresh() as unknown as Record<string, unknown>;
    old.version = 1;
    old.room = 8;
    old.items = ["Marca de Varro"];
    old.read = ["8"];
    old.defeated = ["enemy8"];
    delete old.campaign;
    const migrated = parseSave(JSON.stringify(old));
    expect(migrated?.version).toBe(2);
    expect(migrated?.campaign.visited).toContain("roman-189");
    expect(migrated?.items).toEqual(old.items);
    expect(migrated?.read).toEqual(old.read);
    expect(migrated?.defeated).toEqual(old.defeated);
    expect(migrated?.phase2).toEqual(old.phase2);
  });

  it("rechaza capítulos de diseño inyectados en un guardado", () => {
    const state = fresh();
    state.campaign.visited.push("mosaic-312" as never);
    expect(parseSave(JSON.stringify(state))).toBeNull();
  });

  it("exige investigación, cordura, puzle, combate y tablilla antes de concluir", () => {
    const state = fresh();
    expect(romanObjective(state)).toMatch(/lee/);
    state.read.push("8");
    expect(romanObjective(state)).toMatch(/formación/);
    state.campaign.witnessed.push("roman-formation");
    expect(romanObjective(state)).toMatch(/Ordena/);
    state.items.push("Marca de Varro");
    expect(romanObjective(state)).toMatch(/centurión/);
    state.defeated.push("enemy8");
    expect(romanObjective(state)).toMatch(/tablilla/);
    state.items.push("Tablilla del intervalo");
    expect(romanObjective(state)).toMatch(/Regresa/);
    completeChapter(state.campaign, "roman-189");
    expect(parseSave(JSON.stringify(state))?.campaign.completed).toEqual([
      "roman-189",
    ]);
  });
});
