export const puzzleIds = [
  "manuscripts",
  "genealogy",
  "astronomy",
  "basement",
] as const;
export type PuzzleId = (typeof puzzleIds)[number];

export interface Phase2Progress {
  visited: number[];
  solved: PuzzleId[];
  steps: number[];
  discoveries: string[];
  shortcuts: string[];
  ending: boolean;
}

export const newPhase2 = (): Phase2Progress => ({
  visited: [0],
  solved: [],
  steps: [0, 0, 0, 0],
  discoveries: [],
  shortcuts: [],
  ending: false,
});

export const puzzles: Record<
  PuzzleId,
  {
    title: string;
    choices: [string, string, string];
    order: [number, number, number];
    clue: string;
  }
> = {
  manuscripts: {
    title: "El índice de las tres edades",
    choices: ["El astro inmóvil", "La marea sin costa", "Las cenizas de Lucan"],
    order: [2, 0, 1],
    clue: "Lucan dejó cenizas; Inés dibujó el astro; Adrien escuchó la marea. Ordénalos desde el más antiguo.",
  },
  genealogy: {
    title: "El árbol de Veyr",
    choices: ["1482 · fundación", "1610 · Inés", "1927 · Adrien"],
    order: [0, 1, 2],
    clue: "La sociedad nació en 1482; Inés la desafió en 1610; Adrien encontró el archivo en 1927. Sigue el hilo del tiempo.",
  },
  astronomy: {
    title: "La bóveda sin constelaciones",
    choices: ["Luna", "Eclipse", "Alba"],
    order: [2, 1, 0],
    clue: "La homilía dice: el alba abrió la bóveda, el eclipse la ocultó y la luna custodió lo que quedó.",
  },
  basement: {
    title: "Las tres mordazas",
    choices: ["Bronce", "Cristal", "Piedra"],
    order: [2, 0, 1],
    clue: "El plano del sótano prescribe: piedra para anclar, bronce para contener, cristal para recordar.",
  },
};

export function advancePuzzle(
  progress: Phase2Progress,
  id: PuzzleId,
  choice: number,
): "correct" | "solved" | "wrong" | "already" {
  const index = puzzleIds.indexOf(id);
  if (progress.solved.includes(id)) return "already";
  if (choice !== puzzles[id].order[progress.steps[index]]) return "wrong";
  progress.steps[index]++;
  if (progress.steps[index] < 3) return "correct";
  progress.solved.push(id);
  if (id === "astronomy") progress.shortcuts.push("library-chapel");
  return "solved";
}

export function phase2DoorLocked(
  id: string,
  progress: Phase2Progress,
): string | null {
  const required: Record<string, PuzzleId> = {
    "archive-door": "manuscripts",
    "greenhouse-door": "genealogy",
    "chapel-side": "genealogy",
    "basement-door": "astronomy",
  };
  const puzzle = required[id];
  if (puzzle && !progress.solved.includes(puzzle))
    return `El mecanismo exige resolver «${puzzles[puzzle].title}».`;
  if (
    (id === "library-shortcut" || id === "chapel-shortcut") &&
    !progress.shortcuts.includes("library-chapel")
  )
    return "El atajo aún permanece sellado.";
  return null;
}

export function validPhase2(value: unknown): value is Phase2Progress {
  if (!value || typeof value !== "object") return false;
  const p = value as Partial<Phase2Progress>;
  const unique = (values: unknown, allowed: readonly (string | number)[]) =>
    Array.isArray(values) &&
    values.length <= allowed.length &&
    new Set(values).size === values.length &&
    values.every((v) => allowed.includes(v));
  return (
    unique(p.visited, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) &&
    unique(p.solved, puzzleIds) &&
    Array.isArray(p.steps) &&
    p.steps.length === 4 &&
    p.steps.every((v) => Number.isInteger(v) && v >= 0 && v <= 3) &&
    unique(p.discoveries, ["adrien", "society", "guardian"]) &&
    unique(p.shortcuts, ["library-chapel"]) &&
    typeof p.ending === "boolean"
  );
}
