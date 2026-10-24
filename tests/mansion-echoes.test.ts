import { describe, expect, it } from "vitest";
import * as T from "three";
import { CinematicCamera } from "../src/engine/camera";
import { fresh, parseSave } from "../src/systems/state";
import { World } from "../src/world/scene";
import {
  activeMansionEchoes,
  mansionEchoes,
} from "../src/world/mansion-echoes";
import { reachableFromEntrance } from "./room-navigation";

describe("historical changes to the 1927 mansion", () => {
  it("gives all eleven historical artefacts and Élise's reconciliation a distinct visible consequence", () => {
    expect(mansionEchoes).toHaveLength(12);
    expect(new Set(mansionEchoes.map((echo) => echo.item)).size).toBe(12);
    expect(new Set(mansionEchoes.map((echo) => echo.id)).size).toBe(12);
    expect(activeMansionEchoes([])).toHaveLength(0);
    const items = mansionEchoes.map((echo) => echo.item);
    for (const room of new Set(mansionEchoes.map((echo) => echo.room))) {
      const base = new World(room, [], [], []);
      const world = new World(room, items, [], []);
      expect(world.obstacles).toEqual(base.obstacles);
      for (const echo of activeMansionEchoes(items, room)) {
        const object = world.objects.find(
          (entry) => entry.id === `mansion-echo-${echo.id}`,
        );
        expect(object).toBeDefined();
        expect(world.scene.getObjectByName(`mansion-echo-${echo.id}`)).toBe(
          object?.mesh,
        );
        expect(object?.mesh?.children.length).toBeGreaterThanOrEqual(2);
        expect(object?.mesh?.children.length).toBeLessThan(8);
        expect(reachableFromEntrance(world.obstacles, echo)).toBe(true);
        expect(world.nearest(echo.x, echo.z, 1.9)?.id).toBe(
          `mansion-echo-${echo.id}`,
        );
        const camera = new T.PerspectiveCamera(58, 16 / 9);
        const focus = new T.Vector3(echo.x, 1.25, echo.z);
        new CinematicCamera().update(
          camera,
          echo.x,
          echo.z,
          room,
          0,
          false,
          world.obstacles,
          { focus },
        );
        camera.updateMatrixWorld();
        const projected = focus.project(camera);
        expect(Math.abs(projected.x)).toBeLessThan(0.85);
        expect(Math.abs(projected.y)).toBeLessThan(0.85);
      }
      base.dispose();
      world.dispose();
    }
  });

  it("restores changes from an old save without changing the save schema", () => {
    const old = fresh();
    old.items.push("Tablilla del intervalo", "Acta original de Inés");
    const restored = parseSave(JSON.stringify(old));
    expect(restored).not.toBeNull();
    expect(activeMansionEchoes(restored!.items).map((echo) => echo.id)).toEqual(
      ["roman", "ines"],
    );
    const vestibule = new World(0, restored!.items, [], []);
    expect(vestibule.objects.some((o) => o.id === "mansion-echo-roman")).toBe(
      true,
    );
    expect(vestibule.objects.some((o) => o.id === "mansion-echo-emile")).toBe(
      false,
    );
    vestibule.dispose();
  });
});
