import path from "node:path";
import { readFile } from "node:fs/promises";

const types = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".woff2", "font/woff2"],
  [".json", "application/json; charset=utf-8"],
]);

export function assetPath(root, requestUrl) {
  if (/%2e|%2f|%5c|(?:^|\/)\.\.(?:\/|$|\?)/i.test(requestUrl))
    throw new Error("Ruta codificada no permitida");
  const url = new URL(requestUrl);
  if (
    url.protocol !== "sanity:" ||
    url.hostname !== "game" ||
    url.username ||
    url.password ||
    url.port
  ) {
    throw new Error("Origen de recurso no permitido");
  }
  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    throw new Error("Ruta codificada inválida");
  }
  if (
    pathname.includes("\0") ||
    pathname.includes("\\") ||
    pathname.split("/").includes("..")
  ) {
    throw new Error("Ruta de recurso no permitida");
  }
  const relative = pathname === "/" ? "index.html" : pathname.slice(1);
  const resolved = path.resolve(root, relative);
  if (!resolved.startsWith(path.resolve(root) + path.sep))
    throw new Error("Recurso fuera del juego");
  return resolved;
}

export function assetType(file) {
  return (
    types.get(path.extname(file).toLowerCase()) ?? "application/octet-stream"
  );
}

export async function serveAsset(root, request) {
  if (request.method !== "GET") {
    return new Response("Método no permitido", { status: 405 });
  }
  try {
    const file = assetPath(root, request.url);
    return new Response(await readFile(file), {
      status: 200,
      headers: {
        "Content-Type": assetType(file),
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return new Response("Recurso no disponible", { status: 404 });
  }
}
