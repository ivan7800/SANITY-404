import * as T from "three";
import type { State } from "./state";
import { character, type World } from "../world/scene";

export interface SanityOptions {
  reduced: boolean;
  reduceFlashes: boolean;
  reduceDistortion: boolean;
  reduceAudio: boolean;
}
export interface SanityEvent {
  id: string;
  rooms: number[];
  threshold: number;
  text: string;
  read?: number;
  discovery?: string;
  item?: string;
  priority?: number;
}
export const sanityEvents: SanityEvent[] = [
  {
    id: "roman-ritual",
    rooms: [8],
    threshold: 85,
    read: 8,
    priority: 5,
    text: "La inscripción del altar repite el signo de la tablilla de Lucius.",
  },
  {
    id: "abbey-bell",
    rooms: [9],
    threshold: 85,
    read: 9,
    priority: 5,
    text: "La campana suena una vez. En el registro falta otro nombre.",
  },
  {
    id: "scriptorium-margin",
    rooms: [10],
    threshold: 80,
    read: 10,
    priority: 5,
    text: "Un margen del códice revela el mismo sello que vio Lucius.",
  },
  {
    id: "mansion-reflection",
    rooms: [6],
    threshold: 75,
    discovery: "adrien",
    priority: 5,
    text: "En el vidrio, Adrien señala la luz de la capilla.",
  },
  {
    id: "roman-witness",
    rooms: [8],
    threshold: 75,
    text: "Una figura de bronce aparece donde Lucius no recuerda haber mirado.",
  },
  {
    id: "roman-false-exit",
    rooms: [8],
    threshold: 45,
    text: "El santuario abre una salida que solo existe en tu memoria.",
  },
  {
    id: "abbey-visitor",
    rooms: [9],
    threshold: 65,
    text: "Una figura inmóvil te espera bajo el arco del claustro.",
  },
  {
    id: "ink-apparition",
    rooms: [10],
    threshold: 55,
    text: "El copista vuelve a aparecer entre los pergaminos.",
  },
  {
    id: "mansion-echo",
    rooms: [0],
    threshold: 35,
    text: "Alguien se mueve junto al portal, pero no proyecta sombra.",
  },
  {
    id: "hushed-index",
    rooms: [1],
    threshold: 75,
    read: 1,
    text: "Una página se vuelve sola en una estantería cerrada.",
  },
  {
    id: "levitating-book",
    rooms: [1],
    threshold: 55,
    text: "Un manuscrito abandona su estante sin hacer ruido.",
  },
  {
    id: "portraits-turn",
    rooms: [5],
    threshold: 70,
    read: 5,
    text: "Los rostros de Veyr miran hacia otra fecha.",
  },
  {
    id: "missing-door",
    rooms: [5],
    threshold: 45,
    text: "Aparece una puerta donde estaba el muro.",
  },
  {
    id: "second-footsteps",
    rooms: [5],
    threshold: 60,
    text: "Otra sombra camina un paso detrás de ti.",
  },
  {
    id: "shadow-without-body",
    rooms: [6],
    threshold: 70,
    text: "Una sombra cruza las plantas sin dueño.",
  },
  {
    id: "glass-double",
    rooms: [6],
    threshold: 50,
    discovery: "adrien",
    text: "El cristal devuelve una figura que no estás mirando.",
  },
  {
    id: "rain-upwards",
    rooms: [6],
    threshold: 40,
    text: "La lluvia asciende por el vidrio.",
  },
  {
    id: "silent-choir",
    rooms: [3],
    threshold: 65,
    read: 3,
    text: "El coro vacío dibuja una voz detrás del altar.",
  },
  {
    id: "unknown-penitent",
    rooms: [3],
    threshold: 40,
    text: "Alguien se arrodilla donde no había nadie.",
  },
  {
    id: "lengthened-aisle",
    rooms: [7],
    threshold: 55,
    text: "El pasillo parece alejar el umbral.",
  },
  {
    id: "breathing-seal",
    rooms: [7],
    threshold: 35,
    read: 7,
    text: "El sello respira al ritmo de tus recuerdos.",
  },
];
export function eligibleSanityEvents(state: State) {
  return sanityEvents.filter(
    (event) =>
      event.rooms.includes(state.room) &&
      state.sanity <= event.threshold &&
      (event.read === undefined || state.read.includes(String(event.read))) &&
      (event.item === undefined || state.items.includes(event.item)) &&
      (event.discovery === undefined ||
        state.phase2.discoveries.includes(event.discovery)),
  );
}

/** Stable event order, with room entry grace, global spacing and per-cue cooldown. */
export class PsychologicalDirector {
  private nextAt: number;
  private last = new Map<string, number>();
  private recent: string[] = [];
  constructor(entryTime = 0) {
    this.nextAt = entryTime + 8;
  }
  choose(state: State, enabled = true): SanityEvent | undefined {
    if (!enabled || state.elapsed < this.nextAt) return;
    const eligible = eligibleSanityEvents(state)
      .filter(
        (event) => state.elapsed - (this.last.get(event.id) ?? -Infinity) >= 48,
      )
      .sort(
        (a, b) =>
          (b.priority ?? 0) - (a.priority ?? 0) ||
          (this.last.get(a.id) ?? -Infinity) -
            (this.last.get(b.id) ?? -Infinity) ||
          a.id.localeCompare(b.id),
      );
    const event = eligible.find(
      (candidate) =>
        !this.recent.includes(candidate.id) ||
        state.elapsed - (this.last.get(candidate.id) ?? -Infinity) >= 96,
    );
    // Recheck after a short interval when progress or sanity has not unlocked a cue.
    if (!event) {
      this.nextAt = state.elapsed + 5;
      return;
    }
    this.last.set(event.id, state.elapsed);
    this.recent.push(event.id);
    if (this.recent.length > 2) this.recent.shift();
    this.nextAt = state.elapsed + (state.sanity < 40 ? 12 : 16);
    return event;
  }
}

/** Events change only perception. None alters collisions, doors or saved progress. */
export class Sanity {
  apparition: T.Group;
  activeId = "";
  eventCount = 0;
  private director: PsychologicalDirector;
  private until = 0;
  private book: T.Mesh;
  private falseDoor: T.Group;
  private shadow: T.Mesh;
  private rain: T.Points;
  private portraits: T.Mesh[] = [];
  private portraitColor = new T.Color();
  private alteredPortraitColor = new T.Color(0x8b6271);
  private ring: T.Object3D | undefined;
  private baseFog = 0;
  private initialLights: number[];
  private eraGlyph?: T.Mesh;
  private glyphIntensity = 0;
  constructor(world: World, entryTime = 0) {
    this.director = new PsychologicalDirector(entryTime);
    this.initialLights = world.lights.map((light) => light.intensity);
    this.apparition = character(true);
    this.apparition.visible = false;
    world.scene.add(this.apparition);
    this.book = new T.Mesh(
      new T.BoxGeometry(0.27, 0.38, 0.08),
      new T.MeshStandardMaterial({
        color: 0x8e735b,
        emissive: 0x343043,
        transparent: true,
        opacity: 0.8,
      }),
    );
    this.book.visible = false;
    world.scene.add(this.book);
    this.falseDoor = new T.Group();
    const dark = new T.MeshStandardMaterial({
      color: 0x171b1b,
      transparent: true,
      opacity: 0.72,
    });
    const brass = new T.MeshStandardMaterial({
      color: 0x8d795e,
      roughness: 0.63,
    });
    const door = new T.Mesh(new T.BoxGeometry(1.45, 2.65, 0.09), dark);
    door.position.y = 1.32;
    this.falseDoor.add(door);
    for (const x of [-0.76, 0.76]) {
      const rail = new T.Mesh(new T.BoxGeometry(0.09, 2.8, 0.12), brass);
      rail.position.set(x, 1.4, 0);
      this.falseDoor.add(rail);
    }
    this.falseDoor.visible = false;
    world.scene.add(this.falseDoor);
    this.shadow = new T.Mesh(
      new T.PlaneGeometry(0.8, 2.2),
      new T.MeshBasicMaterial({
        color: 0x030909,
        transparent: true,
        opacity: 0.36,
        depthWrite: false,
      }),
    );
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.visible = false;
    world.scene.add(this.shadow);
    const positions = new Float32Array(48 * 3);
    for (let i = 0; i < 48; i++) {
      positions[i * 3] = Math.sin(i * 3.7) * 4.8;
      positions[i * 3 + 1] = (i % 12) * 0.36;
      positions[i * 3 + 2] = Math.cos(i * 2.9) * 5.5;
    }
    const geometry = new T.BufferGeometry();
    geometry.setAttribute("position", new T.BufferAttribute(positions, 3));
    this.rain = new T.Points(
      geometry,
      new T.PointsMaterial({
        color: 0x9cc4c4,
        size: 0.045,
        transparent: true,
        opacity: 0.55,
      }),
    );
    this.rain.visible = false;
    world.scene.add(this.rain);
    world.scene.traverse((object) => {
      if (object instanceof T.Mesh && object.name.startsWith("veyr-portrait-"))
        this.portraits.push(object);
    });
    if (this.portraits[0])
      this.portraitColor.copy(
        (this.portraits[0].material as T.MeshStandardMaterial).color,
      );
    this.ring = world.scene.getObjectByName("threshold-ring");
    this.eraGlyph = world.scene.getObjectByName(
      world.room === 8 ? "roman-ritual-sigil" : "abbey-codex-glyph",
    ) as T.Mesh | undefined;
    if (this.eraGlyph)
      this.glyphIntensity = (
        this.eraGlyph.material as T.MeshStandardMaterial
      ).emissiveIntensity;
    this.baseFog = (world.scene.fog as T.FogExp2).density;
  }
  update(
    state: State,
    world: World,
    options: SanityOptions,
    notify: (text: string) => void,
    sound: (event: string) => void,
  ) {
    const intensity = 1 - state.sanity / 100;
    const event = this.director.choose(state, !options.reduced);
    if (event) {
      this.activeId = event.id;
      this.until = state.elapsed + 3.2;
      this.eventCount++;
      notify(event.text);
      if (!options.reduceAudio) sound(event.id);
    }
    const active =
      !options.reduced && state.elapsed < this.until ? this.activeId : "";
    world.lights.forEach((light, i) => {
      const base = this.initialLights[i];
      const wave =
        options.reduceFlashes || options.reduced
          ? 0
          : Math.sin(state.elapsed * 0.6 + i) * 0.08 * intensity;
      const breathing =
        active === "breathing-seal" && !options.reduceFlashes
          ? Math.sin(state.elapsed * 2.2) * 0.13
          : 0;
      light.intensity = base * (1 + wave + breathing);
    });
    if (this.eraGlyph)
      (this.eraGlyph.material as T.MeshStandardMaterial).emissiveIntensity =
        this.glyphIntensity +
        (active === "roman-ritual" || active === "scriptorium-margin"
          ? options.reduceFlashes
            ? 0.12
            : 0.25 + Math.sin(state.elapsed * 1.2) * 0.08
          : 0);
    this.apparition.visible = [
      "glass-double",
      "silent-choir",
      "unknown-penitent",
      "roman-witness",
      "abbey-visitor",
      "ink-apparition",
      "mansion-echo",
      "mansion-reflection",
    ].includes(active);
    if (this.apparition.visible)
      this.apparition.position.set(
        T.MathUtils.clamp(
          state.x + (active === "glass-double" ? 3 : -2.5),
          -6.8,
          6.8,
        ),
        0,
        T.MathUtils.clamp(state.z - 2.8, -6.5, 6.5),
      );
    this.book.visible = [
      "hushed-index",
      "levitating-book",
      "scriptorium-margin",
    ].includes(active);
    if (this.book.visible) {
      this.book.position.set(
        -3,
        1.35 + Math.sin(state.elapsed * 3) * 0.24,
        -2.4,
      );
      this.book.rotation.y = state.elapsed * 0.7;
    }
    this.falseDoor.visible = [
      "missing-door",
      "lengthened-aisle",
      "roman-false-exit",
    ].includes(active);
    if (this.falseDoor.visible) {
      this.falseDoor.position.set(
        0,
        0,
        active === "lengthened-aisle" && !options.reduceDistortion
          ? -5.8 - Math.sin(state.elapsed * 1.6) * 0.7
          : -6.3,
      );
      this.falseDoor.scale.setScalar(
        active === "lengthened-aisle" && !options.reduceDistortion ? 1.15 : 1,
      );
    }
    this.shadow.visible = [
      "second-footsteps",
      "shadow-without-body",
      "abbey-bell",
    ].includes(active);
    if (this.shadow.visible)
      this.shadow.position.set(
        T.MathUtils.clamp(state.x + Math.sin(state.elapsed * 2) * 1.5, -6, 6),
        0.035,
        T.MathUtils.clamp(state.z - 1.7, -6, 6),
      );
    this.rain.visible = active === "rain-upwards";
    if (this.rain.visible) this.rain.position.y = (state.elapsed * 0.7) % 0.4;
    if (this.portraits.length) {
      const material = this.portraits[0].material as T.MeshStandardMaterial;
      material.color.copy(this.portraitColor);
      if (active === "portraits-turn" && !options.reduceDistortion)
        material.color.lerp(this.alteredPortraitColor, 0.72);
    }
    if (this.ring)
      this.ring.scale.setScalar(
        active === "breathing-seal" && !options.reduceDistortion
          ? 1 + Math.sin(state.elapsed * 2.4) * 0.1
          : 1,
      );
    (world.scene.fog as T.FogExp2).density =
      active === "lengthened-aisle" && !options.reduceDistortion
        ? this.baseFog * 0.7
        : this.baseFog;
    return options.reduced ? 0.5 : 0.55 + intensity * 0.45;
  }
}
