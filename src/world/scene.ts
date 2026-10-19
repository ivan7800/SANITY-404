import * as T from "three";
import { ShadowBudget } from "../render/shadow-budget";
import { batchRigid } from "../render/batch";
import { pbr } from "../render/materials";
import { Atmosphere } from "../render/atmosphere";
import { lightScene } from "../render/lighting";
import { qualityProfile } from "../render/quality";
import { prop } from "./props";
import { mansion } from "./mansion";
import { decorateRomanSanctuary } from "./roman-sanctuary";
import { decorateMedievalAbbey } from "./medieval-abbey";
import { decoratePhase2Room } from "./phase2-rooms";
import { newPhase2, type Phase2Progress } from "../systems/phase2";
export { character } from "./character";
import { blocked, type Obstacle } from "../systems/state";
export function enemySpawn(obstacles: Obstacle[]): [number, number] {
  return (
    (
      [
        [3, -3],
        [2, -3],
        [0, -3],
        [-2, -3],
      ] as [number, number][]
    ).find(([x, z]) => !blocked(x, z, obstacles, 0.45)) ?? [0, -2]
  );
}
export const names = [
  "Mansión Veyr",
  "Biblioteca prohibida",
  "Cripta de los nombres",
  "Capilla del silencio",
  "Ruinas del intervalo",
  "Archivo familiar",
  "Invernadero de vidrio negro",
  "Sótanos de la vigilia",
  "Santuario de los nombres",
  "Claustro de la ceniza",
  "Scriptorium del silencio",
];
export const subtitles = [
  "ALPES EUROPEOS · NOVIEMBRE DE 1927",
  "NINGÚN LIBRO RECUERDA A SU AUTOR",
  "LOS MUERTOS NO ESTÁN SOLOS",
  "AQUÍ SE REZA HACIA ABAJO",
  "UN LUGAR ANTERIOR AL TIEMPO",
  "LOS RETRATOS CONSERVAN OTRAS FECHAS",
  "LA LLUVIA CRECE HACIA ADENTRO",
  "BAJO LA CASA, ALGUIEN SIGUE CONTANDO",
  "ROMA · AÑO 189 D. C. · EL PRIMER INTERVALO",
  "FRANCIA · AÑO 1348 · EL CLAUSTRO CERRADO",
  "FRANCIA · AÑO 1348 · LOS LIBROS SIN AUTORES",
];
export interface Interactable {
  id: string;
  name: string;
  x: number;
  z: number;
  kind:
    | "note"
    | "item"
    | "door"
    | "seal"
    | "save"
    | "end"
    | "phase2Puzzle"
    | "discovery"
    | "phase2End"
    | "romanPuzzle"
    | "medievalPuzzle";
  value?: string;
  target?: number;
  rotation?: number;
  mesh?: T.Object3D;
}
export class World {
  scene = new T.Scene();
  obstacles: Obstacle[] = [];
  objects: Interactable[] = [];
  lights: T.PointLight[] = [];
  private materials = new Map<string, T.MeshStandardMaterial>();
  atmosphere: Atmosphere;
  highlight: T.Mesh;
  shadowLight: T.SpotLight;
  shadowBudget: ShadowBudget;
  guardPose = false;
  lastEnemyX = 0;
  lastEnemyZ = 0;
  lastEnemyVisible = true;
  constructor(
    public room: number,
    items: string[],
    seals: number[],
    read: string[],
    collected: string[] = [],
    quality = 1.3,
    progress: Phase2Progress = newPhase2(),
  ) {
    const scene = this.scene;
    scene.background = new T.Color("#111817");
    scene.fog = new T.FogExp2("#17202a", 0.022);
    scene.add(
      new T.HemisphereLight(
        0xb1c3d4,
        0x33302b,
        quality === 1
          ? room === 0 || room === 2 || room === 4
            ? 1.35
            : 1.55
          : 1.1,
      ),
    );
    const wall =
      room === 0
        ? 0x343c35
        : room === 1
          ? 0x323331
          : room === 3
            ? 0x393e3b
            : 0x353c3d;
    this.box(0, -0.25, 0, 16, 0.5, 16, 0x333532, false);
    this.box(0, 2.5, -8, 16, 5, 0.35, wall);
    this.box(-8, 2.5, 0, 0.35, 5, 16, wall);
    this.box(8, 2.5, 0, 0.35, 5, 16, wall);
    this.box(0, 2.5, 8, 16, 5, 0.35, wall);
    for (let i = -7; i <= 7; i += 2) {
      this.box(i, 0.01, 0, 0.025, 0.015, 16, 0x171e1a, false);
      this.box(0, 0.012, i, 16, 0.015, 0.025, 0x171e1a, false);
      this.box(i, 2.4, -7.72, 0.16, 4.8, 0.14, 0x686555, false);
      this.box(i, 4.5, -7.65, 1.8, 0.12, 0.18, 0x77705b, false);
    }
    this.box(
      0,
      0.025,
      0,
      3.5,
      0.025,
      12,
      room === 0 ? 0x502f2b : 0x273732,
      false,
    );
    for (const x of [-6.8, 6.8])
      for (const z of [-5, 3]) {
        this.box(x, 1.6, z, 0.4, 3.2, 0.4, 0x666654);
        this.lamp(
          x,
          3.1,
          z,
          0xffbd80,
          7,
          quality !== 1 || (room !== 3 && room !== 6 && z < 0),
        );
      }
    if (room === 0) {
      scene.add(mansion(this.obstacles));
      this.obstacles.push(
        { x: -4, z: -2, w: 3, d: 1.6, height: 1.5 },
        { x: 4, z: 1, w: 2, d: 3, height: 1.5 },
      );
    }
    if (room === 1) {
      for (const x of [-5, 5])
        for (const z of [-3, 2]) {
          this.box(x, 1.7, z, 1, 3.4, 3.4, 0x30281d);
          for (let i = 0; i < 14; i++)
            this.box(
              x + (x < 0 ? 0.55 : -0.55),
              0.4 + (i % 4) * 0.75,
              z - 1.6 + Math.floor(i / 4) * 0.8,
              0.15,
              0.55,
              0.4,
              [0x625338, 0x3e5146, 0x69433c][i % 3],
              false,
            );
        }
    }
    if (room === 2) {
      for (const x of [-4, 4])
        for (const z of [-3, 2]) {
          this.box(x, 0.55, z, 1.5, 1.1, 2.7, 0x575951);
          this.box(x, 1.14, z, 1.7, 0.15, 2.9, 0x777b6f, false);
        }
    }
    if (room === 3) {
      for (const x of [-4, 4])
        for (const z of [-3, 0, 3]) this.box(x, 0.5, z, 2.5, 1, 0.65, 0x393025);
      this.box(3, 0.8, -5, 3, 1.6, 1.3, 0x707263);
      this.box(0, 3.6, -7.6, 0.3, 2, 0.2, 0xa49a78, false);
      this.box(0, 3.8, -7.6, 1.4, 0.25, 0.2, 0xa49a78, false);
    }
    if (room === 4) {
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
        const p = this.box(
          Math.cos(a) * 5,
          1.7,
          Math.sin(a) * 5,
          0.8,
          3.4,
          0.8,
          0x52605a,
        );
        p.rotation.z = Math.sin(i) * 0.2;
      }
      const ring = new T.Mesh(
        new T.TorusGeometry(1.7, 0.12, 6, 36),
        new T.MeshStandardMaterial({
          color: 0x8baf9d,
          emissive: 0x336959,
          emissiveIntensity: 1,
        }),
      );
      ring.position.set(0, 2, -3);
      scene.add(ring);
      this.lamp(0, 2, -3, 0x72e8c0, 35);
    }
    if (room === 8) decorateRomanSanctuary(this);
    else if (room === 9 || room === 10) decorateMedievalAbbey(this);
    else decoratePhase2Room(this);
    this.add(
      {
        id: "save" + room,
        name: "Escritorio de memoria · guardar",
        x: -2,
        z: 5,
        kind: "save",
      },
      0x8b7753,
    );
    this.add(
      {
        id: "note" + room,
        name: "Leer documento",
        x: -5.5,
        z: 5,
        kind: "note",
      },
      0xc5ba92,
    );
    if (room === 0 && !items.includes("Llave de latón"))
      this.add(
        {
          id: "key",
          name: "Recoger llave de latón",
          x: -4,
          z: -0.5,
          kind: "item",
          value: "Llave de latón",
        },
        0xc2a15b,
      );
    if (room !== 4 && room !== 8 && room !== 9 && room !== 10 && !collected.includes("Tónico " + room))
      this.add(
        {
          id: "tonic" + room,
          name: "Recoger tónico",
          x: 5.8,
          z: 5.5,
          kind: "item",
          value: "Tónico " + room,
        },
        0x76a99a,
      );
    if (room > 0 && room < 5)
      this.add(
        {
          id: "back",
          name: "Volver · " + names[room - 1],
          x: 0,
          z: 7,
          kind: "door",
          target: room - 1,
        },
        0x756749,
      );
    if (room < 4)
      this.add(
        {
          id: "next",
          name: "Abrir · " + names[room + 1],
          x: 0,
          z: -7,
          kind: "door",
          target: room + 1,
        },
        0x756749,
      );
    if (room === 0) {
      this.add(
        {
          id: "roman-portal",
          name: "Atravesar la grieta romana · año 189",
          x: 5.8,
          z: -5.2,
          kind: "door",
          target: 8,
        },
        0x9b8050,
      );
    }
    if (room === 9) {
      this.add({id:"medieval-return", name:"Regresar a 1927", x:0, z:6.1, kind:"door", target:0}, 0x9a866a);
      this.add({id:"medieval-scriptorium", name:"Entrar al scriptorium", x:0, z:-6.1, kind:"door", target:10}, 0x9a866a);
    }
    if (room === 10) {
      this.add({id:"medieval-back", name:"Volver al claustro", x:0, z:6.1, kind:"door", target:9}, 0x9a866a);
      this.add({id:"medieval-manuscript", name:"Descifrar el códice sellado", x:-2.9, z:-4.7, kind:"medievalPuzzle"}, 0xa89c7d);
      if (!collected.includes("Códice de Montfort"))
        this.add({id:"medieval-codex", name:"Recuperar el códice de Montfort", x:0, z:-4.1, kind:"item", value:"Códice de Montfort"}, 0xc3ac87);
    }
    if (room === 8) {
      this.add(
        {
          id: "roman-inscription",
          name: "Descifrar la inscripción del altar",
          x: -2.9,
          z: -4.25,
          kind: "romanPuzzle",
        },
        0xb09a70,
      );
      this.add(
        {
          id: "roman-return",
          name: "Regresar a la mansión · año 1927",
          x: 0,
          z: 6.1,
          kind: "door",
          target: 0,
        },
        0x9b8050,
      );
      if (!collected.includes("Tablilla del intervalo"))
        this.add(
          {
            id: "roman-tablet",
            name: "Recoger tablilla del intervalo",
            x: 0,
            z: -4.1,
            kind: "item",
            value: "Tablilla del intervalo",
          },
          0xb8a27c,
        );
    }
    if (room === 0)
      this.add(
        {
          id: "mansion-puzzle",
          name: "Examinar caja astronómica",
          x: 3,
          z: 4,
          kind: "seal",
          target: 0,
        },
        0xa38d5e,
      );
    if (room >= 1 && room <= 3)
      this.add(
        {
          id: "seal" + room,
          name: "Examinar mecanismo del sello",
          x: 0,
          z: -4.5,
          kind: "seal",
          target: room - 1,
        },
        seals.includes(room - 1) ? 0x427b60 : 0x968b6a,
      );
    if (room === 4)
      this.add(
        { id: "end", name: "Cerrar el intervalo", x: 0, z: -3, kind: "end" },
        0x9dd9c0,
      );
    if (room === 1) {
      this.add(
        {
          id: "manuscripts",
          name: "Clasificar manuscritos",
          x: 2.4,
          z: -1,
          kind: "phase2Puzzle",
        },
        0xb99b70,
      );
      this.add(
        {
          id: "archive-door",
          name: "Puerta secreta · archivo familiar",
          x: 6.7,
          z: 0,
          kind: "door",
          target: 5,
          rotation: Math.PI / 2,
        },
        0x7a6647,
      );
      this.add(
        {
          id: "library-shortcut",
          name: "Atajo · capilla",
          x: -6.7,
          z: -5.3,
          kind: "door",
          target: 3,
          rotation: Math.PI / 2,
        },
        0x74634b,
      );
    }
    if (room === 5) {
      this.add(
        {
          id: "archive-back",
          name: "Volver · biblioteca",
          x: -6.7,
          z: 0,
          kind: "door",
          target: 1,
          rotation: Math.PI / 2,
        },
        0x756749,
      );
      this.add(
        {
          id: "genealogy",
          name: "Ordenar el árbol genealógico",
          x: 0,
          z: -3,
          kind: "phase2Puzzle",
        },
        0xb49b75,
      );
      this.add(
        {
          id: "greenhouse-door",
          name: "Puerta de hierro · invernadero",
          x: 6.7,
          z: 0,
          kind: "door",
          target: 6,
          rotation: Math.PI / 2,
        },
        0x668a7d,
      );
      if (!progress.discoveries.includes("society"))
        this.add(
          {
            id: "society",
            name: "Investigar el libro de socios",
            x: 3,
            z: 4,
            kind: "discovery",
          },
          0xc0ab7e,
        );
    }
    if (room === 6) {
      this.add(
        {
          id: "greenhouse-back",
          name: "Volver · archivo",
          x: -6.7,
          z: 0,
          kind: "door",
          target: 5,
          rotation: Math.PI / 2,
        },
        0x756749,
      );
      this.add(
        {
          id: "greenhouse-chapel",
          name: "Galería cubierta · capilla",
          x: 6.7,
          z: 0,
          kind: "door",
          target: 3,
          rotation: Math.PI / 2,
        },
        0x756749,
      );
      if (!progress.discoveries.includes("adrien"))
        this.add(
          {
            id: "adrien",
            name: "Examinar el cuaderno mojado",
            x: 3,
            z: 4,
            kind: "discovery",
          },
          0xc0ab7e,
        );
    }
    if (room === 3) {
      this.add(
        {
          id: "chapel-side",
          name: "Galería cubierta · invernadero",
          x: -6.7,
          z: 0,
          kind: "door",
          target: 6,
          rotation: Math.PI / 2,
        },
        0x668a7d,
      );
      this.add(
        {
          id: "astronomy",
          name: "Alinear la bóveda astronómica",
          x: -2.1,
          z: -3.5,
          kind: "phase2Puzzle",
        },
        0xa2a891,
      );
      this.add(
        {
          id: "basement-door",
          name: "Escalera de piedra · sótanos",
          x: 6.7,
          z: 0,
          kind: "door",
          target: 7,
          rotation: Math.PI / 2,
        },
        0x756749,
      );
      this.add(
        {
          id: "chapel-shortcut",
          name: "Atajo · biblioteca",
          x: -6.7,
          z: -5.3,
          kind: "door",
          target: 1,
          rotation: Math.PI / 2,
        },
        0x74634b,
      );
    }
    if (room === 7) {
      this.add(
        {
          id: "basement-back",
          name: "Subir · capilla",
          x: -6.7,
          z: 0,
          kind: "door",
          target: 3,
          rotation: Math.PI / 2,
        },
        0x756749,
      );
      this.add(
        {
          id: "basement",
          name: "Cerrar las tres mordazas",
          x: 0,
          z: -4.3,
          kind: "phase2Puzzle",
        },
        0x9ba78f,
      );
      this.add(
        {
          id: "phase2-end",
          name: "Atravesar el umbral de Adrien",
          x: 0,
          z: -6.2,
          kind: "phase2End",
        },
        0xa0d4c3,
      );
      if (!progress.discoveries.includes("guardian"))
        this.add(
          {
            id: "guardian",
            name: "Leer la placa del guardián",
            x: 3,
            z: 4,
            kind: "discovery",
          },
          0xbba677,
        );
    }
    const staticGroup = new T.Group();
    for (const object of [...scene.children])
      if (object.userData.staticBox) staticGroup.add(object);
    batchRigid(staticGroup);
    scene.add(staticGroup);
    this.shadowLight = lightScene(scene, quality);
    this.shadowBudget = new ShadowBudget(quality);
    this.atmosphere = new Atmosphere(scene, qualityProfile(quality).dust);
    this.highlight = new T.Mesh(
      new T.TorusGeometry(0.45, 0.014, 6, 32),
      new T.MeshBasicMaterial({
        color: 0xdcc891,
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
      }),
    );
    this.highlight.rotation.x = -Math.PI / 2;
    this.highlight.visible = false;
    scene.add(this.highlight);
    void read;
  }
  box(
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    color: number,
    solid = true,
  ) {
    const surface = h < 0.05 && w > 2 ? "fabric" : h > 3 ? "plaster" : "stone";
    const key = surface + color;
    let material = this.materials.get(key);
    if (!material) {
      material = pbr(surface, color);
      this.materials.set(key, material);
    }
    const m = new T.Mesh(new T.BoxGeometry(w, h, d), material);
    m.userData.staticBox = true;
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    this.scene.add(m);
    if (solid) this.obstacles.push({ x, z, w, d, height: h });
    return m;
  }
  lamp(
    x: number,
    y: number,
    z: number,
    color: number,
    intensity: number,
    lit = true,
  ) {
    const l = new T.PointLight(color, intensity, 10, 2);
    l.position.set(x, y, z);
    if (lit) {
      this.scene.add(l);
      this.lights.push(l);
    }
    const b = new T.Mesh(
      new T.SphereGeometry(0.09, 6, 6),
      new T.MeshBasicMaterial({ color }),
    );
    b.position.copy(l.position);
    b.visible = false;
    this.scene.add(b);
  }
  add(o: Interactable, color: number) {
    const m = prop(o.kind, o.id, color);
    m.position.set(o.x, 0, o.z);
    if (o.rotation) m.rotation.y = o.rotation;
    this.scene.add(m);
    o.mesh = m;
    this.objects.push(o);
  }
  dispose() {
    const geometries = new Set<T.BufferGeometry>(),
      materials = new Set<T.Material>();
    this.scene.traverse((o) => {
      if (o instanceof T.Mesh || o instanceof T.Points) {
        geometries.add(o.geometry);
        for (const m of Array.isArray(o.material) ? o.material : [o.material])
          materials.add(m);
      }
      if (o instanceof T.Light && "shadow" in o)
        (o as T.SpotLight).shadow?.map?.dispose();
    });
    for (const g of geometries) g.dispose();
    for (const m of materials) m.dispose();
  }
}
