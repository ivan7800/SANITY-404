import { newPhase2, validPhase2, type Phase2Progress } from "./phase2";
import { newCampaign, validCampaign, type CampaignProgress } from "./campaign";
import { lateChapters } from "./late-chapters";
export interface State {
  version: 2;
  room: number;
  x: number;
  z: number;
  floor: 0 | 1;
  health: number;
  sanity: number;
  items: string[];
  collected: string[];
  read: string[];
  defeated: string[];
  seals: number[];
  elapsed: number;
  ended: boolean;
  phase2: Phase2Progress;
  campaign: CampaignProgress;
}
export const fresh = (): State => ({
  version: 2,
  room: 0,
  x: 0,
  z: 5,
  floor: 0,
  health: 100,
  sanity: 100,
  items: [],
  collected: [],
  read: [],
  defeated: [],
  seals: [],
  elapsed: 0,
  ended: false,
  phase2: newPhase2(),
  campaign: newCampaign(),
});
export const clamp = (n: number, min = 0, max = 100) =>
  Math.max(min, Math.min(max, n));
export interface Obstacle {
  height?: number;
  y?: number;
  x: number;
  z: number;
  w: number;
  d: number;
}
export function blocked(
  x: number,
  z: number,
  obstacles: Obstacle[],
  radius = 0.34,
) {
  return (
    Math.abs(x) > 8 - radius ||
    Math.abs(z) > 8 - radius ||
    obstacles.some(
      (o) =>
        Math.abs(x - o.x) < o.w / 2 + radius &&
        Math.abs(z - o.z) < o.d / 2 + radius,
    )
  );
}
export function move(
  x: number,
  z: number,
  dx: number,
  dz: number,
  obstacles: Obstacle[],
) {
  const nx = blocked(x + dx, z, obstacles) ? x : x + dx;
  return { x: nx, z: blocked(nx, z + dz, obstacles) ? z : z + dz };
}
export function parseSave(raw: string): State | null {
  try {
    const s = JSON.parse(raw);
    if (
      (s.version !== 1 && s.version !== 2) ||
      !Number.isInteger(s.room) ||
      s.room < 0 ||
      s.room > (s.version === 1 ? 10 : 28) ||
      !["x", "z", "health", "sanity", "elapsed"].every((k) =>
        Number.isFinite(s[k]),
      ) ||
      Math.abs(s.x) > 8 ||
      Math.abs(s.z) > 8 ||
      s.health < 0 ||
      s.health > 100 ||
      s.sanity < 0 ||
      s.sanity > 100 ||
      s.elapsed < 0 ||
      typeof s.ended !== "boolean"
    )
      return null;
    if (s.floor === undefined)
      s.floor =
        s.room === 0 &&
        s.x >= 3.72 &&
        s.x <= 6.28 &&
        s.z <= -5.11 &&
        s.z >= -6.48
          ? 1
          : 0;
    if (s.floor !== 0 && s.floor !== 1) return null;
    if (s.room !== 0) s.floor = 0;
    if (
      s.floor === 1 &&
      !(
        (s.x >= -6.55 && s.x <= 6.35 && s.z >= -6.65 && s.z <= -4.5) ||
        (s.x >= -6.55 && s.x <= -3.45 && s.z > -4.5 && s.z <= -1.35) ||
        (s.x >= -3.35 && s.x <= 0.65 && s.z > -4.5 && s.z <= -1.35)
      )
    )
      return null;
    for (const k of ["items", "collected", "read", "defeated"])
      if (
        !Array.isArray(s[k]) ||
        s[k].length > 100 ||
        !s[k].every((v: unknown) => typeof v === "string")
      )
        return null;
    const allowedItems = [
      "Llave de latón",
      "Medallón Veyr",
      "Tónico 0",
      "Tónico 1",
      "Tónico 2",
      "Tónico 3",
      "Tónico 5",
      "Tónico 6",
      "Tónico 7",
      "Tablilla del intervalo",
      "Marca de Varro",
      "Sello de Montfort",
      "Códice de Montfort",
      "Memoria reconciliada",
      "Juramento de Lucius",
      "Promesa de Isabelle",
      "Rito del velo",
      "Velo activo",
      "Rito de lectura",
      "Lectura del umbral",
      "Folio del rellano",
      "Carta de la raíz",
      "Pigmento de cinabrio",
      "Boceto recompuesto",
      "Molde de Aurelia",
      "Tabla de mareas",
      "Registro corregido",
      "Lista de pasajeros",
      "Carta astral",
      "Primer azimut",
      "Segundo azimut",
      "Patrón de Samira",
      "Disco estelar",
      "Cuña marcada",
      "Base asentada",
      "Clave colocada",
      "Arco ensamblado",
      "Plano del umbral",
      "Hierbas de serbal",
      "Remedio identificado",
      "Cuaderno de Oona",
      "Testimonio de Ada",
      "Testimonio de Bran",
      ...lateChapters.flatMap((chapter) => [
        chapter.clue,
        chapter.solution,
        chapter.artifact,
      ]),
    ];
    if (
      !s.items.every((v: string) => allowedItems.includes(v)) ||
      !s.collected.every((v: string) => allowedItems.includes(v)) ||
      !s.read.every((v: string) => /^(?:[0-9]|1[0-9]|2[0-8])$/.test(v)) ||
      !s.defeated.every(
        (v: string) =>
          /^enemy(?:[0-9]|1[0-9]|2[0-8])$/.test(v) ||
          [
            "mansion-guest",
            "mansion-widow",
            "mansion-crawler",
            "mansion-reflection",
            "mansion-root",
          ].includes(v),
      )
    )
      return null;
    if (
      s.items.includes("Juramento de Lucius") &&
      s.items.includes("Promesa de Isabelle")
    )
      return null;
    if (
      s.items.includes("Testimonio de Ada") &&
      s.items.includes("Testimonio de Bran")
    )
      return null;
    if (
      !Array.isArray(s.seals) ||
      new Set(s.seals).size !== s.seals.length ||
      !s.seals.every(
        (v: unknown) => Number.isInteger(v) && Number(v) >= 0 && Number(v) < 3,
      )
    )
      return null;
    // Old v1 saves did not contain the lateral mansion campaign.
    if (s.phase2 === undefined) {
      s.phase2 = newPhase2();
      if (!s.phase2.visited.includes(s.room)) s.phase2.visited.push(s.room);
    } else if (!validPhase2(s.phase2)) return null;
    if (s.version === 1) {
      s.campaign = newCampaign();
      if (s.room === 8 || s.phase2.visited.includes(8))
        s.campaign.visited.push("roman-189");
      if (
        (s.room >= 9 && s.room <= 10) ||
        s.phase2.visited.some((room: number) => room >= 9 && room <= 10)
      )
        s.campaign.visited.push("abbey-1348");
      s.version = 2;
    } else if (!validCampaign(s.campaign)) return null;
    return s;
  } catch {
    return null;
  }
}
export function damage(s: State, amount: number) {
  s.health = clamp(s.health - amount);
  s.sanity = clamp(s.sanity - amount * 0.45);
}
