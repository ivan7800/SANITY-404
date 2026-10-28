import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const app = require("../desktop/package.json");
const beforeBuild = require("../desktop/before-build.cjs");

describe("empaquetado Electron sin dependencias de ejecución", () => {
  it("omite el colector de módulos solo porque el juego no tiene dependencias runtime externas", async () => {
    expect(app.dependencies ?? {}).toEqual({});
    expect(await beforeBuild()).toBe(false);
  });
  it("incluye el bundle web y proceso principal en asar", () => {
    expect(app.build.files).toContain("main.mjs");
    expect(app.build.files).toContain("paths.mjs");
    expect(app.build.files).toContain("dist-desktop/**/*");
    expect(app.build.electronDist).toBe("node_modules/electron/dist");
  });
});
