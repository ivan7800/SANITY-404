import type { State } from "./state";

/** Derive historical consequences entirely from persistent artefacts. */
export function legacy(state: Pick<State, "items">) {
  const roman = state.items.includes("Tablilla del intervalo");
  const medieval = state.items.includes("Códice de Montfort");
  const mosaic = state.items.includes("Molde de Aurelia");
  const coast = state.items.includes("Lista de pasajeros");
  const stars = state.items.includes("Disco estelar");
  const quarry = state.items.includes("Plano del umbral");
  const hospital = state.items.includes("Cuaderno de Oona");
  const press = state.items.includes("Plancha auténtica");
  const veyr = state.items.includes("Acta original de Inés");
  const theatre = state.items.includes("Partitura del silencio");
  const photo = state.items.includes("Placa de la puerta");
  const complete = roman && medieval;
  return {
    roman,
    medieval,
    mosaic,
    coast,
    stars,
    quarry,
    hospital,
    press,
    veyr,
    theatre,
    photo,
    complete,
    clue: complete
      ? "Lucius marcó el umbral; Isabelle registró el nombre que fue borrado. El archivo de los Veyr ya no puede ocultar su acceso." +
        (mosaic
          ? " El molde de Aurelia conserva el rostro que faltaba en el mosaico."
          : "") +
        (coast
          ? " La lista de Maeve conserva el nombre de Adrien siglos antes de su nacimiento."
          : "") +
        (stars
          ? " El disco de Samira coincide con la caja astronómica de Veyr."
          : "") +
        (quarry
          ? " El plano de Idris muestra el arco oculto bajo los cimientos."
          : "") +
        (hospital
          ? " El cuaderno de Oona demuestra que una vida puede escribirse sobre otra."
          : "") +
        (press
          ? " La plancha de Tomás identifica la mano que falsificó el códice."
          : "") +
        (veyr ? " El acta de Inés prueba el primer pacto de los Veyr." : "") +
        (theatre
          ? " La partitura de Amara conserva el ritmo para cerrar el mecanismo."
          : "") +
        (photo
          ? " La placa de Émile muestra la puerta final antes de construirse."
          : "")
      : roman
        ? "La tablilla conserva el primer signo. Falta el testimonio de Isabelle en 1348." +
          (mosaic ? " Aurelia ha preservado el rostro perdido en 312." : "") +
          (coast ? " Maeve conservó una lista con el nombre de Adrien." : "") +
          (stars ? " El disco de Samira apunta a la caja astronómica." : "") +
          (quarry ? " Idris conservó el plano del arco bajo Veyr." : "") +
          (hospital
            ? " Oona conservó los nombres originales de sus pacientes."
            : "") +
          (press ? " Tomás conservó la plancha que falsificó el códice." : "") +
          (veyr ? " El acta de Inés revela el pacto original." : "") +
          (theatre ? " Amara conservó el ritmo mecánico." : "") +
          (photo ? " Émile fotografió la puerta futura." : "")
        : medieval
          ? "El códice guarda el nombre de la puerta. Falta la inscripción original de Lucius en 189."
          : "Dos testimonios sobreviven al tiempo: uno bajo Roma, otro en un monasterio de 1348.",
  };
}

/** Reconciliation is optional and cannot block the original mansion campaign. */
export function reconcileLegacy(
  state: State,
): "missing" | "already" | "reconciled" {
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
        text:
          "Élise coloca la tablilla junto al códice. Las palabras de Lucius y la escritura de Isabelle devuelven el nombre perdido a Étienne. " +
          (state.items.includes("Molde de Aurelia")
            ? "El molde de Aurelia le devuelve también el rostro que la casa había borrado. "
            : "") +
          (state.items.includes("Lista de pasajeros")
            ? "La lista de Maeve demuestra que Adrien fue recordado antes de nacer. "
            : "") +
          (state.items.includes("Disco estelar")
            ? "El disco de Samira alinea la puerta con la única noche que la casa no puede repetir. "
            : "") +
          (state.items.includes("Plano del umbral")
            ? "El plano de Idris revela qué piedra sostiene el umbral bajo la mansión. "
            : "") +
          (state.items.includes("Testimonio de Ada")
            ? "Ada recuerda la fiebre sin ceder su identidad; su testimonio sostiene la memoria de Élise. "
            : state.items.includes("Testimonio de Bran")
              ? "Bran describe cómo el Intervalo le impuso una vida ajena; su testimonio libera el nombre de Adrien. "
              : "") +
          (state.items.includes("Plancha auténtica")
            ? "La plancha de Tomás identifica la falsificación que borró el nombre del códice. "
            : "") +
          (state.items.includes("Acta original de Inés")
            ? "El acta original de Inés revela quién aceptó el primer pacto de Veyr. "
            : "") +
          (state.items.includes("Partitura del silencio")
            ? "La partitura de Amara marca el ritmo que detiene las voces del Intervalo. "
            : "") +
          (state.items.includes("Placa de la puerta")
            ? "La placa de Émile señala la puerta de tres bisagras por la que pueden salir. "
            : "") +
          "Adrien reconoce a su hermana y ambos abandonan Veyr. La casa queda en silencio, incapaz de borrar a quienes ahora recuerdan juntos.",
      }
    : null;
}
