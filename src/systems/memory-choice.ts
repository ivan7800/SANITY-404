import type { State } from "./state";

export const memoryChoices = ["Juramento de Lucius", "Promesa de Isabelle"] as const;
export type MemoryChoice = (typeof memoryChoices)[number];

/** A mutually exclusive decision in 1927; no new save-version field required. */
export function chosenMemory(state: Pick<State, "items">): MemoryChoice | null {
  return memoryChoices.find((choice) => state.items.includes(choice)) ?? null;
}

export function chooseMemory(state: State, choice: MemoryChoice):
  "locked" | "already" | "chosen" {
  if (!state.items.includes("Memoria reconciliada")) return "locked";
  if (chosenMemory(state)) return "already";
  if (!memoryChoices.includes(choice)) return "locked";
  state.items.push(choice);
  if (choice === "Juramento de Lucius") {
    state.health = Math.min(100, state.health + 30);
  } else {
    state.sanity = Math.min(100, state.sanity + 30);
  }
  return "chosen";
}

export function memoryConsequence(state: Pick<State, "items">) {
  const choice = chosenMemory(state);
  return choice === "Juramento de Lucius"
    ? {
        heading: "La vigilancia del cartógrafo",
        description: "Lucius te enseña a resistir el umbral. Salud restaurada; la vigilancia de los antiguos te acompaña.",
        visual: "bronze" as const,
      }
    : choice === "Promesa de Isabelle"
      ? {
          heading: "La escritura de los vivos",
          description: "Isabelle preserva la memoria en cada página. Cordura restaurada; la casa no puede borrar estas palabras.",
          visual: "violet" as const,
        }
      : null;
}
