// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2026 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

const debug = require("debug")("h1emu:src:servers:ZoneServer2016:entities:npc");
import { DamageInfo, Sound } from "types/zoneserver";
import { ZoneServer2016 } from "../zoneserver";
import { BaseFullCharacter } from "./basefullcharacter";
import { ZoneClient2016 } from "../classes/zoneclient";
import {
  getCurrentServerTimeWrapper,
  getDistance,
  getDistanceSquared,
  logClientActionToMongo,
  metersToFeet
} from "../../../utils/utils";
import { DB_COLLECTIONS, KILL_TYPE } from "../../../utils/enums";
import {
  Effects,
  Items,
  MeleeTypes,
  NpcIds,
  PositionUpdateType,
  ResourceIds,
  ResourceTypes,
  VehicleIds
} from "../models/enums";
import { CommandInteractionString } from "types/zone2016packets";
import { BaseEntity } from "./baseentity";
import { ChallengeType } from "../managers/challengemanager";
import { ProjectileEntity } from "./projectileentity";
import {
  npcCollisionProfile,
  vehicleCollisionProfile
} from "../../../utils/npccollisionprofiles";
import {
  dot,
  makeBox,
  sweepBoxes,
  Vec
} from "../../../utils/collisiongeometry";
import type {
  ImpactCorpse,
  VehicleDeathImpact
} from "../../../utils/npccorpseplacement";
import { JSM } from "../jsms/jsm";
import { Factions } from "../jsms/factions";
import { spawnGasCloudAt } from "../jsms/gasser.jsm";
import {
  NpcGroundMotion,
  NpcGroundSample
} from "../../../utils/npcgroundmotion";

export abstract class Npc extends BaseFullCharacter {
  health: number;
  npcRenderDistance = 100;

  /** Attach the animation object to the npc itself (used for zombie animations) */
  override get attachedObjectTargetId(): string {
    return this.transientId.toString();
  }

  spawnerId: number;
  deathTime: number = 0;
  vehicleImpactCorpse?: ImpactCorpse;
  npcId: number = 0;
  faction: Factions = Factions.None;
  rewardItems: { itemDefId: number; weight: number }[] = [];
  flags = {
    bit0: 0,
    bit1: 0,
    bit2: 0,
    bit3: 0,
    bit4: 0,
    bit5: 0,
    bit6: 0,
    bit7: 0,
    nonAttackable: 0, // disables melee flinch
    bit9: 0,
    bit10: 0,
    bit11: 0,
    projectileCollision: 1,
    bit13: 0, // causes a crash if 1 with noCollide 1
    bit14: 0,
    bit15: 0,
    bit16: 0,
    bit17: 0,
    bit18: 0,
    bit19: 0,
    noCollide: 0, // determines if NpcCollision packet gets sent on player collide
    knockedOut: 0, // knockedOut = 1 will not show the entity if the value is sent immediatly at 1
    bit22: 0,
    bit23: 0
  };
  public get isAlive(): boolean {
    return this.deathTime == 0;
  }
  server: ZoneServer2016;
  npcMeleeDamage: number = 0;
  fsm?: JSM<string | number>;
  currentAnimation = "";
  lookAtTarget: Float32Array | null = null;
  isSelected: boolean = false;
  variant: string = "";
  private groundMotion?: NpcGroundMotion;
  private packetMoving = false;
  private nextEngineSoundTime = 0;
  private zombieApproachVehicleId?: string;
  lastMovementPacketTime = 0;
  lastMovementRecipients = 0;
  groundMotionDiagnostics?: ReturnType<NpcGroundMotion["update"]> & {
    packetVerticalSpeed: number;
    horizontalSpeed: number;
  };

  constructor(
    characterId: string,
    transientId: number,
    actorModelId: number,
    position: Float32Array,
    rotation: Float32Array,
    server: ZoneServer2016,
    spawnerId: number = 0,
    variant: string = ""
  ) {
    super(characterId, transientId, actorModelId, position, rotation, server);
    this.positionUpdateType = PositionUpdateType.MOVABLE;
    this.spawnerId = spawnerId;
    this.health = 10000;
    this.server = server;
    this.variant = variant;
    if (!process.env.DISABLE_AI && this.server.aiEnabled) {
      this.navAgent = this.server.navManager.createAgent(
        this.state.position,
        npcCollisionProfile(actorModelId)
      );
      // Use the agent's actual spawn X/Z, then intersect the terrain there.
      // Do not move the Detour agent off its own navigation surface.
      this.state.position = this.server.navManager.npcNavToGame(
        this.navAgent.position()
      );
      this.resetGroundMotion();
    }
    server.explosiveManager.addEntity(this);
  }

  protected abstract addLoot(server: ZoneServer2016): void;
  protected abstract onHarvest(
    server: ZoneServer2016,
    client: ZoneClient2016
  ): void;
  protected abstract buildInteractionString(
    server: ZoneServer2016,
    client: ZoneClient2016
  ): void;

  setAnimation(animationName: string) {
    if (this.faction === Factions.ZOMBIE && animationName === "Idle") {
      // Zombie movement controls already select idle at rest. A looping Idle
      // message can outlive this FSM state (including on gassers/exploders).
      this.currentAnimation = "";
      return;
    }
    this.currentAnimation = animationName;
    this.server.sendDataToAllWithSpawnedEntity(
      this.server._npcs,
      this.characterId,
      "Character.PlayAnimation",
      { characterId: this.characterId, animationName }
    );
  }

  setSpeed(speed: number) {
    if (this.navAgent) {
      this.navAgent.maxSpeed = speed;
      this.navAgent.maxAcceleration = speed * 2.0;
    }
  }

  playAnimation(animationName: string) {
    this.server.sendDataToAllWithSpawnedEntity(
      this.server._npcs,
      this.characterId,
      "Character.PlayAnimation",
      { characterId: this.characterId, animationName }
    );
  }

  removeEffectTag(effectId: number) {
    const index = this.effectTags.indexOf(effectId);
    if (index <= -1) return;
    this.effectTags.splice(index, 1);
    this.server.sendDataToAllWithSpawnedEntity(
      this.server._npcs,
      this.characterId,
      "Character.RemoveEffectTagCompositeEffect",
      {
        characterId: this.characterId,
        effectId: effectId,
        newEffectId: 0
      }
    );
  }

  applyDamage(characterId: string) {
    const client = this.server.getClientByCharId(characterId);
    if (client?.isLoading === false) {
      const damageInfo: DamageInfo = {
        entity: this.characterId,
        weapon: Items.WEAPON_MACHETE01,
        damage: this.npcMeleeDamage,
        causeBleed: false, // another method for melees to apply bleeding
        meleeType: MeleeTypes.BLADE,
        hitReport: {
          sessionProjectileCount: 0,
          characterId: client.character.characterId,
          position: client.character.state.position,
          unknownFlag1: 0,
          unknownByte2: 0,
          totalShotCount: 0,
          hitLocation: client.character.meleeHit.abilityHitLocation
        }
      };
      const mountedVehicleId = client.vehicle.mountedVehicle;
      if (mountedVehicleId) {
        const vehicle = this.server._vehicles[mountedVehicleId];
        if (vehicle) {
          vehicle.OnMeleeHit(this.server, damageInfo);
          return;
        }
      }

      client.character.OnMeleeHit(this.server, damageInfo);
      if (this.server.isSurvival() && this.server.infectionEnabled) {
        const virus = client.character._resources[ResourceIds.VIRUS];
        if (virus > 0) {
          client.character.immunity = Math.max(
            0,
            client.character.immunity - 50
          );
        } else {
          client.character._resources[ResourceIds.VIRUS] = 200;
          this.server.updateResource(
            client,
            client.character.characterId,
            200,
            ResourceIds.VIRUS,
            ResourceTypes.VIRUS
          );
        }
      }
    } else {
      console.log(
        `CharacterId ${characterId} not found when applying damage from npc`
      );
    }
  }

  async damage(
    server: ZoneServer2016,
    damageInfo: DamageInfo,
    fatalImpact?: VehicleDeathImpact
  ) {
    if (
      !this.isAlive ||
      !Number.isFinite(damageInfo.damage) ||
      damageInfo.damage <= 0
    )
      return;
    let client = server.getClientByCharId(damageInfo.entity);
    if (!client) {
      const sourceEntity = server.getEntity(damageInfo.entity);
      if (sourceEntity instanceof ProjectileEntity) {
        client = server.getClientByCharId(sourceEntity.managerCharacterId);
      }
    }
    const oldHealth = this.health;

    if ((this.health -= damageInfo.damage) <= 0 && this.isAlive) {
      this.deathTime = Date.now();
      this.flags.knockedOut = 1;
      if (this.navAgent) {
        this.navAgent.resetMoveTarget();
        server.navManager.crowd.removeAgent(this.navAgent);
        this.navAgent = undefined;
      }
      this.packetMoving = false;
      this.groundMotion = undefined;
      // Position separation and zero-speed replication must precede both
      // loot creation and the client-managed death/ragdoll transition.
      try {
        server.npcCollisionManager?.onNpcDeath(this, fatalImpact);
      } catch (error) {
        console.error(
          "[NPC-CORPSE] Death positioning failed",
          this.characterId,
          error
        );
      }

      this.addLoot(server);

      if (client) {
        if (this.npcId === NpcIds.ZOMBIE) {
          server.challengeManager.registerChallengeProgression(
            client,
            ChallengeType.BRAIN_DEAD,
            1
          );
        }
        if (!server._soloMode) {
          logClientActionToMongo(
            server._db.collection(DB_COLLECTIONS.KILLS),
            client,
            server._worldId,
            {
              type:
                this.npcId == NpcIds.ZOMBIE
                  ? KILL_TYPE.ZOMBIE
                  : KILL_TYPE.WILDLIFE
            }
          );
        }

        if (this.npcId == NpcIds.ZOMBIE)
          client.character.metrics.zombiesKilled++;
        else client.character.metrics.wildlifeKilled++;
      }
      const observers = server._entityObservers.get(this.characterId);
      if (observers) {
        for (const c of observers) {
          if (!c.isLoading) {
            server.sendData(c, "Character.StartMultiStateDeath", {
              data: {
                characterId: this.characterId,
                flag: 128,
                managerCharacterId:
                  this.vehicleImpactCorpse?.managerId ?? c.character.characterId
              }
            });
            server.sendData(c, "Character.ManagedObject", {
              objectCharacterId: this.characterId,
              characterId:
                this.vehicleImpactCorpse?.managerId ?? c.character.characterId
            });
            if (this.vehicleImpactCorpse) {
              server.npcCollisionManager?.corpses.packetQueued(
                this,
                "Character.StartMultiStateDeath",
                c
              );
              server.npcCollisionManager?.corpses.packetQueued(
                this,
                "Character.ManagedObject",
                c
              );
            }
          } else {
            server.sendData(c, "Character.StartMultiStateDeath", {
              data: {
                characterId: this.characterId,
                flag: 0
              }
            });
          }
        }
      }
    }

    if (client) {
      const damageRecord = server.generateDamageRecord(
        this.characterId,
        damageInfo,
        oldHealth
      );
      client.character.addCombatlogEntry(damageRecord);
    }

    if (
      !this.isAlive &&
      this.effectTags.includes(Effects.PFX_Char_Zombie_Gasser_Ambient)
    ) {
      const GASSER_DEATH_EXPLOSION_RANGE = 10;
      const GASSER_DEATH_EXPLOSION_DAMAGE = Math.floor(10000 / 3);

      this.removeEffectTag(Effects.PFX_Char_Zombie_Gasser_Ambient);

      for (const character of Object.values(server._characters)) {
        if (!character.isAlive) continue;
        if (
          getDistanceSquared(character.state.position, this.state.position) >
          GASSER_DEATH_EXPLOSION_RANGE * GASSER_DEATH_EXPLOSION_RANGE
        )
          continue;

        character.damage(server, {
          entity: this.characterId,
          damage: GASSER_DEATH_EXPLOSION_DAMAGE
        });
      }

      server.sendCompositeEffectToAllInRange(
        100,
        this.characterId,
        this.state.position,
        Effects.PFX_Char_Zombie_Gasser_ExplosionGasCloud
      );

      // schedule body removal after ragdoll animation completes (~0.1 seconds)
      setTimeout(() => {
        server.deleteEntity(this.characterId, server._npcs);
      }, 100);

      spawnGasCloudAt(server, this.state.position, this.characterId);
    }
  }

  OnFullCharacterDataRequest(server: ZoneServer2016, client: ZoneClient2016) {
    server.sendData(client, "LightweightToFullNpc", this.pGetFull(server));
    server.npcCollisionManager?.corpses.onFullData(this, client);

    if (this.onReadyCallback) {
      this.onReadyCallback(client);
      delete this.onReadyCallback;
    }
  }

  OnExplosiveHit(server: ZoneServer2016, sourceEntity: BaseEntity): void {
    let damage = this.health + this.health / 2;

    const distance = getDistance(
      sourceEntity.state.position,
      this.state.position
    );
    if (distance > 5) return;
    if (distance > 1) damage /= distance;
    this.damage(server, {
      entity: sourceEntity.characterId,
      damage: damage
    });
  }

  OnProjectileHit(server: ZoneServer2016, damageInfo: DamageInfo) {
    if (
      server.isHeadshotOnly &&
      damageInfo.hitReport?.hitLocation != "HEAD" &&
      this.isAlive
    )
      return;
    const client = server.getClientByCharId(damageInfo.entity);
    if (client && this.isAlive) {
      const hasHelmetBefore = this.hasHelmet(server);
      const hasArmorBefore = this.hasArmor(server);
      server.sendHitmarker(
        client,
        damageInfo.hitReport?.hitLocation,
        this.hasHelmet(server),
        this.hasArmor(server),
        hasHelmetBefore,
        hasArmorBefore
      );
    }
    switch (damageInfo.hitReport?.hitLocation) {
      case "HEAD":
      case "GLASSES":
      case "NECK":
        damageInfo.damage *= 4;
        break;
      default:
        break;
    }
    this.damage(server, damageInfo);
  }

  OnMeleeHit(server: ZoneServer2016, damageInfo: DamageInfo) {
    if (!this.isAlive) return; // prevent dead npc despawning from melee dmg
    damageInfo.damage = damageInfo.damage / 1.5;
    this.damage(server, damageInfo);

    const client = server.getClientByCharId(damageInfo.entity);
    if (!client) return;
    const weapon = client.character.getEquippedWeapon();
    if (!weapon) return;

    const durabilityDamage = server.getDurabilityDamage(
      weapon.itemDefinitionId
    );

    server.damageItem(client.character, weapon, durabilityDamage);
  }

  destroy(server: ZoneServer2016): boolean {
    return server.deleteEntity(this.characterId, server._npcs);
  }

  OnPlayerSelect(server: ZoneServer2016, client: ZoneClient2016) {
    // Only one at a time
    if (this.isSelected) {
      return;
    }
    this.isSelected = true;
    // Unlock selection after 5sec
    // It's easier to do it that way that to make a whole sys with the utilizeHudTimer
    setTimeout(() => {
      this.isSelected = false;
    }, 5_100);
    const skinningKnife = client.character.getItemById(Items.SKINNING_KNIFE);
    if (!this.isAlive && skinningKnife) {
      server.utilizeHudTimer(client, this.nameId, 5000, 0, () => {
        this.onHarvest(server, client);
        server.damageItem(client.character, skinningKnife, 200);
        server.deleteEntity(this.characterId, server._npcs);
      });
    }
  }

  triggerAwards(
    server: ZoneServer2016,
    client: ZoneClient2016,
    rewardItems: { itemDefId: number; weight: number }[]
  ) {
    const ranges = [];
    const preRewardedItems: number[] = [];
    let cumulativeWeight = 0;
    for (const reward of rewardItems) {
      const range = {
        start: cumulativeWeight,
        end: cumulativeWeight + reward.weight,
        item: reward
      };
      ranges.push(range);
      cumulativeWeight = range.end;
    }

    const totalWeight = rewardItems.reduce((sum, item) => sum + item.weight, 0);
    let count = 1;

    let selectedRange = ranges[0];
    for (let i = 0; i < rewardItems.length; i++) {
      const randomValue = Math.random() * totalWeight;
      for (const range of ranges) {
        if (randomValue >= range.start && randomValue < range.end) {
          selectedRange = range;
          break; // Break out of the loop once a range is chosen
        }
      }

      if (!preRewardedItems.includes(selectedRange.item.itemDefId)) {
        preRewardedItems.push(selectedRange.item.itemDefId);

        if (
          Math.random() <= 0.4 &&
          selectedRange.item.itemDefId != Items.BRAIN_INFECTED
        ) {
          // 40% chance to spawn double rewards
          count = 2;
        }

        const rewardItem = server.generateItem(
          selectedRange.item.itemDefId,
          count
        );
        if (rewardItem) client.character.lootContainerItem(server, rewardItem);
      }
    }
  }

  OnInteractionString(server: ZoneServer2016, client: ZoneClient2016) {
    if (!this.isAlive && client.character.hasItem(Items.SKINNING_KNIFE)) {
      this.buildInteractionString(server, client);
    }
  }

  sendInteractionString(
    server: ZoneServer2016,
    client: ZoneClient2016,
    stringId: number
  ) {
    server.sendData<CommandInteractionString>(
      client,
      "Command.InteractionString",
      {
        guid: this.characterId,
        stringId: stringId
      }
    );
  }

  stopMovement() {
    if (!this.navAgent) return;
    this.navAgent.resetMoveTarget();
  }

  getZombieSounds(sounds: Sound[]): Sound[] {
    if (
      this.faction !== Factions.ZOMBIE ||
      Date.now() < this.nextEngineSoundTime
    )
      return sounds;
    // Moving vehicles already emit radius=50/agitation=3 engine sounds. An
    // idling engine has no position packets, so refresh that same stimulus at
    // the existing 3s engine-resource cadence, for zombie listeners only.
    this.nextEngineSoundTime = Date.now() + 3000;
    const nearby = Object.values(this.server._vehicles).filter(
      (vehicle) =>
        vehicle.engineOn &&
        !vehicle.isDestroyed &&
        vehicle.vehicleId !== VehicleIds.SPECTATE &&
        Math.hypot(
          vehicle.state.position[0] - this.state.position[0],
          vehicle.state.position[2] - this.state.position[2]
        ) < 50
    );
    if (!nearby.length) return sounds;
    return [
      ...sounds,
      ...nearby.map((vehicle) => ({
        position: vehicle.state.position.slice(),
        radius: 50,
        agitation: 3
      }))
    ];
  }

  /** Mounted prey is reached at the vehicle shell, not its blocked seat center.
   * Reuse collision dimensions read-only; leave navigation/collision response alone. */
  getZombieTargetPosition(characterId: string, position: Float32Array) {
    if (this.faction !== Factions.ZOMBIE) return position;
    const mounted =
      this.server.getClientByCharId(characterId)?.vehicle.mountedVehicle;
    const vehicle = mounted && this.server._vehicles[mounted];
    if (!vehicle || vehicle.isDestroyed) return position;
    const profile = vehicleCollisionProfile(vehicle.actorModelId);
    if (!profile) return position;
    const q = vehicle.state.rotation;
    const yaw =
      vehicle.positionUpdate.orientation ??
      Math.atan2(
        2 * (q[3] * q[1] + q[0] * q[2]),
        1 - 2 * (q[1] * q[1] + q[2] * q[2])
      );
    const body = makeBox(
      profile.bounds,
      vehicle.state.position,
      yaw,
      vehicle.positionUpdate.frontTilt ?? 0,
      vehicle.positionUpdate.sideTilt ?? 0
    );
    const delta = body.center.map((v, k) => this.state.position[k] - v) as Vec;
    const nearest = body.center.slice() as Vec;
    for (let axis = 0; axis < 3; axis++) {
      const projection = Math.max(
        -body.half[axis],
        Math.min(body.half[axis], dot(delta, body.axes[axis]))
      );
      for (let k = 0; k < 3; k++) nearest[k] += projection * body.axes[axis][k];
    }
    return new Float32Array([...nearest, 1]);
  }

  refreshZombieVehicleApproach(targetCharacterId: string) {
    if (this.faction !== Factions.ZOMBIE) return;
    const mounted =
      this.server.getClientByCharId(targetCharacterId)?.vehicle.mountedVehicle;
    this.zombieApproachVehicleId = mounted || undefined;
    if (mounted)
      this.server.npcCollisionManager?.allowZombieVehicleApproach(mounted);
  }

  getZombieVehicleApproachDistance(
    targetCharacterId: string | null,
    meleeRange: number,
    resume = false
  ) {
    if (this.faction !== Factions.ZOMBIE || !targetCharacterId)
      return meleeRange;
    const mounted =
      this.server.getClientByCharId(targetCharacterId)?.vehicle.mountedVehicle;
    const vehicle = mounted && this.server._vehicles[mounted];
    if (!vehicle || vehicle.isDestroyed) return meleeRange;
    const profile = npcCollisionProfile(this.actorModelId);
    // Damage reach is not a standing position. Leave room for the existing
    // humanoid envelope to turn, plus its crowd radius. A pitched car projects
    // farther over a standing NPC at its ends than along its doors.
    const turnRadius = Math.hypot(
      Math.max(Math.abs(profile.bounds[0]), Math.abs(profile.bounds[3])),
      Math.max(Math.abs(profile.bounds[2]), Math.abs(profile.bounds[5]))
    );
    const dx = this.state.position[0] - vehicle.state.position[0];
    const dz = this.state.position[2] - vehicle.state.position[2];
    const distance = Math.hypot(dx, dz);
    const yaw = vehicle.positionUpdate.orientation ?? 0;
    const forward = distance
      ? Math.abs(dx * Math.sin(yaw) + dz * Math.cos(yaw)) / distance
      : 0;
    const side = distance
      ? Math.abs(dx * Math.cos(yaw) - dz * Math.sin(yaw)) / distance
      : 0;
    const lean =
      profile.height *
      (Math.abs(Math.sin(vehicle.positionUpdate.frontTilt ?? 0)) * forward +
        Math.abs(Math.sin(vehicle.positionUpdate.sideTilt ?? 0)) * side);
    return Math.min(
      meleeRange,
      turnRadius + profile.radius + lean + (resume ? profile.radius : 0)
    );
  }

  getZombieNavTarget(position: Float32Array) {
    const point = { x: position[0], y: position[1], z: position[2] };
    const query = this.server.navManager.navMeshQuery;
    const radius = npcCollisionProfile(this.actorModelId).radius;
    // Physical road Y and Detour corridor Y differ. The old 10m-wide 3D
    // lookup could prefer a higher polygon several metres to the side, leaving
    // a chasing zombie stopped at that false goal outside melee range.
    const local = query.findNearestPoly(point, {
      halfExtents: { x: radius, y: 10, z: radius }
    });
    if (local.success && local.nearestRef) return local.nearestPoint;
    // Retain broad projection for genuinely off-mesh targets, but never submit
    // an uninitialised nearestPoint when both queries fail.
    const fallback = query.findNearestPoly(point, {
      halfExtents: { x: 10, y: 10, z: 10 }
    });
    return fallback.success && fallback.nearestRef
      ? fallback.nearestPoint
      : undefined;
  }

  private getZombieFacing(position: Float32Array, orientation: number) {
    const previous = this.state.yaw ?? orientation;
    if (this.faction !== Factions.ZOMBIE || orientation === previous)
      return orientation;
    const profile = npcCollisionProfile(this.actorModelId);
    const proposed = makeBox(profile.bounds, position, orientation);
    // Only the pursued vehicle needs the additional facing check. Avoid a
    // world-wide vehicle scan on every zombie movement/attack update.
    const targets = this.zombieApproachVehicleId
      ? [this.server._vehicles[this.zombieApproachVehicleId]]
      : [];
    for (const vehicle of targets) {
      if (!vehicle) continue;
      const vehicleProfile = vehicleCollisionProfile(vehicle.actorModelId);
      if (
        !vehicleProfile ||
        vehicle.isDestroyed ||
        Math.hypot(
          position[0] - vehicle.state.position[0],
          position[2] - vehicle.state.position[2]
        ) >
          proposed.rootRadius + vehicleProfile.radius
      )
        continue;
      const q = vehicle.state.rotation;
      const yaw =
        vehicle.positionUpdate.orientation ??
        Math.atan2(
          2 * (q[3] * q[1] + q[0] * q[2]),
          1 - 2 * (q[1] * q[1] + q[2] * q[2])
        );
      const body = makeBox(
        vehicleProfile.bounds,
        vehicle.state.position,
        yaw,
        vehicle.positionUpdate.frontTilt ?? 0,
        vehicle.positionUpdate.sideTilt ?? 0
      );
      if (!sweepBoxes(proposed, proposed, body)) continue;
      const oldFacing = makeBox(profile.bounds, position, previous);
      // Translation has already been constrained using the previous facing.
      // Do not introduce overlap afterwards through goTo/lookAt replication.
      if (!sweepBoxes(oldFacing, oldFacing, body)) return previous;
    }
    return orientation;
  }

  hasPendingMovementStop(allowContinuation = true) {
    if (
      allowContinuation &&
      this.packetMoving &&
      this.faction === Factions.ZOMBIE &&
      this.navAgent
    ) {
      const velocity = this.navAgent.velocity();
      // The position publisher runs faster than the crowd. Do not publish an
      // artificial zero-speed position between crowd steps: the client derives
      // State_Moving/VelocityLocalZ from motion, not just the forward stance.
      // A real stop still sends the final zero-speed packet once velocity is 0.
      const elapsed =
        (getCurrentServerTimeWrapper().getTruncatedU32() -
          this.lastMovementPacketTime) >>>
        0;
      const crowdInterval =
        (this.server.navManager.updateFrequency ?? 0.2) * 1000;
      // Do not extrapolate indefinitely if a genuinely stuck agent still has
      // residual velocity. Collision-constrained steps bypass this grace period.
      if (Math.hypot(velocity.x, velocity.z) > 0 && elapsed < crowdInterval)
        return false;
    }
    return this.packetMoving;
  }

  resetGroundMotion() {
    const p = this.state.position;
    const ground = this.server.navManager.sampleNpcGround({
      x: p[0],
      y: p[1],
      z: p[2]
    });
    this.groundMotion = new NpcGroundMotion(
      p.slice(),
      ground,
      getCurrentServerTimeWrapper().getFull()
    );
    this.packetMoving = false;
    this.groundMotionDiagnostics = undefined;
  }

  goTo(position: Float32Array, ground?: NpcGroundSample) {
    const previousPosition = this.state.position;
    const time = getCurrentServerTimeWrapper();
    const nominalMs = this.server.pathfindingUpdateRate || 0;
    const sample =
      ground ??
      this.server.navManager.sampleNpcGround({
        x: position[0],
        y: position[1],
        z: position[2]
      });
    if (!this.groundMotion) {
      const previousGround = this.server.navManager.sampleNpcGround({
        x: previousPosition[0],
        y: previousPosition[1],
        z: previousPosition[2]
      });
      this.groundMotion = new NpcGroundMotion(
        previousPosition.slice(),
        previousGround,
        time.getFull() - nominalMs
      );
    }
    const orientTarget = this.lookAtTarget ?? position;
    const dx = orientTarget[0] - this.state.position[0];
    const dz = orientTarget[2] - this.state.position[2];

    const horizontalDist = Math.sqrt(dx * dx + dz * dz);
    const orientation = this.getZombieFacing(
      position,
      horizontalDist > 0 ? Math.atan2(dx, dz) : (this.state.yaw ?? 0)
    );
    const prevOrientation = this.state.yaw ?? orientation;
    let angleChange = orientation - prevOrientation;
    // normalize to [-π, π]
    angleChange = Math.atan2(Math.sin(angleChange), Math.cos(angleChange));
    this.state.yaw = orientation;
    const frontTilt = Math.atan(
      sample.slopeX * Math.sin(orientation) +
        sample.slopeZ * Math.cos(orientation)
    );

    const sinO = Math.sin(orientation);
    const cosO = Math.cos(orientation);

    const sideTilt = Math.atan(sample.slopeX * cosO - sample.slopeZ * sinO);

    this.state.position = position;

    const travelled = Math.hypot(
      position[0] - previousPosition[0],
      position[2] - previousPosition[2]
    );
    const motion = this.groundMotion.update(
      position,
      sample,
      time.getFull(),
      nominalMs,
      travelled > 0
    );
    // Prediction must describe the published displacement, including collision
    // constraints. Crowd velocity can still be nonzero when publication is
    // unchanged; forwarding it makes the client extrapolate and snap back.
    const measuredSpeed = motion.dt > 0 ? travelled / motion.dt : 0;
    const horizontalSpeed = metersToFeet(measuredSpeed);
    const velocity =
      this.faction === Factions.ZOMBIE ? this.navAgent?.velocity() : undefined;
    // Gait selection is separate from client position prediction.
    const gaitSpeed = velocity
      ? Math.hypot(velocity.x, velocity.z)
      : measuredSpeed;
    const stance =
      1 |
      1024 |
      (travelled > 0 ? 65536 : 64) |
      (travelled > 0 &&
      gaitSpeed > (npcCollisionProfile(this.actorModelId).walkSpeedLimit ?? 3)
        ? 4
        : 0);
    // Grounded zombie locomotion follows replicated XYZ. Sending the terrain
    // derivative as vertical velocity suppresses the 2016 client's walk/run
    // animation on slopes (confirmed by a vertical-speed-only live test).
    // Keep authoritative ground Y and wildlife prediction unchanged.
    const verticalSpeed =
      this.faction === Factions.ZOMBIE ? 0 : metersToFeet(motion.verticalSpeed);
    this.packetMoving = horizontalSpeed !== 0 || verticalSpeed !== 0;
    this.groundMotionDiagnostics = {
      ...motion,
      packetVerticalSpeed: verticalSpeed,
      horizontalSpeed
    };

    this.lastMovementPacketTime = time.getTruncatedU32();
    this.lastMovementRecipients =
      this.server.sendDataToAllWithSpawnedEntity(
        this.server._npcs,
        this.characterId,
        "PlayerUpdatePosition",
        {
          transientId: this.transientId,
          positionUpdate: {
            sequenceTime: time.getTruncatedU32(),
            position: this.state.position,
            unknown3_int8: 0,
            stance,
            engineRPM: 0,
            orientation,
            frontTilt,
            sideTilt,
            angleChange,
            verticalSpeed,
            horizontalSpeed
          }
        }
      ) ?? 0;
  }

  /**
   * Turns the NPC to face a target, clamped to maxTurnRateRadPerSec so a
   * stationary NPC (e.g. attacking a player it can't reach, like one on top
   * of a car) doesn't snap its facing instantly every AI tick.
   */
  lookAt(
    targetPosition: Float32Array,
    dt: number = 0,
    maxTurnRateRadPerSec: number = Math.PI
  ) {
    const dx = targetPosition[0] - this.state.position[0];
    const dz = targetPosition[2] - this.state.position[2];
    const targetOrientation = Math.atan2(dx, dz);
    const prevOrientation = this.state.yaw ?? targetOrientation;
    let angleChange = targetOrientation - prevOrientation;
    angleChange = Math.atan2(Math.sin(angleChange), Math.cos(angleChange));
    if (dt > 0) {
      const maxStep = maxTurnRateRadPerSec * dt;
      angleChange = Math.max(-maxStep, Math.min(maxStep, angleChange));
    }
    const orientation = this.getZombieFacing(
      this.state.position,
      prevOrientation + angleChange
    );
    angleChange = Math.atan2(
      Math.sin(orientation - prevOrientation),
      Math.cos(orientation - prevOrientation)
    );
    this.state.yaw = orientation;

    this.server.sendDataToAllWithSpawnedEntity(
      this.server._npcs,
      this.characterId,
      "PlayerUpdatePosition",
      {
        transientId: this.transientId,
        positionUpdate: {
          sequenceTime: getCurrentServerTimeWrapper().getTruncatedU32(),
          // Facing-only packets must not reset XYZ interpolation or zero the
          // locomotion velocity between the regular movement updates.
          unknown3_int8: 0,
          // Facing-only updates must not override gait or slope tilt.
          engineRPM: 0,
          orientation,
          angleChange
        }
      }
    );
  }
}
