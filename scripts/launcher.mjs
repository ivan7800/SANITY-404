import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { randomUUID, createHash } from "node:crypto";
import net from "node:net";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runtime = path.join(root, ".sanity-launcher"),
  lock = path.join(runtime, "server.json"),
  log = path.join(runtime, "server.log");
fs.mkdirSync(runtime, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const alive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};
function read() {
  try {
    return JSON.parse(fs.readFileSync(lock, "utf8"));
  } catch {
    return null;
  }
}
async function probe(s) {
  if (!s?.url || !s.token) return false;
  try {
    const r = await fetch(new URL("__sanity_launcher", s.url), {
      headers: { "X-Sanity-Token": s.token },
      signal: AbortSignal.timeout(700),
    });
    const d = await r.json();
    return d.project === root && d.pid === s.pid;
  } catch {
    return false;
  }
}
function check() {
  const [major, minor] = process.versions.node.split(".").map(Number);
  if (!(
    (major === 20 && minor >= 19) ||
    (major === 22 && minor >= 12) ||
    major >= 24
  ))
    throw Error("Node incompatible. Se necesita Node 20.19+, 22.12+ o 24+.");
  for (const dep of ["vite", "three", "typescript"])
    if (!fs.existsSync(path.join(root, "node_modules", dep, "package.json")))
      throw Error(
        `Falta ${dep}. Ejecuta npm ci manualmente en este proyecto. El lanzador no instala nada.`,
      );
}
async function serveLocked() {
  check();
  let old = read();
  // An interrupted write must not leave the project permanently locked.
  if (!old && fs.existsSync(lock)) {
    await sleep(1100);
    old = read();
    if (!old && fs.existsSync(lock)) fs.unlinkSync(lock);
  }
  if (old && alive(old.pid)) return;
  if (old) fs.unlinkSync(lock);
  let fd;
  try {
    fd = fs.openSync(lock, "wx");
  } catch (e) {
    if (e.code === "EEXIST") return;
    throw e;
  }
  const token = randomUUID();
  let server;
  const identity = { pid: process.pid, token, project: root };
  fs.writeFileSync(fd, JSON.stringify(identity));
  fs.closeSync(fd);
  const clean = () => {
    if (read()?.token === token) fs.rmSync(lock, { force: true });
  };
  let closing = false;
  async function stop() {
    if (closing) return;
    closing = true;
    await server?.close();
    clean();
    process.exit(0);
  }
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
  process.on("exit", clean);
  try {
    const { createServer } = await import("vite");
    server = await createServer({
      root,
      configFile: path.join(root, "vite.config.ts"),
      server: { host: "127.0.0.1", port: 5173, strictPort: false, open: false },
      plugins: [
        {
          name: "sanity-local-launcher",
          configureServer(v) {
            v.middlewares.use("/__sanity_launcher", (req, res) => {
              if (req.headers["x-sanity-token"] !== token) {
                res.statusCode = 403;
                res.end();
                return;
              }
              if (req.method === "POST") {
                res.end("Cerrando SANITY-404");
                setTimeout(stop, 40);
                return;
              }
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ project: root, pid: process.pid }));
            });
          },
        },
      ],
    });
    await server.listen();
    const address = server.httpServer.address();
    const url = `http://127.0.0.1:${address.port}/`;
    fs.writeFileSync(lock, JSON.stringify({ ...identity, url }));
    console.log(`${new Date().toISOString()} READY ${url}`);
    return true;
  } catch (e) {
    clean();
    throw e;
  }
}
// A kernel-owned mutex also serializes recovery of stale or partially written locks.
// The OS releases it after a crash; no PID is killed or global configuration changed.
async function serve() {
  const port =
    40000 +
    (parseInt(createHash("sha256").update(root).digest("hex").slice(0, 8), 16) %
      20000);
  const mutex = net.createServer((socket) => socket.destroy());
  const acquired = await new Promise((resolve, reject) => {
    mutex.once("error", (e) =>
      e.code === "EADDRINUSE" ? resolve(false) : reject(e),
    );
    mutex.listen(port, "127.0.0.1", () => resolve(true));
  });
  if (!acquired) return;
  try {
    if (!(await serveLocked())) mutex.close();
  } catch (e) {
    mutex.close();
    throw e;
  }
}
async function browser(url) {
  if (process.argv.includes("--no-browser")) return;
  let command = process.env.SANITY_BROWSER_COMMAND;
  if (!command) {
    if (process.platform === "win32") {
      command = "explorer.exe";
    } else {
      for (const candidate of [
        "google-chrome",
        "google-chrome-stable",
        "chromium",
        "chromium-browser",
      ]) {
        const { spawnSync } = await import("node:child_process");
        if (spawnSync("which", [candidate], { stdio: "ignore" }).status === 0) {
          command = candidate;
          break;
        }
      }
    }
  }
  if (!command)
    throw Error(`No se encuentra Chrome/Chromium. Abre manualmente ${url}`);
  await new Promise((resolve, reject) => {
    const browserLog = fs.openSync(log, "a");
    const child = spawn(command, [url], {
      detached: true,
      stdio: ["ignore", browserLog, browserLog],
      windowsHide: true,
    });
    fs.closeSync(browserLog);
    child.once("error", reject);
    child.once("spawn", () => {
      child.unref();
      resolve();
    });
  });
  console.log(`Navegador: ${command} ${url}`);
}
async function main() {
  const action = process.argv[2] || "start";
  if (action === "serve") return serve();
  if (action === "check") {
    check();
    console.log(
      `Node ${process.versions.node}: ${process.execPath}\nDependencias disponibles.`,
    );
    return;
  }
  let s = read();
  if (action === "status") {
    if (await probe(s)) {
      console.log(s.url);
      return;
    }
    throw Error("SANITY-404 no está en ejecución.");
  }
  if (action === "stop") {
    if (await probe(s)) {
      await fetch(new URL("__sanity_launcher", s.url), {
        method: "POST",
        headers: { "X-Sanity-Token": s.token },
        signal: AbortSignal.timeout(2000),
      });
      for (let i = 0; i < 60; i++) {
        if (!alive(s.pid) || !fs.existsSync(lock)) {
          console.log("Servidor detenido.");
          return;
        }
        await sleep(100);
      }
      throw Error(`El cierre sigue pendiente. Consulta ${log}`);
    }
    if (s && !alive(s.pid)) fs.rmSync(lock, { force: true });
    console.log("No hay servidor activo de este proyecto.");
    return;
  }
  if (action !== "start")
    throw Error("Uso: start [--no-browser], stop, status, check");
  check();
  if (!(await probe(s))) {
    const fd = fs.openSync(log, "a");
    const child = spawn(
      process.execPath,
      [fileURLToPath(import.meta.url), "serve"],
      {
        cwd: root,
        detached: true,
        stdio: ["ignore", fd, fd],
        windowsHide: true,
      },
    );
    child.unref();
    fs.closeSync(fd);
    for (let i = 0; i < 160; i++) {
      await sleep(150);
      s = read();
      if (await probe(s)) break;
    }
    if (!(await probe(s)))
      throw Error(`No se pudo iniciar Vite. Consulta ${log}`);
  }
  const page = await fetch(s.url, { signal: AbortSignal.timeout(3000) });
  if (!page.ok) throw Error("El servidor inició pero no sirve el videojuego.");
  console.log(
    `SANITY-404: ${s.url}\nRegistro: ${log}\nDetener: ${process.platform === "win32" ? "INICIAR-SANITY-404.cmd --stop" : "./INICIAR-SANITY-404.sh --stop"}`,
  );
  await browser(s.url);
}
main().catch((e) => {
  const message = `${new Date().toISOString()} ERROR ${e.message}`;
  fs.appendFileSync(log, message + "\n");
  console.error(message);
  process.exitCode = 1;
});
