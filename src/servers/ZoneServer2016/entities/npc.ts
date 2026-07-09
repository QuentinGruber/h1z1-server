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

import { DamageInfo } from "types/zoneserver";
import { ZoneServer2016 } from "../zoneserver";
import { BaseFullCharacter } from "./basefullcharacter";
import { ZoneClient2016 } from "../classes/zoneclient";
import {
  getCurrentServerTimeWrapper,
  getDistance,
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
  ResourceTypes
} from "../models/enums";
import { CommandInteractionString } from "types/zone2016packets";
import { BaseEntity } from "./baseentity";
import { ChallengeType } from "../managers/challengemanager";
import { ProjectileEntity } from "./projectileentity";
import { JSM } from "../jsms/jsm";
import { Factions } from "../jsms/factions";
import { spawnGasCloudAt } from "../jsms/gasser.jsm";

export abstract class Npc extends BaseFullCharacter {
  health: number;
  npcRenderDistance = 100;

  /** Attach the animation object to the npc itself (used for zombie animations) */
  override get attachedObjectTargetId(): string {
    return this.transientId.toString();
  }

  spawnerId: number;
  deathTime: number = 0;
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
      this.navAgent = this.server.navManager.createAgent(this.state.position);
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

  async damage(server: ZoneServer2016, damageInfo: DamageInfo) {
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
      for (const a in server._clients) {
        const c = server._clients[a];
        if (c.spawnedEntities.has(this)) {
          if (!c.isLoading) {
            server.sendData(c, "Character.StartMultiStateDeath", {
              data: {
                characterId: this.characterId,
                flag: 128,
                managerCharacterId: c.character.characterId
              }
            });
            server.sendData(c, "Character.ManagedObject", {
              objectCharacterId: this.characterId,
              characterId: c.character.characterId
            });
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
      const damageRecord = await server.generateDamageRecord(
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
      this.removeEffectTag(Effects.PFX_Char_Zombie_Gasser_Ambient);

      server.sendCompositeEffectToAllInRange(
        100,
        this.characterId,
        this.state.position,
        Effects.PFX_Char_Zombie_Gasser_ExplosionGasCloud
      );

      spawnGasCloudAt(server, this.state.position, this.characterId);
    }
  }

  OnFullCharacterDataRequest(server: ZoneServer2016, client: ZoneClient2016) {
    server.sendData(client, "LightweightToFullNpc", this.pGetFull(server));

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

  goTo(position: Float32Array) {
    const orientTarget = this.lookAtTarget ?? position;
    const dx = orientTarget[0] - this.state.position[0];
    const dz = orientTarget[2] - this.state.position[2];
    const dy = orientTarget[1] - this.state.position[1];

    const horizontalDist = Math.sqrt(dx * dx + dz * dz);
    const orientation = Math.atan2(dx, dz);
    const prevOrientation = this.state.yaw ?? orientation;
    let angleChange = orientation - prevOrientation;
    // normalize to [-π, π]
    angleChange = Math.atan2(Math.sin(angleChange), Math.cos(angleChange));
    this.state.yaw = orientation;
    const frontTilt = Math.atan2(dy, horizontalDist);

    const sinO = Math.sin(orientation);
    const cosO = Math.cos(orientation);

    const lateralDist = dx * cosO - dz * sinO;

    const sideTilt = Math.atan2(lateralDist, horizontalDist);

    this.state.position = position;

    let horizontalSpeed = horizontalDist;
    let verticalSpeed = Math.abs(dy);
    if (this.navAgent) {
      const vel = this.navAgent.velocity();
      horizontalSpeed = metersToFeet(Math.sqrt(vel.x * vel.x + vel.z * vel.z));
      verticalSpeed = metersToFeet(Math.abs(vel.y));
    }

    this.server.sendDataToAllWithSpawnedEntity(
      this.server._npcs,
      this.characterId,
      "PlayerUpdatePosition",
      {
        transientId: this.transientId,
        positionUpdate: {
          sequenceTime: getCurrentServerTimeWrapper().getTruncatedU32(),
          position: this.state.position,
          unknown3_int8: 0,
          stance: 66565,
          engineRPM: 0,
          orientation,
          frontTilt,
          sideTilt,
          angleChange,
          verticalSpeed,
          horizontalSpeed
        }
      }
    );
  }

  lookAt(targetPosition: Float32Array) {
    const dx = targetPosition[0] - this.state.position[0];
    const dz = targetPosition[2] - this.state.position[2];
    const dy = targetPosition[1] - this.state.position[1];
    const horizontalDist = Math.sqrt(dx * dx + dz * dz);
    const orientation = Math.atan2(dx, dz);
    const prevOrientation = this.state.yaw ?? orientation;
    let angleChange = orientation - prevOrientation;
    angleChange = Math.atan2(Math.sin(angleChange), Math.cos(angleChange));
    this.state.yaw = orientation;
    const frontTilt = Math.atan2(dy, horizontalDist);
    const sinO = Math.sin(orientation);
    const cosO = Math.cos(orientation);
    const lateralDist = dx * cosO - dz * sinO;
    const sideTilt = Math.atan2(lateralDist, horizontalDist);

    this.server.sendDataToAllWithSpawnedEntity(
      this.server._npcs,
      this.characterId,
      "PlayerUpdatePosition",
      {
        transientId: this.transientId,
        positionUpdate: {
          sequenceTime: getCurrentServerTimeWrapper().getTruncatedU32(),
          position: this.state.position,
          unknown3_int8: 0,
          stance: 66565,
          engineRPM: 0,
          orientation,
          frontTilt,
          sideTilt,
          angleChange,
          verticalSpeed: 0,
          horizontalSpeed: 0
        }
      }
    );
  }
}
