import { it, expect } from "vitest";
import * as T from "three";
import { surfaceTextures, textureBudget } from "../src/render/materials";
import { qualityProfile, renderScale } from "../src/render/quality";
import { CinematicCamera } from "../src/engine/camera";
import { character, animateCharacter, type Rig } from "../src/world/character";
it("las texturas originales se comparten y sus mapas tienen colorimetría correcta", () => {
  const a = surfaceTextures("wood"),
    b = surfaceTextures("wood");
  expect(a).toBe(b);
  expect(a.map.colorSpace).toBe(T.SRGBColorSpace);
  expect(a.normalMap.colorSpace).toBe(T.NoColorSpace);
  expect(a.map.image.width).toBe(128);
  expect(textureBudget().bytes).toBeLessThan(2 * 1024 * 1024);
});
it("la cámara acorta una línea bloqueada sin atravesar el obstáculo", () => {
  const camera = new T.PerspectiveCamera(),
    control = new CinematicCamera();
  control.update(camera, 0, 5, 0, 0, false);
  const original = camera.position.distanceTo(new T.Vector3(0, 1.25, 5));
  control.update(camera, 0, 5, 0, 0, false, [
    { x: -0.3, z: 6.1, w: 0.4, d: 0.4, height: 5 },
  ]);
  expect(control.corrected).toBe(true);
  expect(camera.position.distanceTo(new T.Vector3(0, 1.25, 5))).toBeLessThan(
    original,
  );
  expect(camera.position.z).toBeLessThan(5.9);
});
it("las calidades bajan resolución, sombras y partículas sin alterar las reglas", () => {
  expect(qualityProfile(1).shadows).toBe(false);
  expect(qualityProfile(1.3).shadowSize).toBe(1024);
  expect(qualityProfile(1.6).shadowSize).toBe(2048);
  expect(qualityProfile(1).dust).toBeLessThan(qualityProfile(1.6).dust);
});
it("correr usa una zancada y rodillas distintas de caminar y conserva la defensa", () => {
  const p = character(),
    r = p.userData.rig as Rig;
  animateCharacter(p, 0.2, true, 0, false, 0, false);
  const walking = r.leftLeg.rotation.x;
  animateCharacter(p, 0.2, true, 0, false, 0, true);
  expect(r.leftLeg.rotation.x).not.toBe(walking);
  expect(r.leftKnee.rotation.x + r.rightKnee.rotation.x).toBeGreaterThan(0);
  animateCharacter(p, 0.2, false, 0, true);
  expect(r.leftArm.rotation.x).toBe(-1.2);
});

it("el perfil bajo limita 1080p a un máximo interno de 576p incluso con pantalla HiDPI", () => {
  const scale = renderScale(1920, 1080, 2, 1);
  expect(1920 * 1080 * scale * scale).toBeLessThanOrEqual(1024 * 576 + 1);
  expect(renderScale(1280, 720, 1, 1.3)).toBe(1);
});

it("las sombras se reutilizan en reposo y se actualizan al cambiar la pose", async () => {
  const { ShadowBudget } = await import("../src/render/shadow-budget");
  const b = new ShadowBudget(1.3),
    l = new T.SpotLight();
  l.castShadow = true;
  expect(b.apply(l, 0)).toBe(true);
  expect(b.apply(l, 40)).toBe(false);
  b.mark(true);
  expect(b.apply(l, 40)).toBe(true);
  b.mark(true);
  expect(b.apply(l, 50)).toBe(false);
  expect(b.apply(l, 73)).toBe(true);
});

it("la corrección no termina dentro de una columna cercana al personaje", () => {
  const c = new CinematicCamera(),
    camera = new T.PerspectiveCamera();
  c.update(camera, 0, 5, 0, 0, false, [
    { x: -0.2, z: 5.8, w: 0.3, d: 0.4, height: 3 },
  ]);
  expect(c.corrected).toBe(true);
  expect(camera.position.z).toBeLessThan(5.5);
});

it("la cabeza del protagonista mantiene proporciones adultas respecto al cuerpo", () => {
  const p = character(),
    r = p.userData.rig as Rig;
  p.updateMatrixWorld(true);
  const body = new T.Box3().setFromObject(p).getSize(new T.Vector3()),
    head = new T.Box3().setFromObject(r.head).getSize(new T.Vector3());
  expect(body.y / head.y).toBeGreaterThan(6.5);
});
