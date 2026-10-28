import type { Interactable } from "../world/scene";

/** Describes the action that E, gamepad A or the touch control will open. */
const verbs: Record<Interactable["kind"], string> = {
  note: "LEER",
  item: "RECOGER",
  door: "EXAMINAR",
  seal: "RECOGER",
  save: "GUARDAR",
  end: "CONTINUAR",
  phase2Puzzle: "EXAMINAR",
  discovery: "OBSERVAR",
  phase2End: "CONTINUAR",
  romanPuzzle: "EXAMINAR",
  romanEcho: "OBSERVAR",
  mosaicPuzzle: "EXAMINAR",
  coastLedger: "EXAMINAR",
  starAlignment: "EXAMINAR",
  quarryArch: "EXAMINAR",
  hospitalRemedy: "EXAMINAR",
  hospitalChoice: "DECIDIR",
  latePuzzle: "EXAMINAR",
  lateEvidence: "OBSERVAR",
  medievalPuzzle: "EXAMINAR",
  legacy: "EXAMINAR",
  memoryChoice: "DECIDIR",
  galleryClue: "LEER",
  mansionEcho: "OBSERVAR",
  ritual: "EXAMINAR",
  ritualSecret: "LEER",
};

export function interactionPrompt(
  object: Pick<Interactable, "kind" | "name"> | undefined,
) {
  if (!object) return "";
  const verb = verbs[object.kind];
  const alreadyNamed = new RegExp(
    `(^${verb}\\b|[·:–-]\\s*${verb}$)`,
    "iu",
  ).test(object.name);
  return `E / A · ${alreadyNamed ? object.name : `${verb} · ${object.name}`}`;
}
