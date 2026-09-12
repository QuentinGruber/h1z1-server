import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

type Route = {
  instance?: number;
  instanceIndex?: number;
  label?: string;
  start: [number, number, number];
  end: [number, number, number];
};

function samePosition(
  left: [number, number, number],
  right: [number, number, number]
): boolean {
  return left.every((value, index) => Math.abs(value - right[index]) < 0.001);
}

function chainedRoutes(routes: Route[]): Route[] {
  const byInstance = new Map<number, Route[]>();
  for (const route of routes) {
    const instance = routeInstance(route);
    const instanceRoutes = byInstance.get(instance) ?? [];
    instanceRoutes.push(route);
    byInstance.set(instance, instanceRoutes);
  }

  const chains: Route[] = [];
  for (const [instance, instanceRoutes] of byInstance) {
    for (const exterior of instanceRoutes) {
      const match = exterior.label?.match(/^(.*) exterior to threshold$/);
      if (!match) continue;
      const entrance = match[1];
      const inward = instanceRoutes.find(
        (route) =>
          route.label === `${entrance} threshold to interior` &&
          samePosition(exterior.end, route.start)
      );
      const outward = instanceRoutes.find(
        (route) =>
          route.label === `${entrance} interior to threshold` &&
          inward &&
          samePosition(inward.end, route.start)
      );
      const thresholdToExterior = instanceRoutes.find(
        (route) =>
          route.label === `${entrance} threshold to exterior` &&
          outward &&
          samePosition(outward.end, route.start)
      );
      if (inward) {
        chains.push({
          instanceIndex: instance,
          label: `${entrance} exterior to interior chain`,
          start: exterior.start,
          end: inward.end
        });
      }
      if (outward && thresholdToExterior) {
        chains.push({
          instanceIndex: instance,
          label: `${entrance} interior to exterior chain`,
          start: outward.start,
          end: thresholdToExterior.end
        });
      }
    }
  }
  return chains;
}

type Point = { x: number; y: number; z: number };

function option(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function distance(left: Point, right: Point): number {
  return Math.hypot(left.x - right.x, left.y - right.y, left.z - right.z);
}

function gamePosition(position: [number, number, number]): Float32Array {
  return new Float32Array([position[0], position[1], position[2], 1]);
}

function routeInstance(route: Route): number {
  const instance = route.instance ?? route.instanceIndex;
  if (!Number.isInteger(instance))
    throw new Error("route has no instance index");
  return instance!;
}

const cacheDirectory = process.argv[2];
const routesPath = process.argv[3];
const transitionsPath = option("--transitions");
const runtime64Root = option("--runtime64-root");
const reportPath = option("--report");
const includeChains = process.argv.includes("--include-chains");
const selectedInstances = new Set(
  (option("--instances") ?? "").split(",").filter(Boolean).map(Number)
);
const maximumSteps = Number(option("--steps") ?? 600);
const stepSeconds = Number(option("--step-seconds") ?? 0.05);
const tolerance = Number(option("--tolerance") ?? 0.65);

if (!cacheDirectory || !routesPath) {
  throw new Error(
    "Usage: npx tsx scripts/validateModelCrowdRoutes.ts <cache-dir> <routes.json> [--transitions file] [--runtime64-root directory] [--instances 1,2] [--include-chains] [--steps 600] [--step-seconds 0.05] [--tolerance 0.65] [--report file]"
  );
}
if (
  !Number.isInteger(maximumSteps) ||
  maximumSteps <= 0 ||
  !Number.isFinite(stepSeconds) ||
  stepSeconds <= 0 ||
  !Number.isFinite(tolerance) ||
  tolerance <= 0
) {
  throw new Error("invalid crowd validation limits");
}
if ([...selectedInstances].some((instance) => !Number.isInteger(instance))) {
  throw new Error("--instances must contain comma-separated integers");
}

process.env.NAV_STREAMING = "1";
process.env.NAV_CACHE_DIR = resolve(cacheDirectory);
process.env.NAV_TRANSITIONS = "1";
if (transitionsPath) {
  process.env.NAV_TRANSITIONS_PATH = resolve(transitionsPath);
}
if (runtime64Root) {
  const root = resolve(runtime64Root);
  process.env.NAV_MONOLITHIC_64 = "1";
  process.env.NAV_64_CORE_MODULE = join(root, "core.mjs");
  process.env.NAV_64_WASM_MODULE = join(root, "wasm-compat.mjs");
}

async function main() {
  const allRoutes = JSON.parse(
    readFileSync(resolve(routesPath), "utf8")
  ) as Route[];
  const candidateRoutes = includeChains
    ? [...allRoutes, ...chainedRoutes(allRoutes)]
    : allRoutes;
  const routes = candidateRoutes.filter(
    (route) =>
      selectedInstances.size === 0 ||
      selectedInstances.has(routeInstance(route))
  );
  if (routes.length === 0) throw new Error("no routes selected");

  const { NavManager } = await import("../src/utils/recast");
  const nav = new NavManager();
  await nav.loadNav();

  const realDateNow = Date.now;
  let simulatedNow = realDateNow();
  Date.now = () => simulatedNow;
  const results: Array<Record<string, unknown>> = [];
  try {
    for (const route of routes) {
      const instanceIndex = routeInstance(route);
      const start = gamePosition(route.start);
      const target = gamePosition(route.end);
      const startPoint = nav.getClosestNavPointVec3(start);
      const targetPoint = nav.getClosestNavPointVec3(target);
      if (!startPoint || !targetPoint) {
        results.push({
          instanceIndex,
          label: route.label ?? "unnamed route",
          passed: false,
          failure: "route endpoint did not snap"
        });
        continue;
      }
      const agent = nav.createAgent(start);
      if (!agent) {
        results.push({
          instanceIndex,
          label: route.label ?? "unnamed route",
          passed: false,
          failure: "crowd agent could not be created"
        });
        continue;
      }

      const accepted = agent.requestMoveTarget(targetPoint);
      let previous = agent.position();
      let closestDistance = distance(previous, targetPoint);
      let finalDistance = closestDistance;
      let stationarySteps = 0;
      let walkingSteps = 0;
      let offMeshSteps = 0;
      let invalidSteps = 0;
      let steps = 0;

      if (accepted) {
        for (; steps < maximumSteps && finalDistance > tolerance; steps++) {
          simulatedNow += stepSeconds * 1000;
          nav.updt();
          const current = agent.position();
          const state = agent.state();
          if (state === 0) invalidSteps++;
          else if (state === 1) walkingSteps++;
          else if (state === 2) offMeshSteps++;
          stationarySteps =
            distance(previous, current) < 0.001 ? stationarySteps + 1 : 0;
          previous = current;
          finalDistance = distance(current, targetPoint);
          closestDistance = Math.min(closestDistance, finalDistance);
          if (!nav.crowdHealthy || stationarySteps >= 100) break;
        }
      }

      const passed = accepted && nav.crowdHealthy && finalDistance <= tolerance;
      results.push({
        instanceIndex,
        label: route.label ?? "unnamed route",
        passed,
        accepted,
        steps,
        closestDistance: Number(closestDistance.toFixed(3)),
        finalDistance: Number(finalDistance.toFixed(3)),
        finalState: agent.state(),
        walkingSteps,
        offMeshSteps,
        invalidSteps,
        stationarySteps,
        start: startPoint,
        target: targetPoint,
        final: agent.position()
      });
      nav.removeAgent(agent);
    }
  } finally {
    Date.now = realDateNow;
  }

  const passed = results.filter((result) => result.passed).length;
  const report = {
    schemaVersion: 1,
    cacheDirectory: resolve(cacheDirectory),
    routesPath: resolve(routesPath),
    includeChains,
    routes: results.length,
    passed,
    failed: results.length - passed,
    crowdHealthy: nav.crowdHealthy,
    results
  };
  const encoded = `${JSON.stringify(report, null, 2)}\n`;
  if (reportPath) writeFileSync(resolve(reportPath), encoded);
  console.log(encoded);
  if (passed !== results.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
