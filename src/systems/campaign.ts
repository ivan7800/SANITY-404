/** Stable narrative identifiers. Only rooms with actual scenes may enter production. */
import { lateChapters } from "./late-chapters";
export const chapters = [
  {
    id: "roman-189",
    year: 189,
    hero: "Lucius Varro",
    place: "Santuario de los nombres",
    prerequisite: null,
    room: 8,
    status: "production",
  },
  {
    id: "mosaic-312",
    year: 312,
    hero: "Aurelia",
    place: "Taller de mosaicos",
    prerequisite: "roman-189",
    room: 11,
    status: "production",
  },
  {
    id: "coast-537",
    year: 537,
    hero: "Maeve",
    place: "Archivo costero",
    prerequisite: "mosaic-312",
    room: 13,
    status: "production",
  },
  {
    id: "stars-783",
    year: 783,
    hero: "Samira",
    place: "Observatorio de montaña",
    prerequisite: "coast-537",
    room: 15,
    status: "production",
  },
  {
    id: "quarry-1092",
    year: 1092,
    hero: "Idris",
    place: "Cantera alpina",
    prerequisite: "stars-783",
    room: 17,
    status: "production",
  },
  {
    id: "hospital-1217",
    year: 1217,
    hero: "Oona",
    place: "Hospital de camino",
    prerequisite: "quarry-1092",
    room: 19,
    status: "production",
  },
  {
    id: "abbey-1348",
    year: 1348,
    hero: "Isabelle de Montfort",
    place: "Claustro y scriptorium",
    prerequisite: "hospital-1217",
    room: 9,
    status: "production",
  },
  {
    id: "press-1491",
    year: 1491,
    hero: "Tomás",
    place: "Imprenta de frontera",
    prerequisite: "abbey-1348",
    room: 21,
    status: "production",
  },
  {
    id: "veyr-1610",
    year: 1610,
    hero: "Inés Veyr",
    place: "Casa Veyr",
    prerequisite: "press-1491",
    room: 23,
    status: "production",
  },
  {
    id: "theatre-1786",
    year: 1786,
    hero: "Amara",
    place: "Teatro de autómatas",
    prerequisite: "veyr-1610",
    room: 25,
    status: "production",
  },
  {
    id: "photo-1899",
    year: 1899,
    hero: "Émile",
    place: "Archivo fotográfico",
    prerequisite: "theatre-1786",
    room: 27,
    status: "production",
  },
  {
    id: "mansion-1927",
    year: 1927,
    hero: "Élise Moreau",
    place: "Mansión Veyr",
    prerequisite: "photo-1899",
    room: 0,
    status: "production",
  },
] as const;

export type ChapterId = (typeof chapters)[number]["id"];
export interface CampaignProgress {
  visited: ChapterId[];
  completed: ChapterId[];
  witnessed: string[];
}
export const romanEchoes = [
  {
    id: "roman-echo-ash",
    name: "Testimonio de la ceniza",
    x: -4.15,
    z: 3.45,
    title: "Lo que se consume",
    text: "Una tablilla ennegrecida conserva los nombres de quienes ardieron antes de que Roma levantara este santuario. Lucius lee el primer signo: CENIZA.",
  },
  {
    id: "roman-echo-tide",
    name: "Testimonio de la marea",
    x: 4.15,
    z: 3.45,
    title: "Lo que retorna",
    text: "El agua ha dejado sal en una piedra que jamás vio el mar. Las letras regresan una y otra vez: MAREA es el segundo signo.",
  },
  {
    id: "roman-echo-threshold",
    name: "Testimonio del umbral",
    x: 0,
    z: 1.35,
    title: "Lo que se atraviesa",
    text: "La última estela señala el arco meridional. Ningún soldado proyecta sombra al cruzarlo. UMBRAL cierra la secuencia.",
  },
] as const;
const witnessedEvents = new Set<string>([
  "roman-formation",
  ...romanEchoes.map((echo) => echo.id),
  ...lateChapters.flatMap((chapter) => [
    ...chapter.evidence.map((_, index) => `${chapter.id}-evidence-${index}`),
    `${chapter.id}-step-1`,
    `${chapter.id}-step-2`,
  ]),
]);
export const newCampaign = (): CampaignProgress => ({
  visited: ["mansion-1927"],
  completed: [],
  witnessed: [],
});
const ids = new Set<string>(
  chapters
    .filter((chapter) => chapter.room !== null)
    .map((chapter) => chapter.id),
);
export function validCampaign(value: unknown): value is CampaignProgress {
  if (!value || typeof value !== "object") return false;
  const progress = value as Record<string, unknown>;
  return (
    ["visited", "completed", "witnessed"].every((key) => {
      const entries = progress[key];
      return (
        Array.isArray(entries) &&
        entries.length <= (key === "witnessed" ? 24 : 12) &&
        new Set(entries).size === entries.length &&
        entries.every(
          (entry: unknown) =>
            typeof entry === "string" &&
            (key === "witnessed" ? witnessedEvents.has(entry) : ids.has(entry)),
        )
      );
    }) &&
    (progress.completed as string[]).every((id) =>
      (progress.visited as string[]).includes(id),
    ) &&
    lateChapters.every(
      (chapter) =>
        !(progress.witnessed as string[]).includes(`${chapter.id}-step-2`) ||
        (progress.witnessed as string[]).includes(`${chapter.id}-step-1`),
    )
  );
}
export function visitChapter(progress: CampaignProgress, id: ChapterId) {
  if (!progress.visited.includes(id)) progress.visited.push(id);
}
export function completeChapter(progress: CampaignProgress, id: ChapterId) {
  visitChapter(progress, id);
  if (!progress.completed.includes(id)) progress.completed.push(id);
}
export function romanObjective(state: {
  read: string[];
  items: string[];
  defeated: string[];
  campaign: CampaignProgress;
}): string {
  if (!state.read.includes("8"))
    return "Explora el santuario y lee la inscripción del testigo.";
  if (!state.campaign.witnessed.includes("roman-formation"))
    return "Afronta la formación imposible que despierta en el santuario.";
  if (!state.items.includes("Marca de Varro"))
    return "Ordena las tres edades en el altar.";
  if (!state.defeated.includes("enemy8"))
    return "Derrota al centurión sin nombre con el gladius.";
  if (!state.items.includes("Tablilla del intervalo"))
    return "Recupera la tablilla y conserva el primer signo.";
  return "Regresa por el arco sur para dejar la tablilla a la siguiente época.";
}

export function mosaicObjective(state: {
  read: string[];
  items: string[];
  defeated: string[];
}): string {
  if (!state.read.includes("11"))
    return "Lee el registro del taller y sigue el pigmento rojo.";
  if (!state.items.includes("Pigmento de cinabrio"))
    return "Recupera el pigmento de la galería antes de entrar al horno.";
  if (!state.items.includes("Boceto recompuesto"))
    return "Ordena las teselas en el horno siguiendo el registro.";
  if (!state.defeated.includes("enemy12"))
    return "Resiste al custodio de teselas y abre la cámara del molde.";
  if (!state.items.includes("Molde de Aurelia"))
    return "Conserva el molde auténtico para la siguiente época.";
  return "Regresa por el pórtico del taller con el molde.";
}

export function abbeyObjective(state: {
  read: string[];
  items: string[];
  defeated: string[];
}): string {
  if (!state.read.includes("9"))
    return "Lee el registro de la última campana en el claustro.";
  if (!state.read.includes("10"))
    return "Entra al scriptorium y lee el códice de los que recuerdan.";
  if (!state.items.includes("Sello de Montfort"))
    return "Descifra el nombre anterior en el manuscrito sellado.";
  if (!state.defeated.includes("enemy10"))
    return "Vence al copista de las fiebres para abrir el códice.";
  if (!state.items.includes("Códice de Montfort"))
    return "Recupera el códice y conserva la prueba de Isabelle.";
  return "Regresa al claustro y cruza el arco hacia 1927.";
}

export function attemptMosaicPattern(
  state: { read: string[]; items: string[]; sanity: number },
  choice: number,
): "locked" | "already" | "wrong" | "solved" {
  if (
    !state.read.includes("11") ||
    !state.items.includes("Pigmento de cinabrio")
  )
    return "locked";
  if (state.items.includes("Boceto recompuesto")) return "already";
  if (choice !== 1) {
    state.sanity = Math.max(0, state.sanity - 5);
    return "wrong";
  }
  state.items.push("Boceto recompuesto");
  return "solved";
}

export function coastObjective(state: {
  read: string[];
  items: string[];
  defeated: string[];
}): string {
  if (!state.read.includes("13"))
    return "Lee el libro de salidas del archivo costero.";
  if (!state.items.includes("Tabla de mareas"))
    return "Recoge la tabla de mareas junto al muelle.";
  if (!state.read.includes("14"))
    return "Cruza al depósito y examina el registro de la marea imposible.";
  if (!state.items.includes("Registro corregido"))
    return "Cruza fecha y marea para identificar el barco borrado.";
  if (!state.defeated.includes("enemy14"))
    return "Sobrevive al custodio ahogado que guarda la lista.";
  if (!state.items.includes("Lista de pasajeros"))
    return "Conserva los nombres de los pasajeros ausentes.";
  return "Evacúa el archivo por la escalinata del muelle.";
}

export function correctCoastLedger(
  state: { read: string[]; items: string[]; sanity: number },
  choice: number,
): "locked" | "already" | "wrong" | "solved" {
  if (
    !state.read.includes("13") ||
    !state.read.includes("14") ||
    !state.items.includes("Tabla de mareas")
  )
    return "locked";
  if (state.items.includes("Registro corregido")) return "already";
  if (choice !== 2) {
    state.sanity = Math.max(0, state.sanity - 6);
    return "wrong";
  }
  state.items.push("Registro corregido");
  return "solved";
}

export function starsObjective(state: {
  read: string[];
  items: string[];
  defeated: string[];
}): string {
  if (!state.read.includes("15"))
    return "Lee las observaciones de Samira en la terraza.";
  if (!state.items.includes("Carta astral"))
    return "Recoge la carta astral bajo la bóveda abierta.";
  if (!state.read.includes("16"))
    return "Entra en la cúpula y consulta las posiciones del astro ausente.";
  if (!state.items.includes("Patrón de Samira"))
    return "Alinea el astrolabio: alba, ocaso y noche, en ese orden.";
  if (!state.defeated.includes("enemy16"))
    return "Evita al vigilante ciego y rompe su custodia del disco.";
  if (!state.items.includes("Disco estelar"))
    return "Conserva el disco que señala la puerta futura.";
  return "Cruza de nuevo la terraza y deja el disco a la siguiente época.";
}

export function starAlignmentStep(
  state: { read: string[]; items: string[]; sanity: number },
  choice: number,
): "locked" | "already" | "wrong" | "correct" | "solved" {
  if (
    !state.read.includes("15") ||
    !state.read.includes("16") ||
    !state.items.includes("Carta astral")
  )
    return "locked";
  if (state.items.includes("Patrón de Samira")) return "already";
  const stage = state.items.includes("Segundo azimut")
    ? 2
    : state.items.includes("Primer azimut")
      ? 1
      : 0;
  if (choice !== [0, 2, 1][stage]) {
    state.sanity = Math.max(0, state.sanity - 5);
    state.items = state.items.filter(
      (item) => item !== "Primer azimut" && item !== "Segundo azimut",
    );
    return "wrong";
  }
  if (stage === 2) {
    state.items = state.items.filter(
      (item) => item !== "Primer azimut" && item !== "Segundo azimut",
    );
    state.items.push("Patrón de Samira");
    return "solved";
  }
  state.items.push(stage === 0 ? "Primer azimut" : "Segundo azimut");
  return "correct";
}

export function quarryObjective(state: {
  read: string[];
  items: string[];
  defeated: string[];
}): string {
  if (!state.read.includes("17"))
    return "Lee el cuaderno de corte de Idris en la cantera.";
  if (!state.items.includes("Cuña marcada"))
    return "Recupera la cuña con las marcas originales.";
  if (!state.read.includes("18"))
    return "Entra en la cámara y lee el plano del arco.";
  if (!state.items.includes("Arco ensamblado"))
    return "Asienta base, clave y cierre según las marcas de corte.";
  if (!state.defeated.includes("enemy18"))
    return "Derrota al obrero petrificado que custodia el plano.";
  if (!state.items.includes("Plano del umbral"))
    return "Conserva el plano auténtico del umbral.";
  return "Sal por la cantera antes de que los sillares cambien de nombre.";
}

export function assembleQuarryArch(
  state: { read: string[]; items: string[]; sanity: number },
  choice: number,
): "locked" | "already" | "wrong" | "correct" | "solved" {
  if (
    !state.read.includes("17") ||
    !state.read.includes("18") ||
    !state.items.includes("Cuña marcada")
  )
    return "locked";
  if (state.items.includes("Arco ensamblado")) return "already";
  const stage = state.items.includes("Clave colocada")
    ? 2
    : state.items.includes("Base asentada")
      ? 1
      : 0;
  if (choice !== [0, 2, 1][stage]) {
    state.sanity = Math.max(0, state.sanity - 5);
    state.items = state.items.filter(
      (item) => item !== "Base asentada" && item !== "Clave colocada",
    );
    return "wrong";
  }
  if (stage === 2) {
    state.items = state.items.filter(
      (item) => item !== "Base asentada" && item !== "Clave colocada",
    );
    state.items.push("Arco ensamblado");
    return "solved";
  }
  state.items.push(stage === 0 ? "Base asentada" : "Clave colocada");
  return "correct";
}

export function hospitalObjective(state: {
  read: string[];
  items: string[];
  defeated: string[];
}): string {
  if (!state.read.includes("19"))
    return "Lee el libro de ingresos de Oona en la sala de camino.";
  if (!state.items.includes("Hierbas de serbal"))
    return "Recoge las hierbas de serbal junto a las camas vacías.";
  if (!state.read.includes("20"))
    return "Entra en la enfermería y compara las historias clínicas.";
  if (!state.items.includes("Remedio identificado"))
    return "Relaciona fiebre, pérdida de nombre y remedio en el botiquín.";
  if (!state.defeated.includes("enemy20"))
    return "Aparta al custodio de salas del archivo de pacientes.";
  if (!state.items.includes("Cuaderno de Oona"))
    return "Salva el cuaderno original de los pacientes.";
  if (
    !state.items.includes("Testimonio de Ada") &&
    !state.items.includes("Testimonio de Bran")
  )
    return "Decide qué historia conservar antes de abandonar el hospital.";
  return "Regresa por la sala de camino con el testimonio elegido.";
}

export function identifyHospitalRemedy(
  state: { read: string[]; items: string[]; sanity: number },
  choice: number,
): "locked" | "already" | "wrong" | "solved" {
  if (
    !state.read.includes("19") ||
    !state.read.includes("20") ||
    !state.items.includes("Hierbas de serbal")
  )
    return "locked";
  if (state.items.includes("Remedio identificado")) return "already";
  if (choice !== 1) {
    state.sanity = Math.max(0, state.sanity - 6);
    return "wrong";
  }
  state.items.push("Remedio identificado");
  return "solved";
}

export function keepHospitalTestimony(
  state: { items: string[] },
  choice: "Ada" | "Bran",
): boolean {
  if (!state.items.includes("Cuaderno de Oona")) return false;
  if (
    state.items.includes("Testimonio de Ada") ||
    state.items.includes("Testimonio de Bran")
  )
    return false;
  state.items.push(`Testimonio de ${choice}`);
  return true;
}
