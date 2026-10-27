import { describe, expect, it } from "vitest";
import * as T from "three";
import { CinematicCamera } from "../src/engine/camera";
import { blocked } from "../src/systems/state";
import { World } from "../src/world/scene";
import { luciusVarro } from "../src/world/lucius";
import { isabelleDeMontfort } from "../src/world/isabelle";
import { animateCharacter, type Rig } from "../src/world/character";
import { Atmosphere } from "../src/render/atmosphere";
import { reachableFromEntrance } from "./room-navigation";

describe("Fase 6 — remaster visual sin pérdida de jugabilidad", () => {
  it("encuadra las entradas históricas delante del portal de regreso", () => {
    for (const room of [8, 9, 10])
      for (const mode of ["classic", "modern"] as const) {
        const camera = new T.PerspectiveCamera();
        const cinematic = new CinematicCamera();
        cinematic.update(camera, 0, 5, room, 0, false, [], { mode });
        expect(cinematic.zone).toBe("entrada histórica");
        expect(camera.position.z).toBeLessThan(6.1);
        expect(camera.position.x).toBeGreaterThan(2);
      }
  });

  it("mantiene el corredor y los puzles históricos alcanzables", () => {
    for (const room of [8, 9, 10]) {
      const world = new World(room, [], [], [], [], 1);
      expect(blocked(0, 3, world.obstacles)).toBe(false);
      const puzzle = world.objects.find(
        (object) =>
          object.kind === "romanPuzzle" || object.kind === "medievalPuzzle",
      );
      if (puzzle)
        expect(reachableFromEntrance(world.obstacles, puzzle), puzzle.id).toBe(
          true,
        );
      world.dispose();
    }
  });

  it("conserva el combate articulado con vestuario de cada época", () => {
    for (const actor of [luciusVarro(), isabelleDeMontfort()]) {
      const rig = actor.userData.rig as Rig;
      expect(rig.coat.visible).toBe(false);
      expect(rig.weapon.visible).toBe(false);
      expect(rig.coatTails.visible).toBe(true);
      animateCharacter(actor, 0.2, true, 0.15, true, 0, false, 1 / 60);
      expect(rig.rightArm.rotation.x).toBeLessThan(0);
      expect(Number.isFinite(rig.hips.rotation.y)).toBe(true);
    }
  });

  it("respeta efectos reducidos en el polvo de las tres épocas", () => {
    for (const room of [0, 8, 9]) {
      const atmosphere = new Atmosphere(new T.Scene(), 32, room);
      atmosphere.update(1 / 60, 3, true);
      expect(atmosphere.dust.visible).toBe(false);
      atmosphere.update(1 / 60, 3, false);
      expect(atmosphere.dust.visible).toBe(true);
      atmosphere.dispose();
    }
  });
});
