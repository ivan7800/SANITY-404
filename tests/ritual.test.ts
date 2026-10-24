import { describe, expect, it } from "vitest";
import { absorbVeil, invokeRitual, ritualStatus } from "../src/systems/ritual";
import { fresh, parseSave } from "../src/systems/state";
import { World } from "../src/world/scene";
import { reachableFromEntrance } from "./room-navigation";

describe("mansion witness ritual", () => {
  it("requires the observed order, exact evidence and sanity", () => {
    const state = fresh();
    expect(ritualStatus(state, "reading")).toBe("locked");
    expect(invokeRitual(state, "veil", ["NOMBRE", "PIEDRA", "PAUSA"])).toBe(
      "wrong",
    );
    expect(state.sanity).toBe(97);
    expect(state.items).not.toContain("Velo activo");
    expect(invokeRitual(state, "veil", ["PIEDRA", "NOMBRE", "PAUSA"])).toBe(
      "cast",
    );
    expect(state.sanity).toBe(85);
    expect(absorbVeil(state, 20)).toBe(6);
    expect(absorbVeil(state, 20)).toBe(20);
    expect(invokeRitual(state, "veil", ["PIEDRA", "NOMBRE", "PAUSA"])).toBe(
      "complete",
    );
    state.items.push("Tablilla del intervalo", "Códice de Montfort");
    expect(invokeRitual(state, "reading", ["PAUSA", "PIEDRA", "NOMBRE"])).toBe(
      "cast",
    );
    const restored = parseSave(JSON.stringify(state));
    expect(restored?.items).toContain("Lectura del umbral");
    expect(ritualStatus(restored!, "reading")).toBe("complete");
  });

  it("places the altar and the revealed secret in reachable mansion spaces", () => {
    const hall = new World(0, [], [], []);
    const altar = hall.objects.find((o) => o.id === "ritual-table")!;
    expect(reachableFromEntrance(hall.obstacles, altar)).toBe(true);
    hall.dispose();
    const closed = new World(7, [], [], []);
    expect(closed.objects.some((o) => o.id === "ritual-secret")).toBe(false);
    closed.dispose();
    const open = new World(7, ["Lectura del umbral"], [], []);
    const secret = open.objects.find((o) => o.id === "ritual-secret")!;
    expect(reachableFromEntrance(open.obstacles, secret)).toBe(true);
    open.dispose();
  });
});
