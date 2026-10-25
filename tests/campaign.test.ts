import { describe, expect, it } from "vitest";
import {
  chapters,
  completeChapter,
  mosaicObjective,
  abbeyObjective,
  attemptMosaicPattern,
  romanEchoes,
  romanObjective,
  historicalEndingReadiness,
  historicalProofs,
  chapterIntroductions,
} from "../src/systems/campaign";
import { blocked, fresh, parseSave } from "../src/systems/state";
import { World } from "../src/world/scene";
import { eligibleSanityEvents } from "../src/systems/sanity";

describe("campaña histórica", () => {
  it("conecta doce capítulos y solo registra escenas existentes como producción", () => {
    expect(chapters).toHaveLength(12);
    expect(new Set(chapters.map((chapter) => chapter.id)).size).toBe(12);
    chapters.forEach((chapter, index) => {
      expect(chapter.prerequisite).toBe(index ? chapters[index - 1].id : null);
      expect(chapter.status).toBe("production");
      expect(chapter.room).not.toBeNull();
    });
  });

  it("presenta cada investigación y reserva el final histórico para las once pruebas y la decisión", () => {
    const state = fresh();
    expect(Object.keys(chapterIntroductions)).toHaveLength(11);
    expect(historicalEndingReadiness(state).missingChapters).toHaveLength(11);
    for (const [id, artifact] of historicalProofs) {
      completeChapter(state.campaign, id);
      state.items.push(artifact);
    }
    expect(historicalEndingReadiness(state).ready).toBe(false);
    state.items.push("Memoria reconciliada");
    state.phase2.discoveries.push("adrien");
    expect(historicalEndingReadiness(state).missingChoice).toBe(true);
    state.items.push("Promesa de Isabelle");
    expect(historicalEndingReadiness(state).ready).toBe(true);
    state.items.splice(state.items.indexOf("Placa de la puerta"), 1);
    expect(historicalEndingReadiness(state).missingArtifacts).toContain(
      "Placa de la puerta",
    );
  });

  it("Isabelle conserva su recuerdo temprano, pero Tomás espera a Oona salvo progreso previo", () => {
    const state = fresh();
    completeChapter(state.campaign, "abbey-1348");
    const world = () =>
      new World(
        0,
        state.items,
        state.seals,
        state.read,
        state.collected,
        1,
        state.phase2,
        state.campaign,
      );
    let mansion = world();
    expect(
      mansion.objects.some((object) => object.id === "medieval-portal"),
    ).toBe(true);
    expect(
      mansion.objects.some((object) => object.id === "press-1491-portal"),
    ).toBe(false);
    mansion.dispose();
    state.campaign.visited.push("press-1491");
    mansion = world();
    expect(
      mansion.objects.some((object) => object.id === "press-1491-portal"),
    ).toBe(true);
    mansion.dispose();
    state.campaign.visited.pop();
    completeChapter(state.campaign, "hospital-1217");
    mansion = world();
    expect(
      mansion.objects.some((object) => object.id === "press-1491-portal"),
    ).toBe(true);
    mansion.dispose();
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

  it("rechaza capítulos desconocidos inyectados en un guardado", () => {
    const state = fresh();
    state.campaign.visited.push("future-2030" as never);
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

  it("restaura los testimonios romanos pendientes tras cargar", () => {
    const state = fresh();
    state.room = 8;
    state.campaign.visited.push("roman-189");
    state.campaign.witnessed.push(romanEchoes[0].id);
    const restored = parseSave(JSON.stringify(state));
    expect(restored?.campaign.witnessed).toEqual([romanEchoes[0].id]);
    const world = new World(
      8,
      [],
      [],
      [],
      [],
      1,
      undefined,
      restored!.campaign,
    );
    expect(
      world.objects
        .filter((object) => object.kind === "romanEcho")
        .map((object) => object.id),
    ).toEqual(romanEchoes.slice(1).map((echo) => echo.id));
    world.dispose();
  });

  it("el doble romano aparece solo al conocer la marca con cordura baja", () => {
    const state = fresh();
    state.room = 8;
    state.sanity = 60;
    expect(
      eligibleSanityEvents(state).some((event) => event.id === "roman-double"),
    ).toBe(false);
    state.items.push("Marca de Varro");
    expect(
      eligibleSanityEvents(state).some((event) => event.id === "roman-double"),
    ).toBe(true);
  });

  it("el taller de 312 enlaza dos salas, guarda el molde y conserva los guardados antiguos", () => {
    const old = fresh();
    expect(parseSave(JSON.stringify(old))).toEqual(old);
    const mansion = new World(0, [], [], []);
    expect(
      mansion.objects.some((object) => object.id === "mosaic-portal"),
    ).toBe(false);
    mansion.dispose();
    completeChapter(old.campaign, "roman-189");
    const openMansion = new World(
      0,
      old.items,
      [],
      [],
      [],
      1,
      old.phase2,
      old.campaign,
    );
    const portal = openMansion.objects.find(
      (object) => object.id === "mosaic-portal",
    );
    expect(portal?.target).toBe(11);
    expect(blocked(portal!.x, portal!.z, openMansion.obstacles)).toBe(false);
    openMansion.dispose();
    expect(mosaicObjective(old)).toMatch(/registro/);
    old.room = 11;
    old.phase2.visited.push(11);
    old.campaign.visited.push("mosaic-312");
    old.read.push("11");
    expect(mosaicObjective(old)).toMatch(/pigmento/);
    const gallery = new World(
      11,
      old.items,
      [],
      old.read,
      [],
      1,
      old.phase2,
      old.campaign,
    );
    expect(
      gallery.objects.find((object) => object.id === "mosaic-pigment"),
    ).toBeDefined();
    expect(
      gallery.objects.find((object) => object.id === "mosaic-kiln")?.target,
    ).toBe(12);
    gallery.dispose();
    old.items.push("Pigmento de cinabrio", "Boceto recompuesto");
    old.room = 12;
    old.phase2.visited.push(12);
    expect(mosaicObjective(old)).toMatch(/custodio/);
    const kiln = new World(
      12,
      old.items,
      [],
      old.read,
      [],
      1,
      old.phase2,
      old.campaign,
    );
    expect(
      kiln.objects.find((object) => object.id === "mosaic-back")?.target,
    ).toBe(11);
    expect(
      kiln.objects.find((object) => object.id === "mosaic-mold")?.value,
    ).toBe("Molde de Aurelia");
    kiln.dispose();
    old.defeated.push("enemy12");
    old.items.push("Molde de Aurelia");
    old.collected.push("Molde de Aurelia");
    expect(mosaicObjective(old)).toMatch(/Regresa/);
    completeChapter(old.campaign, "mosaic-312");
    expect(parseSave(JSON.stringify(old))).toEqual(old);
  });

  it("la abadía solo queda lista para concluir tras investigación, combate y códice", () => {
    const state = fresh();
    expect(abbeyObjective(state)).toMatch(/registro/);
    state.read.push("9", "10");
    expect(abbeyObjective(state)).toMatch(/Descifra/);
    state.items.push("Sello de Montfort");
    expect(abbeyObjective(state)).toMatch(/copista/);
    state.defeated.push("enemy10");
    expect(abbeyObjective(state)).toMatch(/códice/);
    state.items.push("Códice de Montfort");
    expect(abbeyObjective(state)).toMatch(/Regresa/);
  });

  it("el mosaico rechaza intentos prematuros y fija una sola respuesta persistente", () => {
    const state = fresh();
    expect(attemptMosaicPattern(state, 1)).toBe("locked");
    state.read.push("11");
    state.items.push("Pigmento de cinabrio");
    expect(attemptMosaicPattern(state, 0)).toBe("wrong");
    expect(state.sanity).toBe(95);
    expect(attemptMosaicPattern(state, 1)).toBe("solved");
    expect(attemptMosaicPattern(state, 1)).toBe("already");
    expect(
      state.items.filter((item) => item === "Boceto recompuesto"),
    ).toHaveLength(1);
    expect(parseSave(JSON.stringify(state))?.items).toContain(
      "Boceto recompuesto",
    );
  });
});
