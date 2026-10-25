import * as T from "three";
import { ShadowBudget } from "../render/shadow-budget";
import { batchRigid } from "../render/batch";
import { pbr, type Surface } from "../render/materials";
import { Atmosphere } from "../render/atmosphere";
import { lightScene } from "../render/lighting";
import { qualityProfile } from "../render/quality";
import { prop } from "./props";
import { mansion } from "./mansion";
import { decorateMansionEchoes } from "./mansion-echoes";
import { decorateRomanSanctuary } from "./roman-sanctuary";
import { decorateMedievalAbbey } from "./medieval-abbey";
import { decorateMosaicWorkshop } from "./mosaic-workshop";
import { decorateCoastalArchive } from "./coastal-archive";
import { decorateStarObservatory } from "./star-observatory";
import { decorateQuarry } from "./quarry-1092";
import { decorateRoadHospital } from "./road-hospital";
import { decorateLateChapter } from "./late-chapters";
import { lateChapters, lateChapterForRoom } from "../systems/late-chapters";
import { decoratePhase2Room } from "./phase2-rooms";
import { newPhase2, type Phase2Progress } from "../systems/phase2";
import {
  newCampaign,
  romanEchoes,
  type CampaignProgress,
} from "../systems/campaign";
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
  "Taller de los rostros",
  "Horno de las teselas",
  "Muelle de los nombres",
  "Archivo de la marea",
  "Terraza del astro ausente",
  "Cúpula de las tres horas",
  "Cantera de los nombres",
  "Cámara del arco",
  "Hospital del camino",
  "Enfermería de los nombres",
  "Imprenta de frontera",
  "Sala de las planchas",
  "Casa Veyr de 1610",
  "Galería de retratos",
  "Teatro de autómatas",
  "Tramoya de las voces",
  "Archivo fotográfico",
  "Cuarto de revelado",
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
  "ROMA · AÑO 312 D. C. · EL ROSTRO SUSTITUIDO",
  "ROMA · AÑO 312 D. C. · LA COPIA Y EL MOLDE",
  "COSTA OCCIDENTAL · AÑO 537 · LOS QUE ZARPARON",
  "COSTA OCCIDENTAL · AÑO 537 · EL REGISTRO BORRADO",
  "MONTAÑA · AÑO 783 · LA ESTRELLA QUE FALTA",
  "MONTAÑA · AÑO 783 · MEDIR LA AUSENCIA",
  "ALPES · AÑO 1092 · LA PIEDRA QUE MIENTE",
  "ALPES · AÑO 1092 · EL PLANO DEL UMBRAL",
  "PASO DE MONTAÑA · AÑO 1217 · LAS CAMAS VACÍAS",
  "PASO DE MONTAÑA · AÑO 1217 · UNA VIDA ESCRITA DOS VECES",
  "FRONTERA · AÑO 1491 · LA TIRADA FALSA",
  "FRONTERA · AÑO 1491 · EL TIPO QUE RECUERDA",
  "CASA VEYR · AÑO 1610 · EL PRIMER PACTO",
  "CASA VEYR · AÑO 1610 · LOS RETRATOS SIN INÉS",
  "TEATRO · AÑO 1786 · VOCES PRESTADAS",
  "TEATRO · AÑO 1786 · LA PARTITURA MECÁNICA",
  "ARCHIVO · AÑO 1899 · LA PUERTA FUTURA",
  "ARCHIVO · AÑO 1899 · EL NEGATIVO IMPOSIBLE",
];
export interface Interactable {
  id: string;
  name: string;
  x: number;
  z: number;
  level?: 0 | 1;
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
    | "romanEcho"
    | "mosaicPuzzle"
    | "coastLedger"
    | "starAlignment"
    | "quarryArch"
    | "hospitalRemedy"
    | "hospitalChoice"
    | "latePuzzle"
    | "lateEvidence"
    | "medievalPuzzle"
    | "legacy"
    | "memoryChoice"
    | "galleryClue"
    | "mansionEcho"
    | "ritual"
    | "ritualSecret";
  value?: string;
  target?: number;
  rotation?: number;
  mesh?: T.Object3D;
}
export class World {
  scene = new T.Scene();
  obstacles: Obstacle[] = [];
  upperObstacles: Obstacle[] = [];
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
    campaign: CampaignProgress = newCampaign(),
  ) {
    const scene = this.scene;
    const eraAtmosphere =
      room === 8 || room === 11 || room === 12
        ? { background: "#1d1a16", fog: "#42382c", density: 0.019 }
        : room >= 9
          ? { background: "#111916", fog: "#303d37", density: 0.027 }
          : { background: "#111817", fog: "#17202a", density: 0.022 };
    scene.background = new T.Color(eraAtmosphere.background);
    scene.fog = new T.FogExp2(eraAtmosphere.fog, eraAtmosphere.density);
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
      room === 8 || room === 11 || room === 12
        ? 0x5f5543
        : room === 9
          ? 0x444940
          : room === 10
            ? 0x4a4542
            : room === 0
              ? 0x343c35
              : room === 1
                ? 0x323331
                : room === 3
                  ? 0x393e3b
                  : 0x353c3d;
    this.box(
      0,
      -0.25,
      0,
      16,
      0.5,
      16,
      room === 19 || room === 20
        ? 0x646e62
        : room === 17 || room === 18
          ? 0x777b70
          : room === 15 || room === 16
            ? 0x626b75
            : room === 13 || room === 14
              ? 0x697970
              : room === 8 || room === 11 || room === 12
                ? 0x6f644e
                : room >= 9
                  ? 0x55574e
                  : 0x333532,
      false,
      room >= 8 ? "stone" : undefined,
    );
    this.box(0, 2.5, -8, 16, 5, 0.35, wall);
    this.box(-8, 2.5, 0, 0.35, 5, 16, wall);
    this.box(8, 2.5, 0, 0.35, 5, 16, wall);
    this.box(0, 2.5, 8, 16, 5, 0.35, wall);
    for (let i = -7; i <= 7; i += 2) {
      const joint = room === 8 ? 0x3c382f : room >= 9 ? 0x333831 : 0x171e1a;
      this.box(i, 0.01, 0, 0.025, 0.015, 16, joint, false);
      this.box(0, 0.012, i, 16, 0.015, 0.025, joint, false);
      this.box(
        i,
        2.4,
        -7.72,
        0.16,
        4.8,
        0.14,
        room === 8 ? 0x776b54 : 0x686555,
        false,
      );
      this.box(
        i,
        4.5,
        -7.65,
        1.8,
        0.12,
        0.18,
        room === 8 ? 0x8e795a : 0x77705b,
        false,
      );
    }
    this.box(
      0,
      0.025,
      0,
      3.5,
      0.025,
      12,
      room === 0
        ? 0x502f2b
        : room === 8
          ? 0x64513d
          : room >= 9
            ? 0x3d4642
            : 0x273732,
      false,
    );
    for (const x of [-6.8, 6.8])
      for (const z of [-5, 3]) {
        // The east pier at z=3 stood directly in front of the Roman threshold.
        // Keep its structural rhythm by moving this one pier behind the bay.
        const pierZ = room === 0 && x > 0 && z === 3 ? 0.7 : z;
        this.box(x, 1.6, pierZ, 0.4, 3.2, 0.4, 0x666654);
        this.lamp(
          x,
          3.1,
          pierZ,
          0xffbd80,
          7,
          quality !== 1 || (room !== 3 && room !== 6 && z < 0),
        );
      }
    if (room === 0) {
      scene.add(mansion(this.obstacles, this.upperObstacles));
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
    else if (room === 11 || room === 12)
      decorateMosaicWorkshop(this, items.includes("Boceto recompuesto"));
    else if (room === 13 || room === 14) decorateCoastalArchive(this);
    else if (room === 15 || room === 16)
      decorateStarObservatory(
        this,
        items.includes("Segundo azimut")
          ? 2
          : items.includes("Primer azimut")
            ? 1
            : items.includes("Patrón de Samira")
              ? 3
              : 0,
      );
    else if (room === 17 || room === 18)
      decorateQuarry(this, items.includes("Arco ensamblado"));
    else if (room === 19 || room === 20) decorateRoadHospital(this);
    else if (lateChapterForRoom(room)) decorateLateChapter(this, quality);
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
        x: room >= 11 ? -3.5 : -5.5,
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
    if (
      room !== 4 &&
      room !== 8 &&
      room !== 9 &&
      room !== 10 &&
      room !== 11 &&
      room !== 12 &&
      room !== 13 &&
      room !== 14 &&
      room !== 15 &&
      room !== 16 &&
      room !== 17 &&
      room !== 18 &&
      room !== 19 &&
      room !== 20 &&
      room < 21 &&
      !collected.includes("Tónico " + room)
    )
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
          id: "upper-save",
          name: "Escritorio del rellano · guardar",
          x: 2,
          z: -5.8,
          level: 1,
          kind: "save",
        },
        0xa58e6e,
      );
      if (!items.includes("Folio del rellano"))
        this.add(
          {
            id: "upper-portraits",
            name: "Recoger el folio de los huéspedes",
            x: -5.9,
            z: -2.5,
            level: 1,
            kind: "item",
            value: "Folio del rellano",
          },
          0x9b8868,
        );
      if (!items.includes("Carta de la raíz"))
        this.add(
          {
            id: "upper-observatory",
            name: "Recoger la carta de la raíz",
            x: -0.2,
            z: -2.2,
            level: 1,
            kind: "item",
            value: "Carta de la raíz",
          },
          0x8ca99b,
        );
      const portals = [
        { x: 4.2, z: -3.8 },
        { x: 4.2, z: -5.4 },
        { x: -4.2, z: -3.8 },
        { x: -4.2, z: -5.4 },
      ];
      lateChapters.forEach((chapter, index) => {
        const prerequisite =
          index === 0 ? "abbey-1348" : lateChapters[index - 1].id;
        const previouslyUnlocked = campaign.visited.includes(chapter.id);
        if (!campaign.completed.includes(prerequisite) && !previouslyUnlocked)
          return;
        // Isabelle's memory can be visited early. The later chain begins only
        // after Oona's testimony, while old saves retain visited portals.
        if (
          index === 0 &&
          !campaign.completed.includes("hospital-1217") &&
          !previouslyUnlocked
        )
          return;
        this.add(
          {
            id: `${chapter.id}-portal`,
            name: `Cruzar hacia ${chapter.place} · año ${chapter.year}`,
            x: portals[index].x,
            z: portals[index].z,
            kind: "door",
            target: chapter.room,
          },
          chapter.colors[1],
        );
      });
      this.add(
        {
          id: "roman-portal",
          name: "Atravesar la grieta romana · año 189",
          x: 6.2,
          z: 3,
          kind: "door",
          target: 8,
          rotation: Math.PI / 2,
        },
        0x9b8050,
      );
      if (campaign.completed.includes("roman-189"))
        this.add(
          {
            id: "mosaic-portal",
            name: "Seguir el molde hacia el taller · año 312",
            x: 6.2,
            z: -0.6,
            kind: "door",
            target: 11,
            rotation: Math.PI / 2,
          },
          0xb07854,
        );
      if (campaign.completed.includes("mosaic-312"))
        this.add(
          {
            id: "coast-portal",
            name: "Cruzar hacia el archivo costero · año 537",
            x: -6.2,
            z: 2.5,
            kind: "door",
            target: 13,
            rotation: -Math.PI / 2,
          },
          0x76989a,
        );
      if (campaign.completed.includes("coast-537"))
        this.add(
          {
            id: "stars-portal",
            name: "Seguir la carta astral · año 783",
            x: -6.2,
            z: -2.5,
            kind: "door",
            target: 15,
            rotation: -Math.PI / 2,
          },
          0x92a6b9,
        );
      if (campaign.completed.includes("stars-783"))
        this.add(
          {
            id: "quarry-portal",
            name: "Seguir las marcas de la cantera · año 1092",
            x: -6.2,
            z: 0,
            kind: "door",
            target: 17,
            rotation: -Math.PI / 2,
          },
          0x9a9b88,
        );
      if (campaign.completed.includes("quarry-1092"))
        this.add(
          {
            id: "hospital-portal",
            name: "Seguir el cuaderno de Oona · año 1217",
            x: 2.6,
            z: -3.3,
            kind: "door",
            target: 19,
            rotation: Math.PI / 2,
          },
          0x91a398,
        );
    }
    const late = lateChapterForRoom(room);
    if (late) {
      const first = room === late.room;
      const prefix = late.id;
      this.add(
        {
          id: `${prefix}-${first ? "return" : "back"}`,
          name: first ? "Regresar a 1927" : `Volver a ${late.place}`,
          x: 0,
          z: 6.1,
          kind: "door",
          target: first ? 0 : late.room,
        },
        late.colors[1],
      );
      if (first) {
        this.add(
          {
            id: `${prefix}-inner`,
            name: `Entrar en ${late.inner}`,
            x: 0,
            z: -6.1,
            kind: "door",
            target: late.room + 1,
          },
          late.colors[1],
        );
        if (!items.includes(late.clue))
          this.add(
            {
              id: `${prefix}-clue`,
              name: `Recoger ${late.clue}`,
              x: 2.25,
              z: -1.6,
              kind: "item",
              value: late.clue,
            },
            late.colors[1],
          );
      } else {
        late.evidence.forEach((evidence, index) => {
          this.add(
            {
              id: `${prefix}-evidence-${index}`,
              name: `Inspeccionar ${evidence.name}`,
              x: index === 0 ? -2.4 : 2.4,
              z: 1.15,
              kind: "lateEvidence",
              value: String(index),
            },
            late.colors[1],
          );
        });
        this.add(
          {
            id: `${prefix}-puzzle`,
            name: late.puzzleTask,
            x: -2.4,
            z: -2.2,
            kind: "latePuzzle",
          },
          late.colors[1],
        );
        if (!items.includes(late.artifact))
          this.add(
            {
              id: `${prefix}-artifact`,
              name: `Conservar ${late.artifact}`,
              x: 2.4,
              z: -4.1,
              kind: "item",
              value: late.artifact,
            },
            late.colors[1],
          );
      }
    }
    if (room === 19) {
      this.add(
        {
          id: "hospital-return",
          name: "Regresar a 1927",
          x: 0,
          z: 6.1,
          kind: "door",
          target: 0,
        },
        0x91a398,
      );
      this.add(
        {
          id: "hospital-ward",
          name: "Entrar en la enfermería",
          x: 0,
          z: -6.1,
          kind: "door",
          target: 20,
        },
        0x91a398,
      );
      if (!items.includes("Hierbas de serbal"))
        this.add(
          {
            id: "hospital-rowan",
            name: "Recoger hierbas de serbal",
            x: -2.3,
            z: 1.6,
            kind: "item",
            value: "Hierbas de serbal",
          },
          0x829a73,
        );
    }
    if (room === 20) {
      this.add(
        {
          id: "hospital-back",
          name: "Volver a la sala de camino",
          x: 0,
          z: 6.1,
          kind: "door",
          target: 19,
        },
        0x91a398,
      );
      this.add(
        {
          id: "hospital-remedy",
          name: "Comparar remedios e historiales",
          x: -2.4,
          z: -2.2,
          kind: "hospitalRemedy",
        },
        0x9da98a,
      );
      if (!items.includes("Cuaderno de Oona"))
        this.add(
          {
            id: "hospital-record",
            name: "Salvar el cuaderno de Oona",
            x: 0,
            z: -4.1,
            kind: "item",
            value: "Cuaderno de Oona",
          },
          0xb4aa8e,
        );
      this.add(
        {
          id: "hospital-testimony",
          name: "Conservar un testimonio",
          x: 2.2,
          z: -2.2,
          kind: "hospitalChoice",
        },
        0xaca58a,
      );
    }
    if (room === 17) {
      this.add(
        {
          id: "quarry-return",
          name: "Regresar a 1927",
          x: 0,
          z: 6.1,
          kind: "door",
          target: 0,
        },
        0x9a9b88,
      );
      this.add(
        {
          id: "quarry-chamber",
          name: "Entrar en la cámara del arco",
          x: 0,
          z: -6.1,
          kind: "door",
          target: 18,
        },
        0x9a9b88,
      );
      if (!items.includes("Cuña marcada"))
        this.add(
          {
            id: "quarry-wedge",
            name: "Recoger la cuña marcada",
            x: -3.4,
            z: 1.8,
            kind: "item",
            value: "Cuña marcada",
          },
          0xa79b7c,
        );
    }
    if (room === 18) {
      this.add(
        {
          id: "quarry-back",
          name: "Volver a la cantera",
          x: 0,
          z: 6.1,
          kind: "door",
          target: 17,
        },
        0x9a9b88,
      );
      this.add(
        {
          id: "quarry-assembly",
          name: "Ensamblar el arco de piedra",
          x: -2.8,
          z: -4.4,
          kind: "quarryArch",
        },
        0xa79b7c,
      );
      if (!items.includes("Plano del umbral"))
        this.add(
          {
            id: "quarry-plan",
            name: "Conservar el plano del umbral",
            x: 0,
            z: -4.05,
            kind: "item",
            value: "Plano del umbral",
          },
          0xb7ac8d,
        );
    }
    if (room === 15) {
      this.add(
        {
          id: "stars-return",
          name: "Regresar a 1927",
          x: 0,
          z: 6.1,
          kind: "door",
          target: 0,
        },
        0x92a6b9,
      );
      this.add(
        {
          id: "stars-dome",
          name: "Entrar en la cúpula",
          x: 0,
          z: -6.1,
          kind: "door",
          target: 16,
        },
        0x92a6b9,
      );
      if (!items.includes("Carta astral"))
        this.add(
          {
            id: "stars-chart",
            name: "Recoger la carta astral",
            x: -3.4,
            z: 1.7,
            kind: "item",
            value: "Carta astral",
          },
          0xb8b398,
        );
    }
    if (room === 16) {
      this.add(
        {
          id: "stars-back",
          name: "Volver a la terraza",
          x: 0,
          z: 6.1,
          kind: "door",
          target: 15,
        },
        0x92a6b9,
      );
      this.add(
        {
          id: "stars-wheel",
          name: "Alinear el astrolabio",
          x: -2.7,
          z: -4.4,
          kind: "starAlignment",
        },
        0xb8b398,
      );
      if (!items.includes("Disco estelar"))
        this.add(
          {
            id: "stars-disc",
            name: "Conservar el disco estelar",
            x: 0,
            z: -4,
            kind: "item",
            value: "Disco estelar",
          },
          0xc6b790,
        );
    }
    if (room === 13) {
      this.add(
        {
          id: "coast-return",
          name: "Regresar a 1927",
          x: 0,
          z: 6.1,
          kind: "door",
          target: 0,
        },
        0x76989a,
      );
      this.add(
        {
          id: "coast-vault",
          name: "Entrar en el depósito de embarque",
          x: 0,
          z: -6.1,
          kind: "door",
          target: 14,
        },
        0x76989a,
      );
      if (!items.includes("Tabla de mareas"))
        this.add(
          {
            id: "coast-tides",
            name: "Recoger tabla de mareas",
            x: -3.5,
            z: 2,
            kind: "item",
            value: "Tabla de mareas",
          },
          0xa9b9a3,
        );
    }
    if (room === 14) {
      this.add(
        {
          id: "coast-back",
          name: "Volver al muelle",
          x: 0,
          z: 6.1,
          kind: "door",
          target: 13,
        },
        0x76989a,
      );
      this.add(
        {
          id: "coast-ledger",
          name: "Cruzar fechas y mareas",
          x: -2.7,
          z: -3.8,
          kind: "coastLedger",
        },
        0xb1ad91,
      );
      if (!items.includes("Lista de pasajeros"))
        this.add(
          {
            id: "coast-list",
            name: "Conservar la lista de pasajeros",
            x: 0,
            z: -4.05,
            kind: "item",
            value: "Lista de pasajeros",
          },
          0xbeb69c,
        );
    }
    if (room === 11) {
      this.add(
        {
          id: "mosaic-return",
          name: "Regresar a 1927",
          x: 0,
          z: 6.1,
          kind: "door",
          target: 0,
        },
        0xa67d55,
      );
      this.add(
        {
          id: "mosaic-kiln",
          name: "Entrar al horno de las teselas",
          x: 0,
          z: -6.1,
          kind: "door",
          target: 12,
        },
        0xa67d55,
      );
      if (!items.includes("Pigmento de cinabrio"))
        this.add(
          {
            id: "mosaic-pigment",
            name: "Recoger pigmento de cinabrio",
            x: -4.4,
            z: 1.6,
            kind: "item",
            value: "Pigmento de cinabrio",
          },
          0xb75d47,
        );
    }
    if (room === 12) {
      this.add(
        {
          id: "mosaic-back",
          name: "Volver a la galería",
          x: 0,
          z: 6.1,
          kind: "door",
          target: 11,
        },
        0xa67d55,
      );
      this.add(
        {
          id: "mosaic-pattern",
          name: "Recomponer el rostro en las teselas",
          x: -3.5,
          z: -4.4,
          kind: "mosaicPuzzle",
        },
        0xbb8e62,
      );
      if (!items.includes("Molde de Aurelia"))
        this.add(
          {
            id: "mosaic-mold",
            name: "Recuperar el molde auténtico",
            x: 0,
            z: -4.2,
            kind: "item",
            value: "Molde de Aurelia",
          },
          0xc2a77e,
        );
    }
    if (room === 9) {
      this.add(
        {
          id: "medieval-return",
          name: "Regresar a 1927",
          x: 0,
          z: 6.1,
          kind: "door",
          target: 0,
        },
        0x9a866a,
      );
      this.add(
        {
          id: "medieval-scriptorium",
          name: "Entrar al scriptorium",
          x: 0,
          z: -6.1,
          kind: "door",
          target: 10,
        },
        0x9a866a,
      );
    }
    if (room === 10) {
      this.add(
        {
          id: "medieval-back",
          name: "Volver al claustro",
          x: 0,
          z: 6.1,
          kind: "door",
          target: 9,
        },
        0x9a866a,
      );
      this.add(
        {
          id: "medieval-manuscript",
          name: "Descifrar el códice sellado",
          x: -2.9,
          z: -4.7,
          kind: "medievalPuzzle",
        },
        0xa89c7d,
      );
      if (!collected.includes("Códice de Montfort"))
        this.add(
          {
            id: "medieval-codex",
            name: "Recuperar el códice de Montfort",
            x: 0,
            z: -4.1,
            kind: "item",
            value: "Códice de Montfort",
          },
          0xc3ac87,
        );
    }
    if (room === 8) {
      for (const echo of romanEchoes)
        if (!campaign.witnessed.includes(echo.id))
          this.add(
            {
              id: echo.id,
              name: echo.name,
              x: echo.x,
              z: echo.z,
              kind: "romanEcho",
            },
            0xb49768,
          );
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
          id: "medieval-portal",
          name: campaign.completed.includes("hospital-1217")
            ? "Cruzar hacia el claustro de 1348"
            : "Observar un recuerdo adelantado de 1348",
          x: -5.8,
          z: -5.2,
          kind: "door",
          target: 9,
        },
        0x877c69,
      );
    if (room === 0) {
      this.add(
        {
          id: "legacy-desk",
          name: "Reconstruir la memoria de las tres épocas",
          x: -2.5,
          z: -4.7,
          kind: "legacy",
        },
        0xaeb993,
      );
      this.add(
        {
          id: "ritual-table",
          name: "Leer la mesa de los tres signos",
          x: 0,
          z: 2.7,
          kind: "ritual",
        },
        0xa6ac91,
      );
      if (items.includes("Memoria reconciliada"))
        this.add(
          {
            id: "legacy-passage",
            name: "Atravesar el pasaje temporal · archivo Veyr",
            x: 2.7,
            z: -5.8,
            kind: "door",
            target: 5,
          },
          0x79b89d,
        );
    }
    if (room === 5 && items.includes("Memoria reconciliada")) {
      this.add(
        {
          id: "memory-altar",
          name: "Elegir el legado que sobrevivirá",
          x: 2.8,
          z: 3.2,
          kind: "memoryChoice",
        },
        0xb0a079,
      );
      this.add(
        {
          id: "legacy-back",
          name: "Volver por el pasaje temporal · vestíbulo",
          x: -2.8,
          z: -5.8,
          kind: "door",
          target: 0,
        },
        0x79b89d,
      );
    }
    if (room === 0) {
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
      this.add(
        {
          id: "gallery-chart",
          name: "Examinar carta astral del rellano",
          x: 4.35,
          z: -6.1,
          kind: "galleryClue",
        },
        0xb6a073,
      );
    }
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
    if (
      room === 5 &&
      (items.includes("Juramento de Lucius") ||
        items.includes("Promesa de Isabelle"))
    ) {
      const roman = items.includes("Juramento de Lucius");
      const aura = new T.Mesh(
        new T.TorusGeometry(0.65, 0.06, 8, 32),
        new T.MeshStandardMaterial({
          color: roman ? 0xc69a54 : 0xa18cc8,
          emissive: roman ? 0x795327 : 0x513d7d,
          emissiveIntensity: 0.7,
        }),
      );
      aura.rotation.x = Math.PI / 2;
      aura.position.set(2.8, 1.45, 3.2);
      this.scene.add(aura);
      this.lamp(2.8, 2.5, 3.2, roman ? 0xdab16f : 0x9889d0, 7);
    }
    if (room === 4 && items.includes("Memoria reconciliada")) {
      const ring = new T.Mesh(
        new T.TorusGeometry(0.7, 0.065, 8, 32),
        new T.MeshStandardMaterial({
          color: 0x9fc8a8,
          emissive: 0x3b796b,
          emissiveIntensity: 0.7,
        }),
      );
      ring.position.set(0, 2.2, -3.2);
      this.scene.add(ring);
    }
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
      if (items.includes("Lectura del umbral"))
        this.add(
          {
            id: "ritual-secret",
            name: "Examinar el nombre bajo la piedra",
            x: -2.1,
            z: 4.4,
            kind: "ritualSecret",
          },
          0xa7c9ae,
        );
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
    if (room <= 7) decorateMansionEchoes(this, items);
    const staticGroup = new T.Group();
    for (const object of [...scene.children])
      if (object.userData.staticBox) staticGroup.add(object);
    batchRigid(staticGroup);
    scene.add(staticGroup);
    this.shadowLight = lightScene(scene, quality, room);
    this.shadowBudget = new ShadowBudget(quality);
    this.atmosphere = new Atmosphere(scene, qualityProfile(quality).dust, room);
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
    surfaceOverride?: Surface,
  ) {
    const surface =
      surfaceOverride ??
      (h < 0.05 && w > 2 ? "fabric" : h > 3 ? "plaster" : "stone");
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
    if (!lit) return;
    const l = new T.PointLight(color, intensity, 10, 2);
    l.position.set(x, y, z);
    this.scene.add(l);
    this.lights.push(l);
  }
  add(o: Interactable, color: number) {
    const m = prop(o.kind, o.id, color);
    m.position.set(
      o.x,
      o.level === 1 || o.kind === "galleryClue" ? 2.64 : 0,
      o.z,
    );
    if (o.rotation) m.rotation.y = o.rotation;
    this.scene.add(m);
    o.mesh = m;
    this.objects.push(o);
  }
  nearest(x: number, z: number, radius = 1.9, y = 0) {
    let nearest: Interactable | undefined;
    let best = radius * radius;
    for (const object of this.objects) {
      if (
        this.room === 0 &&
        (object.level === 1 || object.kind === "galleryClue") !== y > 1.4
      )
        continue;
      const dx = object.x - x;
      const dz = object.z - z;
      const distance = dx * dx + dz * dz;
      if (distance < best) {
        best = distance;
        nearest = object;
      }
    }
    return nearest;
  }
  remove(o: Interactable) {
    if (!this.objects.includes(o)) return;
    this.objects = this.objects.filter((item) => item !== o);
    if (!o.mesh) return;
    this.scene.remove(o.mesh);
    // Each prop owns its geometry and materials. Surface textures are shared
    // across rooms and remain in the cache for subsequent props.
    const geometries = new Set<T.BufferGeometry>();
    const materials = new Set<T.Material>();
    o.mesh.traverse((child) => {
      if (!(child instanceof T.Mesh)) return;
      geometries.add(child.geometry);
      for (const material of Array.isArray(child.material)
        ? child.material
        : [child.material])
        materials.add(material);
    });
    for (const geometry of geometries) geometry.dispose();
    for (const material of materials) material.dispose();
    o.mesh = undefined;
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
