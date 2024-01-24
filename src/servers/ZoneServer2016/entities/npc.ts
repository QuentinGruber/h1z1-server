// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2024 H1emu community
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
import { logClientActionToMongo } from "../../../utils/utils";
import { DB_COLLECTIONS } from "../../../utils/enums";
import { Items, MeleeTypes, StringIds } from "../models/enums";
import { CommandInteractionString } from "types/zone2016packets";

export class Npc extends BaseFullCharacter {
  health: number;
  npcRenderDistance = 80;
  spawnerId: number;
  deathTime: number = 0;
  rewardItems: { itemDefId: number; weight: number }[] = [];
  requiredHarvestItems: number[] = [];
  canReceiveDamage = true;
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
  constructor(
    characterId: string,
    transientId: number,
    actorModelId: number,
    position: Float32Array,
    rotation: Float32Array,
    server: ZoneServer2016,
    spawnerId: number = 0
  ) {
    super(characterId, transientId, actorModelId, position, rotation, server);
    this.spawnerId = spawnerId;
    this.health = 10000;
    this.initNpcData();
  }

  async damage(server: ZoneServer2016, damageInfo: DamageInfo) {
    const client = server.getClientByCharId(damageInfo.entity),
      oldHealth = this.health;

    if (!this.isAlive && this.canReceiveDamage) {
      if ((this.health -= damageInfo.damage) <= 0) {
        this.flags.knockedOut = 1;
        if (client) {
          server.deleteEntity(this.characterId, server._npcs);
        }
      }
    }

    if ((this.health -= damageInfo.damage) <= 0 && this.isAlive) {
      this.deathTime = Date.now();
      server.worldObjectManager.createLootbag(server, this);
      if (client) {
        if (!server._soloMode) {
          logClientActionToMongo(
            server._db.collection(DB_COLLECTIONS.KILLS),
            client,
            server._worldId,
            { type: "zombie" }
          );
        }
        client.character.metrics.zombiesKilled++;
      }
      server.sendDataToAllWithSpawnedEntity(
        server._npcs,
        this.characterId,
        "Character.StartMultiStateDeath",
        {
          characterId: this.characterId
        }
      );

      this.health = 10000;
      // This is temporary fix so shotguns won't despawn the entity since the pellets will hit after entity is knocked out.
      // TODO: Revisit this
      this.canReceiveDamage = false;
      setTimeout(() => {
        this.canReceiveDamage = true;
      }, 1000);
    }

    if (client) {
      const damageRecord = await server.generateDamageRecord(
        this.characterId,
        damageInfo,
        oldHealth
      );
      client.character.addCombatlogEntry(damageRecord);
    }
  }

  OnFullCharacterDataRequest(server: ZoneServer2016, client: ZoneClient2016) {
    server.sendData(client, "LightweightToFullNpc", this.pGetFull(server));

    if (this.onReadyCallback) {
      this.onReadyCallback(client);
      delete this.onReadyCallback;
    }
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
    if (damageInfo.meleeType && !this.isAlive) {
      const client = server.getClientByCharId(damageInfo.entity);

      if (
        this.requiredHarvestItems.includes(damageInfo.meleeType) &&
        client &&
        this.rewardItems.length > 0
      ) {
        const totalWeight = this.rewardItems.reduce(
          (sum, item) => sum + item.weight,
          0
        );
        const randomValue = Math.random() * totalWeight;

        let cumulativeWeight = 0;
        for (const reward of this.rewardItems) {
          cumulativeWeight += reward.weight;
          if (randomValue <= cumulativeWeight) {
            if (reward.itemDefId == 0) break; // Don't always give a reward
            //TODO: Keep track if the brain was already harvested.
            const rewardItem = server.generateItem(reward.itemDefId, 1);
            if (rewardItem) client.character.lootItem(server, rewardItem);
            break;
          }
        }
      }
    }

    damageInfo.damage = damageInfo.damage / 1.5;
    this.damage(server, damageInfo);
  }

  destroy(server: ZoneServer2016): boolean {
    return server.deleteEntity(this.characterId, server._npcs);
  }

  initNpcData() {
    switch (this.actorModelId) {
      case 9667:
        //Screamer
        break;
      case 9510:
      case 9634:
        this.nameId = StringIds.ZOMBIE_WALKER;
        this.requiredHarvestItems = [
          MeleeTypes.BLADE,
          MeleeTypes.BLUNT,
          MeleeTypes.KNIFE
        ];
        this.rewardItems = [
          {
            itemDefId: 0,
            weight: 60
          },
          {
            itemDefId: Items.CLOTH,
            weight: 40
          },
          {
            itemDefId: Items.BRAIN_INFECTED,
            weight: 10
          }
        ];
        break;
      case 9253:
      case 9002:
        this.nameId = StringIds.DEER;
        this.requiredHarvestItems = [MeleeTypes.KNIFE];
        this.rewardItems = [
          {
            itemDefId: 0,
            weight: 40
          },
          {
            itemDefId: Items.MEAT_VENISON,
            weight: 30
          },
          {
            itemDefId: Items.ANIMAL_FAT,
            weight: 15
          },
          {
            itemDefId: Items.DEER_SCENT,
            weight: 5
          },
          {
            itemDefId: Items.DEER_BLADDER,
            weight: 10
          }
        ];
        break;
      case 9003:
        this.nameId = StringIds.WOLF;
        this.requiredHarvestItems = [MeleeTypes.KNIFE];
        this.rewardItems = [
          {
            itemDefId: 0,
            weight: 45
          },
          {
            itemDefId: Items.MEAT_WOLF,
            weight: 40
          },
          {
            itemDefId: Items.ANIMAL_FAT,
            weight: 15
          }
        ];
        break;
      case 9187:
        this.nameId = StringIds.BEAR;
        this.requiredHarvestItems = [MeleeTypes.KNIFE];
        this.rewardItems = [
          {
            itemDefId: 0,
            weight: 45
          },
          {
            itemDefId: Items.MEAT_BEAR,
            weight: 40
          },
          {
            itemDefId: Items.ANIMAL_FAT,
            weight: 15
          }
        ];
        break;
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
}
