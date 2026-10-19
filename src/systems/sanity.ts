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
}
export const sanityEvents: SanityEvent[] = [
  { id: "roman-witness", rooms: [8], threshold: 75, text: "Una figura de bronce aparece donde Lucius no recuerda haber mirado." },
  { id: "roman-false-exit", rooms: [8], threshold: 45, text: "El santuario abre una salida que solo existe en tu memoria." },
  { id: "abbey-visitor", rooms: [9], threshold: 65, text: "Una figura inmóvil te espera bajo el arco del claustro." },
  { id: "ink-apparition", rooms: [10], threshold: 55, text: "El copista vuelve a aparecer entre los pergaminos." },
  { id: "mansion-echo", rooms: [0], threshold: 35, text: "Alguien se mueve junto al portal, pero no proyecta sombra." },
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
      (event.discovery === undefined ||
        state.phase2.discoveries.includes(event.discovery)),
  );
}

/** Events change only perception. None alters collisions, doors or saved progress. */
export class Sanity {
  apparition: T.Group;
  activeId = "";
  eventCount = 0;
  private nextEvent = 8;
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
  constructor(world: World) {
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
    if (state.elapsed >= this.nextEvent) {
      const seed = Math.abs(
        Math.sin(state.elapsed * 12.9898 + state.room * 78.233),
      );
      this.nextEvent = state.elapsed + 10 + seed * 7;
      const eligible = eligibleSanityEvents(state).filter(
        (event) => event.id !== this.activeId,
      );
      if (
        !options.reduced &&
        eligible.length &&
        seed < 0.32 + intensity * 0.63
      ) {
        const event = eligible[Math.floor(seed * 1000) % eligible.length];
        this.activeId = event.id;
        this.until = state.elapsed + 2.4;
        this.eventCount++;
        notify(event.text);
        if (!options.reduceAudio) sound(event.id);
      }
    }
    const active =
      !options.reduced && state.elapsed < this.until ? this.activeId : "";
    world.lights.forEach((light, i) => {
      const base = Number(light.userData.base ?? light.intensity);
      light.userData.base = base;
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
    this.apparition.visible = [
      "glass-double",
      "silent-choir",
      "unknown-penitent",
      "roman-witness",
      "abbey-visitor",
      "ink-apparition",
      "mansion-echo",
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
    this.book.visible = ["hushed-index", "levitating-book"].includes(active);
    if (this.book.visible) {
      this.book.position.set(
        -3,
        1.35 + Math.sin(state.elapsed * 3) * 0.24,
        -2.4,
      );
      this.book.rotation.y = state.elapsed * 0.7;
    }
    this.falseDoor.visible = ["missing-door", "lengthened-aisle", "roman-false-exit"].includes(
      active,
    );
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
    this.shadow.visible = ["second-footsteps", "shadow-without-body"].includes(
      active,
    );
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
