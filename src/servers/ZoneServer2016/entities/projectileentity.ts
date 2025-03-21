// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2025 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================
import { ZoneServer2016 } from "../zoneserver";
import { ZoneClient2016 } from "../classes/zoneclient";
import { BaseLightweightCharacter } from "./baselightweightcharacter";
import {
  AddLightweightNpc,
  CharacterPlayWorldCompositeEffect,
  CommandPlayDialogEffect
} from "types/zone2016packets";
import { Items, PositionUpdateType } from "../models/enums";
import { DamageInfo } from "../../../types/zoneserver";
import { getDistance } from "../../../utils/utils";

export class ProjectileEntity extends BaseLightweightCharacter {
  projectileUniqueId: number;

  managerCharacterId: string;

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
  itemDefinitionId: number;
  triggerTimeout?: NodeJS.Timeout;
  destroyTimeout?: NodeJS.Timeout;
  triggered: boolean = false;
  gasDamageInterval?: NodeJS.Timeout;
  constructor(
    characterId: string,
    transientId: number,
    actorModelId: number,
    position: Float32Array,
    rotation: Float32Array,
    server: ZoneServer2016,
    itemDefinitionId: number,
    projectileUniqueId: number,
    managerCharacterId: string
  ) {
    super(characterId, transientId, actorModelId, position, rotation, server);
    this.positionUpdateType = PositionUpdateType.MOVABLE;
    this.projectileUniqueId = projectileUniqueId;
    this.managerCharacterId = managerCharacterId;
    this.itemDefinitionId = itemDefinitionId;
    this.movementVersion = 10;

    this.destroyTimeout = setTimeout(() => {
      this.destroy(server);
    }, 30000);
    let triggerTimeoutDelay = 0;
    switch (itemDefinitionId) {
      case Items.GRENADE_HE:
        this.actorModelId = 9443;
        triggerTimeoutDelay = 3000;
        break;
      case Items.GRENADE_FLASH:
        this.actorModelId = 9478;
        triggerTimeoutDelay = 2000;
        break;
      case Items.GRENADE_GAS:
        this.actorModelId = 9480;
        triggerTimeoutDelay = 5000;
        break;
      case Items.GRENADE_SMOKE:
        this.actorModelId = 9468;
        triggerTimeoutDelay = 1000;
        break;
      case Items.WEAPON_MOLOTOV:
        this.actorModelId = 9440;
        triggerTimeoutDelay = 0;
      case Items.WEAPON_BOW_RECURVE:
        this.actorModelId = 0;
        triggerTimeoutDelay = 0;
        break;
      default:
        break;
    }
    if (triggerTimeoutDelay) {
      this.triggerTimeout = setTimeout(() => {
        this.onTrigger(server);
      }, triggerTimeoutDelay);
    }
  }

  pGetLightweight(): AddLightweightNpc {
    return {
      characterId: this.characterId,
      transientId: this.transientId,
      actorModelId: this.actorModelId,
      position: this.state.position,
      rotation: this.state.rotation,
      scale: this.scale,
      positionUpdateType: this.positionUpdateType,
      projectileUniqueId: this.projectileUniqueId,
      profileId: this.profileId,
      isLightweight: this.isLightweight,
      flags: {
        flags1: this.flags,
        flags2: this.flags,
        flags3: this.flags
      },
      managerCharacterId: this.managerCharacterId,
      movementVersion: this.movementVersion,
      headActor: this.headActor,
      attachedObject: {}
    };
  }

  applyPostion(position: Float32Array) {
    this.state.position = position;
  }

  onTrigger(server: ZoneServer2016, client?: ZoneClient2016) {
    clearTimeout(this.triggerTimeout);
    if (this.triggered) {
      this.destroy(server);
      return;
    }
    this.triggered = true;
    let effectId = 0;
    let effectType = 0;
    const sendToThrower = true;
    switch (this.itemDefinitionId) {
      case Items.GRENADE_FLASH:
        effectId = 4658;
        effectType = 1;
        break;
      case Items.GRENADE_GAS:
        effectId = 2335;
        effectType = 2;
        break;
      case Items.GRENADE_HE:
        effectId = 5301;
        effectType = 1;
        break;
      case Items.GRENADE_SMOKE:
        effectId = 2333;
        effectType = 2;
        break;
      case Items.WEAPON_MOLOTOV:
        effectId = 5308;
        effectType = 1;
        break;
      case Items.WEAPON_BOW_RECURVE:
        effectId = 0;
        effectType = 0;
        break;
    }

    switch (effectType) {
      case 1:
        if (sendToThrower) {
          server.sendDataToAllWithSpawnedEntity<CharacterPlayWorldCompositeEffect>(
            server._throwableProjectiles,
            this.characterId,
            "Character.PlayWorldCompositeEffect",
            {
              characterId: this.characterId,
              effectId: effectId,
              position: this.state.position
            }
          );
        } else if (client) {
          server.sendDataToAllOthersWithSpawnedEntity<CharacterPlayWorldCompositeEffect>(
            server._throwableProjectiles,
            client,
            this.characterId,
            "Character.PlayWorldCompositeEffect",
            {
              characterId: this.characterId,
              effectId: effectId,
              position: this.state.position
            }
          );
        }
        break;
      case 2:
        server.sendDataToAllWithSpawnedEntity<CommandPlayDialogEffect>(
          server._throwableProjectiles,
          this.characterId,
          "Command.PlayDialogEffect",
          {
            characterId: this.characterId,
            effectId: effectId
          }
        );
        break;
    }

    if (this.itemDefinitionId == Items.GRENADE_HE) server.explosionDamage(this);
    if (this.itemDefinitionId == Items.WEAPON_BOW_RECURVE)
      server.explosionDamage(this);
    if (this.itemDefinitionId == Items.GRENADE_GAS) {
      this.gasDamageInterval = setInterval(() => {
        for (const a in server._characters) {
          const character = server._characters[a];
          if (server.checkRespirator(character)) continue;
          if (getDistance(character.state.position, this.state.position) <= 7) {
            const damageInfo: DamageInfo = {
              entity: "Server.GasGrenade",
              damage: 500
            };
            character.damage(server, damageInfo);
            server.sendDataToAllWithSpawnedEntity(
              server._characters,
              character.characterId,
              "Character.PlayAnimation",
              {
                characterId: character.characterId,
                animationName: "Action",
                animationType: "ActionType",
                unm4: 0,
                unknownDword1: 0,
                unknownByte1: 0,
                unknownDword2: 0,
                unknownByte1xda: 0,
                unknownDword3: 10
              }
            );
          }
        }
      }, 1000);
    }

    if (this.itemDefinitionId == Items.WEAPON_MOLOTOV)
      server.explosionDamage(this);

    if (this.itemDefinitionId == Items.GRENADE_FLASH)
      server.explosionDamage(this);
    switch (this.itemDefinitionId) {
      case Items.GRENADE_FLASH:
      case Items.GRENADE_HE:
      case Items.WEAPON_MOLOTOV:
      case Items.WEAPON_BOW_RECURVE:
        this.destroy(server);
        break;
    }
  }

  destroy(server: ZoneServer2016): boolean {
    clearInterval(this.gasDamageInterval);
    return server.deleteEntity(this.characterId, server._throwableProjectiles);
  }
}
