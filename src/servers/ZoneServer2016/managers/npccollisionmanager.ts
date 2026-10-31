const debug = require("debug")("h1emu:src:servers:ZoneServer2016:managers:npccollisionmanager");
import type { ZoneServer2016 } from "../zoneserver";
import type { Vehicle2016 } from "../entities/vehicle";
import type { Npc } from "../entities/npc";
import { NpcCorpseManager } from "./npccorpsemanager";
import type { VehicleDeathImpact } from "../../../utils/npccorpseplacement";
import type { BoxObstacle, CrowdAgent, Vector3 } from "recast-navigation";
import {
  npcCollisionProfile,
  vehicleCollisionProfile,
  impactParameters as rules,
  CollisionProfile,
  npcNavigationClearance
} from "../../../utils/npccollisionprofiles";
import {
  makeBox,
  sweepBoxes,
  dot,
  Vec
} from "../../../utils/collisiongeometry";

interface Pose {
  position: Float32Array;
  yaw: number;
  pitch: number;
  roll: number;
  time: number;
  sequenceTime?: number;
}
interface VehicleCollisionState {
  managerId?: string;
  sequenceAnchor?: { receipt: number; sequence: number };
  pose: Pose;
  movedAt: number;
  obstacle?: BoxObstacle;
  markers: CrowdAgent[];
  contacts: Set<string>;
  speed?: number;
  loss?: { energy: number; time: number };
  lastNpcImpact?: number;
}
/** Shared creature collision/damage service. Never chooses a terrain height. */
export class NpcCollisionManager {
  readonly corpses: NpcCorpseManager;
  private vehicles = new Map<string, VehicleCollisionState>();
  private npcNav = new Map<string, Vector3>();
  private npcGrid = new Map<string, Npc[]>();
  readonly metrics = {
    impacts: 0,
    blockedNpcMoves: 0,
    rejectedVehicleMoves: 0
  };
  constructor(private server: ZoneServer2016) {
    this.corpses = new NpcCorpseManager(server, () =>
      Object.values(server._vehicles).flatMap((v) => {
        const p = vehicleCollisionProfile(v.actorModelId);
        if (!p) return [];
        const state = this.vehicles.get(v.characterId);
        return [
          {
            vehicleId: v.characterId,
            body: this.box(p, state?.pose ?? this.pose(v)),
            obstacleRef: state?.obstacle?.ref
          }
        ];
      })
    );
  }
  onNpcDeath(npc: Npc, impact?: VehicleDeathImpact) {
    this.npcNav.delete(npc.characterId);
    for (const vehicle of this.vehicles.values())
      vehicle.contacts.delete(npc.characterId);
    this.corpses.onDeath(npc, impact);
  }
  private pose(vehicle: Vehicle2016, time = Date.now()): Pose {
    const q = vehicle.state.rotation;
    const yaw =
      vehicle.positionUpdate.orientation ??
      Math.atan2(
        2 * (q[3] * q[1] + q[0] * q[2]),
        1 - 2 * (q[1] * q[1] + q[2] * q[2])
      );
    return {
      position: vehicle.state.position.slice(),
      yaw,
      pitch: vehicle.positionUpdate.frontTilt ?? 0,
      roll: vehicle.positionUpdate.sideTilt ?? 0,
      time
    };
  }
  private box(p: CollisionProfile, s: Pose) {
    return makeBox(p.bounds, s.position, s.yaw, s.pitch, s.roll);
  }
  sync() {
    this.corpses.observeVehicles();
    const now = Date.now(),
      nav = this.server.navManager;
    this.npcGrid.clear();
    for (const npc of Object.values(this.server._npcs)) {
      if (!npc.isAlive) continue;
      const r = npcCollisionProfile(npc.actorModelId).radius,
        p = npc.state.position;
      for (
        let x = Math.floor((p[0] - r) / 16);
        x <= Math.floor((p[0] + r) / 16);
        x++
      )
        for (
          let z = Math.floor((p[2] - r) / 16);
          z <= Math.floor((p[2] + r) / 16);
          z++
        ) {
          const key = `${x},${z}`,
            list = this.npcGrid.get(key) ?? [];
          list.push(npc);
          this.npcGrid.set(key, list);
        }
    }
    for (const [id] of this.vehicles)
      if (!this.server._vehicles[id] || this.server._vehicles[id].isDestroyed)
        this.remove(id);
    for (const id of this.npcNav.keys())
      if (!this.server._npcs[id]?.isAlive) this.npcNav.delete(id);
    for (const vehicle of Object.values(this.server._vehicles)) {
      const p = vehicleCollisionProfile(vehicle.actorModelId);
      if (!p || vehicle.isDestroyed) continue;
      let state = this.vehicles.get(vehicle.characterId);
      if (!state) {
        state = {
          pose: this.pose(vehicle, now),
          movedAt: 0,
          markers: [],
          contacts: new Set()
        };
        this.vehicles.set(vehicle.characterId, state);
      }
      // Server teleports are rebaselined here, never interpreted as an impact.
      if (
        vehicle.state.position.some(
          (v, k) => k < 3 && v !== state!.pose.position[k]
        )
      ) {
        this.clearObstacle(state);
        state.pose = this.pose(vehicle, now);
        state.movedAt = now;
        state.contacts.clear();
      }
      const box = this.box(p, state.pose),
        length = p.bounds[5] - p.bounds[2],
        width = p.bounds[3] - p.bounds[0];
      if (state.obstacle) {
        for (const marker of state.markers) nav.crowd.removeAgent(marker);
        state.markers.length = 0;
        continue;
      }
      const count = Math.ceil(length / width);
      // Several local avoidance circles cover the vehicle, instead of one
      // undersized circle or a huge circle that blocks an entire road.
      for (let i = 0; i < count; i++) {
        const along = -length / 2 + (length * (i + 0.5)) / count;
        const center = {
          x: box.center[0] + box.axes[2][0] * along,
          y: box.center[1],
          z: box.center[2] + box.axes[2][2] * along
        };
        if (!state.markers[i])
          state.markers[i] = nav.createPassiveAgent(
            new Float32Array([center.x, center.y, center.z, 0]),
            Math.hypot(width / 2, length / count / 2)
          );
        else state.markers[i].teleport(center);
      }
      if (!state.obstacle && now - state.movedAt >= rules.parkedDelayMs) {
        // Vertical envelope of the pitched/rolled geometry; yaw footprint is
        // conservative on slopes. This obstacle is removed on any movement.
        const floor = nav.getClosestNavPointVec3(state.pose.position).y;
        const bottom = Math.min(floor, box.center[1] - box.half[1]),
          top =
            box.center[1] +
            box.half[1] +
            Math.abs(Math.sin(state.pose.pitch)) * box.rootRadius;
        const half = {
          x:
            box.half[0] +
            Math.abs(Math.sin(state.pose.roll)) * box.rootRadius +
            npcNavigationClearance,
          y: (top - bottom) / 2,
          z:
            box.half[2] +
            Math.abs(Math.sin(state.pose.pitch)) * box.rootRadius +
            npcNavigationClearance
        };
        state.obstacle =
          nav.addObstacle(
            new Float32Array([
              box.center[0],
              (bottom + top) / 2,
              box.center[2],
              0
            ]),
            half,
            state.pose.yaw
          ) ?? undefined;
      }
    }
  }
  private clearObstacle(s: VehicleCollisionState) {
    if (s.obstacle) {
      this.server.navManager.removeObstacle(s.obstacle);
      s.obstacle = undefined;
    }
  }
  remove(id: string) {
    this.corpses.remove(id);
    this.npcNav.delete(id);
    const s = this.vehicles.get(id);
    if (!s) return;
    this.clearObstacle(s);
    for (const marker of s.markers)
      this.server.navManager.crowd.removeAgent(marker);
    this.vehicles.delete(id);
  }
  private candidates(start: Pose, end: Pose, p: CollisionProfile) {
    const result = new Set<Npc>(),
      r = p.radius;
    for (
      let x = Math.floor(
        (Math.min(start.position[0], end.position[0]) - r) / 16
      );
      x <= Math.floor((Math.max(start.position[0], end.position[0]) + r) / 16);
      x++
    )
      for (
        let z = Math.floor(
          (Math.min(start.position[2], end.position[2]) - r) / 16
        );
        z <=
        Math.floor((Math.max(start.position[2], end.position[2]) + r) / 16);
        z++
      )
        for (const npc of this.npcGrid.get(`${x},${z}`) ?? []) result.add(npc);
    return result;
  }
  /** Called only for an authenticated manager's accepted movement, not collision packets. */
  moveVehicle(
    vehicle: Vehicle2016,
    position: Float32Array,
    yaw: number,
    pitch: number,
    roll: number,
    now = Date.now(),
    sequenceTime?: number,
    managerId?: string
  ): boolean {
    if (
      vehicle.isDestroyed ||
      ![...position.slice(0, 3), yaw, pitch, roll].every(Number.isFinite)
    ) {
      this.metrics.rejectedVehicleMoves++;
      return false;
    }
    if (
      sequenceTime !== undefined &&
      (!Number.isInteger(sequenceTime) ||
        sequenceTime < 0 ||
        sequenceTime > 0xffffffff)
    ) {
      this.metrics.rejectedVehicleMoves++;
      return false;
    }
    const p = vehicleCollisionProfile(vehicle.actorModelId);
    if (!p) return true;
    yaw = Math.atan2(Math.sin(yaw), Math.cos(yaw));
    pitch = Math.atan2(Math.sin(pitch), Math.cos(pitch));
    roll = Math.atan2(Math.sin(roll), Math.cos(roll));
    const state = this.vehicles.get(vehicle.characterId);
    if (!state) {
      this.vehicles.set(vehicle.characterId, {
        pose: {
          position: position.slice(),
          yaw,
          pitch,
          roll,
          time: now,
          sequenceTime
        },
        movedAt: now,
        markers: [],
        contacts: new Set()
      });
      return true;
    }
    const old = state.pose;
    if (managerId !== undefined && state.managerId !== managerId) {
      state.managerId = managerId;
      state.sequenceAnchor = undefined;
      old.sequenceTime = undefined;
    }
    const arrivalDt = (now - old.time) / 1000;
    let dt = arrivalDt;
    if (
      sequenceTime !== undefined &&
      Number.isInteger(sequenceTime) &&
      sequenceTime >= 0 &&
      sequenceTime <= 0xffffffff &&
      old.sequenceTime !== undefined
    ) {
      const ticks = (sequenceTime - old.sequenceTime) >>> 0;
      if (ticks > 0x7fffffff) {
        this.metrics.rejectedVehicleMoves++;
        return false;
      }
      const packetDt = ticks / 1000;
      // SOE can deliver a burst after a stall. Use monotonic packet spacing
      // only within a bounded server-arrival clock window, never packet speed.
      const anchor = state.sequenceAnchor;
      const clockPlausible =
        !anchor ||
        Math.abs(
          ((sequenceTime - anchor.sequence) >>> 0) / 1000 -
            (now - anchor.receipt) / 1000
        ) <= rules.maximumClockSkewSeconds;
      if (
        clockPlausible &&
        packetDt > 0 &&
        packetDt <= rules.maximumSampleSeconds &&
        Math.abs(packetDt - arrivalDt) <= rules.maximumClockSkewSeconds
      )
        dt = packetDt;
    }
    const delta = position.slice(0, 3).map((v, k) => v - old.position[k]);
    const distance = Math.hypot(...delta);
    if (dt <= 0) {
      if (distance > 0) {
        this.metrics.rejectedVehicleMoves++;
        return false;
      }
      if (yaw !== old.yaw || pitch !== old.pitch || roll !== old.roll) {
        this.clearObstacle(state);
        state.pose = {
          position: position.slice(),
          yaw,
          pitch,
          roll,
          time: now
        };
        state.movedAt = now;
      }
      return true;
    }
    const speed = distance / dt;
    if (speed > rules.maximumSpeed) {
      this.metrics.rejectedVehicleMoves++;
      return false;
    }
    if (sequenceTime !== undefined && !state.sequenceAnchor)
      state.sequenceAnchor = { receipt: now, sequence: sequenceTime };
    const loss =
      0.5 * p.mass * Math.max(0, (state.speed ?? 0) ** 2 - speed ** 2);
    state.speed = speed;
    if (loss > 0) state.loss = { energy: loss, time: now };
    const next: Pose = {
      position: position.slice(),
      yaw,
      pitch,
      roll,
      time: now,
      sequenceTime
    };
    const angle = Math.atan2(Math.sin(yaw - old.yaw), Math.cos(yaw - old.yaw));
    const pitchAngle = Math.atan2(
      Math.sin(pitch - old.pitch),
      Math.cos(pitch - old.pitch)
    );
    const rollAngle = Math.atan2(
      Math.sin(roll - old.roll),
      Math.cos(roll - old.roll)
    );
    const rotation = Math.max(
      Math.abs(angle),
      Math.abs(pitchAngle),
      Math.abs(rollAngle)
    );
    if (distance > 0 || rotation > 0) {
      this.clearObstacle(state);
      state.movedAt = now;
    }
    state.pose = next;
    if (dt > rules.maximumSampleSeconds) {
      state.contacts.clear();
      return true;
    }
    const endBox = this.box(p, next);
    const previousContacts = new Set(state.contacts);
    const release = () => {
      for (const id of state.contacts) {
        const npc = this.server._npcs[id];
        if (
          !npc?.isAlive ||
          !sweepBoxes(
            endBox,
            endBox,
            makeBox(
              npcCollisionProfile(npc.actorModelId).bounds,
              npc.state.position,
              npc.state.yaw
            )
          )
        )
          state.contacts.delete(id);
      }
    };
    if (speed <= rules.minimumSpeed) {
      release();
      return true;
    }
    const steps = Math.max(1, Math.ceil(rotation / rules.rotationStepRadians));
    const poseAt = (t: number): Pose => ({
      position: new Float32Array(
        old.position.map((v, k) => v + (position[k] - v) * t)
      ),
      yaw: old.yaw + angle * t,
      pitch: old.pitch + pitchAngle * t,
      roll: old.roll + rollAngle * t,
      time: now
    });
    for (const npc of this.candidates(old, next, p)) {
      if (this.server._npcs[npc.characterId] !== npc) continue;
      if (!npc.isAlive || previousContacts.has(npc.characterId)) continue;
      const n = npcCollisionProfile(npc.actorModelId),
        body = makeBox(n.bounds, npc.state.position, npc.state.yaw);
      let hit: ReturnType<typeof sweepBoxes> = null;
      let globalHitTime = 0;
      for (let step = 0; step < steps && !hit; step++) {
        hit = sweepBoxes(
          this.box(p, poseAt(step / steps)),
          this.box(p, poseAt((step + 1) / steps)),
          body
        );
        if (hit) globalHitTime = (step + hit.time) / steps;
      }
      if (!hit) continue;
      const motion = npc.groundMotionDiagnostics;
      const npcVelocity: Vec =
        motion && motion.dt > 0
          ? [
              (npc.state.position[0] - motion.previous[0]) / motion.dt,
              motion.rawVerticalSpeed,
              (npc.state.position[2] - motion.previous[2]) / motion.dt
            ]
          : [0, 0, 0];
      const closing = Math.max(
        0,
        -dot(
          Array.from(delta).map((v, k) => v / dt - npcVelocity[k]) as Vec,
          hit.normal
        )
      );
      if (closing <= rules.minimumSpeed) continue;
      state.contacts.add(npc.characterId);
      state.lastNpcImpact = now;
      const reducedMass = (p.mass * n.mass) / (p.mass + n.mass),
        energy = 0.5 * reducedMass * closing * closing;
      const driver = vehicle.getDriver(this.server),
        source = driver?.characterId ?? vehicle.characterId;
      const npcDamage = (energy * rules.npcDamagePerJoule) / n.resistance;
      let fatalImpact: VehicleDeathImpact | undefined;
      if (npcDamage >= npc.health) {
        const segments: [
          ReturnType<typeof makeBox>,
          ReturnType<typeof makeBox>
        ][] = [];
        for (let step = 0; step < steps; step++)
          segments.push([
            this.box(p, poseAt(step / steps)),
            this.box(p, poseAt((step + 1) / steps))
          ]);
        const horizontal = Math.hypot(delta[0], delta[2]);
        const forward: Vec =
          horizontal > 0
            ? [delta[0] / horizontal, 0, delta[2] / horizontal]
            : [0, 0, 0];
        const length =
          2 *
          endBox.half.reduce(
            (r, h, k) => r + h * Math.abs(dot(endBox.axes[k], forward)),
            0
          );
        const future = {
          ...next,
          position: new Float32Array(
            next.position.map((v, k) => (k < 3 ? v + forward[k] * length : v))
          )
        };
        segments.push([endBox, this.box(p, future)]);
        const support = body.half.reduce(
          (r, h, k) => r + h * Math.abs(dot(body.axes[k], hit!.normal)),
          0
        );
        fatalImpact = {
          vehicleId: vehicle.characterId,
          source,
          original: npc.state.position.slice(),
          normal: [...hit.normal],
          velocity: Array.from(delta).map((v) => v / dt) as Vec,
          speed,
          contact: body.center.map(
            (v, k) => v + hit!.normal[k] * support
          ) as Vec,
          timeOfImpact: globalHitTime,
          vehiclePose: {
            previous: Array.from(old.position),
            current: Array.from(next.position),
            heading: next.yaw,
            pitch: next.pitch,
            roll: next.roll
          },
          segments
        };
      }
      // damage() marks deaths synchronously before awaiting anything, so one
      // sweep through many creatures cannot duplicate kills or loot.
      void npc
        .damage(
          this.server,
          {
            entity: source,
            damage: npcDamage
          },
          fatalImpact
        )
        .catch((error) =>
          console.error(
            "[NPC-IMPACT] Damage processing failed",
            npc.characterId,
            error
          )
        );
      vehicle.damage(this.server, {
        entity: source,
        damage: energy * rules.vehicleDamagePerJoule * n.resistance
      });
      if (npc.isAlive) npc.playAnimation("Flinch");
      if (process.env.NPC_COLLISION_DIAGNOSTICS === "1")
        debug(
          "[NPC-IMPACT] " +
            JSON.stringify({
              vehicle: vehicle.characterId,
              npc: npc.characterId,
              species: n.species,
              source,
              speed,
              closingSpeed: closing,
              npcDamage: (energy * rules.npcDamagePerJoule) / n.resistance,
              vehicleDamage:
                energy * rules.vehicleDamagePerJoule * n.resistance,
              normal: hit.normal,
              health: npc.health,
              groundY: npc.state.position[1]
            })
        );
      this.metrics.impacts++;
      if (vehicle.isDestroyed) break;
    }
    release();
    return true;
  }
  /** Legacy world-collision packets are hints only. Consume a recent measured
   * kinetic-energy loss once, never a client-provided damage amount. */
  worldCollision(vehicle: Vehicle2016, now = Date.now()) {
    const state = this.vehicles.get(vehicle.characterId);
    if (
      !state?.loss ||
      now - state.loss.time > rules.worldCollisionWindowMs ||
      now - (state.lastNpcImpact ?? -Infinity) < rules.worldCollisionWindowMs
    )
      return;
    const energy = state.loss.energy;
    state.loss = undefined;
    vehicle.damage(this.server, {
      entity:
        vehicle.getDriver(this.server)?.characterId ?? vehicle.characterId,
      damage: energy * rules.vehicleDamagePerJoule
    });
  }
  /** Guard publication against penetrating a vehicle while tile-cache/crowd
   * avoidance is catching up. Roll back only a newly blocked horizontal step. */
  constrain(npc: Npc, proposed: Vector3): Vector3 {
    const previous = this.npcNav.get(npc.characterId);
    if (previous && previous.x === proposed.x && previous.z === proposed.z) {
      this.npcNav.set(npc.characterId, { ...proposed });
      return proposed;
    }
    const n = npcCollisionProfile(npc.actorModelId);
    if (previous) {
      const ground = this.server.navManager.npcNavToGame(proposed);
      const start = makeBox(n.bounds, npc.state.position, npc.state.yaw),
        end = makeBox(n.bounds, ground, npc.state.yaw);
      for (const [id, s] of this.vehicles) {
        const v = this.server._vehicles[id],
          p = v && vehicleCollisionProfile(v.actorModelId);
        if (!p || v.isDestroyed) continue;
        if (
          Math.hypot(
            proposed.x - s.pose.position[0],
            proposed.z - s.pose.position[2]
          ) >
          n.radius +
            p.radius +
            Math.hypot(proposed.x - previous.x, proposed.z - previous.z)
        )
          continue;
        const body = this.box(p, s.pose),
          hit = sweepBoxes(start, end, body);
        if (!hit) continue;
        // Let a contacted creature escape an overlapping moving vehicle.
        if (
          sweepBoxes(start, start, body) &&
          Math.hypot(...end.center.map((x, k) => x - body.center[k])) >
            Math.hypot(...start.center.map((x, k) => x - body.center[k]))
        )
          continue;
        const target = npc.navAgent?.corners().length
          ? npc.navAgent.target()
          : undefined;
        npc.navAgent?.teleport(previous);
        if (target) npc.navAgent?.requestMoveTarget(target);
        this.metrics.blockedNpcMoves++;
        return { ...previous };
      }
    }
    this.npcNav.set(npc.characterId, { ...proposed });
    return proposed;
  }
}
