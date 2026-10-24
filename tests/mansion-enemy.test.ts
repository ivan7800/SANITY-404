import { expect, it } from "vitest";
import { animateEnemyStyle, createEnemy } from "../src/world/enemies";
import type { Rig } from "../src/world/character";

it("da a la sombra de la mansión un rostro velado y anticipación articulada", () => {
  const shade = createEnemy("shade");
  const rig = shade.userData.rig as Rig;
  expect(shade.name).toBe("La sombra de los retratos");
  expect(rig.head.children.length).toBeGreaterThan(0);
  expect(shade.getObjectByName("shade-cuff")).toBeDefined();
  animateEnemyStyle(shade, 0.3, "shade", "windup", 1);
  expect(rig.leftArm.rotation.x).toBeLessThan(-1);
  expect(rig.rightArm.rotation.x).toBeLessThan(-1);
});
