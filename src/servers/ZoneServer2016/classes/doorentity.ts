// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2022 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { eul2quat } from "../../../utils/utils";
import { ZoneServer2016 } from "../zoneserver";
import { BaseLightweightCharacter } from "./baselightweightcharacter";
import { ZoneClient2016 } from "./zoneclient";

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
  flags = {
    bit0: 0,
    bit1: 0,
    bit2: 0,
    bit3: 0,
    bit4: 0,
    bit5: 0,
    bit6: 0,
    bit7: 0,
    bit8: 0,
    bit9: 0,
    bit10: 0,
    bit11: 0,
    projectileCollision: 1,
    bit13: 0,
    bit14: 0,
    bit15: 0,
    bit16: 0,
    bit17: 0,
    bit18: 0,
    bit19: 0,
    noCollide: 0,
    knockedOut: 0,
    bit22: 0,
    bit23: 0,
  };
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
  constructor(
    characterId: string,
    transientId: number,
    actorModelId: number,
    position: Float32Array,
    rotation: Float32Array,
    scale: Float32Array,
    spawnerId: number
  ) {
    super(characterId, transientId, actorModelId, position, rotation);
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
  }

  OnPlayerSelect(server: ZoneServer2016, client: ZoneClient2016) {
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
          orientation: this.isOpen ? this.closedAngle : this.openAngle,
        },
      }
    );
    server.sendDataToAllWithSpawnedEntity(
      server._doors,
      this.characterId,
      "Command.PlayDialogEffect",
      {
        characterId: this.characterId,
        effectId: this.isOpen ? this.closeSound : this.openSound,
      }
    );
    this.isOpen = !this.isOpen;
  }

  OnInteractionString(server: ZoneServer2016, client: ZoneClient2016) {
    server.sendData(client, "Command.InteractionString", {
      guid: this.characterId,
      stringId: 78,
    });
  }
}
