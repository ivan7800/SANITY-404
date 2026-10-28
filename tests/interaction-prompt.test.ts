import { expect, it } from "vitest";
import { interactionPrompt } from "../src/ui/interaction-prompt";

it("identifica la acción contextual sin prometer que una puerta está desbloqueada", () => {
  expect(interactionPrompt(undefined)).toBe("");
  expect(interactionPrompt({ kind: "note", name: "Carta de Adrien" })).toBe(
    "E / A · LEER · Carta de Adrien",
  );
  expect(interactionPrompt({ kind: "note", name: "Leer documento" })).toBe(
    "E / A · Leer documento",
  );
  expect(interactionPrompt({ kind: "item", name: "Tónico" })).toBe(
    "E / A · RECOGER · Tónico",
  );
  expect(interactionPrompt({ kind: "save", name: "Fonógrafo" })).toBe(
    "E / A · GUARDAR · Fonógrafo",
  );
  expect(
    interactionPrompt({
      kind: "save",
      name: "Escritorio de memoria · guardar",
    }),
  ).toBe("E / A · Escritorio de memoria · guardar");
  expect(interactionPrompt({ kind: "door", name: "Portal romano" })).toBe(
    "E / A · EXAMINAR · Portal romano",
  );
  expect(
    interactionPrompt({ kind: "memoryChoice", name: "Recuerdo familiar" }),
  ).toBe("E / A · DECIDIR · Recuerdo familiar");
});
