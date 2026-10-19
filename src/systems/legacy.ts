import type { State } from "./state";

/** Derive historical consequences entirely from persistent artefacts. */
export function legacy(state: Pick<State, "items">) {
  const roman = state.items.includes("Tablilla del intervalo");
  const medieval = state.items.includes("Códice de Montfort");
  const complete = roman && medieval;
  return {
    roman,
    medieval,
    complete,
    clue: complete
      ? "Lucius marcó el umbral; Isabelle registró el nombre que fue borrado. El archivo de los Veyr ya no puede ocultar su acceso."
      : roman
        ? "La tablilla conserva el primer signo. Falta el testimonio de Isabelle en 1348."
        : medieval
          ? "El códice guarda el nombre de la puerta. Falta la inscripción original de Lucius en 189."
          : "Dos testimonios sobreviven al tiempo: uno bajo Roma, otro en un monasterio de 1348.",
  };
}

/** Reconciliation is optional and cannot block the original mansion campaign. */
export function reconcileLegacy(state: State): "missing" | "already" | "reconciled" {
  if (!legacy(state).complete) return "missing";
  if (state.items.includes("Memoria reconciliada")) return "already";
  state.items.push("Memoria reconciliada");
  state.sanity = Math.min(100, state.sanity + 20);
  return "reconciled";
}

export function legacyEnding(state: Pick<State, "items" | "phase2">) {
  return state.items.includes("Memoria reconciliada") &&
    state.phase2.discoveries.includes("adrien")
    ? {
        title: "La historia que nadie pudo borrar",
        text: "Élise coloca la tablilla junto al códice. Las palabras de Lucius y la escritura de Isabelle devuelven el nombre perdido a Étienne. Adrien reconoce a su hermana y ambos abandonan Veyr. La casa queda en silencio, incapaz de borrar a quienes ahora recuerdan juntos.",
      }
    : null;
}
