// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2023 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { eul2quat } from "../../../utils/utils";
import { ZoneServer2016 } from "../zoneserver";
import { BaseLightweightCharacter } from "./baselightweightcharacter";
import { ZoneClient2016 } from "../classes/zoneclient";
import { DamageInfo } from "../../../types/zoneserver";
import { AddLightweightNpc } from "types/zone2016packets";
import { Effects } from "../models/enums";

function getDestroyedModels(actorModel: number): number[] {
  switch (actorModel) {
    case 9455:
      return [9452, 9453, 9454];
    case 9897:
      return [9898, 9899, 9900];
    case 9901:
      return [9902];
    case 9183:
      return [9184, 9185, 9186];
    case 9333:
      return [9334, 9335];
    default:
      return [];
  }
}

function getDoorSound(actorModelId: number) {
  let openSound = 5048;
  let closeSound = 5049;
  switch (actorModelId) {
    case 49:
      openSound = 5081;
      closeSound = 5082;
      break;
    case 9009:
    case 9165:
    case 9167:
    case 9169:
    case 9171:
    case 9497:
    case 9904:
    case 9905:
    case 9333:
    case 9334:
    case 9335:
      openSound = 5048;
      closeSound = 5049;
      break;
    case 9136:
      openSound = 5091;
      closeSound = 5092;
      break;
    case 9224:
    case 9232:
    case 9233:
      openSound = 5089;
      closeSound = 5090;
      break;
    case 9243:
      openSound = 5093;
      closeSound = 5094;
      break;
    case 9903:
    case 9246:
    case 9498:
      openSound = 5095;
      closeSound = 5096;
      break;
    case 9452:
    case 9453:
    case 9454:
    case 9455:
      openSound = 5083;
      closeSound = 5084;
      break;
    case 9183:
    case 9184:
    case 9185:
    case 9186:
      openSound = 5085;
      closeSound = 5086;
      break;
    default:
      break;
  }
  return { openSound, closeSound };
}

export class DoorEntity extends BaseLightweightCharacter {
  spawnerId: number;
  npcRenderDistance = 150;
  openAngle: number;
  closedAngle: number;
  startRot: Float32Array;
  positionUpdateType = 1;
  moving = false;
  isOpen = false;
  openSound: number;
  closeSound: number;
  destroyed: boolean = false;
  destroyedModel: number;
  destroyedModels: number[];
  constructor(
    characterId: string,
    transientId: number,
    actorModelId: number,
    position: Float32Array,
    rotation: Float32Array,
    server: ZoneServer2016,
    scale: Float32Array,
    spawnerId: number
  ) {
    super(characterId, transientId, actorModelId, position, rotation, server);
    this.flags.projectileCollision = 1;
    this.scale = new Float32Array(scale);
    this.spawnerId = spawnerId;
    this.startRot = rotation;
    (this.state.rotation = new Float32Array(
      eul2quat(
        new Float32Array([rotation[0], rotation[1], rotation[2], rotation[3]])
      )
    )),
      (this.openAngle = this.startRot[0] + 1.575);
    this.closedAngle = this.startRot[0];
    const { openSound, closeSound } = getDoorSound(this.actorModelId);
    this.openSound = openSound;
    this.closeSound = closeSound;
    this.destroyedModels = getDestroyedModels(this.actorModelId);
    this.destroyedModel =
      this.destroyedModels[(this.destroyedModels.length * Math.random()) | 0];
    this.health = 2000;
  }

  pGetLightweight(): AddLightweightNpc {
    return {
      characterId: this.characterId,
      transientId: this.transientId,
      actorModelId: this.destroyed ? this.destroyedModel : this.actorModelId,
      position: new Float32Array(
        Array.from(this.state.position).map((pos, idx) => {
          return idx == 1 ? pos++ : pos;
        })
      ),
      rotation: this.state.rotation,
      scale: this.scale,
      positionUpdateType: this.positionUpdateType,
      profileId: this.profileId,
      isLightweight: this.isLightweight,
      flags: {
        flags1: this.flags,
        flags2: this.flags,
        flags3: this.flags
      },
      headActor: this.headActor,
      attachedObject: {}
    };
  }

  OnProjectileHit(server: ZoneServer2016, damageInfo: DamageInfo) {
    if (!this.destroyedModel || this.destroyed) return;
    this.health -= damageInfo.damage;
    if (this.health > 0) return;
    this.destroyed = true;
    server.sendDataToAllWithSpawnedEntity(
      server._doors,
      this.characterId,
      "Character.Destroyed",
      {
        characterId: this.characterId,
        destroyedModel: this.destroyedModel,
        disableWeirdPhysic: true,
        destroyedEffect2: Effects.PFX_Damage_GlassWindow_House
      }
    );
  }

  OnMeleeHit(server: ZoneServer2016, damageInfo: DamageInfo) {
    this.OnProjectileHit(server, damageInfo);
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  OnPlayerSelect(
    server: ZoneServer2016,
    client: ZoneClient2016,
    isInstant?: boolean
    /* eslint-enable @typescript-eslint/no-unused-vars */
  ) {
    client; // eslint
    if (this.moving) {
      return;
    }
    this.moving = true;
    // eslint-disable-next-line
    const door = this; // for setTimeout callback
    setTimeout(function () {
      door.moving = false;
    }, 1000);
    server.sendDataToAllWithSpawnedEntity(
      server._doors,
      this.characterId,
      "PlayerUpdatePosition",
      {
        transientId: this.transientId,
        positionUpdate: {
          sequenceTime: 0,
          unknown3_int8: 0,
          position: this.state.position,
          orientation: this.isOpen ? this.closedAngle : this.openAngle
        }
      }
    );
    server.sendDataToAllWithSpawnedEntity(
      server._doors,
      this.characterId,
      "Command.PlayDialogEffect",
      {
        characterId: this.characterId,
        effectId: this.isOpen ? this.closeSound : this.openSound
      }
    );
    this.isOpen = !this.isOpen;
  }

  OnInteractionString(server: ZoneServer2016, client: ZoneClient2016) {
    server.sendData(client, "Command.InteractionString", {
      guid: this.characterId,
      stringId: 78
    });
  }

  destroy(server: ZoneServer2016): boolean {
    return server.deleteEntity(this.characterId, server._doors);
  }
}
