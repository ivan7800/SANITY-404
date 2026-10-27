import * as T from "three";
import { qualityProfile } from "./quality";
import { lateChapterForRoom } from "../systems/late-chapters";
export function lightScene(scene: T.Scene, quality: number, room = 0) {
  const p = qualityProfile(quality);
  const late = lateChapterForRoom(room);
  const roman = room === 8 || room === 11 || room === 12;
  const medieval = room === 9 || room === 10;
  const coast = room === 13 || room === 14;
  const stars = room === 15 || room === 16;
  const quarry = room === 17 || room === 18;
  const hospital = room === 19 || room === 20;
  const moon = new T.DirectionalLight(
    late
      ? late.colors[1]
      : roman
        ? 0xe9b778
        : quarry
          ? 0xa9b4a0
          : hospital
            ? 0xa7c5b0
            : stars
              ? 0x9ba8d0
              : coast
                ? 0x97b9b9
                : medieval
                  ? 0xa8b8af
                  : room === 0
                    ? 0x9aadc8
                    : 0x91b7ed,
    late
      ? 1.28
      : roman
        ? 1.3
        : quarry
          ? 1.25
          : hospital
            ? 1.22
            : stars
              ? 1.18
              : coast
                ? 1.2
                : medieval
                  ? 1.45
                  : room === 0
                    ? 1.15
                    : 1.7,
  );
  moon.position.set(
    roman ? -5 : medieval ? -8 : -7,
    roman ? 6 : 5,
    roman ? -5 : -1,
  );
  scene.add(moon);
  const key = new T.SpotLight(
    late
      ? late.colors[1]
      : roman
        ? 0xffb76b
        : quarry
          ? 0xd4bc91
          : hospital
            ? 0xd8c293
            : stars
              ? 0xc9bfaa
              : coast
                ? 0xb7d0bd
                : medieval
                  ? 0xffc69a
                  : room === 0
                    ? 0xf1b77e
                    : 0xffc58b,
    room === 0
      ? quality === 1
        ? 84
        : 76
      : roman
        ? quality === 1
          ? 102
          : 94
        : quality === 1
          ? 115
          : 105,
    22,
    Math.PI * 0.38,
    0.75,
    1.4,
  );
  key.position.set(
    room === 0 ? -1.2 : roman ? -2 : medieval ? 1.5 : 0,
    room === 0 ? 5.25 : 4.75,
    room === 0 ? 1.4 : roman ? -1 : 2,
  );
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
    roman
      ? 0xff9b4e
      : quarry
        ? 0x8e9b80
        : hospital
          ? 0x8cae97
          : stars
            ? 0x889cb8
            : coast
              ? 0x799da1
              : medieval
                ? 0xe5ae83
                : room === 0
                  ? 0x9cafc7
                  : 0xffd2a0,
    room === 0 ? 3.8 : quality === 1 ? 7 : 5,
    room === 0 ? 12 : 11,
    2,
  );
  fill.position.set(
    room === 0 ? 2.8 : 0,
    room === 0 ? 3.3 : 2.5,
    room === 0 ? -4.5 : 4,
  );
  scene.add(fill);
  scene.add(key, key.target);
  return key;
}
