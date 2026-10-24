import { clamp, type State } from "./state";

export type RitualSign = "PIEDRA" | "NOMBRE" | "PAUSA";
export const ritualSigns: RitualSign[] = ["PIEDRA", "NOMBRE", "PAUSA"];
export const rituals = [
  {
    id: "veil",
    title: "Velo del testigo",
    sequence: ["PIEDRA", "NOMBRE", "PAUSA"],
    requires: [],
    completed: "Rito del velo",
    effect: "Velo activo",
    cost: 12,
    clue: "La piedra sostiene el nombre; la pausa lo protege.",
  },
  {
    id: "reading",
    title: "Lectura del umbral",
    sequence: ["PAUSA", "PIEDRA", "NOMBRE"],
    requires: ["Tablilla del intervalo", "Códice de Montfort"],
    completed: "Rito de lectura",
    effect: "Lectura del umbral",
    cost: 18,
    clue: "Isabelle dejó una pausa antes de la inscripción de Lucius. Solo entonces pronunció el nombre.",
  },
] as const;

export function ritualStatus(
  state: Pick<State, "items" | "sanity">,
  id: string,
) {
  const ritual = rituals.find((entry) => entry.id === id);
  if (!ritual) return "unknown";
  if (state.items.includes(ritual.completed)) return "complete";
  if (!ritual.requires.every((item) => state.items.includes(item)))
    return "locked";
  if (state.sanity < ritual.cost) return "exhausted";
  return "ready";
}

/** A wrong sign breaks the phrase and costs focus; no progress is saved mid phrase. */
export function invokeRitual(state: State, id: string, sequence: RitualSign[]) {
  const status = ritualStatus(state, id);
  if (status !== "ready") return status;
  const ritual = rituals.find((entry) => entry.id === id)!;
  if (
    sequence.length !== ritual.sequence.length ||
    sequence.some((sign, index) => sign !== ritual.sequence[index])
  ) {
    state.sanity = clamp(state.sanity - 3);
    return "wrong";
  }
  state.sanity = clamp(state.sanity - ritual.cost);
  state.items.push(ritual.completed, ritual.effect);
  return "cast";
}

export function absorbVeil(state: State, damage: number) {
  const index = state.items.indexOf("Velo activo");
  if (index < 0) return damage;
  state.items.splice(index, 1);
  return Math.max(1, Math.ceil(damage * 0.3));
}
