import { describe, expect, it } from "vitest";
import {
  evaluateStartup,
  requiredStartupStages,
} from "../scripts/phase35-electron-startup-check.mjs";

const successful = requiredStartupStages.map((stage) => ({ stage }));
successful.find((item) => item.stage === "window-created").visible = true;
successful.find((item) => item.stage === "window-loaded").url =
  "sanity://game/index.html";

describe("diagnóstico independiente de Electron", () => {
  it("exige código principal, readiness, ventana visible y contenido cargado", () => {
    expect(evaluateStartup(successful).passed).toBe(true);
    const processOnly = evaluateStartup([]);
    expect(processOnly.passed).toBe(false);
    expect(processOnly.missing).toContain("main-loaded");
    expect(evaluateStartup(successful.slice(0, -1)).passed).toBe(false);
    expect(evaluateStartup([...successful].reverse()).passed).toBe(false);
  });

  it("rechaza una carga fallida aunque se hayan emitido los demás hitos", () => {
    expect(
      evaluateStartup([...successful, { stage: "window-load-failed" }]).passed,
    ).toBe(false);
  });
});
