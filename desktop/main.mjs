import { app, BrowserWindow, protocol, session } from "electron";
import path from "node:path";
import { appendFileSync } from "node:fs";
import { serveAsset } from "./paths.mjs";

const origin = "sanity://game";
const qaMode = !app.isPackaged && Boolean(process.env.SANITY_QA_USER_DATA);
const qaEvents = [];
function startup(stage, details = {}) {
  if (!qaMode) return;
  const entry = {
    at: new Date().toISOString(),
    pid: process.pid,
    stage,
    ...details,
  };
  const line = `SANITY_QA_STARTUP ${JSON.stringify(entry)}`;
  process.stderr.write(`${line}\n`);
  if (process.env.SANITY_QA_STARTUP_LOG)
    appendFileSync(
      process.env.SANITY_QA_STARTUP_LOG,
      `${JSON.stringify(entry)}\n`,
    );
}
startup("main-loaded", { electron: process.versions.electron });
if (qaMode) {
  app.setPath("userData", path.resolve(process.env.SANITY_QA_USER_DATA));
  globalThis.sanityDesktopQaEvents = qaEvents;
  startup("user-data-set");
}
function record(type, details = {}) {
  if (qaMode) {
    qaEvents.push({ type, at: new Date().toISOString(), ...details });
    if (qaEvents.length > 300) qaEvents.shift();
  }
  if (["did-fail-load", "render-process-gone"].includes(type)) {
    console.error(`SANITY Electron ${type}: ${JSON.stringify(details)}`);
  }
}
protocol.registerSchemesAsPrivileged([
  {
    scheme: "sanity",
    privileges: { standard: true, secure: true, supportFetchAPI: true },
  },
]);
startup("scheme-registered");

if (process.platform === "win32") app.setAppUserModelId("com.sanity404.game");

function openWindow() {
  startup("window-creating");
  const window = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 600,
    backgroundColor: "#0d1012",
    icon: path.join(app.getAppPath(), "assets", "icon.png"),
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });
  startup("window-created", {
    windowId: window.id,
    visible: window.isVisible(),
  });
  const contents = window.webContents;
  contents.on("did-fail-load", (_event, code, description, url, mainFrame) =>
    record("did-fail-load", { code, description, url, mainFrame }),
  );
  contents.on("did-finish-load", () =>
    record("did-finish-load", { url: contents.getURL() }),
  );
  contents.on("render-process-gone", (_event, details) =>
    record("render-process-gone", details),
  );
  contents.on("console-message", (event, _level, legacyMessage) =>
    record("console-message", {
      level: event?.level ?? _level,
      message: event?.message ?? legacyMessage,
      sourceId: event?.sourceId,
      lineNumber: event?.lineNumber,
    }),
  );
  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  const preventExternalNavigation = (event, url) => {
    if (!url.startsWith(origin + "/")) event.preventDefault();
  };
  window.webContents.on("will-navigate", preventExternalNavigation);
  window.webContents.on("will-redirect", preventExternalNavigation);
  record("window-created", { visible: window.isVisible() });
  startup("window-loading");
  void window.loadURL(`${origin}/index.html`).then(
    () => startup("window-loaded", { url: window.webContents.getURL() }),
    (error) => {
      startup("window-load-failed", { message: String(error) });
      process.stderr.write(
        `SANITY Electron window load failed: ${error.stack || error}\n`,
      );
      app.exit(1);
    },
  );
}

startup("waiting-for-ready");
app
  .whenReady()
  .then(async () => {
    startup("app-ready");
    const root = path.join(app.getAppPath(), "dist-desktop");
    protocol.handle("sanity", async (request) => {
      const response = await serveAsset(root, request);
      record("asset", { url: request.url, status: response.status });
      if (response.status >= 400)
        console.error(
          `SANITY Electron recurso ${response.status}: ${request.url}`,
        );
      return response;
    });
    startup("protocol-handled");
    session.defaultSession.setPermissionRequestHandler(
      (_contents, _permission, callback) => callback(false),
    );
    startup("permissions-configured");
    openWindow();
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) openWindow();
    });
  })
  .catch((error) => {
    startup("startup-failed", { message: String(error), stack: error.stack });
    process.stderr.write(
      `SANITY Electron startup failed: ${error.stack || error}\n`,
    );
    app.exit(1);
  });

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
