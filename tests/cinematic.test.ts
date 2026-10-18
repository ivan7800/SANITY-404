import { it, expect } from "vitest";
import * as T from "three";
import { CinematicCamera } from "../src/engine/camera";
import { strikeClear, Combat } from "../src/systems/combat";
import { fresh } from "../src/systems/state";
import { character, animateDeath, type Rig } from "../src/world/character";
it("ambos modos mantienen la cámara a media altura y son distintos", () => {
  const c = new CinematicCamera(),
    cam = new T.PerspectiveCamera();
  c.update(cam, 0, 5, 0, 0, false, [], { mode: "classic" });
  const classic = cam.position.clone();
  expect(cam.position.y).toBeLessThan(2.5);
  c.update(cam, 0, 5, 0, 0, false, [], { mode: "modern" });
  expect(cam.position.distanceTo(classic)).toBeGreaterThan(1);
  expect(cam.position.y).toBeGreaterThan(1.5);
});
it("los cambios de zona interpolan en lugar de saltar", () => {
  const c = new CinematicCamera(),
    cam = new T.PerspectiveCamera();
  c.update(cam, 0, 1.1, 0, 0, false);
  const start = cam.position.clone();
  c.update(cam, 0, 0.9, 0, 0.016, false);
  expect(cam.position.distanceTo(start)).toBeLessThan(1.1);
});
it("paredes y muebles bloquean el golpe; alfombras no", () => {
  const a = new T.Vector3(),
    b = new T.Vector3(0, 0, 1.4);
  const obstacle = { x: 0, z: 0.7, w: 2, d: 0.3, height: 2 };
  expect(strikeClear(a, b, [obstacle])).toBe(false);
  expect(strikeClear(a, b, [{ ...obstacle, height: 0.1 }])).toBe(true);
  const c = new Combat(0),
    p = character(),
    e = character(true),
    s = fresh(),
    noop = () => {};
  e.position.copy(b);
  c.update(0.01, s, p, e, [obstacle], true, noop, noop);
  expect(c.health).toBe(60);
  e.position.set(0, 0, 1);
  c.windup = 0.01;
  c.update(0.02, s, p, e, [obstacle], false, noop, noop);
  expect(s.health).toBe(100);
});
it("la caída articula piernas y torso sin desplazar la raíz de colisión", () => {
  const p = character(),
    r = p.userData.rig as Rig;
  animateDeath(p, 1);
  expect(r.hips.position.y).toBeLessThan(0.4);
  expect(r.leftKnee.rotation.x).toBeGreaterThan(1);
  expect(p.position.y).toBe(0);
});
it("el corredor lateral recibe un plano cercano dentro del espacio transitable", () => {
  const c = new CinematicCamera(),
    camera = new T.PerspectiveCamera();
  c.update(camera, 6.3, 0, 1, 0, false, []);
  expect(c.zone).toBe("pasillo de estanterías");
  expect(camera.position.y).toBe(1.85);
  expect(camera.position.x).toBeGreaterThan(5.8);
});
