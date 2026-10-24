import { describe, expect, it, vi } from "vitest";
import * as T from "three";
import {
  PsychologicalDirector,
  Sanity,
  eligibleSanityEvents,
} from "../src/systems/sanity";
import { Audio } from "../src/systems/audio";
import { fresh, parseSave } from "../src/systems/state";
import { World } from "../src/world/scene";
import { character } from "../src/world/character";

describe("Fase 8: director psicológico", () => {
  it("reserva los sucesos del rellano para la planta, sala y pruebas correctas", () => {
    const state = fresh();
    state.sanity = 40;
    state.x = -5;
    state.z = -3;
    expect(
      eligibleSanityEvents(state).some(
        (event) => event.id === "upper-crawler-scrape",
      ),
    ).toBe(false);
    state.floor = 1;
    expect(
      eligibleSanityEvents(state).some(
        (event) => event.id === "upper-crawler-scrape",
      ),
    ).toBe(true);
    state.x = 5;
    state.z = -5.8;
    expect(
      eligibleSanityEvents(state).some(
        (event) => event.id === "upper-widow-veil",
      ),
    ).toBe(false);
    state.items.push("Folio del rellano");
    expect(
      eligibleSanityEvents(state).some(
        (event) => event.id === "upper-widow-veil",
      ),
    ).toBe(true);
  });
  it("sitúa la aparición de la galería en la misma altura que Élise", () => {
    const state = fresh();
    state.floor = 1;
    state.x = 2;
    state.z = -5.8;
    state.sanity = 60;
    state.elapsed = 8;
    const world = new World(0, [], [], []);
    const sanity = new Sanity(world);
    sanity.update(
      state,
      world,
      {
        reduced: false,
        reduceFlashes: true,
        reduceDistortion: true,
        reduceAudio: true,
      },
      () => {},
      () => {},
    );
    expect(sanity.activeId).toBe("upper-guest-turn");
    expect(sanity.apparition.visible).toBe(true);
    expect(sanity.apparition.position.y).toBe(2.64);
    expect(sanity.apparition.position.z).toBe(-5.8);
    world.dispose();
  });
  it("pliega temporalmente la galería sin modificar colisiones ni guardado", () => {
    const state = fresh();
    state.sanity = 50;
    state.elapsed = 8;
    const world = new World(0, [], [], []);
    const obstacles = JSON.stringify(world.obstacles);
    const progress = JSON.stringify(state);
    const sanity = new Sanity(world);
    sanity.update(
      state,
      world,
      {
        reduced: false,
        reduceFlashes: true,
        reduceDistortion: false,
        reduceAudio: true,
      },
      () => {},
      () => {},
    );
    expect(sanity.activeId).toBe("mansion-folded-gallery");
    expect(world.scene.getObjectByName("sanity-folded-gallery")?.visible).toBe(
      true,
    );
    expect(
      world.scene.getObjectByName("sanity-folded-gallery")?.children,
    ).toHaveLength(1);
    expect(JSON.stringify(world.obstacles)).toBe(obstacles);
    expect(JSON.stringify(state)).toBe(progress);
    state.elapsed = 12;
    sanity.update(
      state,
      world,
      {
        reduced: false,
        reduceFlashes: true,
        reduceDistortion: false,
        reduceAudio: true,
      },
      () => {},
      () => {},
    );
    expect(world.scene.getObjectByName("sanity-folded-gallery")?.visible).toBe(
      false,
    );
    world.dispose();
  });
  it("agrupa la aparición sin perder triángulos ni alterar su silueta", () => {
    const world = new World(0, [], [], []);
    const original = character(true);
    const apparition = new Sanity(world).apparition;
    const measure = (root: T.Group) => {
      root.updateMatrixWorld(true);
      const bounds = new T.Box3();
      let triangles = 0;
      let draws = 0;
      const vertex = new T.Vector3();
      root.traverse((object) => {
        if (!(object instanceof T.Mesh) || !object.visible) return;
        draws++;
        const position = object.geometry.attributes
          .position as T.BufferAttribute;
        triangles += object.geometry.index
          ? object.geometry.index.count / 3
          : position.count / 3;
        for (let i = 0; i < position.count; i++) {
          vertex
            .fromBufferAttribute(position, i)
            .applyMatrix4(object.matrixWorld);
          bounds.expandByPoint(vertex);
        }
      });
      return { bounds, triangles, draws };
    };
    const before = measure(original);
    const after = measure(apparition);
    expect(after.triangles).toBe(before.triangles);
    expect(after.draws).toBeLessThan(before.draws);
    for (const axis of ["x", "y", "z"] as const) {
      expect(after.bounds.min[axis]).toBeCloseTo(before.bounds.min[axis], 4);
      expect(after.bounds.max[axis]).toBeCloseTo(before.bounds.max[axis], 4);
    }
    world.dispose();
  });

  it("respeta entrada, sala, época, progreso, prioridad y frecuencia", () => {
    const state = fresh();
    state.room = 8;
    state.sanity = 40;
    state.read.push("8");
    state.elapsed = 70;
    const director = new PsychologicalDirector(70);
    expect(director.choose(state)).toBeUndefined();
    state.elapsed = 78;
    expect(director.choose(state)?.id).toBe("roman-ritual");
    expect(director.choose(state)).toBeUndefined();
    state.elapsed = 89;
    expect(director.choose(state)).toBeUndefined();
    state.elapsed = 94;
    expect(director.choose(state)?.id).toBe("roman-false-exit");
    state.room = 9;
    state.read.push("9");
    state.elapsed = 110;
    expect(director.choose(state)?.id).toBe("abbey-bell");
    expect(director.choose(state, false)).toBeUndefined();
  });

  it("no repite inmediatamente y puede recuperar un evento tras su enfriamiento", () => {
    const state = fresh();
    state.room = 0;
    state.sanity = 30;
    const director = new PsychologicalDirector();
    state.elapsed = 8;
    expect(director.choose(state)?.id).toBe("mansion-echo");
    state.elapsed = 20;
    expect(director.choose(state)?.id).toBe("mansion-folded-gallery");
    for (const time of [25, 60, 103]) {
      state.elapsed = time;
      expect(director.choose(state)).toBeUndefined();
    }
    state.elapsed = 108;
    expect(director.choose(state)?.id).toBe("mansion-echo");
  });

  it("cada época produce una manifestación reversible sin tocar progreso ni colisiones", () => {
    for (const [room, id, read] of [
      [8, "roman-ritual", "8"],
      [9, "abbey-bell", "9"],
      [10, "scriptorium-margin", "10"],
    ] as const) {
      const state = fresh();
      state.room = room;
      state.sanity = 35;
      state.read.push(read);
      const world = new World(room, [], [], state.read);
      const sanity = new Sanity(world);
      const before = JSON.stringify(state);
      const obstacles = JSON.stringify(world.obstacles);
      const objects = JSON.stringify(
        world.objects.map(({ id, kind, target }) => ({ id, kind, target })),
      );
      const glyph = world.scene.getObjectByName(
        room === 8 ? "roman-ritual-sigil" : "abbey-codex-glyph",
      ) as T.Mesh | undefined;
      const initialGlow = glyph
        ? (glyph.material as T.MeshStandardMaterial).emissiveIntensity
        : 0;
      const notify = vi.fn();
      const sound = vi.fn();
      state.elapsed = 8;
      sanity.update(
        state,
        world,
        {
          reduced: false,
          reduceFlashes: true,
          reduceDistortion: true,
          reduceAudio: true,
        },
        notify,
        sound,
      );
      expect(sanity.activeId).toBe(id);
      expect(notify).toHaveBeenCalledOnce();
      expect(sound).not.toHaveBeenCalled();
      expect(JSON.stringify(world.obstacles)).toBe(obstacles);
      expect(
        JSON.stringify(
          world.objects.map(({ id, kind, target }) => ({ id, kind, target })),
        ),
      ).toBe(objects);
      if (room !== 9)
        expect(
          (glyph!.material as T.MeshStandardMaterial).emissiveIntensity,
        ).toBeGreaterThan(initialGlow);
      state.elapsed = 12;
      sanity.update(
        state,
        world,
        {
          reduced: false,
          reduceFlashes: true,
          reduceDistortion: true,
          reduceAudio: true,
        },
        notify,
        sound,
      );
      expect(sanity.apparition.visible).toBe(false);
      expect(sanity["book"].visible).toBe(false);
      if (room !== 9)
        expect(
          (glyph!.material as T.MeshStandardMaterial).emissiveIntensity,
        ).toBe(initialGlow);
      expect(JSON.stringify(state)).not.toBe(before); // only the test clock moved
      expect({ ...state, elapsed: 0 }).toEqual({
        ...JSON.parse(before),
        elapsed: 0,
      });
      world.dispose();
    }
  });

  it("mantiene guardados versión 1 y opciones reducidas sin acontecimientos", () => {
    const legacy = fresh();
    (legacy as { version: number }).version = 1;
    delete (legacy as Partial<typeof legacy>).phase2;
    delete (legacy as Partial<typeof legacy>).campaign;
    const restored = parseSave(JSON.stringify(legacy));
    expect(restored?.version).toBe(2);
    const state = restored!;
    state.room = 8;
    state.sanity = 20;
    state.read.push("8");
    state.elapsed = 50;
    const world = new World(8, [], [], state.read);
    const sanity = new Sanity(world);
    const sound = vi.fn();
    sanity.update(
      state,
      world,
      {
        reduced: true,
        reduceFlashes: true,
        reduceDistortion: true,
        reduceAudio: true,
      },
      vi.fn(),
      sound,
    );
    expect(sanity.eventCount).toBe(0);
    expect(sound).not.toHaveBeenCalled();
    expect(
      world.lights.every((light: T.PointLight) =>
        Number.isFinite(light.intensity),
      ),
    ).toBe(true);
    world.dispose();
  });

  it("las señales de época reutilizan el audio existente y sus voces limitadas", () => {
    const audio = new Audio();
    const tone = vi.spyOn(audio, "tone");
    audio.sanityEvent("abbey-bell");
    audio.sanityEvent("roman-ritual");
    audio.sanityEvent("scriptorium-margin");
    expect(tone).toHaveBeenCalledTimes(5);
    expect(audio.ctx).toBeUndefined();
    expect(audio.activeVoices).toBe(0);
  });
});
