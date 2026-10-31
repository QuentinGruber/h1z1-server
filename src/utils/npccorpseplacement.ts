import {
  CollisionBox,
  Vec,
  makeBox,
  dot,
  sweepBoxes
} from "./collisiongeometry";
import type { CollisionProfile } from "./npccollisionprofiles";

export interface VehicleDeathImpact {
  vehicleId: string;
  source: string;
  original: Float32Array;
  normal: Vec;
  velocity: Vec;
  speed: number;
  contact: Vec;
  timeOfImpact: number;
  segments: [CollisionBox, CollisionBox][];
  vehiclePose?: {
    previous: number[];
    current: number[];
    heading: number;
    pitch: number;
    roll: number;
  };
}
export interface ImpactCorpse {
  position: Float32Array;
  managerId?: string;
  settled: boolean;
  impact: VehicleDeathImpact;
}
/** Enclose the authored body under arbitrary ragdoll root rotation. This is
 * placement clearance, not a change to living collision or ground elevation. */
export function corpseBounds(p: CollisionProfile) {
  const r = Math.hypot(
    ...[0, 1, 2].map((k) =>
      Math.max(Math.abs(p.bounds[k]), Math.abs(p.bounds[k + 3]))
    )
  );
  return [-r, Math.min(0, p.bounds[1]), -r, r, p.bounds[4], r];
}
const projection = (b: CollisionBox, d: Vec) =>
  b.half.reduce((sum, h, k) => sum + h * Math.abs(dot(b.axes[k], d)), 0);
const angular = (a: CollisionBox, b: CollisionBox) =>
  a.rootRadius *
  Math.max(
    ...a.axes.map((d, k) =>
      Math.acos(Math.max(-1, Math.min(1, dot(d, b.axes[k]))))
    )
  );
export interface CorpsePlacementQueries {
  ground(x: number, z: number): number | null;
  traversable(from: Float32Array, to: Float32Array): boolean;
  blocked: CollisionBox[];
}
/** Find the shortest validated, packet-representable exit from the impact
 * sweep and one vehicle-length of anticipated forward travel. No Y offsets. */
export function placeImpactCorpse(
  profile: CollisionProfile,
  impact: VehicleDeathImpact,
  queries: CorpsePlacementQueries
) {
  const bounds = corpseBounds(profile),
    origin = impact.original;
  const body = makeBox(bounds, origin);
  const velocityLength = Math.hypot(impact.velocity[0], impact.velocity[2]);
  const forward: Vec =
    velocityLength > 0
      ? [
          impact.velocity[0] / velocityLength,
          0,
          impact.velocity[2] / velocityLength
        ]
      : [1, 0, 0];
  const normalLength = Math.hypot(impact.normal[0], impact.normal[2]);
  const contact: Vec =
    normalLength > 0
      ? [-impact.normal[0] / normalLength, 0, -impact.normal[2] / normalLength]
      : forward;
  const side: Vec = [-forward[2], 0, forward[0]];
  const directions: Vec[] = [
    contact,
    side,
    side.map((v) => -v) as Vec,
    forward,
    forward.map((v) => -v) as Vec
  ];
  // Search relative to contact/motion, never a special map location.
  for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI) / 8;
    directions.push([
      forward[0] * Math.cos(a) + side[0] * Math.sin(a),
      0,
      forward[2] * Math.cos(a) + side[2] * Math.sin(a)
    ]);
  }
  const start = impact.segments[0][0],
    end = impact.segments.at(-1)![1];
  const limit =
    Math.hypot(...end.center.map((v, k) => v - start.center[k])) +
    2 * (body.rootRadius + start.rootRadius);
  const nearby = queries.blocked.filter(
    (b) =>
      Math.hypot(b.center[0] - body.center[0], b.center[2] - body.center[2]) <=
      limit + b.rootRadius
  );
  let result: Float32Array | null = null,
    best = Infinity,
    failedGroundQueries = 0;
  for (const d of directions) {
    let distance = 0;
    for (const [a, b] of impact.segments) {
      const far =
        Math.max(
          dot(a.center, d) + projection(a, d),
          dot(b.center, d) + projection(b, d)
        ) + angular(a, b);
      distance = Math.max(
        distance,
        far - dot(body.center, d) + projection(body, d)
      );
    }
    const exits = [
      distance,
      ...nearby.map(
        (b) =>
          dot(b.center, d) +
          projection(b, d) -
          dot(body.center, d) +
          projection(body, d)
      )
    ]
      .filter((t) => t >= distance && t <= limit)
      .sort((a, b) => a - b);
    for (const t of exits) {
      if (t > best) break;
      // 2016 position packets quantize to centimetres. Round outward and
      // validate those actual wire coordinates instead of adding a clearance.
      const quantize = (v: number, sign: number) =>
        (sign > 0
          ? Math.ceil(v * 100)
          : sign < 0
            ? Math.floor(v * 100)
            : Math.round(v * 100)) / 100;
      let x = quantize(origin[0] + d[0] * t, d[0]),
        z = quantize(origin[2] + d[2] * t, d[2]);
      for (let rounding = 0; rounding < 4; rounding++) {
        const y = queries.ground(x, z);
        if (y === null || !Number.isFinite(y)) {
          failedGroundQueries++;
          break;
        }
        const p = new Float32Array([x, y, z, 0]);
        // Account for Float32 serialization before accepting the candidate.
        const corpse = makeBox(bounds, p);
        const wire = makeBox(
          bounds,
          Array.from(p.slice(0, 3), (v) => Math.round(v * 100) / 100)
        );
        if (
          impact.segments.some(
            ([a, b]) => sweepBoxes(a, b, corpse) || sweepBoxes(a, b, wire)
          )
        ) {
          x = quantize(x + d[0] * 0.01, d[0]);
          z = quantize(z + d[2] * 0.01, d[2]);
          continue;
        }
        if (
          nearby.some(
            (b) => sweepBoxes(corpse, corpse, b) || sweepBoxes(wire, wire, b)
          )
        )
          break;
        if (!queries.traversable(origin, p)) break;
        // Do not carry a corpse through an intervening construction wall.
        if (
          nearby.some(
            (b) => !sweepBoxes(body, body, b) && sweepBoxes(body, corpse, b)
          )
        )
          break;
        const travel = Math.hypot(p[0] - origin[0], p[2] - origin[2]);
        if (travel < best) {
          best = travel;
          result = p;
        }
        break;
      }
    }
  }
  return {
    position: result,
    distance: Number.isFinite(best) ? best : null,
    failedGroundQueries
  };
}
