import * as T from "three";
export type Surface =
  "wood" | "stone" | "brass" | "fabric" | "leather" | "plaster";
const textures = new Map<
  Surface,
  { map: T.DataTexture; roughnessMap: T.DataTexture; normalMap: T.DataTexture }
>();
const size = 128;
const noise = (x: number, y: number) => {
  const v = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return v - Math.floor(v);
};
/** Original deterministic albedo, roughness and tangent normals. No downloaded assets. */
export function surfaceTextures(kind: Surface) {
  const cached = textures.get(kind);
  if (cached) return cached;
  const albedo = new Uint8Array(size * size * 4),
    rough = new Uint8Array(size * size * 4),
    normals = new Uint8Array(size * size * 4),
    height = new Float32Array(size * size);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const n = noise(x, y),
        u = x / size,
        v = y / size;
      let h = 0.5,
        t = 0.8;
      if (kind === "wood") {
        h =
          0.5 +
          0.15 * Math.sin(u * 80 + Math.sin(v * 11) * 2) +
          0.07 * Math.sin(u * 231 + Math.sin(v * 19)) +
          0.06 * n;
        t = 0.61 + h * 0.3;
        if (x % 32 < 1) t *= 0.55;
      } else if (kind === "stone") {
        h = 0.5 + 0.09 * Math.sin(u * 15 + v * 8) + 0.05 * n;
        const vein = Math.pow(
          Math.abs(Math.sin(u * 17 + Math.sin(v * 11) * 2)),
          12,
        );
        t = 0.76 + h * 0.2 - vein * 0.13;
      } else if (kind === "brass") {
        h = n * 0.12;
        const patina = Math.sin(u * 14) * Math.sin(v * 21) > 0.5;
        t = patina ? 0.42 : 0.68 + n * 0.27;
      } else if (kind === "fabric") {
        h = (x % 3 === 0 ? 0.38 : 0.58) + (y % 3 === 0 ? 0.02 : 0.15);
        t = 0.72 + n * 0.12 + Math.sin(u * 50) * Math.sin(v * 50) * 0.08;
      } else if (kind === "leather") {
        h = n * 0.2;
        t = 0.65 + n * 0.25;
      } else {
        h = n * 0.16;
        t = 0.72 + n * 0.18;
      }
      const i = (y * size + x) * 4;
      height[y * size + x] = h;
      // Subtle periodic colour variation gives otherwise monochrome
      // procedural surfaces material identity without new texture assets.
      const macro = 0.5 + 0.25 * Math.sin(u * Math.PI * 2) +
        0.25 * Math.cos(v * Math.PI * 2);
      const variation = 0.94 + macro * 0.1;
      const tint =
        kind === "wood" ? [1.07, 0.98, 0.88] :
        kind === "stone" ? [0.96, 0.99, 1.03] :
        kind === "brass" ? [1.08, 0.99, 0.84] :
        kind === "fabric" ? [1.04, 0.97, 0.95] :
        kind === "leather" ? [1.06, 0.97, 0.89] :
        [0.98, 0.99, 1.02];
      const r =
        (kind === "brass"
          ? 0.42 + n * 0.28
          : kind === "stone"
            ? 0.57 + n * 0.2
            : kind === "wood"
              ? 0.6 + n * 0.2
              : 0.82 + n * 0.12) + (macro - 0.5) * 0.08;
      for (let c = 0; c < 3; c++) {
        albedo[i + c] = Math.round(Math.min(1, t * variation * tint[c]) * 255);
        rough[i + c] = Math.round(Math.max(0, Math.min(1, r)) * 255);
      }
      if (kind === "brass" && t < 0.5) {
        albedo[i] = 75;
        albedo[i + 1] = 108;
        albedo[i + 2] = 94;
      }
      albedo[i + 3] = rough[i + 3] = 255;
    }
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const dx =
          height[y * size + ((x + 1) % size)] -
          height[y * size + ((x + size - 1) % size)],
        dy =
          height[((y + 1) % size) * size + x] -
          height[((y + size - 1) % size) * size + x];
      const n = new T.Vector3(-dx * 0.55, -dy * 0.55, 1).normalize();
      normals.set(
        [
          (n.x * 0.5 + 0.5) * 255,
          (n.y * 0.5 + 0.5) * 255,
          (n.z * 0.5 + 0.5) * 255,
          255,
        ],
        i,
      );
    }
  const tex = (data: Uint8Array, color = false) => {
    const t = new T.DataTexture(data, size, size);
    t.wrapS = t.wrapT = T.RepeatWrapping;
    t.magFilter = T.LinearFilter;
    t.minFilter = T.LinearMipmapLinearFilter;
    t.generateMipmaps = true;
    t.colorSpace = color ? T.SRGBColorSpace : T.NoColorSpace;
    t.needsUpdate = true;
    return t;
  };
  const result = {
    map: tex(albedo, true),
    roughnessMap: tex(rough),
    normalMap: tex(normals),
  };
  textures.set(kind, result);
  return result;
}
export function pbr(
  kind: Surface,
  color: T.ColorRepresentation,
  extra: T.MeshStandardMaterialParameters = {},
) {
  return new T.MeshStandardMaterial({
    ...surfaceTextures(kind),
    color,
    roughness: 1,
    metalness: kind === "brass" ? 0.7 : 0,
    normalScale: new T.Vector2(0.45, 0.45),
    ...extra,
  });
}
export function textureBudget() {
  return {
    surfaces: textures.size,
    maps: textures.size * 3,
    bytes: (textures.size * 3 * size * size * 4 * 4) / 3,
  };
}

/** Remove the subtle normal lookup only in Low; color and roughness remain PBR. */
export function simplifyLowMaterials(root: T.Object3D) {
  const seen = new Set<T.Material>();
  root.traverse((object) => {
    if (!(object instanceof T.Mesh)) return;
    for (const material of Array.isArray(object.material)
      ? object.material
      : [object.material]) {
      if (seen.has(material)) continue;
      seen.add(material);
      if (material instanceof T.MeshStandardMaterial && material.normalMap) {
        material.normalMap = null;
        material.needsUpdate = true;
      }
    }
  });
}
