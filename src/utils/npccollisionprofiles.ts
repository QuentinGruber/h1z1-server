import { readFileSync } from "node:fs";
import { join } from "node:path";
export interface CollisionProfile {
  walkSpeedLimit?: number;
  species: string;
  bounds: number[];
  radius: number;
  height: number;
  mass: number;
  resistance: number;
}
export interface ImpactParameters {
  parkedDelayMs: number;
  worldCollisionWindowMs: number;
  minimumSpeed: number;
  maximumSpeed: number;
  maximumSampleSeconds: number;
  maximumClockSkewSeconds: number;
  npcDamagePerJoule: number;
  vehicleDamagePerJoule: number;
  rotationStepRadians: number;
}
const data: {
  version: number;
  npcs: Record<string, CollisionProfile>;
  vehicles: Record<string, CollisionProfile>;
  impact: ImpactParameters;
} = JSON.parse(
  readFileSync(
    process.env.NPC_COLLISION_PROFILES_PATH ??
      join(__dirname, "../../data/2016/npcCollisionProfiles.json"),
    "utf8"
  )
);
if (data.version !== 1 || !data.npcs?.default || !data.vehicles || !data.impact)
  throw Error("Unsupported NPC collision profiles");
for (const p of [
  ...Object.values(data.npcs),
  ...Object.values(data.vehicles)
]) {
  if (
    p.bounds.length !== 6 ||
    !p.bounds.every(Number.isFinite) ||
    p.bounds.slice(0, 3).some((v, k) => v >= p.bounds[k + 3]) ||
    ![p.radius, p.height, p.mass, p.resistance].every(
      (v) => Number.isFinite(v) && v > 0
    )
  )
    throw Error("Invalid NPC collision profile");
  if (
    p.walkSpeedLimit !== undefined &&
    (!Number.isFinite(p.walkSpeedLimit) || p.walkSpeedLimit <= 0)
  )
    throw Error("Invalid locomotion speed limit");
  Object.freeze(p.bounds);
  Object.freeze(p);
}
for (const value of [
  data.impact.minimumSpeed,
  data.impact.maximumSpeed,
  data.impact.maximumSampleSeconds,
  data.impact.maximumClockSkewSeconds,
  data.impact.npcDamagePerJoule,
  data.impact.vehicleDamagePerJoule,
  data.impact.rotationStepRadians,
  data.impact.parkedDelayMs,
  data.impact.worldCollisionWindowMs
])
  if (!Number.isFinite(value) || value <= 0)
    throw Error("Invalid impact parameters");
if (
  data.impact.rotationStepRadians < Math.PI / 1800 ||
  data.impact.rotationStepRadians > Math.PI / 4
)
  throw Error("Rotation step must be between 0.1 and 45 degrees");
export const impactParameters = Object.freeze(data.impact);
export const npcNavigationClearance = Math.max(
  ...Object.values(data.npcs).map((p) => p.radius)
);
export function npcCollisionProfile(actorModelId: number): CollisionProfile {
  return data.npcs[actorModelId] ?? data.npcs.default;
}
export function vehicleCollisionProfile(
  actorModelId: number
): CollisionProfile | undefined {
  return data.vehicles[actorModelId];
}
