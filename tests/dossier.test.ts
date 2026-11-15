import { expect, it } from "vitest";
import { completeChapter, historicalProofs } from "../src/systems/campaign";
import {
  dossierFindings,
  historicalLead,
  reconstructionQuestion,
} from "../src/systems/dossier";
import { fresh } from "../src/systems/state";

it("indica la siguiente época y luego los requisitos del umbral", () => {
  const state = fresh();
  expect(historicalLead(state)).toContain("189 ·");
  completeChapter(state.campaign, "roman-189");
  expect(historicalLead(state)).toContain("312 ·");
  for (const [id, artifact] of historicalProofs) {
    completeChapter(state.campaign, id);
    state.items.push(artifact);
  }
  expect(historicalLead(state)).toContain("vestíbulo");
  state.items.push("Memoria reconciliada", "Promesa de Isabelle");
  expect(historicalLead(state)).toContain("invernadero");
  state.phase2.discoveries.push("adrien");
  expect(historicalLead(state)).toContain("reconstruye");
});

it("muestra solo pruebas conservadas y permite consultar las cuatro respuestas", () => {
  const all = historicalProofs.map(([, artifact]) => artifact);
  expect(dossierFindings([])).toEqual([]);
  const findings = dossierFindings(all);
  expect(findings).toHaveLength(4);
  for (const [i, evidence] of findings.entries()) {
    expect(reconstructionQuestion(i)).toBe(evidence);
    expect(evidence.options[evidence.correct]).toBeTruthy();
  }
  expect(reconstructionQuestion(findings.length)).toBeUndefined();
});
