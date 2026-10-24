import * as T from "three";
import { batchRigid } from "../render/batch";
import { pbr } from "../render/materials";
import type { World } from "./scene";

/** The historical evidence physically rewrites the house on every load. */
export const mansionEchoes = [
  {
    id: "roman",
    year: 189,
    item: "Tablilla del intervalo",
    room: 0,
    x: 6.1,
    z: 5.2,
    title: "La junta de Lucius",
    text: "La junta romana atraviesa la piedra del vestíbulo. Lucius trazó el primer límite del Intervalo aquí, muchos siglos antes de que existiera la casa.",
    color: 0xa89b75,
    form: "inscription",
  },
  {
    id: "aurelia",
    year: 312,
    item: "Molde de Aurelia",
    room: 1,
    x: 5.8,
    z: -5.2,
    title: "El rostro recuperado",
    text: "Un rostro de teselas asoma entre los lomos de la biblioteca. Aurelia impidió que la copia sustituyera al original.",
    color: 0xa36e55,
    form: "face",
  },
  {
    id: "maeve",
    year: 537,
    item: "Lista de pasajeros",
    room: 1,
    x: -5.8,
    z: 4.3,
    title: "La marca de la marea",
    text: "La humedad dibuja una línea de embarque imposible. El nombre salvado por Maeve sigue escrito por encima del agua.",
    color: 0x6c9995,
    form: "tide",
  },
  {
    id: "samira",
    year: 783,
    item: "Disco estelar",
    room: 3,
    x: -5.3,
    z: 4.3,
    title: "El cielo de Samira",
    text: "La bóveda de la capilla adopta la constelación ausente que Samira midió. Una estrella queda deliberadamente vacía.",
    color: 0x96adc0,
    form: "stars",
  },
  {
    id: "idris",
    year: 1092,
    item: "Plano del umbral",
    room: 7,
    x: 5.4,
    z: -5.2,
    title: "El arco de Idris",
    text: "Una arcada de cantera aflora del muro del sótano. Sus dovelas repiten las medidas del plano de Idris.",
    color: 0x9c9e8a,
    form: "arch",
  },
  {
    id: "oona",
    year: 1217,
    item: "Cuaderno de Oona",
    room: 5,
    x: -4.1,
    z: 4.4,
    title: "La cama ausente",
    text: "El registro del archivo conserva una cama sin paciente. Oona dejó espacio para una identidad que la casa intentó sobrescribir.",
    color: 0xa2b7a0,
    form: "ledger",
  },
  {
    id: "isabelle",
    year: 1348,
    item: "Códice de Montfort",
    room: 3,
    x: 5.3,
    z: 4.3,
    title: "La campana de Isabelle",
    text: "Una campana muda aparece bajo la bóveda. Su inscripción conserva el nombre que Isabelle copió durante la peste.",
    color: 0xa49779,
    form: "bell",
  },
  {
    id: "tomas",
    year: 1491,
    item: "Plancha auténtica",
    room: 1,
    x: 2.9,
    z: 4.5,
    title: "La página invertida",
    text: "Los tipos metálicos invierten una página de la biblioteca. La falsificación que Tomás descubrió ya no puede confundirse con el códice.",
    color: 0xb39568,
    form: "print",
  },
  {
    id: "ines",
    year: 1610,
    item: "Acta original de Inés",
    room: 5,
    x: 4.1,
    z: 4.4,
    title: "El retrato envejecido",
    text: "El retrato de Inés ha envejecido cuatro siglos en una noche. El acta del primer pacto se transparenta bajo la pintura.",
    color: 0x9a7767,
    form: "portrait",
  },
  {
    id: "amara",
    year: 1786,
    item: "Partitura del silencio",
    room: 3,
    x: 0,
    z: 4.7,
    title: "El mecanismo sin voz",
    text: "Un pequeño mecanismo escénico marca el compás del silencio. Amara dejó una pausa donde la casa espera oír una orden.",
    color: 0xbfa77b,
    form: "clock",
  },
  {
    id: "emile",
    year: 1899,
    item: "Placa de la puerta",
    room: 0,
    x: -6.1,
    z: 4.3,
    title: "La puerta fotografiada",
    text: "Una puerta de tres bisagras proyecta su sombra sobre el vestíbulo. Émile la fotografió antes de que sus tablones fueran instalados.",
    color: 0x94a8a2,
    form: "door",
  },
  {
    id: "elise",
    year: 1927,
    item: "Memoria reconciliada",
    room: 5,
    x: 0,
    z: 4.7,
    title: "La memoria de Élise",
    text: "Las pruebas reunidas por Élise abren una grieta legible en el archivo. La casa ya no decide sola qué nombres sobreviven.",
    color: 0xa7c9ae,
    form: "memory",
  },
] as const;

export type MansionEcho = (typeof mansionEchoes)[number];
export function activeMansionEchoes(items: readonly string[], room?: number) {
  return mansionEchoes.filter(
    (echo) =>
      items.includes(echo.item) && (room === undefined || echo.room === room),
  );
}

function echoModel(echo: MansionEcho) {
  const group = new T.Group();
  group.name = `mansion-echo-${echo.id}`;
  const stone = pbr("stone", 0x353e3b);
  const accent = pbr("brass", echo.color);
  const dark = pbr("wood", 0x332d29);
  const paper = pbr("fabric", 0xb8ae94);
  const box = (
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    material: T.Material,
  ) => {
    const mesh = new T.Mesh(new T.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    group.add(mesh);
  };
  const ring = (r: number, y: number, material: T.Material, segments = 20) => {
    const mesh = new T.Mesh(
      new T.TorusGeometry(r, 0.045, 6, segments),
      material,
    );
    mesh.position.set(0, y, 0.19);
    group.add(mesh);
  };
  // The relief occupies a shallow wall bay; it never creates a new collision.
  box(0, 1.55, 0, 1.22, 2.35, 0.18, stone);
  box(0, 2.78, 0.02, 1.37, 0.13, 0.28, accent);
  box(0, 0.35, 0.02, 1.37, 0.12, 0.28, accent);
  if (echo.form === "inscription") {
    for (let i = 0; i < 5; i++)
      box(
        -0.36 + i * 0.18,
        1.12 + (i % 2) * 0.3,
        0.13,
        0.055,
        0.78,
        0.035,
        accent,
      );
  } else if (echo.form === "face" || echo.form === "portrait") {
    const head = new T.Mesh(
      new T.SphereGeometry(0.39, 12, 8),
      echo.form === "face" ? accent : paper,
    );
    head.scale.set(0.7, 1, 0.25);
    head.position.set(0, 1.85, 0.18);
    group.add(head);
    box(0, 0.9, 0.16, 0.72, 0.8, 0.13, echo.form === "face" ? paper : dark);
    for (const x of [-0.13, 0.13])
      box(x, 1.88, 0.29, 0.065, 0.035, 0.025, dark);
    if (echo.form === "portrait")
      for (let i = 0; i < 4; i++)
        box(-0.4 + i * 0.25, 1.4 - i * 0.13, 0.3, 0.025, 1.35, 0.01, accent);
  } else if (echo.form === "tide") {
    for (let i = 0; i < 4; i++)
      box(0, 0.8 + i * 0.33, 0.13, 0.92, 0.045, 0.04, accent);
    box(0, 1.91, 0.14, 0.82, 0.16, 0.07, dark);
    box(0, 2.13, 0.14, 0.06, 0.38, 0.06, paper);
  } else if (
    echo.form === "stars" ||
    echo.form === "clock" ||
    echo.form === "memory"
  ) {
    ring(0.38, 1.65, accent);
    ring(0.2, 1.65, paper, 16);
    for (let i = 0; i < (echo.form === "stars" ? 5 : 8); i++) {
      const a = (i * Math.PI * 2) / (echo.form === "stars" ? 6 : 8);
      box(
        Math.sin(a) * 0.39,
        1.65 + Math.cos(a) * 0.39,
        0.2,
        0.07,
        0.07,
        0.04,
        i === 2 && echo.form === "stars" ? dark : accent,
      );
    }
    if (echo.form === "clock") box(0.12, 1.75, 0.25, 0.34, 0.04, 0.03, dark);
    if (echo.form === "memory") box(0, 1.65, 0.25, 0.08, 0.85, 0.03, paper);
  } else if (echo.form === "arch" || echo.form === "door") {
    for (const x of [-0.43, 0.43]) box(x, 1.47, 0.16, 0.17, 1.75, 0.22, accent);
    box(0, 2.42, 0.16, 1.02, 0.22, 0.22, accent);
    if (echo.form === "door") {
      for (const y of [0.84, 1.45, 2.07])
        box(-0.41, y, 0.29, 0.11, 0.13, 0.1, paper);
      box(0, 1.43, 0.1, 0.7, 1.65, 0.04, dark);
    }
  } else if (echo.form === "bell") {
    const bell = new T.Mesh(new T.ConeGeometry(0.38, 0.65, 12), accent);
    bell.rotation.z = Math.PI;
    bell.position.set(0, 1.68, 0.19);
    group.add(bell);
    box(0, 2.11, 0.2, 0.58, 0.08, 0.11, paper);
  } else if (echo.form === "ledger" || echo.form === "print") {
    box(0, 1.55, 0.14, 0.8, 1.2, 0.04, paper);
    for (let i = 0; i < 6; i++)
      box(
        echo.form === "print" ? -0.28 + i * 0.11 : 0,
        echo.form === "print" ? 1.55 : 1.13 + i * 0.16,
        0.18,
        echo.form === "print" ? 0.055 : 0.62,
        echo.form === "print" ? 0.65 : 0.025,
        0.015,
        dark,
      );
  }
  group.position.set(echo.x, 0, echo.z);
  // Wall reliefs face the center of the room, including the south bays.
  group.rotation.y =
    echo.x > 4.5
      ? -Math.PI / 2
      : echo.x < -4.5
        ? Math.PI / 2
        : echo.z > 0
          ? Math.PI
          : 0;
  return batchRigid(group);
}

export function decorateMansionEchoes(world: World, items: readonly string[]) {
  for (const echo of activeMansionEchoes(items, world.room)) {
    const mesh = echoModel(echo);
    world.scene.add(mesh);
    world.objects.push({
      id: `mansion-echo-${echo.id}`,
      name: `Examinar ${echo.title.toLowerCase()} · ${echo.year}`,
      x: echo.x,
      z: echo.z,
      kind: "mansionEcho",
      value: echo.id,
      mesh,
    });
  }
}
