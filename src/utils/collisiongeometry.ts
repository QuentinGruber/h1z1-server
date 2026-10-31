export type Vec = [number, number, number];
export interface CollisionBox {
  center: Vec;
  axes: Vec[];
  half: Vec;
  rootRadius: number;
}
export const dot = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const sub = (a: Vec, b: Vec): Vec => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: Vec, b: Vec): Vec => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0]
];
export function makeBox(
  bounds: number[],
  position: ArrayLike<number>,
  yaw = 0,
  pitch = 0,
  roll = 0
): CollisionBox {
  const rotate = (p: Vec): Vec => {
    let [x, y, z] = p;
    [x, y] = [
      Math.cos(roll) * x - Math.sin(roll) * y,
      Math.sin(roll) * x + Math.cos(roll) * y
    ];
    [y, z] = [
      Math.cos(pitch) * y - Math.sin(pitch) * z,
      Math.sin(pitch) * y + Math.cos(pitch) * z
    ];
    return [
      Math.cos(yaw) * x + Math.sin(yaw) * z,
      y,
      -Math.sin(yaw) * x + Math.cos(yaw) * z
    ];
  };
  const offset = rotate([
    (bounds[0] + bounds[3]) / 2,
    (bounds[1] + bounds[4]) / 2,
    (bounds[2] + bounds[5]) / 2
  ]);
  return {
    center: offset.map((v, k) => v + position[k]) as Vec,
    axes: [rotate([1, 0, 0]), rotate([0, 1, 0]), rotate([0, 0, 1])],
    half: [
      (bounds[3] - bounds[0]) / 2,
      (bounds[4] - bounds[1]) / 2,
      (bounds[5] - bounds[2]) / 2
    ],
    rootRadius: Math.hypot(
      ...[0, 1, 2].map((k) =>
        Math.max(Math.abs(bounds[k]), Math.abs(bounds[k + 3]))
      )
    )
  };
}
const radius = (b: CollisionBox, axis: Vec) =>
  b.half.reduce((r, h, k) => r + h * Math.abs(dot(b.axes[k], axis)), 0);
/** Diagnostic SAT depth only. Does not alter collision response or sweeps. */
export function boxPenetrationDepth(
  a: CollisionBox,
  b: CollisionBox
): number | null {
  let depth = Infinity;
  for (const raw of [
    ...a.axes,
    ...b.axes,
    ...a.axes.flatMap((x) => b.axes.map((y) => cross(x, y)))
  ]) {
    const length = Math.hypot(...raw);
    if (length < 1e-10) continue;
    const axis = raw.map((x) => x / length) as Vec;
    const overlap =
      radius(a, axis) +
      radius(b, axis) -
      Math.abs(dot(sub(a.center, b.center), axis));
    if (overlap < 0) return null;
    depth = Math.min(depth, overlap);
  }
  return depth;
}
/** Continuous SAT: exact for translating OBBs; conservative angular envelope
 * for rotating OBBs. Callers subdivide rotation to limit conservative contact. */
export function sweepBoxes(
  a: CollisionBox,
  endA: CollisionBox,
  b: CollisionBox,
  endB = b
) {
  const axes = [
    ...a.axes,
    ...b.axes,
    ...a.axes.flatMap((x) => b.axes.map((y) => cross(x, y)))
  ];
  const p = sub(a.center, b.center),
    delta = sub(sub(endA.center, a.center), sub(endB.center, b.center));
  const angular = (x: CollisionBox, y: CollisionBox) =>
    x.rootRadius *
    Math.max(
      ...x.axes.map((axis, k) =>
        Math.acos(Math.max(-1, Math.min(1, dot(axis, y.axes[k]))))
      )
    );
  const margin = angular(a, endA) + angular(b, endB);
  let enter = 0,
    exit = 1;
  let normal: Vec = [0, 0, 0];
  for (const raw of axes) {
    const length = Math.hypot(...raw);
    if (length < 1e-10) continue;
    const axis = raw.map((x) => x / length) as Vec;
    const r =
      Math.max(radius(a, axis), radius(endA, axis)) +
      Math.max(radius(b, axis), radius(endB, axis)) +
      margin;
    const start = dot(p, axis),
      velocity = dot(delta, axis);
    if (Math.abs(velocity) < 1e-12) {
      if (Math.abs(start) > r) return null;
      continue;
    }
    let t0 = (-r - start) / velocity,
      t1 = (r - start) / velocity;
    if (t0 > t1) [t0, t1] = [t1, t0];
    if (t0 > enter) {
      enter = t0;
      normal = axis.map(
        (x) => x * (start + velocity * t0 >= 0 ? 1 : -1)
      ) as Vec;
    }
    exit = Math.min(exit, t1);
    if (enter > exit) return null;
  }
  if (exit < 0 || enter > 1) return null;
  if (Math.hypot(...normal) === 0) {
    const n = Math.hypot(...p);
    normal = n > 0 ? (p.map((x) => x / n) as Vec) : [1, 0, 0];
  }
  return { time: Math.max(0, enter), exitTime: exit, normal };
}
