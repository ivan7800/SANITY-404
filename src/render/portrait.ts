import * as T from "three";
const paintings = new Map<number, T.DataTexture>();
/** Fictional Veyr family portrait, painted procedurally into an original canvas texture. */
export function portrait(seed: number) {
  if (paintings.has(seed)) return paintings.get(seed)!;
  const w = 128,
    h = 192,
    pixels = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const u = x / w,
        v = y / h,
        n = Math.sin(x * 41 + y * 177 + seed) * 0.5 + 0.5;
      let c = [37 + 15 * n, 40 + 13 * n, 35 + 10 * n];
      const fx = (u - 0.5) / 0.17,
        fy = (v - 0.33) / 0.2;
      if (
        v > 0.46 &&
        v < 0.95 &&
        Math.abs(u - 0.5) < 0.11 + (v - 0.46) * 0.52
      ) {
        c = [43 + n * 15, 47 + n * 15, 53 + n * 18];
        if (v < 0.6 && Math.abs(u - 0.5) < (0.62 - v) * 0.7)
          c = [172, 157, 124];
      }
      if (fx * fx + fy * fy < 1) {
        const shade = 0.55 + (1 - fx) * 0.18;
        c = [194 * shade, 153 * shade, 114 * shade];
        if (v < 0.26 || u < 0.365 || u > 0.635)
          c = [41 + n * 12, 28 + n * 10, 22 + n * 9];
        if (
          v > 0.315 &&
          v < 0.327 &&
          (Math.abs(u - 0.445) < 0.023 || Math.abs(u - 0.55) < 0.023)
        )
          c = [39, 34, 28];
        if (v > 0.426 && v < 0.437 && Math.abs(u - 0.5) < 0.036)
          c = [117, 65, 53];
      }
      const edge = Math.max(
          0.35,
          1 - Math.pow(Math.hypot((u - 0.5) * 1.4, (v - 0.5) * 1.1), 2) * 0.7,
        ),
        crackle = Math.sin(x * 0.7 + Math.sin(y * 0.12) * 5) > 0.997 ? 0.75 : 1;
      const i = (y * w + x) * 4;
      for (let k = 0; k < 3; k++) pixels[i + k] = c[k] * edge * crackle;
      pixels[i + 3] = 255;
    }
  const texture = new T.DataTexture(pixels, w, h);
  texture.colorSpace = T.SRGBColorSpace;
  texture.magFilter = T.LinearFilter;
  texture.minFilter = T.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  paintings.set(seed, texture);
  return texture;
}
