import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import assert from "node:assert/strict";
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "sanity-firefox-"));
const url = process.env.SANITY_TEST_URL || "http://127.0.0.1:5173/";
const child = spawn(
  "/usr/bin/firefox",
  [
    "--no-remote",
    "--profile",
    profile,
    "--headless",
    "--remote-debugging-port=9225",
    "about:blank",
  ],
  {
    env: { ...process.env, MOZ_HEADLESS: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  },
);
let log = "",
  ws,
  id = 0,
  context,
  record = false;
const errors = [],
  pending = new Map();
const timeout = (ms) =>
  new Promise((_, reject) =>
    setTimeout(
      () => reject(new Error("Firefox BiDi timeout: " + log.slice(-600))),
      ms,
    ),
  );
try {
  await Promise.race([
    new Promise((resolve, reject) => {
      child.on("error", reject);
      child.on("exit", (code) =>
        reject(new Error("Firefox exit " + code + ": " + log.slice(-600))),
      );
      const chunk = (b) => {
        log += b.toString();
        if (log.includes("WebDriver BiDi listening")) resolve();
      };
      child.stdout.on("data", chunk);
      child.stderr.on("data", chunk);
    }),
    timeout(15000),
  ]);
  ws = new WebSocket("ws://127.0.0.1:9225/session");
  await Promise.race([
    new Promise((resolve, reject) => {
      ws.addEventListener("open", resolve, { once: true });
      ws.addEventListener("error", reject, { once: true });
    }),
    timeout(10000),
  ]);
  ws.addEventListener("message", (event) => {
    const m = JSON.parse(event.data);
    if (m.id) {
      const p = pending.get(m.id);
      if (p) {
        pending.delete(m.id);
        m.type === "error"
          ? p.reject(new Error(JSON.stringify(m)))
          : p.resolve(m.result);
      }
    } else if (
      record &&
      m.method === "log.entryAdded" &&
      m.params.level === "error"
    )
      errors.push(m.params.text);
  });
  const send = (method, params) =>
    new Promise((resolve, reject) => {
      const n = ++id;
      pending.set(n, { resolve, reject });
      ws.send(JSON.stringify({ id: n, method, params }));
    });
  const session = await send("session.new", {
    capabilities: { alwaysMatch: { browserName: "firefox" } },
  });
  await send("session.subscribe", { events: ["log.entryAdded"] });
  context = (await send("browsingContext.create", { type: "tab" })).context;
  record = true;
  await send("browsingContext.navigate", { context, url, wait: "complete" });
  const evaluate = async (expression) => {
    const r = await send("script.evaluate", {
      expression: `JSON.stringify(${expression})`,
      target: { context },
      awaitPromise: true,
    });
    if (r.type === "exception") throw new Error(JSON.stringify(r));
    return JSON.parse(r.result.value);
  };
  let ready = false;
  for (let i = 0; i < 100; i++) {
    ready = await evaluate("typeof window.sanityInspect === 'function'");
    if (ready) break;
    await new Promise((r) => setTimeout(r, 100));
  }
  assert.ok(ready, "El juego no cargó en Firefox");
  await evaluate(
    "(()=>{document.querySelector('#new').click();return true})()",
  );
  for (let i = 0; i < 100; i++) {
    const s = await evaluate("window.sanityInspect()");
    if (s.draw.frame > 5) break;
    await new Promise((r) => setTimeout(r, 100));
  }
  const before = await evaluate("window.sanityInspect()"),
    webgl = await evaluate(
      "(()=>{const g=document.querySelector('canvas').getContext('webgl2');return {version:g.getParameter(g.VERSION),renderer:g.getParameter(g.RENDERER)}})()",
    );
  assert.ok(before.draw.triangles > 1000);
  assert.ok(before.playerRig);
  assert.equal(before.cameraMode, "classic");
  await send("input.performActions", {
    context,
    actions: [
      {
        type: "key",
        id: "keyboard",
        actions: [{ type: "keyDown", value: "w" }],
      },
    ],
  });
  await new Promise((r) => setTimeout(r, 900));
  await send("input.performActions", {
    context,
    actions: [
      { type: "key", id: "keyboard", actions: [{ type: "keyUp", value: "w" }] },
    ],
  });
  const after = await evaluate("window.sanityInspect()");
  assert.ok(after.state.z < before.state.z - 0.2);
  const shot = await send("browsingContext.captureScreenshot", { context });
  fs.mkdirSync("docs/capturas/fase17", { recursive: true });
  fs.writeFileSync(
    "docs/capturas/fase17/firefox.png",
    Buffer.from(shot.data, "base64"),
  );
  await evaluate(
    "(()=>{localStorage.setItem('sanity404-settings',JSON.stringify({quality:1,volume:0,reduced:false,cameraMode:'modern'}));return true})()",
  );
  await send("browsingContext.navigate", { context, url, wait: "complete" });
  for (let i = 0; i < 100; i++) {
    ready = await evaluate("typeof window.sanityInspect === 'function'");
    if (ready) break;
    await new Promise((r) => setTimeout(r, 100));
  }
  assert.ok(ready);
  await evaluate(
    "(()=>{document.querySelector('#new').click();return true})()",
  );
  for (let i = 0; i < 100; i++) {
    if ((await evaluate("window.sanityInspect()")).draw.frame > 5) break;
    await new Promise((r) => setTimeout(r, 100));
  }
  const modern = await evaluate("window.sanityInspect()");
  assert.equal(modern.cameraMode, "modern");
  assert.ok(Math.abs(modern.camera[0] - before.camera[0]) > 1);
  const modernShot = await send("browsingContext.captureScreenshot", {
    context,
  });
  fs.writeFileSync(
    "docs/capturas/fase17/firefox-modern.png",
    Buffer.from(modernShot.data, "base64"),
  );
  await evaluate(
    `(()=>{localStorage.setItem('sanity404-save',JSON.stringify({version:1,room:6,x:0,z:0,health:100,sanity:80,items:[],collected:[],read:[],defeated:['enemy6'],seals:[],elapsed:0,ended:false,phase2:{visited:[0,6],solved:[],steps:[0,0,0,0],discoveries:[],shortcuts:[],ending:false}}));localStorage.setItem('sanity404-settings',JSON.stringify({quality:1,volume:0,reduced:false,cameraMode:'classic',reduceFlashes:true}));return true})()`,
  );
  await send("browsingContext.navigate", { context, url, wait: "complete" });
  for (let i = 0; i < 100; i++) {
    ready = await evaluate("typeof window.sanityInspect === 'function'");
    if (ready) break;
    await new Promise((r) => setTimeout(r, 100));
  }
  assert.ok(ready);
  await evaluate(
    "(()=>{document.querySelector('#load').click();return true})()",
  );
  for (let i = 0; i < 100; i++) {
    if ((await evaluate("window.sanityInspect()")).draw.frame > 5) break;
    await new Promise((r) => setTimeout(r, 100));
  }
  const greenhouseBefore = await evaluate("window.sanityInspect()");
  assert.equal(greenhouseBefore.state.room, 6);
  assert.ok(greenhouseBefore.draw.triangles > 1000);
  await send("input.performActions", {
    context,
    actions: [
      {
        type: "key",
        id: "keyboard",
        actions: [{ type: "keyDown", value: "w" }],
      },
    ],
  });
  await new Promise((r) => setTimeout(r, 900));
  await send("input.performActions", {
    context,
    actions: [
      { type: "key", id: "keyboard", actions: [{ type: "keyUp", value: "w" }] },
    ],
  });
  const greenhouseAfter = await evaluate("window.sanityInspect()");
  assert.ok(greenhouseAfter.state.z < greenhouseBefore.state.z - 0.2);
  const greenhouseShot = await send("browsingContext.captureScreenshot", {
    context,
  });
  fs.mkdirSync("docs/capturas/fase2", { recursive: true });
  fs.writeFileSync(
    "docs/capturas/fase2/firefox-invernadero.png",
    Buffer.from(greenhouseShot.data, "base64"),
  );
  fs.writeFileSync(
    "docs/capturas/fase2/firefox.json",
    JSON.stringify(
      {
        browser: session.capabilities.browserName,
        version: session.capabilities.browserVersion,
        webgl,
        room: greenhouseBefore.state.room,
        before: greenhouseBefore.state.z,
        after: greenhouseAfter.state.z,
        draw: greenhouseAfter.draw,
        errors,
      },
      null,
      2,
    ),
  );
  assert.deepEqual(errors, []);
  const result = {
    browser: session.capabilities.browserName,
    version: session.capabilities.browserVersion,
    webgl,
    before: {
      draw: before.draw,
      position: before.state.z,
      camera: before.camera,
    },
    after: { position: after.state.z, camera: after.camera },
    modern: {
      draw: modern.draw,
      camera: modern.camera,
      mode: modern.cameraMode,
    },
    errors,
  };
  fs.writeFileSync(
    "docs/capturas/fase17/firefox.json",
    JSON.stringify(result, null, 2),
  );
  console.log(JSON.stringify(result));
} finally {
  ws?.close();
  child.kill("SIGTERM");
}
