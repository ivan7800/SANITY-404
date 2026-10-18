import { clamp, type State } from "./state";
export function drinkTonic(state: State): "empty" | "full" | "used" {
  const i = state.items.findIndex((i) => i.startsWith("Tónico"));
  if (i < 0) return "empty";
  if (state.health === 100 && state.sanity === 100) return "full";
  state.items.splice(i, 1);
  state.health = clamp(state.health + 40);
  state.sanity = clamp(state.sanity + 25);
  return "used";
}
