import { describe, expect, it } from "vitest";
import path from "node:path";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import { assetPath, assetType, serveAsset } from "../desktop/paths.mjs";

const root = path.resolve("desktop/dist-desktop");

describe("recursos de la aplicación de escritorio", () => {
  it("resuelve index y assets dentro del bundle", () => {
    expect(assetPath(root, "sanity://game/")).toBe(
      path.join(root, "index.html"),
    );
    expect(assetPath(root, "sanity://game/assets/main.js")).toBe(
      path.join(root, "assets/main.js"),
    );
    expect(assetPath(root, "sanity://game/assets/main.js?v=1")).toBe(
      path.join(root, "assets/main.js"),
    );
  });
  it.each([
    "sanity://evil/index.html",
    "https://game/index.html",
    "sanity://game/%2e%2e/secret",
    "sanity://game/../secret",
    "sanity://game/%5csecret",
    "sanity://game/%00bad",
  ])("rechaza rutas ajenas: %s", (url) => {
    expect(() => assetPath(root, url)).toThrow();
  });
  it("sirve tipos correctos para módulos, estilos y HTML", () => {
    expect(assetType("main.js")).toContain("javascript");
    expect(assetType("main.css")).toContain("css");
    expect(assetType("index.html")).toContain("html");
  });
  it("sirve HTML 200 y distingue recursos inexistentes y métodos prohibidos", async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "sanity34-assets-"));
    try {
      await writeFile(path.join(directory, "index.html"), "<main>Juego</main>");
      const loaded = await serveAsset(directory, {
        method: "GET",
        url: "sanity://game/index.html",
      });
      expect(loaded.status).toBe(200);
      expect(loaded.headers.get("content-type")).toContain("text/html");
      expect(await loaded.text()).toContain("Juego");
      expect(
        (
          await serveAsset(directory, {
            method: "GET",
            url: "sanity://game/missing.js",
          })
        ).status,
      ).toBe(404);
      expect(
        (
          await serveAsset(directory, {
            method: "POST",
            url: "sanity://game/index.html",
          })
        ).status,
      ).toBe(405);
    } finally {
      await rm(directory, { recursive: true });
    }
  });
});
