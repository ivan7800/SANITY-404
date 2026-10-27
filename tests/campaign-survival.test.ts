import { expect, it } from "vitest";
import { Combat } from "../src/systems/combat";
import { fresh, parseSave } from "../src/systems/state";
import { drinkTonic } from "../src/systems/inventory";
import { character } from "../src/world/scene";
import { createEnemy } from "../src/world/enemies";

function photographicAttack(preciseGuard: boolean) {
  const state = fresh();
  state.room = 27;
  state.health = 5;
  state.sanity = 0;
  const player = character();
  const enemy = createEnemy("developerShade");
  enemy.position.set(0, 0, 1.2);
  enemy.lookAt(player.position);
  const combat = new Combat(27);
  const messages: string[] = [];
  const update = (dt: number, guard = false) =>
    combat.update(
      dt,
      state,
      player,
      enemy,
      [],
      false,
      () => {},
      (message) => messages.push(message),
      guard,
    );
  update(0.01);
  update(1.01);
  expect(combat.windup).toBeGreaterThan(0.19);
  update(combat.windup - 0.18);
  expect(combat.windup).toBeCloseTo(0.18, 5);
  update(0.19, preciseGuard);
  return { state, combat, messages, update };
}

it("la parada precisa en la sala 27 evita el golpe mortal sin duplicar daño", () => {
  const attack = photographicAttack(true);
  expect(attack.state.health).toBe(5);
  expect(attack.state.sanity).toBeGreaterThan(1.8);
  expect(attack.messages).toContain(
    "Defensa precisa. El enemigo queda expuesto: contraataca.",
  );
  attack.update(0.1);
  expect(attack.state.health).toBe(5);
});

it("el mismo golpe de 1899 mata a un personaje con 5 de salud sin defensa", () => {
  const attack = photographicAttack(false);
  expect(attack.state.health).toBe(0);
  attack.update(0.1);
  expect(attack.state.health).toBe(0);
});

it("el tónico legítimo y el guardado conservan salud, cordura e inventario", () => {
  const state = fresh();
  state.room = 27;
  state.health = 31;
  state.sanity = 2.66;
  state.items.push("Tónico 6");
  expect(drinkTonic(state)).toBe("used");
  expect(state.health).toBe(71);
  expect(state.sanity).toBeCloseTo(27.66);
  expect(drinkTonic(state)).toBe("empty");
  const restored = parseSave(JSON.stringify(state));
  expect(restored?.room).toBe(27);
  expect(restored?.health).toBe(71);
  expect(restored?.sanity).toBeCloseTo(27.66);
  expect(restored?.items).not.toContain("Tónico 6");
});
