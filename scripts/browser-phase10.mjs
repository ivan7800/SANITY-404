import assert from "node:assert/strict";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";
import { browserLaunchOptions } from "./browser-launch.mjs";

const bundledChrome = chromium.executablePath();
const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH ||
    (existsSync(bundledChrome) ? bundledChrome : "/usr/bin/google-chrome"),
  ...browserLaunchOptions(),
});
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 },
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(process.env.SANITY_TEST_URL || "http://127.0.0.1:5173/");
  await page
    .getByRole("button", { name: "Nueva partida", exact: true })
    .click();
  await page.waitForFunction(() => window.sanityInspect().state.elapsed > 0.1);
  await page.evaluate(() => {
    const canvas = document.querySelector("#viewport canvas");
    const gl = canvas.getContext("webgl2");
    const extension = gl.getExtension("WEBGL_lose_context");
    if (!extension) throw new Error("WEBGL_lose_context no disponible");
    window.phase10LoseContext = extension;
    window.phase10ContextEvents = [];
    for (const type of ["webglcontextlost", "webglcontextrestored"])
      canvas.addEventListener(type, (event) =>
        window.phase10ContextEvents.push({
          type,
          defaultPrevented: event.defaultPrevented,
          at: performance.now(),
        }),
      );
    extension.loseContext();
  });
  await page.getByRole("heading", { name: "Gráficos interrumpidos" }).waitFor();
  assert.equal(
    (await page.evaluate(() => window.sanityInspect())).paused,
    true,
  );
  assert.equal(
    await page.evaluate(() => window.phase10ContextEvents[0]?.defaultPrevented),
    true,
    "La pérdida WebGL debe permitir la restauración del contexto",
  );
  await page.evaluate(() => {
    window.phase10LoseContext.restoreContext();
  });
  const resumeButton = page.getByRole("button", {
    name: "Volver al juego",
    exact: true,
  });
  try {
    await resumeButton.waitFor({ state: "visible", timeout: 10000 });
    assert.equal(await resumeButton.getAttribute("id"), "resume");
    const recovered = await page.evaluate(() => window.sanityInspect());
    const contextEvents = await page.evaluate(
      () => window.phase10ContextEvents,
    );
    assert.deepEqual(
      contextEvents.map((event) => event.type),
      ["webglcontextlost", "webglcontextrestored"],
    );
    assert.equal(recovered.started, true);
    assert.equal(recovered.paused, true);
    assert.equal(recovered.overlayHidden, false);
  } catch (error) {
    const ui = await page
      .evaluate(() => ({
        game: window.sanityInspect(),
        contextEvents: window.phase10ContextEvents,
        contextStillLost: document
          .querySelector("#viewport canvas")
          ?.getContext("webgl2")
          ?.isContextLost(),
        panelText: document.querySelector("#panel")?.innerText,
        overlayHidden: document.querySelector("#overlay")?.hidden,
        buttons: [...document.querySelectorAll("#overlay button")].map(
          (button) => ({
            id: button.id,
            text: button.textContent?.trim(),
            ariaLabel: button.getAttribute("aria-label"),
            disabled: button.disabled,
            visible: button.checkVisibility(),
          }),
        ),
      }))
      .catch(() => null);
    const evidence = {
      stage: "restauración WebGL y menú de pausa",
      ui,
      accessibleTree: await page
        .locator("#overlay")
        .ariaSnapshot()
        .catch(() => null),
      javascriptErrors: errors,
      failure: String(error),
    };
    mkdirSync("docs/capturas/fase32", { recursive: true });
    writeFileSync(
      "docs/capturas/fase32/webgl-recovery-failure.json",
      `${JSON.stringify(evidence, null, 2)}\n`,
    );
    await page
      .screenshot({ path: "docs/capturas/fase32/webgl-recovery-failure.png" })
      .catch(() => {});
    throw new Error(
      `La recuperación WebGL no mostró el control esperado: ${JSON.stringify(evidence)}`,
      {
        cause: error,
      },
    );
  }
  mkdirSync("docs/capturas/fase32", { recursive: true });
  await page.screenshot({
    path: "docs/capturas/fase32/webgl-recovery-menu-pass.png",
  });
  await resumeButton.click();
  await page.waitForFunction(() => {
    const current = window.sanityInspect();
    return current.started && !current.paused && current.overlayHidden;
  });
  const before = await page.evaluate(
    () => window.sanityInspect().state.elapsed,
  );
  await page.waitForFunction(
    (elapsed) => window.sanityInspect().state.elapsed > elapsed + 0.1,
    before,
  );
  await page.setViewportSize({ width: 960, height: 640 });
  await page.waitForFunction(
    () => window.sanityInspect().canvas.rect.width === 960,
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS pérdida y recuperación WebGL, reanudación y redimensionamiento",
  );
} finally {
  await browser.close();
}
