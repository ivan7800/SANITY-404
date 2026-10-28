import { readFile, readdir, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

const roots = [
  { name: "web", directory: "dist", prefix: "/SANITY-404/" },
  { name: "desktop", directory: "desktop/dist-desktop", prefix: "./" },
];

async function files(directory) {
  const result = [];
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, item.name);
    if (item.isDirectory()) result.push(...(await files(file)));
    else if (item.isFile()) result.push(file);
  }
  return result;
}

let failed = false;
for (const target of roots) {
  try {
    const html = await readFile(
      path.join(target.directory, "index.html"),
      "utf8",
    );
    if (
      !html.includes(target.prefix + "assets/") ||
      html.includes("/src/main.ts")
    ) {
      throw new Error(`base incorrecta en ${target.directory}/index.html`);
    }
    for (const [, reference] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
      if (/^(?:https?:|data:|#)/.test(reference)) continue;
      const relative = reference.startsWith(target.prefix)
        ? reference.slice(target.prefix.length)
        : reference.replace(/^\.\//, "");
      if (relative.startsWith("/") || relative.split("/").includes("..")) {
        throw new Error(`Referencia fuera del bundle: ${reference}`);
      }
      await readFile(path.join(target.directory, relative));
    }
    const inventory = [];
    for (const file of await files(target.directory)) {
      const bytes = await readFile(file);
      inventory.push({
        file,
        bytes: (await stat(file)).size,
        sha256: createHash("sha256").update(bytes).digest("hex"),
      });
    }
    console.log(
      JSON.stringify(
        { target: target.name, status: "PASS", files: inventory },
        null,
        2,
      ),
    );
  } catch (error) {
    failed = true;
    console.error(`${target.name}: FAIL: ${error.message}`);
  }
}
if (failed) process.exitCode = 1;
