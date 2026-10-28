import { afterEach, expect, it, vi } from "vitest";
import { readSettings } from "../src/systems/config";

afterEach(() => vi.unstubAllGlobals());

const withSettings = (raw: string | null) => {
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
  vi.stubGlobal("localStorage", { getItem: () => raw });
  return readSettings();
};

it("recupera el texto ampliado y el perfil gráfico de un ajuste guardado", () => {
  const settings = withSettings(
    JSON.stringify({ largeText: true, quality: 1, volume: 0.2 }),
  );
  expect(settings.largeText).toBe(true);
  expect(settings.quality).toBe(1);
  expect(settings.volume).toBe(0.2);
});

it("mantiene la compatibilidad de preferencias antiguas y descarta valores inválidos", () => {
  expect(withSettings(JSON.stringify({ quality: 1.6 })).largeText).toBe(false);
  const invalid = withSettings(
    JSON.stringify({ largeText: "yes", quality: 4, volume: 9 }),
  );
  expect(invalid.largeText).toBe(false);
  expect(invalid.quality).toBe(1.3);
  expect(invalid.volume).toBe(1);
});
