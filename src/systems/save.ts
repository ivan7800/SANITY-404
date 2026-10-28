import { parseSave, type State } from "./state";
const key = "sanity404-save";
export function readSave(): State | null {
  try {
    return parseSave(localStorage.getItem(key) || "");
  } catch {
    return null;
  }
}
export function writeSave(state: State): boolean {
  try {
    const serialized = JSON.stringify(state);
    if (!parseSave(serialized)) return false;
    localStorage.setItem(key, serialized);
    return true;
  } catch {
    return false;
  }
}
