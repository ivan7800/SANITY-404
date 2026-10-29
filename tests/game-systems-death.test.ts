import { expect, it } from "vitest";
import { Combat } from "../src/systems/combat";
import { fresh, parseSave } from "../src/systems/state";
import { character } from "../src/world/character";
import { createEnemy } from "../src/world/enemies";
import { World, enemySpawn } from "../src/world/scene";
import { safeSpawn } from "../src/systems/collision";

it("la sombra de la mansión puede matar desde el escenario de game-systems y el punto de guardado sigue siendo válido", () => {
  const world = new World(0, [], [], []);
  try {
    const spawn = safeSpawn({ x: 3, z: -3 }, world.obstacles);
    expect(spawn).toEqual({ x: 3, z: -3 });
    const [enemyX, enemyZ] = enemySpawn(world.obstacles);
    expect([enemyX, enemyZ]).toEqual([2, -3]);

    const state = fresh();
    state.x = spawn!.x;
    state.z = spawn!.z;
    state.health = 12;
    const player = character();
    player.position.set(state.x, 0, state.z);
    const enemy = createEnemy("shade");
    enemy.position.set(enemyX, 0, enemyZ);
    const combat = new Combat(0);
    const checkpoint = fresh();
    expect(parseSave(JSON.stringify(checkpoint))).toEqual(checkpoint);

    for (let frame = 0; frame < 1800 && state.health > 0; frame++) {
      state.elapsed += 1 / 60;
      combat.update(
        1 / 60,
        state,
        player,
        enemy,
        world.obstacles,
        false,
        () => {},
        () => {},
      );
    }
    expect(combat.hitsReceived).toBeGreaterThan(0);
    expect(state.health).toBe(0);
    expect(parseSave(JSON.stringify(state))).toBeNull();
    expect(parseSave(JSON.stringify(checkpoint))?.health).toBe(100);
  } finally {
    world.dispose();
  }
});
