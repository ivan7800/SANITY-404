import { parseSave, type State } from "./state";

const keys = {
  manual: "sanity404-save",
  checkpoint: "sanity404-checkpoint",
} as const;
export type SaveSlot = keyof typeof keys;

export function readSave(slot?: SaveSlot): State | null {
  if (!slot) return readSave("checkpoint") ?? readSave("manual");
  try {
    return parseSave(localStorage.getItem(keys[slot]) || "");
  } catch {
    return null;
  }
}

export function writeSave(state: State, slot: SaveSlot = "manual"): boolean {
  try {
    const serialized = JSON.stringify(state);
    if (!parseSave(serialized)) return false;
    localStorage.setItem(keys[slot], serialized);
    if (slot === "manual") removeSave("checkpoint");
    return true;
  } catch {
    return false;
  }
}

export function removeSave(slot: SaveSlot): boolean {
  try {
    localStorage.removeItem(keys[slot]);
    return true;
  } catch {
    return false;
  }
}
