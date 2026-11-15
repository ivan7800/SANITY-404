import { chapters, historicalEndingReadiness } from "./campaign";
import type { State } from "./state";

const caseEvidence = [
  {
    artifact: "Plancha auténtica",
    observation:
      "La matriz conserva la inicial de Isabelle. La copia invierte el signo.",
    question: "¿Qué delata una copia que intenta sustituir al original?",
    options: [
      "El signo invertido",
      "La fecha más antigua",
      "El borde desgastado",
    ],
    correct: 0,
  },
  {
    artifact: "Acta original de Inés",
    observation:
      "La firma de Inés estaba en el inventario de 1608, antes de que se rehiciera el árbol familiar.",
    question: "¿Qué prueba que Inés existía antes del pacto?",
    options: [
      "El retrato sin firma",
      "El inventario de 1608",
      "El árbol rehecho de 1610",
    ],
    correct: 1,
  },
  {
    artifact: "Partitura del silencio",
    observation:
      "Entre el grave y el agudo, la cuerda central no toca ninguna campana.",
    question: "¿Qué interrumpe el mecanismo de sustitución?",
    options: ["El golpe agudo", "El golpe grave", "La pausa entre ambos"],
    correct: 2,
  },
  {
    artifact: "Placa de la puerta",
    observation:
      "El negativo B muestra las tres bisagras que coinciden con el plano de Idris.",
    question: "¿Cómo reconoces el umbral que sobrevivió al cambio?",
    options: [
      "Por el reflejo de Émile",
      "Por las tres bisagras del plano",
      "Por la fecha de la fotografía",
    ],
    correct: 1,
  },
] as const;

export function dossierFindings(items: readonly string[]) {
  return caseEvidence.filter((entry) => items.includes(entry.artifact));
}

export function reconstructionQuestion(index: number) {
  return caseEvidence[index];
}

export function historicalLead(state: State): string {
  const next = chapters.find(
    ({ id }) => id !== "mansion-1927" && !state.campaign.completed.includes(id),
  );
  if (next)
    return `Siguiente recuerdo: ${next.year} · ${next.place}. Busca su acceso en el vestíbulo de Veyr.`;
  const status = historicalEndingReadiness(state);
  if (status.missingArtifacts.length)
    return `Vuelve a buscar las pruebas: ${status.missingArtifacts.join(", ")}.`;
  if (status.missingReconciliation)
    return "Reúne la tablilla y el códice en la escritorio de reconciliación del vestíbulo.";
  if (status.missingChoice)
    return "Escoge qué testimonio fijar en el archivo familiar.";
  if (status.missingAdrien)
    return "Busca el cuaderno de Adrien en el invernadero.";
  return "Lleva las pruebas al umbral y reconstruye el Intervalo.";
}
