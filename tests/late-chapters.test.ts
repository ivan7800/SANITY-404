import { describe, expect, it } from "vitest";
import { completeChapter, historicalProofs } from "../src/systems/campaign";
import {
  lateChapters,
  lateArtifactUnlocked,
  inspectLateEvidence,
  lateEvidenceCount,
  lateExitUnlocked,
  lateObjective,
  latePuzzleStage,
  solveLatePuzzle,
} from "../src/systems/late-chapters";
import { eligibleSanityEvents, Sanity } from "../src/systems/sanity";
import { blocked, fresh, parseSave } from "../src/systems/state";
import { legacy, legacyEnding, reconcileLegacy } from "../src/systems/legacy";
import {
  enemyKindForRoom,
  createEnemy,
  animateEnemyStyle,
} from "../src/world/enemies";
import type { Rig } from "../src/world/character";
import { lateHero } from "../src/world/late-chapters";
import { World } from "../src/world/scene";
import { reachableFromEntrance } from "./room-navigation";
import * as T from "three";

describe("1491, 1610, 1786 y 1899", () => {
  it("encadena los cuatro portales y conserva accesibles los objetos de cada sala", () => {
    const state = fresh();
    completeChapter(state.campaign, "abbey-1348");
    completeChapter(state.campaign, "hospital-1217");
    for (const chapter of lateChapters) {
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
        (object) => object.id === `${chapter.id}-portal`,
      );
      expect(portal?.target).toBe(chapter.room);
      expect(blocked(portal!.x, portal!.z, mansion.obstacles), portal!.id).toBe(
        true,
      );
      expect(
        reachableFromEntrance(mansion.obstacles, portal!, { x: 0, z: 4.4 }),
        portal!.id,
      ).toBe(true);
      mansion.dispose();
      for (const room of [chapter.room, chapter.room + 1]) {
        const world = new World(room, [], [], []);
        expect(
          world.scene.getObjectByName(
            `landmark-${chapter.id}-${room === chapter.room ? "outer" : "inner"}`,
          ),
        ).toBeDefined();
        for (const object of world.objects) {
          expect(object.collider, object.id).toBeDefined();
          expect(
            reachableFromEntrance(world.obstacles, object),
            object.id,
          ).toBe(true);
        }
        world.dispose();
      }
      completeChapter(state.campaign, chapter.id);
    }
  });

  it.each(lateChapters)(
    "$year exige pistas, puzle, combate y prueba persistente",
    (chapter) => {
      const state = fresh();
      state.room = chapter.room + 1;
      state.phase2.visited.push(chapter.room, chapter.room + 1);
      state.campaign.visited.push(chapter.id);
      expect(lateObjective(state)).toBe(chapter.entrance);
      expect(lateArtifactUnlocked(state, chapter)).toBe(false);
      expect(lateExitUnlocked(state, chapter)).toBe(false);
      expect(solveLatePuzzle(state, chapter, chapter.order[0])).toBe("locked");
      state.read.push(String(chapter.room), String(chapter.room + 1));
      state.items.push(chapter.clue);
      expect(lateObjective(state)).toMatch(/pruebas materiales/);
      expect(inspectLateEvidence(state, chapter, 0)).toBe(true);
      expect(inspectLateEvidence(state, chapter, 0)).toBe(false);
      expect(lateEvidenceCount(state, chapter)).toBe(1);
      expect(solveLatePuzzle(state, chapter, chapter.order[0])).toBe("locked");
      expect(inspectLateEvidence(state, chapter, 1)).toBe(true);
      expect(solveLatePuzzle(state, chapter, (chapter.order[0] + 1) % 3)).toBe(
        "wrong",
      );
      expect(state.sanity).toBe(94);
      expect(solveLatePuzzle(state, chapter, chapter.order[0])).toBe("correct");
      expect(latePuzzleStage(state, chapter)).toBe(1);
      expect(parseSave(JSON.stringify(state))).toEqual(state);
      expect(solveLatePuzzle(state, chapter, (chapter.order[1] + 1) % 3)).toBe(
        "wrong",
      );
      expect(latePuzzleStage(state, chapter)).toBe(0);
      expect(lateEvidenceCount(state, chapter)).toBe(2);
      expect(solveLatePuzzle(state, chapter, chapter.order[0])).toBe("correct");
      expect(solveLatePuzzle(state, chapter, chapter.order[1])).toBe("correct");
      expect(latePuzzleStage(state, chapter)).toBe(2);
      expect(solveLatePuzzle(state, chapter, chapter.order[2])).toBe("solved");
      expect(lateObjective(state)).toBe(chapter.fight);
      expect(lateArtifactUnlocked(state, chapter)).toBe(false);
      state.defeated.push(`enemy${chapter.room + 1}`);
      expect(lateArtifactUnlocked(state, chapter)).toBe(true);
      expect(lateObjective(state)).toBe(chapter.artifactTask);
      state.items.push(chapter.artifact);
      expect(lateExitUnlocked(state, chapter)).toBe(true);
      expect(lateObjective(state)).toMatch(/Regresa/);
      completeChapter(state.campaign, chapter.id);
      expect(parseSave(JSON.stringify(state))).toEqual(state);
      expect(parseSave(JSON.stringify({ ...state, room: 29 }))).toBeNull();
    },
  );

  it.each(lateChapters)(
    "$year tiene protagonista, enemigo y efecto de cordura propios",
    (chapter) => {
      expect(lateHero(chapter).userData.historicalHero).toBe(chapter.id);
      expect(
        lateHero(chapter).getObjectByName(`silhouette-${chapter.id}`),
      ).toBeDefined();
      const kind = enemyKindForRoom(chapter.room + 1);
      const enemy = createEnemy(kind);
      expect(enemy.name).not.toBe("El desnombrado");
      expect(enemy.getObjectByName(`late-enemy-${kind}`)).toBeDefined();
      animateEnemyStyle(enemy, 1, kind, "windup", 1);
      expect((enemy.userData.rig as Rig).rightArm.rotation.x).toBeLessThan(
        -1.3,
      );
      const state = fresh();
      state.room = chapter.room + 1;
      state.sanity = 40;
      state.read.push(String(chapter.room));
      expect(
        eligibleSanityEvents(state).some((event) =>
          event.rooms.includes(chapter.room),
        ),
      ).toBe(true);
    },
  );

  it("las cuatro pruebas alteran el diario y el epílogo sin romper guardados v1", () => {
    const old = fresh() as unknown as Record<string, unknown>;
    old.version = 1;
    old.room = 8;
    delete old.campaign;
    const migrated = parseSave(JSON.stringify(old));
    expect(migrated?.version).toBe(2);
    const state = fresh();
    state.items.push(
      "Tablilla del intervalo",
      "Códice de Montfort",
      ...lateChapters.map((chapter) => chapter.artifact),
    );
    expect(reconcileLegacy(state)).toBe("reconciled");
    state.phase2.discoveries.push("adrien");
    state.items.push("Promesa de Isabelle");
    for (const [id, artifact] of historicalProofs) {
      completeChapter(state.campaign, id);
      if (!state.items.includes(artifact)) state.items.push(artifact);
    }
    for (const name of ["Tomás", "Inés", "Amara", "Émile"])
      expect(legacy(state).clue).toContain(name);
    const ending = legacyEnding(state)?.text ?? "";
    for (const name of ["Tomás", "Inés", "Amara", "Émile"])
      expect(ending).toContain(name);
    expect(parseSave(JSON.stringify(state))).toEqual(state);
  });

  it("un guardado v2 que ya resolvió el mecanismo conserva su salida", () => {
    const chapter = lateChapters[0];
    const state = fresh();
    state.room = chapter.room + 1;
    state.phase2.visited.push(chapter.room, chapter.room + 1);
    state.campaign.visited.push(chapter.id);
    state.read.push(String(chapter.room), String(chapter.room + 1));
    state.items.push(chapter.clue, chapter.solution);
    const restored = parseSave(JSON.stringify(state));
    expect(restored).not.toBeNull();
    expect(lateObjective(restored!)).toBe(chapter.fight);
    expect(solveLatePuzzle(restored!, chapter, chapter.order[0])).toBe(
      "already",
    );
    state.campaign.witnessed.push(`${chapter.id}-step-2`);
    expect(parseSave(JSON.stringify(state))).toBeNull();
  });

  it.each([
    [22, "press-reversed-type", "sanity-book"],
    [24, "veyr-vanishing-name", "late-veyr-portrait"],
    [26, "theatre-phantom-chorus", "apparition"],
    [28, "photo-unfixed-door", "sanity-false-door"],
  ] as const)(
    "la sala %i activa su segunda manifestación reversible",
    (room, id, visual) => {
      const state = fresh();
      state.room = room;
      state.sanity = 40;
      state.read.push(String(room - 1), String(room));
      const world = new World(room, [], [], []);
      const sanity = new Sanity(world);
      const options = {
        reduced: false,
        reduceFlashes: true,
        reduceDistortion: false,
        reduceAudio: true,
      };
      state.elapsed = 8;
      sanity.update(
        state,
        world,
        options,
        () => {},
        () => {},
      );
      if (visual === "late-veyr-portrait")
        expect(
          (world.scene.getObjectByName(visual) as import("three").Mesh)
            .material,
        ).toHaveProperty("opacity", 0.12);
      state.elapsed = 25;
      sanity.update(
        state,
        world,
        options,
        () => {},
        () => {},
      );
      expect(sanity.activeId).toBe(id);
      if (visual === "apparition") expect(sanity.apparition.visible).toBe(true);
      else if (visual === "late-veyr-portrait")
        expect(
          (world.scene.getObjectByName(visual) as import("three").Mesh)
            .material,
        ).toHaveProperty("opacity", 1);
      else expect(world.scene.getObjectByName(visual)?.visible).toBe(true);
      state.elapsed = 29;
      sanity.update(
        state,
        world,
        options,
        () => {},
        () => {},
      );
      if (visual !== "late-veyr-portrait" && visual !== "apparition")
        expect(world.scene.getObjectByName(visual)?.visible).toBe(false);
      world.dispose();
    },
  );

  it("el perfil Bajo reduce geometría decorativa sin quitar pistas ni salidas", () => {
    const triangles = (world: World) => {
      let count = 0;
      world.scene.traverse((object) => {
        if (object instanceof T.Mesh)
          count +=
            (object.geometry.index?.count ??
              object.geometry.getAttribute("position").count) / 3;
      });
      return count;
    };
    for (const chapter of lateChapters) {
      const low = new World(chapter.room + 1, [], [], [], [], 1);
      const high = new World(chapter.room + 1, [], [], [], [], 1.3);
      expect(triangles(low)).toBeLessThan(triangles(high));
      expect(low.objects.map((object) => object.id)).toEqual(
        high.objects.map((object) => object.id),
      );
      low.dispose();
      high.dispose();
    }
  });
});
