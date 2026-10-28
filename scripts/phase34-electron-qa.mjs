import { _electron as electron } from "@playwright/test";
import { readdir } from "node:fs/promises";
import path from "node:path";
import {
  desktopRoot,
  resolveElectronExecutable,
} from "./phase34-electron-runtime.mjs";

async function bundledFiles(directory, prefix = "") {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = path.join(prefix, entry.name);
    if (entry.isDirectory())
      files.push(
        ...(await bundledFiles(path.join(directory, entry.name), relative)),
      );
    else if (entry.isFile()) files.push(relative.split(path.sep).join("/"));
  }
  return files;
}

export async function launchElectron(userData, report) {
  const executablePath = resolveElectronExecutable();
  report.executablePath = executablePath;
  const app = await electron.launch({
    executablePath,
    args: [desktopRoot],
    env: { ...process.env, SANITY_QA_USER_DATA: userData },
  });
  const page = await app.firstWindow();
  page.on("pageerror", (error) =>
    report.errors.push({ type: "pageerror", message: error.message }),
  );
  page.on("console", (message) => {
    if (message.type() === "error")
      report.errors.push({ type: "console", message: message.text() });
  });
  page.on("requestfailed", (request) =>
    report.errors.push({
      type: "requestfailed",
      url: request.url(),
      failure: request.failure(),
    }),
  );
  return { app, page };
}

export async function snapshot(app, page) {
  const main = await app.evaluate(({ BrowserWindow }) => {
    const window = BrowserWindow.getAllWindows()[0];
    return {
      visible: window?.isVisible() ?? false,
      url: window?.webContents.getURL() ?? "",
      loading: window?.webContents.isLoading() ?? false,
      events: globalThis.sanityDesktopQaEvents ?? [],
    };
  });
  const renderer = await page.evaluate(() => {
    const body = document.body;
    const style = body && getComputedStyle(body);
    const rect = body?.getBoundingClientRect();
    const menu = document.querySelector("#new");
    const menuRect = menu?.getBoundingClientRect();
    return {
      readyState: document.readyState,
      title: document.title,
      origin: location.origin,
      body: {
        width: rect?.width ?? 0,
        height: rect?.height ?? 0,
        display: style?.display,
        visibility: style?.visibility,
        opacity: style?.opacity,
        content: body?.textContent?.trim().slice(0, 500) ?? "",
      },
      menu: {
        present: Boolean(menu),
        width: menuRect?.width ?? 0,
        height: menuRect?.height ?? 0,
      },
      overlayHidden: document.querySelector("#overlay")?.hidden,
      transitionClosed: document
        .querySelector("#title-transition")
        ?.classList.contains("title-transition--closed"),
      canvas: Boolean(document.querySelector("#viewport canvas")),
      savePresent: Boolean(localStorage.getItem("sanity404-save")),
    };
  });
  return { main, renderer };
}

export function menuReady(view) {
  return Boolean(
    view?.main?.visible &&
    view.main.url === "sanity://game/index.html" &&
    !view.renderer?.overlayHidden &&
    view.renderer?.menu?.width > 0 &&
    view.renderer?.menu?.height > 0,
  );
}

export function mainFailures(events = []) {
  return events.filter(
    (item) =>
      item.type === "did-fail-load" ||
      item.type === "render-process-gone" ||
      (item.type === "asset" && item.status >= 400) ||
      (item.type === "console-message" &&
        (item.level === "error" || item.level === 3)),
  );
}

export async function verifyBundledResources(page) {
  const files = await bundledFiles(path.join(desktopRoot, "dist-desktop"));
  const results = await page.evaluate(async (names) => {
    return Promise.all(
      names.map(async (name) => {
        const url = new URL(name, "sanity://game/").href;
        try {
          const response = await fetch(url, { cache: "no-store" });
          await response.arrayBuffer();
          return { name, url, status: response.status };
        } catch (error) {
          return { name, url, status: 0, error: String(error) };
        }
      }),
    );
  }, files);
  if (results.some((item) => item.status !== 200)) {
    throw new Error(`Recursos del bundle fallidos: ${JSON.stringify(results)}`);
  }
  return results;
}

export async function waitForMenu(page) {
  await page.waitForURL("sanity://game/index.html", { timeout: 15000 });
  await page.waitForLoadState("load", { timeout: 15000 });
  await page
    .getByRole("button", { name: "Nueva partida", exact: true })
    .waitFor({ state: "visible", timeout: 15000 });
  await page.waitForFunction(
    () => {
      const overlay = document.querySelector("#overlay");
      const menu = document.querySelector("#new");
      return (
        overlay &&
        !overlay.hidden &&
        menu &&
        menu.getBoundingClientRect().width > 0
      );
    },
    null,
    { timeout: 15000 },
  );
}

export async function waitForGame(page) {
  await page.waitForFunction(
    () => {
      const overlay = document.querySelector("#overlay");
      const curtain = document.querySelector("#title-transition");
      const canvas = document.querySelector("#viewport canvas");
      return (
        overlay?.hidden &&
        !curtain?.classList.contains("title-transition--closed") &&
        canvas &&
        canvas.width > 0 &&
        canvas.height > 0
      );
    },
    null,
    { timeout: 15000 },
  );
}
