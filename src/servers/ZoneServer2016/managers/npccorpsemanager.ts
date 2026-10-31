const debug = require("debug")("h1emu:src:servers:ZoneServer2016:managers:npccorpsemanager");
import type { ZoneServer2016 } from "../zoneserver";
import type { Npc } from "../entities/npc";
import type { ZoneClient2016 } from "../classes/zoneclient";
import type { BoxObstacle } from "recast-navigation";
import {
  CollisionBox,
  makeBox,
  sweepBoxes,
  boxPenetrationDepth
} from "../../../utils/collisiongeometry";
import { npcCollisionProfile } from "../../../utils/npccollisionprofiles";
import {
  corpseBounds,
  placeImpactCorpse,
  VehicleDeathImpact
} from "../../../utils/npccorpseplacement";
import { eul2quat, getCurrentServerTimeWrapper } from "../../../utils/utils";

export class NpcCorpseManager {
  private timers = new Map<string, ReturnType<typeof setTimeout>>();
  private corpses = new Map<string, Npc>();
  private reportedDrift = new Set<string>();
  private traces = new Map<
    string,
    {
      ordinal: number;
      until: number;
      overlap?: string;
      poseSeen?: boolean;
      received?: Set<string>;
    }
  >();
  private readonly settleMs = Number(
    process.env.NPC_CORPSE_SETTLE_TIMEOUT_MS ?? 5000
  );
  constructor(
    private server: ZoneServer2016,
    private vehicles: () => {
      body: CollisionBox;
      vehicleId?: string;
      obstacleRef?: BoxObstacle["ref"];
    }[]
  ) {
    if (
      !Number.isFinite(this.settleMs) ||
      this.settleMs <= 0 ||
      this.settleMs > 60000
    )
      throw Error("NPC_CORPSE_SETTLE_TIMEOUT_MS must be in (0,60000]");
  }
  remove(id: string) {
    const timer = this.timers.get(id);
    if (timer) clearTimeout(timer);
    this.timers.delete(id);
    this.corpses.delete(id);
    this.reportedDrift.delete(id);
    this.traces.delete(id);
  }
  private trace(npc: Npc, event: string, details: object = {}) {
    if (process.env.NPC_COLLISION_DIAGNOSTICS !== "1") return;
    const trace = this.traces.get(npc.characterId);
    if (!trace) return;
    debug(
      "[NPC-CORPSE-TRACE] " +
        JSON.stringify({
          characterId: npc.characterId,
          event,
          ordinal: ++trace.ordinal,
          time: Date.now(),
          serverPosition: Array.from(npc.state.position),
          clientVisibleOverlap: "unobserved; requires client test",
          ...details
        })
    );
  }
  packetQueued(npc: Npc, packet: string, client: ZoneClient2016) {
    this.trace(npc, "packet-queued", {
      packet,
      recipient: client.character.characterId,
      transport: "Reliable; queue order does not prove client application order"
    });
  }
  packetReceived(
    npc: Npc,
    client: ZoneClient2016,
    packet: string,
    flag: number | undefined,
    root: unknown
  ) {
    const trace = this.traces.get(npc.characterId);
    // Log the first inbound packet of each type; do not flood on every pose.
    if (!trace) return;
    trace.received ??= new Set();
    if (trace.received.has(packet)) return;
    trace.received.add(packet);
    const reported = root as ArrayLike<number> | undefined;
    const rootError =
      reported &&
      reported.length >= 3 &&
      [0, 1, 2].every((k) => Number.isFinite(reported[k]))
        ? Math.hypot(
            ...[0, 1, 2].map((k) => reported[k] - npc.state.position[k])
          )
        : undefined;
    this.trace(npc, "client-packet-received", {
      packet,
      gatewayChannel: flag,
      sender: client.character.characterId,
      authorizedManager: npc.vehicleImpactCorpse?.managerId,
      reportedRoot: root,
      reportedRootError: rootError,
      evidence: "reported root only; rendered body overlap is unknown"
    });
  }
  /** Bounded diagnostics only: never moves a corpse or a vehicle. */
  observeVehicles() {
    if (!this.traces.size) return;
    const now = Date.now(),
      vehicles = this.vehicles();
    for (const [id, trace] of this.traces) {
      if (now > trace.until) {
        this.traces.delete(id);
        continue;
      }
      const npc = this.corpses.get(id);
      if (!npc) continue;
      const body = makeBox(
        corpseBounds(npcCollisionProfile(npc.actorModelId)),
        npc.state.position
      );
      const overlaps = vehicles.flatMap((v) => {
        const depth = boxPenetrationDepth(body, v.body);
        return depth === null ? [] : [{ vehicleId: v.vehicleId, depth }];
      });
      const signature = JSON.stringify(overlaps.map((v) => v.vehicleId));
      if (trace.overlap !== signature) {
        trace.overlap = signature;
        this.trace(npc, "server-overlap-transition", { overlaps });
      }
    }
  }
  private queries(npc: Npc) {
    const nav = this.server.navManager,
      vehicles = this.vehicles();
    const excluded = new Set(
      vehicles.map((v) => v.obstacleRef).filter((r) => r !== undefined)
    );
    const blocked = vehicles.map((v) => v.body);
    for (const o of nav.tilecache?.obstacles?.values() ?? []) {
      if (excluded.has(o.ref)) continue;
      if (o.type === "box")
        blocked.push(
          makeBox(
            [
              -o.halfExtents.x,
              -o.halfExtents.y,
              -o.halfExtents.z,
              o.halfExtents.x,
              o.halfExtents.y,
              o.halfExtents.z
            ],
            [o.position.x, o.position.y, o.position.z],
            o.angle
          )
        );
      else
        blocked.push(
          makeBox(
            [-o.radius, 0, -o.radius, o.radius, o.height, o.radius],
            [o.position.x, o.position.y, o.position.z]
          )
        );
    }
    for (const other of this.corpses.values())
      if (other !== npc && other.vehicleImpactCorpse)
        blocked.push(
          makeBox(
            corpseBounds(npcCollisionProfile(other.actorModelId)),
            other.state.position
          )
        );
    return {
      blocked,
      ground: (x: number, z: number) => {
        const sample = nav.sampleNpcGround({ x, y: npc.state.position[1], z });
        return sample.valid && sample.surface !== "navmesh"
          ? sample.height
          : null;
      },
      traversable: (from: Float32Array, to: Float32Array) => {
        const query = nav.navMeshQuery;
        const options = { halfExtents: { x: 0.01, y: 1000, z: 0.01 } };
        const a = query.findNearestPoly(
          { x: from[0], y: from[1], z: from[2] },
          options
        );
        const b = query.findNearestPoly(
          { x: to[0], y: to[1], z: to[2] },
          options
        );
        if (
          !a.success ||
          !a.nearestRef ||
          !b.success ||
          !b.nearestRef ||
          Math.hypot(b.nearestPoint.x - to[0], b.nearestPoint.z - to[2]) > 0.01
        )
          return false;
        const ray = query.raycast(a.nearestRef, a.nearestPoint, b.nearestPoint);
        return ray.success && ray.t >= 1;
      }
    };
  }
  private reindex(npc: Npc) {
    for (const cell of this.server._grid ?? []) {
      const index = cell.objects.indexOf(npc);
      if (index >= 0) {
        cell.objects.splice(index, 1);
        cell.lastModified = Date.now();
      }
    }
    this.server.pushToGridCell?.(npc);
  }
  onDeath(npc: Npc, impact?: VehicleDeathImpact) {
    if (!impact) return;
    const nav = this.server.navManager;
    // A just-moved parked car may still be carved into the old mesh until
    // the next timer. Commit its queued removal before validating the death
    // position; do not advance the crowd or change any living route target.
    if (nav.obstaclesRequestsPending) {
      let upToDate = false;
      while (!upToDate) ({ upToDate } = nav.tilecache.update(nav.navmesh));
      nav.obstaclesRequestsPending = 0;
    }
    const placement = placeImpactCorpse(
      npcCollisionProfile(npc.actorModelId),
      impact,
      this.queries(npc)
    );
    const observers = [
      ...(this.server._entityObservers.get(npc.characterId) ?? [])
    ].filter((c) => !c.isLoading);
    const manager =
      observers.find((c) => c.character.characterId === impact.source) ??
      observers[0];
    npc.vehicleImpactCorpse = {
      position: (placement.position ?? npc.state.position).slice(),
      managerId: manager?.character.characterId,
      settled: false,
      impact
    };
    if (!placement.position)
      console.error(
        "[NPC-CORPSE] No validated separation candidate; retaining existing position",
        npc.characterId
      );
    npc.state.position = npc.vehicleImpactCorpse.position.slice();
    this.reindex(npc);
    this.corpses.set(npc.characterId, npc);
    if (process.env.NPC_COLLISION_DIAGNOSTICS === "1") {
      this.traces.set(npc.characterId, {
        ordinal: 0,
        until: Date.now() + 10000
      });
      const originalBody = makeBox(
        npcCollisionProfile(npc.actorModelId).bounds,
        impact.original,
        npc.state.yaw
      );
      this.trace(npc, "fatal-impact", {
        vehicleId: impact.vehicleId,
        species: npcCollisionProfile(npc.actorModelId).species,
        preImpact: Array.from(impact.original),
        contact: impact.contact,
        contactKind: "NPC support point on swept contact normal",
        timeOfImpact: impact.timeOfImpact,
        vehiclePose: impact.vehiclePose,
        velocity: impact.velocity,
        speed: impact.speed,
        endpointPenetration: boxPenetrationDepth(
          originalBody,
          impact.segments.at(-1)![0]
        ),
        selectedPosition: Array.from(npc.state.position),
        placement
      });
      this.observeVehicles();
    }
    // Queue zero-velocity position BEFORE death/ragdoll packets. Reliable
    // ordering alone does not prove when the client applies the transform.
    this.sendAnchor(npc);
    this.sendDeathTransform(npc);
    if (process.env.NPC_COLLISION_DIAGNOSTICS === "1")
      debug(
        "[NPC-CORPSE] " +
          JSON.stringify({
            characterId: npc.characterId,
            vehicle: impact.vehicleId,
            species: npcCollisionProfile(npc.actorModelId).species,
            contact: impact.contact,
            normal: impact.normal,
            velocity: impact.velocity,
            speed: impact.speed,
            timeOfImpact: impact.timeOfImpact,
            original: Array.from(impact.original),
            corpse: Array.from(npc.state.position),
            placement,
            managerId: npc.vehicleImpactCorpse.managerId
          })
      );
    const timer = setTimeout(() => {
      if (this.server._npcs[npc.characterId] === npc && !npc.isAlive)
        this.settle(npc);
      this.timers.delete(npc.characterId);
    }, this.settleMs);
    timer.unref();
    this.timers.set(npc.characterId, timer);
  }
  private sendAnchor(npc: Npc, client?: ZoneClient2016) {
    const payload = {
      transientId: npc.transientId,
      positionUpdate: {
        sequenceTime: getCurrentServerTimeWrapper().getTruncatedU32(),
        position: npc.state.position.slice(),
        stance: 1 | 1024 | 64,
        horizontalSpeed: 0,
        verticalSpeed: 0,
        orientation: npc.state.yaw ?? 0
      }
    };
    if (client) this.server.sendData(client, "PlayerUpdatePosition", payload);
    else
      this.server.sendDataToAllWithSpawnedEntity(
        this.server._npcs,
        npc.characterId,
        "PlayerUpdatePosition",
        payload
      );
    this.trace(npc, "anchor-queued", {
      packet: "PlayerUpdatePosition",
      sequenceTime: payload.positionUpdate.sequenceTime,
      recipient: client?.character.characterId ?? "ready observers",
      horizontalSpeed: 0,
      verticalSpeed: 0
    });
  }
  /** 2016 native ClientUpdate handler applies this transform synchronously,
   * unlike a timestamped movement sample. Run before StartMultiStateDeath,
   * while the client's entity still has its living physics representation. */
  private sendDeathTransform(npc: Npc, client?: ZoneClient2016) {
    const rotation = Number.isFinite(npc.state.yaw)
      ? eul2quat(new Float32Array([npc.state.yaw!, 0, 0]))
      : (npc.state.rotation?.slice() ?? new Float32Array([0, 0, 0, 1]));
    const payload = {
      characterId: npc.characterId,
      position: new Float32Array([
        npc.state.position[0],
        npc.state.position[1],
        npc.state.position[2],
        1
      ]),
      rotation,
      // Native handler tests this flag before applying the root transform.
      unknownBoolean1: true,
      unknownByte1: 0
    };
    if (client)
      this.server.sendData(
        client,
        "ClientUpdate.UpdateManagedLocation",
        payload
      );
    else
      this.server.sendDataToAllWithSpawnedEntity(
        this.server._npcs,
        npc.characterId,
        "ClientUpdate.UpdateManagedLocation",
        payload
      );
    this.trace(npc, "death-transform-queued", {
      packet: "ClientUpdate.UpdateManagedLocation",
      recipient: client?.character.characterId ?? "ready observers",
      position: Array.from(payload.position),
      rotation: Array.from(rotation),
      applyTransform: true
    });
  }
  private rotation(value: unknown): number[] | undefined {
    if (!Array.isArray(value) && !ArrayBuffer.isView(value)) return;
    const v = value as ArrayLike<number>;
    if (v.length !== 4) return;
    const result = Array.from(v);
    return result.every((x) => Number.isFinite(x) && Math.abs(x) <= 2 * Math.PI)
      ? result
      : undefined;
  }
  onPose(npc: Npc, client: ZoneClient2016, update: unknown): boolean {
    const state = npc.vehicleImpactCorpse;
    if (
      !state ||
      state.settled ||
      npc.isAlive ||
      client.character.characterId !== state.managerId ||
      !this.server._entityObservers.get(npc.characterId)?.has(client) ||
      !update ||
      typeof update !== "object"
    )
      return false;
    const input = update as Record<string, unknown>;
    const trace = this.traces.get(npc.characterId);
    if (trace && !trace.poseSeen) {
      trace.poseSeen = true;
      this.trace(npc, "authorized-client-pose", {
        reportedRoot: input.position,
        evidence:
          "client-reported root; not a measurement of rendered ragdoll limbs"
      });
    }
    const positionUpdate: { [key: string]: unknown } = {
      sequenceTime: getCurrentServerTimeWrapper().getTruncatedU32(),
      position: state.position.slice(),
      horizontalSpeed: 0,
      verticalSpeed: 0
    };
    const rotation = this.rotation(input.rotationRaw);
    if (rotation) positionUpdate.rotationRaw = rotation;
    for (const key of ["orientation", "frontTilt", "sideTilt"])
      if (
        typeof input[key] === "number" &&
        Number.isFinite(input[key]) &&
        Math.abs(input[key]) <= 2 * Math.PI
      )
        positionUpdate[key] = input[key];
    const payload = { characterId: npc.characterId, positionUpdate };
    this.server.sendDataToAllOthersWithSpawnedEntity(
      this.server._npcs,
      client,
      npc.characterId,
      "Ragdoll.UpdatePose",
      payload
    );
    const incoming = input.position as ArrayLike<number> | undefined;
    if (
      incoming &&
      incoming.length >= 3 &&
      Math.hypot(
        ...[0, 1, 2].map((k) => Number(incoming[k]) - state.position[k])
      ) > 0.01
    ) {
      this.server.sendData(client, "Ragdoll.UpdatePose", payload);
      if (
        process.env.NPC_COLLISION_DIAGNOSTICS === "1" &&
        !this.reportedDrift.has(npc.characterId)
      ) {
        this.reportedDrift.add(npc.characterId);
        debug(
          "[NPC-CORPSE-POSE] " +
            JSON.stringify({
              characterId: npc.characterId,
              reported: Array.from(incoming).slice(0, 3),
              anchor: Array.from(state.position.slice(0, 3)),
              corrected: true
            })
        );
      }
    }
    return true;
  }
  settle(npc: Npc, client?: ZoneClient2016, rotation?: unknown): boolean {
    const state = npc.vehicleImpactCorpse;
    if (!state || npc.isAlive || this.server._npcs[npc.characterId] !== npc)
      return false;
    if (
      client &&
      (client.character.characterId !== state.managerId ||
        !this.server._entityObservers.get(npc.characterId)?.has(client))
    )
      return false;
    if (state.settled) return true;
    this.trace(npc, "settle-request", {
      source: client ? "authorized-client" : "watchdog",
      poseReceived: this.traces.get(npc.characterId)?.poseSeen ?? false
    });
    if (client) {
      const validRotation = this.rotation(rotation);
      if (validRotation) npc.state.rotation = new Float32Array(validRotation);
    }
    const queries = this.queries(npc);
    const bounds = corpseBounds(npcCollisionProfile(npc.actorModelId));
    const body = makeBox(bounds, state.position);
    // A car may have turned or stopped since the fatal packet. Revalidate
    // before settling, without following the car's translation each tick.
    if (queries.blocked.some((b) => sweepContact(body, b))) {
      const placement = placeImpactCorpse(
        npcCollisionProfile(npc.actorModelId),
        { ...state.impact, original: state.position.slice() },
        queries
      );
      if (placement.position) {
        state.position = placement.position;
        npc.state.position = placement.position.slice();
        this.reindex(npc);
      } else
        console.error(
          "[NPC-CORPSE] Settling separation unavailable",
          npc.characterId
        );
    }
    state.settled = true;
    const timer = this.timers.get(npc.characterId);
    if (timer) clearTimeout(timer);
    this.timers.delete(npc.characterId);
    this.sendAnchor(npc);
    this.server.sendDataToAllWithSpawnedEntity(
      this.server._npcs,
      npc.characterId,
      "Ragdoll.Stop",
      {
        characterId: npc.characterId,
        position: Array.from(npc.state.position.slice(0, 3)),
        rotation: Array.from(npc.state.rotation ?? [0, 0, 0, 1])
      }
    );
    this.trace(npc, "ragdoll-stop-queued", {
      packet: "Ragdoll.Stop",
      position: Array.from(npc.state.position)
    });
    this.observeVehicles();
    return true;
  }
  onFullData(npc: Npc, client: ZoneClient2016) {
    if (!npc.vehicleImpactCorpse || npc.isAlive) return;
    this.sendAnchor(npc, client);
    this.sendDeathTransform(npc, client);
    this.server.sendData(client, "Character.StartMultiStateDeath", {
      data: {
        characterId: npc.characterId,
        flag:
          !npc.vehicleImpactCorpse.settled && npc.vehicleImpactCorpse.managerId
            ? 128
            : 0,
        managerCharacterId: npc.vehicleImpactCorpse.managerId
      }
    });
    if (!npc.vehicleImpactCorpse.settled && npc.vehicleImpactCorpse.managerId)
      this.server.sendData(client, "Character.ManagedObject", {
        objectCharacterId: npc.characterId,
        characterId: npc.vehicleImpactCorpse.managerId
      });
    if (npc.vehicleImpactCorpse.settled)
      this.server.sendData(client, "Ragdoll.Stop", {
        characterId: npc.characterId,
        position: Array.from(npc.state.position.slice(0, 3)),
        rotation: Array.from(npc.state.rotation ?? [0, 0, 0, 1])
      });
  }
}
const sweepContact = (a: CollisionBox, b: CollisionBox) =>
  sweepBoxes(a, a, b) !== null;
