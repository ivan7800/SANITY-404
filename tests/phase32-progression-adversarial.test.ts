import { expect, it } from "vitest";
import { completeChapter } from "../src/systems/campaign";
import { fresh } from "../src/systems/state";
import { World } from "../src/world/scene";

// Technical scene checks. The campaign certification still starts from New Game.
const mansionPortals = (state: ReturnType<typeof fresh>) => {
  const world = new World(
    0,
    state.items,
    state.seals,
    state.read,
    state.collected,
    1,
    state.phase2,
    state.campaign,
  );
  const ids = world.objects.map((object) => object.id);
  world.dispose();
  return ids;
};

it("no presenta portales históricos posteriores antes de sus capítulos", () => {
  const state = fresh();
  expect(mansionPortals(state)).toContain("roman-portal");
  expect(mansionPortals(state)).not.toContain("mosaic-portal");
  expect(mansionPortals(state)).not.toContain("coast-portal");
  expect(mansionPortals(state)).not.toContain("photo-1899-portal");

  completeChapter(state.campaign, "roman-189");
  expect(mansionPortals(state)).toContain("mosaic-portal");
  expect(mansionPortals(state)).not.toContain("coast-portal");
  completeChapter(state.campaign, "mosaic-312");
  expect(mansionPortals(state)).toContain("coast-portal");
  expect(mansionPortals(state)).not.toContain("stars-portal");
});

it("mantiene el requisito de Oona para la cadena tardía tras Isabelle", () => {
  const state = fresh();
  completeChapter(state.campaign, "abbey-1348");
  expect(mansionPortals(state)).not.toContain("press-1491-portal");
  completeChapter(state.campaign, "hospital-1217");
  expect(mansionPortals(state)).toContain("press-1491-portal");
});
