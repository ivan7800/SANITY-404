/** Stable narrative identifiers. Only rooms with actual scenes may enter production. */
export const chapters = [
  {
    id: "roman-189",
    year: 189,
    hero: "Lucius Varro",
    place: "Santuario de los nombres",
    prerequisite: null,
    room: 8,
    status: "production",
  },
  {
    id: "mosaic-312",
    year: 312,
    hero: "Aurelia",
    place: "Taller de mosaicos",
    prerequisite: "roman-189",
    room: null,
    status: "draft",
  },
  {
    id: "coast-537",
    year: 537,
    hero: "Maeve",
    place: "Archivo costero",
    prerequisite: "mosaic-312",
    room: null,
    status: "draft",
  },
  {
    id: "stars-783",
    year: 783,
    hero: "Samira",
    place: "Observatorio de montaña",
    prerequisite: "coast-537",
    room: null,
    status: "draft",
  },
  {
    id: "quarry-1092",
    year: 1092,
    hero: "Idris",
    place: "Cantera alpina",
    prerequisite: "stars-783",
    room: null,
    status: "draft",
  },
  {
    id: "hospital-1217",
    year: 1217,
    hero: "Oona",
    place: "Hospital de camino",
    prerequisite: "quarry-1092",
    room: null,
    status: "draft",
  },
  {
    id: "abbey-1348",
    year: 1348,
    hero: "Isabelle de Montfort",
    place: "Claustro y scriptorium",
    prerequisite: "hospital-1217",
    room: 9,
    status: "production",
  },
  {
    id: "press-1491",
    year: 1491,
    hero: "Tomás",
    place: "Imprenta de frontera",
    prerequisite: "abbey-1348",
    room: null,
    status: "draft",
  },
  {
    id: "veyr-1610",
    year: 1610,
    hero: "Inés Veyr",
    place: "Casa Veyr",
    prerequisite: "press-1491",
    room: null,
    status: "draft",
  },
  {
    id: "theatre-1786",
    year: 1786,
    hero: "Amara",
    place: "Teatro de autómatas",
    prerequisite: "veyr-1610",
    room: null,
    status: "draft",
  },
  {
    id: "photo-1899",
    year: 1899,
    hero: "Émile",
    place: "Archivo fotográfico",
    prerequisite: "theatre-1786",
    room: null,
    status: "draft",
  },
  {
    id: "mansion-1927",
    year: 1927,
    hero: "Élise Moreau",
    place: "Mansión Veyr",
    prerequisite: "photo-1899",
    room: 0,
    status: "production",
  },
] as const;

export type ChapterId = (typeof chapters)[number]["id"];
export interface CampaignProgress {
  visited: ChapterId[];
  completed: ChapterId[];
  witnessed: string[];
}
export const newCampaign = (): CampaignProgress => ({
  visited: ["mansion-1927"],
  completed: [],
  witnessed: [],
});
const ids = new Set<string>(
  chapters
    .filter((chapter) => chapter.room !== null)
    .map((chapter) => chapter.id),
);
export function validCampaign(value: unknown): value is CampaignProgress {
  if (!value || typeof value !== "object") return false;
  const progress = value as Record<string, unknown>;
  return (
    ["visited", "completed", "witnessed"].every((key) => {
      const entries = progress[key];
      return (
        Array.isArray(entries) &&
        entries.length <= 12 &&
        new Set(entries).size === entries.length &&
        entries.every(
          (entry: unknown) =>
            typeof entry === "string" &&
            (key === "witnessed"
              ? entry === "roman-formation"
              : ids.has(entry)),
        )
      );
    }) &&
    (progress.completed as string[]).every((id) =>
      (progress.visited as string[]).includes(id),
    )
  );
}
export function visitChapter(progress: CampaignProgress, id: ChapterId) {
  if (!progress.visited.includes(id)) progress.visited.push(id);
}
export function completeChapter(progress: CampaignProgress, id: ChapterId) {
  visitChapter(progress, id);
  if (!progress.completed.includes(id)) progress.completed.push(id);
}
export function romanObjective(state: {
  read: string[];
  items: string[];
  defeated: string[];
  campaign: CampaignProgress;
}): string {
  if (!state.read.includes("8"))
    return "Explora el santuario y lee la inscripción del testigo.";
  if (!state.campaign.witnessed.includes("roman-formation"))
    return "Afronta la formación imposible que despierta en el santuario.";
  if (!state.items.includes("Marca de Varro"))
    return "Ordena las tres edades en el altar.";
  if (!state.defeated.includes("enemy8"))
    return "Derrota al centurión sin nombre con el gladius.";
  if (!state.items.includes("Tablilla del intervalo"))
    return "Recupera la tablilla y conserva el primer signo.";
  return "Regresa por el arco sur para dejar la tablilla a la siguiente época.";
}
