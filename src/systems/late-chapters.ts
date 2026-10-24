import type { State } from "./state";

/** Four consecutive investigations. The item names are stable save identifiers. */
export const lateChapters = [
  {
    id: "press-1491",
    year: 1491,
    room: 21,
    hero: "TOMÁS · IMPRESOR",
    weapon: "palanca de prensa",
    place: "Imprenta de frontera",
    inner: "Sala de las planchas",
    clue: "Prueba de impresión",
    solution: "Planchas ordenadas",
    artifact: "Plancha auténtica",
    answers: [
      "La matriz de Isabelle",
      "El signo invertido",
      "El anuncio de muerte",
    ],
    order: [0, 1, 2],
    steps: [
      "Selecciona la matriz que conservarás.",
      "Aísla la copia que invierte el signo.",
      "Destruye la tirada que anuncia la muerte.",
    ],
    evidence: [
      {
        name: "Marca de la matriz",
        text: "En el borde de la plancha hay una I tallada a mano, igual que la firma del códice de Isabelle.",
      },
      {
        name: "Titular adelantado",
        text: "El pliego final lleva la fecha de mañana y el nombre de Tomás entre los muertos. Esa tirada debe destruirse.",
      },
    ],
    entrance: "Lee el registro de Tomás junto a la prensa.",
    pickup: "Recoge la prueba de impresión en la nave.",
    innerTask: "Consulta la tirada falsa en la sala de planchas.",
    puzzleTask: "Ordena las planchas y bloquea la tirada falsa.",
    fight: "Derrota al cajista de tipos móviles.",
    artifactTask: "Conserva la plancha auténtica.",
    epilogue:
      "Tomás rompe la tirada falsa y guarda la plancha que identifica al falsificador del códice.",
    colors: [0x69523e, 0xb69a6a, 0x3c3028],
  },
  {
    id: "veyr-1610",
    year: 1610,
    room: 23,
    hero: "INÉS VEYR · ARCHIVISTA",
    weapon: "estoque de archivo",
    place: "Casa Veyr de 1610",
    inner: "Galería de retratos",
    clue: "Inventario de Inés",
    solution: "Asiento corregido",
    artifact: "Acta original de Inés",
    answers: [
      "Retrato sin nombre",
      "Inventario de 1608",
      "Árbol rehecho de 1610",
    ],
    order: [1, 2, 0],
    steps: [
      "Identifica el registro anterior al pacto.",
      "Señala el árbol rehecho que borró a Inés.",
      "Busca a la testigo ausente en los retratos.",
    ],
    evidence: [
      {
        name: "Fecha del inventario",
        text: "La página de 1608 conserva la firma de Inés bajo la cera original; no se ha raspado.",
      },
      {
        name: "Huella tras el retrato",
        text: "Un marco vacío conserva el contorno de Inés. El árbol de 1610 se escribió después de retirarlo.",
      },
    ],
    entrance: "Lee el inventario familiar de Inés.",
    pickup: "Recoge el inventario de 1608.",
    innerTask: "Examina la genealogía en la galería.",
    puzzleTask:
      "Confronta inventario y genealogía para romper el asiento falso.",
    fight: "Vence al retrato guardián.",
    artifactTask: "Oculta el acta original del pacto.",
    epilogue:
      "Inés arranca su asiento falso y esconde el original en la casa que Élise conocerá.",
    colors: [0x49434b, 0xa3886d, 0x2e2935],
  },
  {
    id: "theatre-1786",
    year: 1786,
    room: 25,
    hero: "AMARA · MAQUINISTA",
    weapon: "llave mecánica",
    place: "Teatro de autómatas",
    inner: "Tramoya de las voces",
    clue: "Partitura de poleas",
    solution: "Contrapesos alineados",
    artifact: "Partitura del silencio",
    answers: ["El grave", "El mudo", "El agudo"],
    order: [0, 1, 2],
    steps: [
      "Marca el primer golpe del mecanismo.",
      "Introduce el silencio entre las voces.",
      "Activa el último contrapeso.",
    ],
    evidence: [
      {
        name: "Polea grave",
        text: "La rueda grande tira de la campana grave. En la partitura aparece antes de la pausa.",
      },
      {
        name: "Contrapeso mudo",
        text: "La cuerda central no tiene campana: crea un compás de silencio antes del golpe agudo.",
      },
    ],
    entrance: "Lee las notas de Amara en el escenario.",
    pickup: "Recoge la partitura de poleas.",
    innerTask: "Entra en la tramoya y lee el ritmo codificado.",
    puzzleTask: "Alinea los contrapesos según la partitura.",
    fight: "Desactiva al autómata de escena.",
    artifactTask: "Conserva la partitura del silencio.",
    epilogue:
      "Amara detiene las voces mecánicas; la partitura conserva el ritmo del rito.",
    colors: [0x553740, 0xc4936c, 0x2d2936],
  },
  {
    id: "photo-1899",
    year: 1899,
    room: 27,
    hero: "ÉMILE · FOTÓGRAFO",
    weapon: "trípode de campaña",
    place: "Archivo fotográfico",
    inner: "Cuarto de revelado",
    clue: "Negativo anterior",
    solution: "Exposición fijada",
    artifact: "Placa de la puerta",
    answers: ["Negativo A", "Negativo B", "La placa velada"],
    order: [1, 0, 2],
    steps: [
      "Elige el negativo que muestra la puerta futura.",
      "Aparta la copia con dos bisagras.",
      "Fija la exposición donde el marco todavía es visible.",
    ],
    evidence: [
      {
        name: "Bisagras de la placa",
        text: "Tres marcas de luz coinciden con las bisagras del plano de Idris. El negativo B las conserva.",
      },
      {
        name: "Baño de fijador",
        text: "La placa velada deja ver el marco tras un segundo baño. Solo entonces puede fijarse sin borrar la puerta.",
      },
    ],
    entrance: "Lee el diario de placas de Émile.",
    pickup: "Recoge el negativo anterior.",
    innerTask: "Entra en el revelado y estudia la exposición.",
    puzzleTask: "Superpón los negativos y fija la puerta verdadera.",
    fight: "Aparta la sombra de revelado.",
    artifactTask: "Envía la placa verificable a Veyr.",
    epilogue:
      "Émile fija la puerta futura. En la última copia su rostro es más viejo que en el espejo.",
    colors: [0x3b4549, 0x9da9a4, 0x252d31],
  },
] as const;

export type LateChapter = (typeof lateChapters)[number];
export function lateChapterForRoom(room: number): LateChapter | undefined {
  return lateChapters.find(
    (chapter) => room === chapter.room || room === chapter.room + 1,
  );
}
export function lateObjective(
  state: Pick<State, "room" | "read" | "items" | "defeated" | "campaign">,
): string {
  const chapter = lateChapterForRoom(state.room);
  if (!chapter) return "";
  if (!state.read.includes(String(chapter.room))) return chapter.entrance;
  if (!state.items.includes(chapter.clue)) return chapter.pickup;
  if (!state.read.includes(String(chapter.room + 1))) return chapter.innerTask;
  if (
    !state.items.includes(chapter.solution) &&
    lateEvidenceCount(state, chapter) < chapter.evidence.length
  )
    return "Inspecciona las dos pruebas materiales de la sala antes de actuar.";
  if (!state.items.includes(chapter.solution)) return chapter.puzzleTask;
  if (!state.defeated.includes(`enemy${chapter.room + 1}`))
    return chapter.fight;
  if (!state.items.includes(chapter.artifact)) return chapter.artifactTask;
  return `Regresa por ${chapter.place} con la prueba conservada.`;
}
export function solveLatePuzzle(
  state: Pick<State, "read" | "items" | "sanity" | "campaign">,
  chapter: LateChapter,
  choice: number,
): "locked" | "already" | "wrong" | "correct" | "solved" {
  if (state.items.includes(chapter.solution)) return "already";
  if (
    !state.read.includes(String(chapter.room)) ||
    !state.read.includes(String(chapter.room + 1)) ||
    !state.items.includes(chapter.clue) ||
    lateEvidenceCount(state, chapter) < chapter.evidence.length
  )
    return "locked";
  const stage = latePuzzleStage(state, chapter);
  if (choice !== chapter.order[stage]) {
    state.sanity = Math.max(0, state.sanity - 6);
    state.campaign.witnessed = state.campaign.witnessed.filter(
      (id) => !id.startsWith(`${chapter.id}-step-`),
    );
    return "wrong";
  }
  if (stage < chapter.order.length - 1) {
    state.campaign.witnessed.push(`${chapter.id}-step-${stage + 1}`);
    return "correct";
  }
  state.campaign.witnessed = state.campaign.witnessed.filter(
    (id) => !id.startsWith(`${chapter.id}-step-`),
  );
  state.items.push(chapter.solution);
  return "solved";
}

export function lateEvidenceId(chapter: LateChapter, index: number): string {
  return `${chapter.id}-evidence-${index}`;
}
export function inspectLateEvidence(
  state: Pick<State, "campaign">,
  chapter: LateChapter,
  index: number,
): boolean {
  if (index < 0 || index >= chapter.evidence.length) return false;
  const id = lateEvidenceId(chapter, index);
  if (state.campaign.witnessed.includes(id)) return false;
  state.campaign.witnessed.push(id);
  return true;
}
export function lateEvidenceCount(
  state: Pick<State, "campaign">,
  chapter: LateChapter,
): number {
  return chapter.evidence.filter((_, index) =>
    state.campaign.witnessed.includes(lateEvidenceId(chapter, index)),
  ).length;
}
export function latePuzzleStage(
  state: Pick<State, "campaign" | "items">,
  chapter: LateChapter,
): number {
  if (state.items.includes(chapter.solution)) return chapter.order.length;
  return [1, 2].filter((step) =>
    state.campaign.witnessed.includes(`${chapter.id}-step-${step}`),
  ).length;
}

export function lateArtifactUnlocked(
  state: Pick<State, "items" | "defeated">,
  chapter: LateChapter,
): boolean {
  return (
    state.items.includes(chapter.solution) &&
    state.defeated.includes(`enemy${chapter.room + 1}`)
  );
}

export function lateExitUnlocked(
  state: Pick<State, "items">,
  chapter: LateChapter,
): boolean {
  return state.items.includes(chapter.artifact);
}
