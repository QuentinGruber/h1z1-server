const debug = require("debug")("h1emu:src:utils:npcmotiontrace");
import type { NavManager } from "./recast";
import type { Npc } from "../servers/ZoneServer2016/entities/npc";
import type { Vector3 } from "recast-navigation";

/** Temporary frame-correlated trace; never changes movement or selects ground. */
export class NpcMotionTrace {
  private until =
    process.env.NPC_MOTION_TRACE === "1" ? Date.now() + 600000 : 0;
  private previous = new Map<string, { position: number[]; time: number }>();
  private frame = 0;
  private lastLog = 0;
  private started = 0;
  private previousFrameTime = 0;
  private frameDeltaSeconds = 0;
  private selected = new Map<
    string,
    { observerCount: number; sample: object }
  >();

  begin() {
    if (Date.now() >= this.until) return;
    this.frame++;
    const now = Date.now();
    this.frameDeltaSeconds = this.previousFrameTime
      ? (now - this.previousFrameTime) / 1000
      : 0;
    this.previousFrameTime = now;
    this.started = performance.now();
    this.selected.clear();
  }

  observe(
    npc: Npc,
    nav: Vector3,
    packetSent: boolean,
    manager: NavManager,
    observerCount = 0
  ) {
    const now = Date.now();
    if (now >= this.until) return;
    const p = Array.from(npc.state.position.slice(0, 3));
    const old = this.previous.get(npc.characterId);
    this.previous.set(npc.characterId, { position: p, time: now });
    if (!old || now - this.lastLog < 1000) return;
    const dy = p[1] - old.position[1];
    const horizontal = Math.hypot(
      p[0] - old.position[0],
      p[2] - old.position[2]
    );
    const role =
      dy > 0
        ? "uphill"
        : dy < 0
          ? "downhill"
          : horizontal === 0
            ? "stationary"
            : "level";
    const selected = this.selected.get(role);
    // Prefer visible NPCs, while retaining distant flat-ground controls.
    if (selected && selected.observerCount >= observerCount) return;
    const ground = manager.sampleNpcGround(nav);
    const terrain = manager.terrain?.getSurface(nav.x, nav.z);
    if (
      role === "stationary" &&
      Math.hypot(ground.slopeX, ground.slopeZ) > 1e-6
    )
      return;
    this.selected.set(role, {
      observerCount,
      sample: {
        role,
        observerCount,
        characterId: npc.characterId,
        position: p,
        previous: old.position,
        dt: (now - old.time) / 1000,
        terrainY: terrain?.height ?? null,
        roadY: manager.roads?.getSample(nav.x, nav.z)?.height ?? null,
        navmeshY: nav.y,
        selectedSurface: ground.surface,
        targetY: ground.height,
        finalY: p[1],
        observedVerticalSpeed: dy / ((now - old.time) / 1000),
        packetSubmitted: packetSent,
        packetSent: packetSent && npc.lastMovementRecipients > 0,
        recipients: packetSent ? npc.lastMovementRecipients : 0,
        packetTime: packetSent ? npc.lastMovementPacketTime : null,
        motion: packetSent ? npc.groundMotionDiagnostics : null
      }
    });
  }

  end(manager: NavManager) {
    const now = Date.now();
    if (now >= this.until || now - this.lastLog < 1000) return;
    this.lastLog = now;
    // Read-only diagnostic access to the pinned Recast accumulator.
    const crowd = manager.crowd as unknown as { accumulator?: number };
    debug(
      "[NPC-MOTION-FRAME] " +
        JSON.stringify({
          frame: this.frame,
          time: now,
          durationMs: performance.now() - this.started,
          frameDeltaSeconds: this.frameDeltaSeconds,
          crowdTiming: manager.lastCrowdTiming ?? null,
          crowdBacklogSeconds: crowd.accumulator ?? null,
          samples: [...this.selected.values()].map((entry) => entry.sample)
        })
    );
    // Bound diagnostic state even if entities are continuously respawned.
    if (this.previous.size > 4000) this.previous.clear();
  }
}
