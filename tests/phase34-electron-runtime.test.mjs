import { describe, expect, it } from "vitest";
import { resolveElectronExecutable } from "../scripts/phase34-electron-runtime.mjs";

describe("resolución del ejecutable Electron", () => {
  it("acepta un binario ejecutable sin asumir su ubicación dentro de node_modules", () => {
    expect(resolveElectronExecutable(() => process.execPath)).toBe(
      process.execPath,
    );
  });

  it("explica cuándo npm instaló el paquete sin extraer el binario", () => {
    expect(() =>
      resolveElectronExecutable(() => "/ruta/inexistente/electron"),
    ).toThrow(/Electron no tiene un ejecutable utilizable/);
  });

  it("rechaza un módulo que no devuelve una ruta absoluta", () => {
    expect(() => resolveElectronExecutable(() => "dist/electron")).toThrow(
      /Electron no tiene un ejecutable utilizable/,
    );
  });
});
