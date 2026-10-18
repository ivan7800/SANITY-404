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
    localStorage.setItem(key, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
