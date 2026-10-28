import { describe, expect, it } from "vitest";
import { mainFailures, menuReady } from "../scripts/phase34-electron-qa.mjs";

const visibleMenu = {
  main: { visible: true, url: "sanity://game/index.html" },
  renderer: {
    overlayHidden: false,
    body: { height: 0, display: "block", visibility: "visible" },
    menu: { width: 180, height: 44 },
  },
};

describe("visibilidad del menú Electron", () => {
  it("acepta el menú real aunque body mida cero por los hijos fixed", () => {
    expect(menuReady(visibleMenu)).toBe(true);
  });
  it("rechaza un body presente cuando la ventana o el botón no son visibles", () => {
    expect(
      menuReady({
        ...visibleMenu,
        main: { ...visibleMenu.main, visible: false },
      }),
    ).toBe(false);
    expect(
      menuReady({
        ...visibleMenu,
        renderer: { ...visibleMenu.renderer, menu: { width: 0, height: 0 } },
      }),
    ).toBe(false);
  });
  it("detecta recursos 404, renderer caído y errores tempranos de consola", () => {
    const events = [
      { type: "asset", status: 200 },
      { type: "asset", status: 404 },
      { type: "console-message", level: "error", message: "Uncaught Error" },
      { type: "render-process-gone", reason: "crashed" },
    ];
    expect(mainFailures(events)).toEqual(events.slice(1));
  });
});
