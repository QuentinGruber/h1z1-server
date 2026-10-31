const debug = require("debug")("h1emu:src:utils:npcgrounddiagnostics");
import type { Vector3 } from "recast-navigation";
import type { NavMeshQuery } from "recast-navigation";
import type { TerrainHeight } from "./terrainheight";
import type { RoadSurfaces } from "./roadsurfaces";
import type { NpcGroundMotion } from "./npcgroundmotion";

/** Optional, time-limited diagnostics. Regions are configuration, never movement rules. */
export class NpcGroundDiagnostics {
  private regions: { x: number; y?: number; z: number; radius: number }[] = [];
  private until = 0;
  private last = new Map<string, number>();
  private window = 0;
  private count = 0;

  constructor(configuration = process.env.NPC_GROUND_DIAGNOSTICS) {
    if (!configuration) return;
    try {
      const regions = JSON.parse(configuration);
      if (
        !Array.isArray(regions) ||
        !regions.every(
          (r) =>
            Number.isFinite(r.x) &&
            Number.isFinite(r.z) &&
            Number.isFinite(r.radius) &&
            r.radius > 0
        )
      )
        throw new Error("Expected an array of {x,z,radius}");
      this.regions = regions;
      this.until = Date.now() + 10 * 60 * 1000;
      debug(
        `[NPC-GROUND] Temporary diagnostics enabled for ${regions.length} regions; expires in 10 minutes`
      );
    } catch (error) {
      console.error(
        "[NPC-GROUND] Invalid diagnostic configuration; diagnostics disabled",
        error
      );
    }
  }

  reportReferences(
    terrain: TerrainHeight | undefined,
    query: NavMeshQuery,
    roads?: RoadSurfaces
  ) {
    if (!this.until) return;
    for (const region of this.regions) {
      const sample = terrain?.inspectHeight(region.x, region.z);
      const nearest = query.findNearestPoly(
        { x: region.x, y: region.y ?? sample?.height ?? 0, z: region.z },
        { halfExtents: { x: 0.01, y: 1000, z: 0.01 } }
      );
      debug(
        "[NPC-GROUND-REFERENCE] " +
          JSON.stringify({
            input: region,
            sample,
            navmesh:
              nearest.success && nearest.nearestRef
                ? nearest.nearestPoint
                : null,
            npc: null,
            roadCollision: roads?.getSample(region.x, region.z) ?? null
          })
      );
    }
  }

  trace(
    characterId: string,
    position: Float32Array,
    nav: Vector3,
    terrain?: TerrainHeight,
    roads?: RoadSurfaces,
    motion?: ReturnType<NpcGroundMotion["update"]> & {
      packetVerticalSpeed: number;
      horizontalSpeed: number;
    }
  ) {
    if (!this.until || Date.now() >= this.until) return;
    const region = this.regions.findIndex(
      (r) => Math.hypot(nav.x - r.x, nav.z - r.z) <= r.radius
    );
    if (region < 0) return;
    const now = Date.now();
    if (now - (this.last.get(characterId) ?? 0) < 2000) return;
    if (now - this.window >= 1000) {
      this.window = now;
      this.count = 0;
    }
    if (this.count >= 10) return;
    if (this.last.size >= 2000) this.last.clear();
    this.last.set(characterId, now);
    this.count++;
    const sample = terrain?.inspectHeight(nav.x, nav.z);
    debug(
      "[NPC-GROUND] " +
        JSON.stringify({
          characterId,
          region,
          npc: Array.from(position.slice(0, 3)),
          navmesh: nav,
          groundY: sample?.height ?? null,
          selectedTerrain: sample?.selected ?? null,
          terrainTiles: sample?.tiles ?? [],
          failedHeightQuery: !sample || sample.failedQuery,
          roadCollision: roads?.getSample(nav.x, nav.z) ?? null,
          consecutivePrevious: motion?.previous ?? null,
          updateDeltaSeconds: motion?.dt ?? null,
          selectedSurface: motion?.selectedSurface ?? null,
          finalY: position[1],
          motion: motion ?? null
        })
    );
  }
}
