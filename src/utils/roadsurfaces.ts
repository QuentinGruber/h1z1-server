import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
interface Instance {
  actor: string;
  id: number;
  position: number[];
  rotation: number[];
  scale: number[];
}
interface Triangle {
  vertices: number[];
  actor: string;
  instanceId: number;
  triangle: number;
}

/** Original asphalt-road CDTA collision triangles with ZONE instance transforms. */
export class RoadSurfaces {
  private readonly bins = new Map<string, Triangle[]>();
  readonly instanceCount: number;
  constructor(file: string) {
    const data = JSON.parse(gunzipSync(readFileSync(file)).toString("utf8"));
    if (data.version !== 1 || !Array.isArray(data.instances))
      throw new Error("Invalid road data");
    this.instanceCount = data.instances.length;
    for (const instance of data.instances as Instance[]) {
      const model = data.models[instance.actor.toLowerCase()];
      if (!model) throw new Error("Missing road collision model");
      for (const mesh of model.meshes) {
        const vertices: number[][] = [];
        for (let i = 0; i < mesh.vertices.length; i += 3)
          vertices.push(
            this.transform(mesh.vertices.slice(i, i + 3), instance)
          );
        for (let i = 0; i < mesh.indices.length; i += 3) {
          const a = vertices[mesh.indices[i]],
            b = vertices[mesh.indices[i + 1]],
            c = vertices[mesh.indices[i + 2]];
          if (!a || !b || !c) throw new Error("Invalid road triangle");
          const triangle = {
            vertices: [...a, ...b, ...c],
            actor: instance.actor,
            instanceId: instance.id,
            triangle: i / 3
          };
          for (
            let x = Math.floor(Math.min(a[0], b[0], c[0]) / 8);
            x <= Math.floor(Math.max(a[0], b[0], c[0]) / 8);
            x++
          ) {
            for (
              let z = Math.floor(Math.min(a[2], b[2], c[2]) / 8);
              z <= Math.floor(Math.max(a[2], b[2], c[2]) / 8);
              z++
            ) {
              const key = `${x},${z}`,
                list = this.bins.get(key) ?? [];
              list.push(triangle);
              this.bins.set(key, list);
            }
          }
        }
      }
    }
  }
  private transform(p: number[], instance: Instance): number[] {
    const [yaw, pitch, roll] = instance.rotation;
    let [x, y, z] = p.map((v, k) => v * instance.scale[k]);
    [x, y] = [
      Math.cos(roll) * x - Math.sin(roll) * y,
      Math.sin(roll) * x + Math.cos(roll) * y
    ];
    [y, z] = [
      Math.cos(pitch) * y - Math.sin(pitch) * z,
      Math.sin(pitch) * y + Math.cos(pitch) * z
    ];
    [x, z] = [
      Math.cos(yaw) * x + Math.sin(yaw) * z,
      -Math.sin(yaw) * x + Math.cos(yaw) * z
    ];
    return [
      x + instance.position[0],
      y + instance.position[1],
      z + instance.position[2]
    ];
  }
  getSample(x: number, z: number) {
    let selected: {
      height: number;
      actor: string;
      instanceId: number;
      triangle: number;
      slopeX: number;
      slopeZ: number;
    } | null = null;
    for (const t of this.bins.get(
      `${Math.floor(x / 8)},${Math.floor(z / 8)}`
    ) ?? []) {
      const v = t.vertices,
        bx = v[3] - v[0],
        bz = v[5] - v[2],
        cx = v[6] - v[0],
        cz = v[8] - v[2],
        det = bx * cz - bz * cx;
      if (det === 0) continue;
      const u = ((x - v[0]) * cz - (z - v[2]) * cx) / det,
        w = (bx * (z - v[2]) - bz * (x - v[0])) / det;
      if (u < -1e-9 || w < -1e-9 || u + w > 1 + 1e-9) continue;
      const height = v[1] + u * (v[4] - v[1]) + w * (v[7] - v[1]);
      if (!selected || height > selected.height)
        selected = {
          height,
          actor: t.actor,
          instanceId: t.instanceId,
          triangle: t.triangle,
          slopeX: ((v[4] - v[1]) * cz - bz * (v[7] - v[1])) / det,
          slopeZ: (bx * (v[7] - v[1]) - (v[4] - v[1]) * cx) / det
        };
    }
    return selected;
  }
}
