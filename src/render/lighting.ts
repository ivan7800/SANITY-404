import * as T from "three";
import { qualityProfile } from "./quality";
export function lightScene(scene: T.Scene, quality: number, room = 0) {
  const p = qualityProfile(quality);
  const roman = room === 8;
  const medieval = room === 9 || room === 10;
  const moon = new T.DirectionalLight(
    roman ? 0xe9b778 : medieval ? 0xa8b8af : 0x91b7ed,
    roman ? 1.3 : medieval ? 1.45 : 1.7,
  );
  moon.position.set(-7, 5, -1);
  scene.add(moon);
  const key = new T.SpotLight(
    roman ? 0xffb76b : medieval ? 0xffc69a : 0xffc58b,
    roman ? (quality === 1 ? 102 : 94) : quality === 1 ? 115 : 105,
    22,
    Math.PI * 0.38,
    0.75,
    1.4,
  );
  key.position.set(0, 4.75, 2);
  key.target.position.set(0, 0, -1);
  key.castShadow = p.shadows;
  key.shadow.autoUpdate = false;
  key.shadow.needsUpdate = true;
  key.shadow.mapSize.set(p.shadowSize, p.shadowSize);
  key.shadow.bias = -0.00035;
  key.shadow.normalBias = 0.025;
  key.shadow.radius = 3;
  key.shadow.camera.near = 0.3;
  key.shadow.camera.far = 23;
  const fill = new T.PointLight(
    roman ? 0xff9b4e : medieval ? 0xe5ae83 : 0xffd2a0,
    quality === 1 ? 7 : 5,
    11,
    2,
  );
  fill.position.set(0, 2.5, 4);
  scene.add(fill);
  scene.add(key, key.target);
  return key;
}
