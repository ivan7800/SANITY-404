export interface Settings {
  reduced: boolean;
  volume: number;
  quality: number;
  cameraMode: "classic" | "modern";
  reduceFlashes: boolean;
  reduceDistortion: boolean;
  reduceAudio: boolean;
}
export function readSettings(): Settings {
  const defaults: Settings = {
    reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
    volume: 0.35,
    quality: 1.3,
    cameraMode: "classic",
    reduceFlashes: matchMedia("(prefers-reduced-motion: reduce)").matches,
    reduceDistortion: false,
    reduceAudio: false,
  };
  try {
    const s = JSON.parse(localStorage.getItem("sanity404-settings") || "{}");
    return {
      reduced: typeof s.reduced === "boolean" ? s.reduced : defaults.reduced,
      volume:
        typeof s.volume === "number" && Number.isFinite(s.volume)
          ? Math.max(0, Math.min(1, s.volume))
          : defaults.volume,
      cameraMode: s.cameraMode === "modern" ? "modern" : "classic",
      reduceFlashes:
        typeof s.reduceFlashes === "boolean"
          ? s.reduceFlashes
          : defaults.reduceFlashes,
      reduceDistortion:
        typeof s.reduceDistortion === "boolean" ? s.reduceDistortion : false,
      reduceAudio: typeof s.reduceAudio === "boolean" ? s.reduceAudio : false,
      quality: [1, 1.3, 1.6].includes(s.quality) ? s.quality : defaults.quality,
    };
  } catch {
    return defaults;
  }
}
