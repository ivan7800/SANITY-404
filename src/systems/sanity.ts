import * as T from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { batchRigid } from "../render/batch";
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
  area?:
    "upper-stair" | "upper-gallery" | "upper-portraits" | "upper-observatory";
  priority?: number;
}
export const sanityEvents: SanityEvent[] = [
  {
    id: "press-future-headline",
    rooms: [21, 22],
    threshold: 80,
    read: 21,
    priority: 4,
    text: "La primera plana anuncia la muerte de Tomás con la fecha de mañana.",
  },
  {
    id: "veyr-missing-portrait",
    rooms: [23, 24],
    threshold: 78,
    read: 23,
    priority: 4,
    text: "El retrato de Inés deja un hueco donde estaba su rostro.",
  },
  {
    id: "theatre-unearned-applause",
    rooms: [25, 26],
    threshold: 76,
    read: 25,
    priority: 4,
    text: "El público aplaude una escena que aún no has representado.",
  },
  {
    id: "photo-aged-self",
    rooms: [27, 28],
    threshold: 74,
    read: 27,
    priority: 4,
    text: "En la placa acabas de envejecer cuarenta años.",
  },
  {
    id: "press-reversed-type",
    rooms: [22],
    threshold: 46,
    read: 22,
    priority: 3,
    text: "Los tipos impresos se invierten y forman tu nombre al revés.",
  },
  {
    id: "veyr-vanishing-name",
    rooms: [24],
    threshold: 44,
    read: 24,
    priority: 3,
    text: "En el árbol familiar desaparece el nombre de Inés mientras lo lees.",
  },
  {
    id: "theatre-phantom-chorus",
    rooms: [26],
    threshold: 43,
    read: 26,
    priority: 3,
    text: "La tramoya canta con voces de personas que aún no han nacido.",
  },
  {
    id: "photo-unfixed-door",
    rooms: [28],
    threshold: 42,
    read: 28,
    priority: 3,
    text: "Una puerta de tres bisagras aparece en la pared del cuarto oscuro.",
  },
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
    id: "roman-double",
    rooms: [8],
    threshold: 65,
    item: "Marca de Varro",
    priority: 4,
    text: "La figura junto al altar lleva el rostro de Lucius. Al girarte, ya no está.",
  },
  {
    id: "mosaic-false-face",
    rooms: [11, 12],
    threshold: 75,
    item: "Pigmento de cinabrio",
    priority: 4,
    text: "El mosaico muestra tu rostro donde faltaban las teselas. La figura se aparta al mirarla.",
  },
  {
    id: "coast-passengers",
    rooms: [13, 14],
    threshold: 78,
    item: "Tabla de mareas",
    priority: 4,
    text: "Una fila de pasajeros espera en el muelle. Ninguno moja la madera.",
  },
  {
    id: "coast-upward-rain",
    rooms: [14],
    threshold: 45,
    read: 14,
    text: "Gotas saladas ascienden desde el suelo del depósito.",
  },
  {
    id: "stars-unseen-watcher",
    rooms: [15, 16],
    threshold: 72,
    item: "Carta astral",
    priority: 4,
    text: "Una segunda figura sigue la estrella que no está en el cielo.",
  },
  {
    id: "stars-reverse-dust",
    rooms: [16],
    threshold: 42,
    read: 16,
    text: "El polvo asciende hacia una constelación que ninguna carta conserva.",
  },
  {
    id: "quarry-wrong-name",
    rooms: [17, 18],
    threshold: 75,
    item: "Cuña marcada",
    priority: 4,
    text: "Una marca de corte adopta tu nombre mientras la observas.",
  },
  {
    id: "quarry-receding-exit",
    rooms: [18],
    threshold: 42,
    read: 18,
    text: "La salida de piedra se aleja un paso por cada paso que das.",
  },
  {
    id: "hospital-occupied-beds",
    rooms: [19, 20],
    threshold: 72,
    item: "Hierbas de serbal",
    priority: 4,
    text: "Las camas se hunden bajo el peso de pacientes que no puedes ver.",
  },
  {
    id: "hospital-swapped-chart",
    rooms: [20],
    threshold: 43,
    read: 20,
    text: "Tu nombre aparece en el historial de un paciente muerto hace años.",
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
    id: "mansion-folded-gallery",
    rooms: [0],
    threshold: 55,
    priority: -1,
    text: "Un segundo arco cruza el vestíbulo. Al parpadear, vuelve a estar detrás de la pared.",
  },
  {
    id: "upper-guest-turn",
    rooms: [0],
    area: "upper-gallery",
    threshold: 75,
    priority: 4,
    text: "El huésped aparece al fondo de la galería. Solo cambia de postura cuando dejas de mirarlo.",
  },
  {
    id: "upper-widow-veil",
    rooms: [0],
    area: "upper-stair",
    item: "Folio del rellano",
    threshold: 68,
    priority: 4,
    text: "Un velo roza la barandilla desde arriba. Los pasos continúan descendiendo después de detenerte.",
  },
  {
    id: "upper-reflection-step",
    rooms: [0],
    area: "upper-observatory",
    threshold: 48,
    priority: 4,
    text: "Tu reflejo da un paso que Élise no ha dado.",
  },
  {
    id: "upper-crawler-scrape",
    rooms: [0],
    area: "upper-portraits",
    threshold: 72,
    priority: 4,
    text: "Algo raspa la madera bajo los retratos y se detiene al entrar en la sala.",
  },
  {
    id: "upper-root-names",
    rooms: [0],
    area: "upper-observatory",
    item: "Carta de la raíz",
    threshold: 42,
    priority: 5,
    text: "Los nombres tallados bajo el suelo responden con voces distintas.",
  },
  {
    id: "archive-aged-eyes",
    rooms: [5],
    threshold: 58,
    item: "Acta original de Inés",
    priority: 4,
    text: "El retrato de Inés envejece otra vez. Sus ojos siguen a Élise hasta el umbral.",
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
      (event.area === undefined ||
        (state.room === 0 &&
          state.floor === 1 &&
          (event.area === "upper-stair"
            ? state.x > 3.65
            : event.area === "upper-gallery"
              ? state.z < -5.1 && state.x <= 3.65
              : event.area === "upper-portraits"
                ? state.x < -3.45 && state.z > -5.1
                : state.x >= -3.45 && state.x < 0.65 && state.z > -5.1))) &&
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
  private readCount = -1;
  private itemCount = -1;
  private witnessedCount = -1;
  constructor(entryTime = 0) {
    this.nextAt = entryTime + 8;
  }
  choose(
    state: State,
    enabled = true,
    inDanger = false,
  ): SanityEvent | undefined {
    const progressChanged =
      this.readCount >= 0 &&
      (this.readCount !== state.read.length ||
        this.itemCount !== state.items.length ||
        this.witnessedCount !== state.campaign.witnessed.length);
    this.readCount = state.read.length;
    this.itemCount = state.items.length;
    this.witnessedCount = state.campaign.witnessed.length;
    if (progressChanged) this.nextAt = Math.max(this.nextAt, state.elapsed + 4);
    // Combat already has its own audible and visual tells. Keep the next
    // hallucination at least six seconds beyond the last dangerous frame.
    if (inDanger) {
      this.nextAt = Math.max(this.nextAt, state.elapsed + 6);
      return;
    }
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
  private ghostArch?: T.Group;
  private shadow: T.Mesh;
  private rain: T.Points;
  private portraits: T.Mesh[] = [];
  private portraitColor = new T.Color();
  private alteredPortraitColor = new T.Color(0x8b6271);
  private ring: T.Object3D | undefined;
  private baseFog = 0;
  private initialLights: number[];
  private eraGlyph?: T.Mesh;
  private latePortrait?: T.Mesh;
  private glyphIntensity = 0;
  isEventActive(elapsed: number) {
    return elapsed < this.until;
  }
  constructor(world: World, entryTime = 0) {
    this.director = new PsychologicalDirector(entryTime);
    this.initialLights = world.lights.map((light) => light.intensity);
    this.apparition = character(true);
    // The hallucination keeps one pose. Bake joint transforms once and merge
    // meshes that share a material; its silhouette and surface stay identical.
    const materials = new Map<T.Material, T.Mesh[]>();
    this.apparition.updateMatrixWorld(true);
    this.apparition.traverse((object) => {
      if (!(object instanceof T.Mesh) || !object.visible) return;
      const material = object.material as T.Material;
      const meshes = materials.get(material) ?? [];
      meshes.push(object);
      materials.set(material, meshes);
    });
    const baked = new T.Group();
    baked.name = this.apparition.name;
    for (const [material, meshes] of materials) {
      const parts = meshes.map((mesh) =>
        mesh.geometry.clone().applyMatrix4(mesh.matrixWorld),
      );
      const geometry = mergeGeometries(parts);
      if (geometry) {
        for (const part of parts) part.dispose();
        const mesh = new T.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        baked.add(mesh);
      } else {
        for (const part of parts) {
          const mesh = new T.Mesh(part, material);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          baked.add(mesh);
        }
      }
    }
    const oldGeometries = new Set<T.BufferGeometry>();
    this.apparition.traverse((object) => {
      if (object instanceof T.Mesh) oldGeometries.add(object.geometry);
    });
    for (const geometry of oldGeometries) geometry.dispose();
    this.apparition = baked;
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
    this.book.name = "sanity-book";
    this.book.visible = false;
    world.scene.add(this.book);
    this.falseDoor = new T.Group();
    this.falseDoor.name = "sanity-false-door";
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
    if (world.room === 0) {
      this.ghostArch = new T.Group();
      this.ghostArch.name = "sanity-folded-gallery";
      const ghostStone = new T.MeshStandardMaterial({
        color: 0x80968b,
        emissive: 0x1c3b35,
        transparent: true,
        opacity: 0.32,
        depthWrite: false,
      });
      for (const x of [-1.15, 1.15]) {
        const column = new T.Mesh(
          new T.CylinderGeometry(0.13, 0.18, 2.8, 8),
          ghostStone,
        );
        column.position.set(x, 1.4, 0);
        this.ghostArch.add(column);
      }
      for (let i = 0; i < 7; i++) {
        const angle = (i / 6) * Math.PI;
        const stone = new T.Mesh(
          new T.BoxGeometry(0.45, 0.3, 0.32),
          ghostStone,
        );
        stone.position.set(
          Math.cos(angle) * 1.15,
          2.8 + Math.sin(angle) * 0.82,
          0,
        );
        stone.rotation.z = angle - Math.PI / 2;
        this.ghostArch.add(stone);
      }
      this.ghostArch.position.set(0, 0, -2.3);
      this.ghostArch.visible = false;
      world.scene.add(batchRigid(this.ghostArch));
    }
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
    this.latePortrait = world.scene.getObjectByName("late-veyr-portrait") as
      T.Mesh | undefined;
    if (this.latePortrait) {
      const material = this.latePortrait.material as T.MeshStandardMaterial;
      material.transparent = true;
    }
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
    inDanger = false,
  ) {
    const intensity = 1 - state.sanity / 100;
    if (inDanger) this.until = 0;
    const event = this.director.choose(state, !options.reduced, inDanger);
    if (event) {
      this.activeId = event.id;
      this.until = state.elapsed + 3.2;
      this.eventCount++;
      notify(event.text);
      if (!options.reduceAudio) sound(event.id);
    }
    const active =
      !inDanger && !options.reduced && state.elapsed < this.until
        ? this.activeId
        : "";
    for (let i = 0; i < world.lights.length; i++) {
      const light = world.lights[i];
      const base = this.initialLights[i];
      const wave =
        options.reduceFlashes || options.reduced
          ? 0
          : Math.sin(state.elapsed * 0.6 + i) * 0.08 * intensity;
      const breathing =
        (active === "breathing-seal" ||
          active === "theatre-unearned-applause") &&
        !options.reduceFlashes
          ? Math.sin(state.elapsed * 2.2) * 0.13
          : 0;
      light.intensity = base * (1 + wave + breathing);
    }
    if (this.eraGlyph)
      (this.eraGlyph.material as T.MeshStandardMaterial).emissiveIntensity =
        this.glyphIntensity +
        (active === "roman-ritual" || active === "scriptorium-margin"
          ? options.reduceFlashes
            ? 0.12
            : 0.25 + Math.sin(state.elapsed * 1.2) * 0.08
          : 0);
    this.apparition.visible =
      active === "glass-double" ||
      active === "silent-choir" ||
      active === "unknown-penitent" ||
      active === "roman-witness" ||
      active === "roman-double" ||
      active === "mosaic-false-face" ||
      active === "coast-passengers" ||
      active === "stars-unseen-watcher" ||
      active === "quarry-wrong-name" ||
      active === "hospital-occupied-beds" ||
      active === "veyr-missing-portrait" ||
      active === "theatre-phantom-chorus" ||
      active === "photo-aged-self" ||
      active === "abbey-visitor" ||
      active === "ink-apparition" ||
      active === "mansion-echo" ||
      active === "upper-guest-turn" ||
      active === "upper-widow-veil" ||
      active === "upper-reflection-step" ||
      active === "archive-aged-eyes" ||
      active === "mansion-reflection";
    if (this.apparition.visible) {
      if (active === "upper-guest-turn")
        this.apparition.position.set(
          T.MathUtils.clamp(state.x - 2, -5.8, 3),
          2.64,
          -5.8,
        );
      else if (active === "upper-widow-veil")
        this.apparition.position.set(5, 2.64, -5.85);
      else if (active === "upper-reflection-step")
        this.apparition.position.set(
          T.MathUtils.clamp(state.x + 1, -2.8, 0.2),
          2.64,
          T.MathUtils.clamp(state.z - 0.8, -4.7, -2),
        );
      else
        this.apparition.position.set(
          T.MathUtils.clamp(
            state.x + (active === "glass-double" ? 3 : -2.5),
            -6.8,
            6.8,
          ),
          state.room === 0 && state.floor === 1 ? 2.64 : 0,
          T.MathUtils.clamp(state.z - 2.8, -6.5, 6.5),
        );
    }
    this.book.visible =
      active === "hushed-index" ||
      active === "levitating-book" ||
      active === "scriptorium-margin" ||
      active === "press-future-headline" ||
      active === "press-reversed-type" ||
      active === "veyr-vanishing-name";
    if (active === "hospital-swapped-chart") this.book.visible = true;
    if (this.book.visible) {
      this.book.position.set(
        -3,
        1.35 + Math.sin(state.elapsed * 3) * 0.24,
        -2.4,
      );
      this.book.rotation.y = state.elapsed * 0.7;
    }
    this.falseDoor.visible =
      active === "missing-door" ||
      active === "lengthened-aisle" ||
      active === "roman-false-exit" ||
      active === "quarry-receding-exit" ||
      active === "photo-unfixed-door";
    if (this.ghostArch) {
      this.ghostArch.visible =
        active === "mansion-folded-gallery" || active === "upper-root-names";
      if (this.ghostArch.visible) {
        this.ghostArch.position.y = active === "upper-root-names" ? 2.64 : 0;
        this.ghostArch.position.x = active === "upper-root-names" ? -1.3 : 0;
        this.ghostArch.position.z =
          (active === "upper-root-names" ? -3.5 : -2.3) -
          (options.reduceDistortion ? 0 : Math.sin(state.elapsed * 1.3) * 0.35);
        this.ghostArch.scale.z = options.reduceDistortion
          ? 1
          : 1 + Math.sin(state.elapsed * 1.1) * 0.18;
      } else {
        this.ghostArch.position.x = 0;
        this.ghostArch.position.y = 0;
        this.ghostArch.position.z = -2.3;
        this.ghostArch.scale.z = 1;
      }
    }
    if (this.falseDoor.visible) {
      this.falseDoor.position.set(
        0,
        0,
        (active === "lengthened-aisle" || active === "quarry-receding-exit") &&
          !options.reduceDistortion
          ? -5.8 - Math.sin(state.elapsed * 1.6) * 0.7
          : -6.3,
      );
      this.falseDoor.scale.setScalar(
        (active === "lengthened-aisle" || active === "quarry-receding-exit") &&
          !options.reduceDistortion
          ? 1.15
          : 1,
      );
    }
    this.shadow.visible =
      active === "second-footsteps" ||
      active === "shadow-without-body" ||
      active === "abbey-bell" ||
      active === "theatre-unearned-applause";
    if (active === "upper-crawler-scrape") this.shadow.visible = true;
    if (this.shadow.visible)
      this.shadow.position.set(
        T.MathUtils.clamp(state.x + Math.sin(state.elapsed * 2) * 1.5, -6, 6),
        state.room === 0 && state.floor === 1 ? 2.675 : 0.035,
        T.MathUtils.clamp(state.z - 1.7, -6, 6),
      );
    this.rain.visible =
      active === "rain-upwards" ||
      active === "coast-upward-rain" ||
      active === "stars-reverse-dust";
    if (this.rain.visible) this.rain.position.y = (state.elapsed * 0.7) % 0.4;
    if (this.portraits.length) {
      const material = this.portraits[0].material as T.MeshStandardMaterial;
      material.color.copy(this.portraitColor);
      if (
        (active === "portraits-turn" ||
          active === "veyr-missing-portrait" ||
          active === "archive-aged-eyes") &&
        !options.reduceDistortion
      )
        material.color.lerp(this.alteredPortraitColor, 0.72);
    }
    if (this.latePortrait)
      (this.latePortrait.material as T.MeshStandardMaterial).opacity =
        active === "veyr-missing-portrait" && !options.reduceDistortion
          ? 0.12
          : 1;
    if (this.ring)
      this.ring.scale.setScalar(
        active === "breathing-seal" && !options.reduceDistortion
          ? 1 + Math.sin(state.elapsed * 2.4) * 0.1
          : 1,
      );
    (world.scene.fog as T.FogExp2).density =
      (active === "lengthened-aisle" || active === "photo-unfixed-door") &&
      !options.reduceDistortion
        ? this.baseFog * 0.7
        : this.baseFog;
    return options.reduced ? 0.5 : 0.55 + intensity * 0.45;
  }
}
