import * as T from "three";
export const qualityProfile = (value: number) =>
  value === 1
    ? {
        name: "Baja",
        scale: 0.8,
        maxPixels: 1024 * 576,
        shadows: false,
        shadowSize: 512,
        dust: 32,
      }
    : value === 1.6
      ? {
          name: "Alta",
          scale: 1.25,
          maxPixels: 1920 * 1080,
          shadows: true,
          shadowSize: 2048,
          dust: 160,
        }
      : {
          name: "Media",
          scale: 1,
          maxPixels: 1600 * 900,
          shadows: true,
          shadowSize: 1024,
          dust: 80,
        };
export function renderScale(
  width: number,
  height: number,
  dpr: number,
  value: number,
) {
  const p = qualityProfile(value);
  return Math.min(
    dpr,
    p.scale,
    Math.sqrt(p.maxPixels / Math.max(1, width * height)),
  );
}
export function applyQuality(renderer: T.WebGLRenderer, value: number) {
  const p = qualityProfile(value);
  renderer.setPixelRatio(
    renderScale(innerWidth, innerHeight, devicePixelRatio, value),
  );
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = p.shadows;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  return p;
}
