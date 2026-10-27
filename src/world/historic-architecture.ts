import * as T from "three";
import { batchRigid } from "../render/batch";
import { pbr } from "../render/materials";

type HistoricRoof =
  "roman" | "abbey" | "coast" | "observatory" | "quarry" | "hospital";

function roofForRoom(room: number): HistoricRoof {
  if ([8, 11, 12].includes(room)) return "roman";
  if ([9, 10].includes(room)) return "abbey";
  if ([13, 14].includes(room)) return "coast";
  if ([15, 16].includes(room)) return "observatory";
  if ([17, 18].includes(room)) return "quarry";
  return "hospital";
}

const palette: Record<HistoricRoof, [number, number]> = {
  roman: [0x776c55, 0xa59673],
  abbey: [0x535d56, 0x899287],
  coast: [0x384a49, 0x746f5b],
  observatory: [0x3d485e, 0x9b987e],
  quarry: [0x545b50, 0x8b8e78],
  hospital: [0x4c5142, 0x8d8069],
};

/** Lightweight period-specific room envelope. Everything is overhead or
 * recessed into the existing wall; the gameplay obstacles remain unchanged. */
export function historicArchitecture(room: number) {
  if (room < 8 || room > 20)
    throw new RangeError(`Sala histórica inválida: ${room}`);
  const style = roofForRoom(room);
  const group = new T.Group();
  group.name = `arquitectura-${style}-${room}`;
  const shell = pbr(
    style === "coast" || style === "hospital" ? "wood" : "stone",
    palette[style][0],
    {
      side: T.DoubleSide,
    },
  );
  const ribs = pbr(
    style === "coast" || style === "hospital" ? "wood" : "stone",
    palette[style][1],
  );
  const trim = pbr("brass", style === "observatory" ? 0xa59469 : 0x81765b, {
    roughness: 0.88,
  });
  const mesh = (geometry: T.BufferGeometry, material: T.Material) => {
    const result = new T.Mesh(geometry, material);
    result.castShadow = false;
    result.receiveShadow = true;
    group.add(result);
    return result;
  };
  const box = (
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    material: T.Material,
  ) => {
    const result = mesh(new T.BoxGeometry(w, h, d), material);
    result.position.set(x, y, z);
    return result;
  };
  const roofY = (x: number, z: number) => {
    const u = Math.abs(x) / 7.5;
    if (style === "roman") return 4.55 + 0.6 * Math.sqrt(1 - u * u);
    if (style === "abbey") return 4.35 + 0.88 * (1 - u);
    if (style === "coast") return 4.36 + 0.7 * (1 - u);
    if (style === "quarry") return 4.5 + 0.14 * Math.sin(x * 0.83 + z * 0.57);
    if (style === "hospital") return 4.38 + 0.73 * (1 - u);
    const radial = Math.min(1, (x * x + z * z) / (9.8 * 9.8));
    return 4.42 + 0.87 * Math.sqrt(1 - radial);
  };

  // Samira's exposed terrace needs open sky. The instrument chamber keeps
  // its own shallow dome; all other rooms receive a period-specific roof.
  if (room !== 15) {
    const across = 24;
    const along = 16;
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];
    for (let iz = 0; iz <= along; iz++) {
      const z = -7.46 + (14.92 * iz) / along;
      for (let ix = 0; ix <= across; ix++) {
        const x = -7.46 + (14.92 * ix) / across;
        positions.push(x, roofY(x, z), z);
        uvs.push(ix / 3, iz / 3);
      }
    }
    for (let iz = 0; iz < along; iz++)
      for (let ix = 0; ix < across; ix++) {
        const a = iz * (across + 1) + ix;
        const b = a + across + 1;
        indices.push(a, b, a + 1, a + 1, b, b + 1);
      }
    const roof = new T.BufferGeometry();
    roof.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
    roof.setAttribute("uv", new T.Float32BufferAttribute(uvs, 2));
    roof.setIndex(indices);
    roof.computeVertexNormals();
    mesh(roof, shell);
  }

  const bayPositions =
    style === "quarry" ? [-5.5, -1.8, 1.8, 5.5] : [-5.8, -2.9, 0, 2.9, 5.8];
  if (room !== 15)
    for (const z of bayPositions) {
      const points: T.Vector3[] = [];
      for (let i = 0; i <= 24; i++) {
        const x = -7.38 + (14.76 * i) / 24;
        points.push(new T.Vector3(x, roofY(x, z) - 0.04, z));
      }
      mesh(
        new T.TubeGeometry(new T.CatmullRomCurve3(points), 24, 0.064, 5, false),
        ribs,
      );
      for (const side of [-1, 1])
        box(side * 7.49, 4.45, z, 0.22, 0.18, 0.4, trim);
    }

  // Side arches echo the existing columns without new floor-level blockers.
  // The terrace uses these as an open parapet silhouette instead of a roof.
  for (const side of [-1, 1])
    for (const z of [-4.25, 0, 4.25]) {
      const points: T.Vector3[] = [];
      for (let i = 0; i <= 12; i++) {
        const a = (Math.PI * i) / 12;
        const pointed =
          style === "abbey" ? Math.pow(Math.sin(a), 1.7) : Math.sin(a);
        points.push(
          new T.Vector3(
            side * 7.65,
            3.55 + pointed * 0.58,
            z - 1.8 * Math.cos(a),
          ),
        );
      }
      mesh(
        new T.TubeGeometry(new T.CatmullRomCurve3(points), 16, 0.06, 5, false),
        ribs,
      );
      box(side * 7.64, 4.13, z, 0.17, 0.15, 0.19, trim);
    }

  // The roof construction is combined per material: two or three draw calls
  // even though its geometry contains several separate ribs and bays.
  return batchRigid(group);
}
