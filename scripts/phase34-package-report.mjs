import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";

const directory = path.resolve(
  process.argv.find((arg) => arg.startsWith("--dir="))?.slice(6) ??
    "desktop/release",
);
let entries;
try {
  entries = await readdir(directory, { withFileTypes: true });
} catch (error) {
  if (error.code !== "ENOENT") throw error;
  entries = [];
}

const packages = entries.filter(
  (item) => item.isFile() && /\.(?:AppImage|deb|exe)$/i.test(item.name),
);
if (packages.length === 0) {
  console.error("FAIL: no hay AppImage, DEB ni EXE en desktop/release");
  process.exitCode = 1;
} else {
  for (const item of packages) {
    const file = path.join(directory, item.name);
    const hash = createHash("sha256");
    for await (const chunk of createReadStream(file)) hash.update(chunk);
    console.log(
      JSON.stringify({
        file,
        bytes: (await stat(file)).size,
        sha256: hash.digest("hex"),
      }),
    );
  }
}
