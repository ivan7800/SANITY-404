import { it, expect } from "vitest";
import * as T from "three";
import { character, animateCharacter, type Rig } from "../src/world/character";
import { CinematicCamera } from "../src/engine/camera";
it("el humanoide tiene volumen, extremidades articuladas y animación", () => {
  const p = character(),
    r = p.userData.rig as Rig,
    box = new T.Box3().setFromObject(p),
    size = box.getSize(new T.Vector3());
  expect(size.y).toBeGreaterThan(1.7);
  expect(size.z).toBeGreaterThan(0.4);
  animateCharacter(p, 0.15, true);
  expect(r.leftLeg.rotation.x).not.toBe(0);
  expect(r.rightLeg.rotation.x).toBe(-r.leftLeg.rotation.x);
  animateCharacter(p, 0.15, false, 0, true);
  expect(r.leftArm.rotation.x).toBe(-1.2);
});
it("la cámara tiene tres encuadres cinematográficos dentro de la mansión", () => {
  const c = new CinematicCamera(),
    camera = new T.PerspectiveCamera();
  const positions = [];
  for (const z of [5, 0, -6]) {
    c.update(camera, 0, z, 0, 0, false);
    positions.push(camera.position.toArray().join(","));
    expect(Math.abs(camera.position.x)).toBeLessThan(7.5);
    expect(Math.abs(camera.position.z)).toBeLessThan(7.5);
  }
  expect(new Set(positions).size).toBe(3);
});
